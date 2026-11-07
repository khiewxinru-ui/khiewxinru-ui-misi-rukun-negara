import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { contentSchema, type Content } from "../src/shared/content";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type Config = {
  appUrl: string;
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  owner: string;
  repo: string;
  branch: string;
  teachers: string[];
  key: string;
  dataDir: string;
  port: number;
};
export const nonce = () => randomBytes(32).toString("base64url");
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function encrypt(value: string, keyHex: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
  return Buffer.concat([
    iv,
    cipher.update(value, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
}
export function decrypt(value: string, keyHex: string) {
  const b = Buffer.from(value, "base64"),
    decipher = createDecipheriv(
      "aes-256-gcm",
      Buffer.from(keyHex, "hex"),
      b.subarray(0, 12),
    );
  decipher.setAuthTag(b.subarray(-16));
  return (
    decipher.update(b.subarray(12, -16)).toString("utf8") +
    decipher.final("utf8")
  );
}
export class EditorStore {
  db: DatabaseSync;
  constructor(dataDir: string) {
    if (dataDir !== ":memory:")
      mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(
      dataDir === ":memory:" ? dataDir : join(dataDir, "editor.sqlite"),
    );
    this.db.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, token TEXT NOT NULL, csrf TEXT NOT NULL, login TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS oauth(state TEXT PRIMARY KEY, verifier TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS draft(id INTEGER PRIMARY KEY CHECK(id=1), content TEXT NOT NULL, revision TEXT NOT NULL, source_sha TEXT NOT NULL, updated TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS media(path TEXT PRIMARY KEY,mime TEXT NOT NULL,body TEXT NOT NULL,created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS versions(sha TEXT PRIMARY KEY,content TEXT NOT NULL,login TEXT NOT NULL,created TEXT NOT NULL);
    `);
    this.db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
    this.db.prepare("DELETE FROM oauth WHERE expires < ?").run(Date.now());
    this.db
      .prepare("DELETE FROM media WHERE created < ?")
      .run(Date.now() - 7 * 86400000);
  }
  getDraft() {
    return this.db.prepare("SELECT * FROM draft WHERE id=1").get() as
      | {
          content: string;
          revision: string;
          source_sha: string;
          updated: string;
        }
      | undefined;
  }
  initializeDraft(content: Content, sha: string) {
    const now = new Date().toISOString();
    this.db
      .prepare("INSERT OR IGNORE INTO draft VALUES(1,?,?,?,?)")
      .run(JSON.stringify(content), nonce(), sha, now);
    this.db
      .prepare("INSERT OR IGNORE INTO versions VALUES(?,?,?,?)")
      .run(
        "source-" + sha,
        JSON.stringify(content),
        "GitHub · kandungan asal",
        now,
      );
    return this.getDraft()!;
  }
  saveDraft(content: Content, revision: string) {
    const next = nonce(),
      updated = new Date().toISOString();
    const result = this.db
      .prepare(
        "UPDATE draft SET content=?,revision=?,updated=? WHERE id=1 AND revision=?",
      )
      .run(JSON.stringify(content), next, updated, revision);
    if (!result.changes)
      throw new HttpError(
        409,
        "Draf telah berubah. Eksport salinan anda, kemudian muatkan semula draf terkini.",
      );
    return this.getDraft()!;
  }
  close() {
    this.db.close();
  }
}

type GitFetch = typeof fetch;
export class GitHubService {
  constructor(
    private config: Config,
    private fetcher: GitFetch = fetch,
  ) {}
  async api<T = Record<string, unknown>>(
    token: string,
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    const res = await this.fetcher(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "Misi-Rukun-Negara-Teacher-Editor",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      if (res.status === 409 || res.status === 422)
        throw new HttpError(
          409,
          "Repository telah berubah. Semak versi terkini sebelum menerbitkan semula.",
        );
      if (res.status === 401 || res.status === 403)
        throw new HttpError(
          403,
          "Akses GitHub tidak mencukupi atau telah tamat. Log masuk semula.",
        );
      throw new HttpError(
        502,
        `GitHub tidak dapat menyelesaikan permintaan (${res.status}).`,
      );
    }
    return res.status === 204 ? ({} as T) : ((await res.json()) as T);
  }
  get root() {
    return `/repos/${this.config.owner}/${this.config.repo}`;
  }
  async authorized(token: string) {
    const user = await this.api<{ login: string; avatar_url: string }>(
      token,
      "/user",
    );
    if (
      !this.config.teachers.some(
        (t) => t.toLowerCase() === user.login.toLowerCase(),
      )
    )
      throw new HttpError(
        403,
        "Akaun ini tidak tersenarai sebagai guru yang dibenarkan.",
      );
    const permission = await this.api<{ permission: string }>(
      token,
      `${this.root}/collaborators/${encodeURIComponent(user.login)}/permission`,
    );
    if (!["admin", "write", "maintain"].includes(permission.permission))
      throw new HttpError(
        403,
        "Guru memerlukan kebenaran menulis pada repository ini.",
      );
    return user;
  }
  async current(token: string) {
    const file = await this.api<{ content: string; sha: string }>(
      token,
      `${this.root}/contents/public/content/game.json?ref=${encodeURIComponent(this.config.branch)}`,
    );
    const content = contentSchema.parse(
      JSON.parse(Buffer.from(file.content, "base64").toString("utf8")),
    );
    return { content, sha: file.sha };
  }
  async publish(
    token: string,
    content: Content,
    sourceSha: string,
    media: { path: string; body: string }[],
  ) {
    // Compare content version as well as the branch's eventual fast-forward lease.
    const remote = await this.current(token);
    if (remote.sha !== sourceSha)
      throw new HttpError(
        409,
        "Kandungan yang diterbitkan telah berubah sejak draf dibuka. Semak perubahan dahulu.",
      );
    const ref = await this.api<{ object: { sha: string } }>(
      token,
      `${this.root}/git/ref/heads/${encodeURIComponent(this.config.branch)}`,
    );
    const parent = await this.api<{ tree: { sha: string } }>(
      token,
      `${this.root}/git/commits/${ref.object.sha}`,
    );
    const serialized = JSON.stringify(content, null, 2) + "\n";
    const entries: {
      path: string;
      mode: string;
      type: string;
      content?: string;
      sha?: string;
    }[] = [
      {
        path: "public/content/game.json",
        mode: "100644",
        type: "blob",
        content: serialized,
      },
    ];
    for (const item of media) {
      const b = await this.api<{ sha: string }>(
        token,
        `${this.root}/git/blobs`,
        "POST",
        { encoding: "base64", content: item.body },
      );
      entries.push({
        path: `public/${item.path}`,
        mode: "100644",
        type: "blob",
        sha: b.sha,
      });
    }
    const tree = await this.api<{ sha: string }>(
      token,
      `${this.root}/git/trees`,
      "POST",
      { base_tree: parent.tree.sha, tree: entries },
    );
    const commit = await this.api<{ sha: string }>(
      token,
      `${this.root}/git/commits`,
      "POST",
      {
        message: "content: publish teacher-reviewed learning materials",
        tree: tree.sha,
        parents: [ref.object.sha],
      },
    );
    await this.api(
      token,
      `${this.root}/git/refs/heads/${encodeURIComponent(this.config.branch)}`,
      "PATCH",
      { sha: commit.sha, force: false },
    );
    const sha = createHash("sha1")
      .update(`blob ${Buffer.byteLength(serialized)}\0`)
      .update(serialized)
      .digest("hex");
    return { commit: commit.sha, contentSha: sha };
  }
}
