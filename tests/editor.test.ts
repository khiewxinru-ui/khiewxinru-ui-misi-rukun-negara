import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { once } from "node:events";
import { createEditorApp } from "../server/index";
import {
  EditorStore,
  GitHubService,
  HttpError,
  encrypt,
  decrypt,
  hash,
  type Config,
} from "../server/editor-service";
import { contentSchema } from "../src/shared/content";

const content = contentSchema.parse(
  JSON.parse(
    readFileSync(
      new URL("../public/content/game.json", import.meta.url),
      "utf8",
    ),
  ),
);
const config: Config = {
  appUrl: "http://localhost:5173/",
  apiUrl: "http://localhost:8787",
  clientId: "test-client",
  clientSecret: "test-secret",
  owner: "teacher",
  repo: "school-game",
  branch: "main",
  teachers: ["teacher"],
  key: "ab".repeat(32),
  dataDir: ":memory:",
  port: 0,
};
class FakeGitHub extends GitHubService {
  publications = 0;
  override async current() {
    return { content: structuredClone(content), sha: "original-blob" };
  }
  override async authorized() {
    return { login: "teacher", avatar_url: "" };
  }
  override async publish() {
    this.publications++;
    return { commit: "a".repeat(40), contentSha: "new-blob" };
  }
}
test("Encrypted tokens round-trip and tampering is rejected", () => {
  const value = encrypt("private-provider-token", config.key);
  assert.equal(decrypt(value, config.key), "private-provider-token");
  assert.equal(value.includes("private-provider-token"), false);
  const altered = Buffer.from(value, "base64");
  altered[15] ^= 1;
  assert.throws(() => decrypt(altered.toString("base64"), config.key));
});
test("Teacher API: access control, CSRF, durable drafts, upload validation, publish and restore", async (t) => {
  const store = new EditorStore(":memory:"),
    provider = new FakeGitHub(config),
    app = createEditorApp(config, store, provider),
    server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const url = `http://127.0.0.1:${address.port}`;
  const call = (
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) =>
    fetch(url + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
  t.after(() => {
    server.close();
    store.close();
  });
  assert.equal((await call("/api/draft")).status, 401);
  assert.equal((await call("/api/publish", {})).status, 401);
  assert.equal((await call("/auth/callback?state=bad&code=bad")).status, 403);
  assert.equal(
    (await call("/health", undefined, { Origin: "https://evil.invalid" }))
      .status,
    403,
  );
  const raw = "test-browser-session";
  store.db
    .prepare("INSERT INTO sessions VALUES(?,?,?,?,?)")
    .run(
      hash(raw),
      encrypt("server-only-token", config.key),
      "csrf-proof",
      "teacher",
      Date.now() + 100000,
    );
  const cookie = { Cookie: `mrn_session=${raw}` },
    secureHeaders = {
      ...cookie,
      Origin: "http://localhost:5173",
      "X-CSRF-Token": "csrf-proof",
    };
  const session = await (await call("/api/session", undefined, cookie)).json();
  assert.equal(session.login, "teacher");
  assert.equal(JSON.stringify(session).includes("server-only-token"), false);
  for (const path of [
    "/api/draft",
    "/api/media",
    "/api/publish",
    "/api/restore",
    "/api/logout",
  ])
    assert.equal((await call(path, {}, cookie)).status, 403, path);
  const initial = await (await call("/api/draft", undefined, cookie)).json();
  assert.ok(initial.revision);
  const revised = structuredClone(content);
  revised.missions[0].activities[0].title = "Draf guru yang diuji";
  const savedResponse = await call(
    "/api/draft",
    { content: revised, revision: initial.revision },
    secureHeaders,
  );
  assert.equal(savedResponse.status, 200);
  const saved = await savedResponse.json();
  assert.equal(
    (
      await call(
        "/api/draft",
        { content, revision: initial.revision },
        secureHeaders,
      )
    ).status,
    409,
  );
  const draft = await (await call("/api/draft", undefined, cookie)).json();
  assert.equal(
    draft.content.missions[0].activities[0].title,
    "Draf guru yang diuji",
  );
  assert.equal(
    (
      await call(
        "/api/media",
        {
          mime: "image/png",
          body: Buffer.from("<script>alert(1)</script>").toString("base64"),
        },
        secureHeaders,
      )
    ).status,
    400,
  );
  const validPng = readFileSync(
    new URL("../public/assets/heritage-street.webp", import.meta.url),
  );
  const upload = await call(
    "/api/media",
    { mime: "image/webp", body: validPng.toString("base64") },
    secureHeaders,
  );
  assert.equal(upload.status, 200);
  const media = await upload.json();
  assert.match(media.path, /^assets\/uploads\/.+\.webp$/);
  assert.equal(
    (await call("/api/publish", { revision: "stale" }, secureHeaders)).status,
    409,
  );
  const published = await call(
    "/api/publish",
    { revision: saved.revision },
    secureHeaders,
  );
  assert.equal(published.status, 200);
  const result = await published.json();
  assert.equal(result.status, "committed");
  assert.equal(provider.publications, 1);
  assert.notEqual(result.status, "deployed");
  const versions = await (
    await call("/api/versions", undefined, cookie)
  ).json();
  assert.equal(versions.versions.length, 2);
  assert.ok(
    versions.versions.some(
      (v: { sha: string }) => v.sha === "source-original-blob",
    ),
  );
  const restore = await call(
    "/api/restore",
    { sha: result.commit, revision: saved.revision },
    secureHeaders,
  );
  assert.equal(restore.status, 200);
  assert.equal(
    provider.publications,
    1,
    "Restore is a draft operation, not an implicit publication",
  );
  assert.equal((await call("/api/logout", {}, secureHeaders)).status, 200);
  assert.equal((await call("/api/session", undefined, cookie)).status, 401);
});
test("GitHub content conflicts prevent overwriting changes", async () => {
  const github = new GitHubService(
    config,
    async () =>
      new Response(
        JSON.stringify({
          content: Buffer.from(JSON.stringify(content)).toString("base64"),
          sha: "changed",
        }),
        { status: 200 },
      ),
  );
  await assert.rejects(
    () => github.publish("token", content, "old", []),
    (e: unknown) => e instanceof HttpError && e.status === 409,
  );
});
test("Publishing uses one commit with a non-forced fast-forward and no credential in content", async () => {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  const fake: typeof fetch = async (input, init) => {
    const path = String(input).replace("https://api.github.com", ""),
      body = init?.body ? JSON.parse(String(init.body)) : {};
    calls.push({ path, body });
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      "Bearer private-token",
    );
    if (path.includes("/contents/"))
      return new Response(
        JSON.stringify({
          content: Buffer.from(JSON.stringify(content)).toString("base64"),
          sha: "original",
        }),
      );
    if (path.includes("/git/ref/"))
      return new Response(JSON.stringify({ object: { sha: "parent" } }));
    if (path.endsWith("/git/commits/parent"))
      return new Response(JSON.stringify({ tree: { sha: "base-tree" } }));
    if (path.endsWith("/git/blobs"))
      return new Response(JSON.stringify({ sha: "media-sha" }));
    if (path.endsWith("/git/trees"))
      return new Response(JSON.stringify({ sha: "new-tree" }));
    if (path.endsWith("/git/commits"))
      return new Response(JSON.stringify({ sha: "new-commit" }));
    return new Response("{}");
  };
  const g = new GitHubService(config, fake);
  const result = await g.publish("private-token", content, "original", [
    { path: "assets/uploads/a.png", body: "AQID" },
  ]);
  assert.equal(result.commit, "new-commit");
  const ref = calls.at(-1)!;
  assert.deepEqual(ref.body, { sha: "new-commit", force: false });
  const tree = calls.find((c) => c.path.endsWith("/git/trees"))!;
  assert.equal(tree.body.base_tree, "base-tree");
  assert.equal((tree.body.tree as unknown[]).length, 2);
  assert.equal(JSON.stringify(calls).includes("private-token"), false);
});
