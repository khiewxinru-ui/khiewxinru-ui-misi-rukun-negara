import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contentSchema } from "../src/shared/content";
import {
  Config,
  EditorStore,
  GitHubService,
  HttpError,
  decrypt,
  encrypt,
  hash,
  nonce,
  safeEqual,
} from "./editor-service";

export function configFromEnv(): Config {
  return {
    appUrl: process.env.APP_URL || "http://localhost:5173/",
    apiUrl: process.env.PUBLIC_API_URL || "http://localhost:8787",
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    owner: process.env.GITHUB_OWNER || "khiewxinru-ui",
    repo: process.env.GITHUB_REPO || "khiewxinru-ui-misi-rukun-negara",
    branch: process.env.GITHUB_BRANCH || "main",
    teachers: (process.env.TEACHER_LOGINS || "khiewxinru-ui")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    key: process.env.SESSION_ENCRYPTION_KEY || "",
    dataDir: process.env.DATA_DIR || "./data",
    port: Number(process.env.PORT || 8787),
  };
}
type Session = {
  id: string;
  token: string;
  csrf: string;
  login: string;
  expires: number;
};
const cookie = (req: Request, name: string) =>
  req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
const asyncRoute =
  (f: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void f(req, res).catch(next);
  };

export function createEditorApp(
  config: Config,
  store = new EditorStore(config.dataDir),
  github = new GitHubService(config),
) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  const origin = new URL(config.appUrl).origin,
    secure = new URL(config.apiUrl).protocol === "https:";
  const configured =
    !!config.clientId &&
    !!config.clientSecret &&
    /^[0-9a-f]{64}$/i.test(config.key) &&
    config.teachers.length > 0;
  let publishing = false;
  const cookies = (
    res: Response,
    name: string,
    value: string,
    maxAge: number,
    sameSite = "None",
  ) =>
    res.append(
      "Set-Cookie",
      `${name}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=${secure ? sameSite : "Lax"}${secure ? "; Secure" : ""}`,
    );
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'",
    );
    if (req.headers.origin && req.headers.origin !== origin)
      return res
        .status(403)
        .json({ error: "Asal permintaan tidak dibenarkan." });
    if (req.headers.origin === origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
    }
    if (req.method === "OPTIONS") {
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, X-CSRF-Token",
      );
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      return res.sendStatus(204);
    }
    next();
  });
  app.use(express.json({ limit: "9mb" }));
  const rates = new Map<string, { count: number; reset: number }>();
  app.use((req, res, next) => {
    const ip = req.ip || "unknown",
      now = Date.now();
    let b = rates.get(ip);
    if (!b || b.reset < now) {
      b = { count: 0, reset: now + 60000 };
      rates.set(ip, b);
    }
    if (++b.count > 180) {
      res.setHeader("Retry-After", "60");
      return res
        .status(429)
        .json({ error: "Terlalu banyak permintaan. Cuba sebentar lagi." });
    }
    if (rates.size > 10000)
      for (const [k, v] of rates) if (v.reset < now) rates.delete(k);
    next();
  });
  const session = (req: Request, res: Response): Session | null => {
    const raw = cookie(req, "mrn_session");
    const s = raw
      ? (store.db
          .prepare("SELECT * FROM sessions WHERE id=? AND expires>?")
          .get(hash(raw), Date.now()) as Session | undefined)
      : undefined;
    if (!s) {
      res.status(401).json({ error: "Sila log masuk sebagai guru." });
      return null;
    }
    return s;
  };
  const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const s = session(req, res);
    if (!s) return;
    res.locals.session = s;
    if (
      req.method !== "GET" &&
      (!req.headers.origin ||
        req.headers.origin !== origin ||
        !safeEqual(String(req.headers["x-csrf-token"] || ""), s.csrf))
    )
      return res.status(403).json({
        error: "Pengesahan keselamatan gagal. Muatkan semula halaman.",
      });
    next();
  };
  const token = (res: Response) =>
    decrypt((res.locals.session as Session).token, config.key);
  app.get("/health", (_req, res) =>
    res.json({
      ok: true,
      configured,
      repository: `${config.owner}/${config.repo}`,
    }),
  );
  app.get(
    "/auth/github",
    asyncRoute(async (req, res) => {
      if (!configured)
        throw new HttpError(
          503,
          "Log masuk guru belum dikonfigurasi. Sediakan OAuth GitHub dan kunci sesi pada backend.",
        );
      const state = nonce(),
        verifier = nonce();
      store.db
        .prepare("INSERT INTO oauth VALUES(?,?,?)")
        .run(hash(state), verifier, Date.now() + 600000);
      cookies(res, "mrn_oauth", state, 600, "Lax");
      const url = new URL("https://github.com/login/oauth/authorize");
      url.search = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: `${config.apiUrl}/auth/callback`,
        scope: "public_repo",
        state,
        code_challenge: createHash("sha256")
          .update(verifier)
          .digest("base64url"),
        code_challenge_method: "S256",
      }).toString();
      res.redirect(url.toString());
    }),
  );
  app.get(
    "/auth/callback",
    asyncRoute(async (req, res) => {
      if (!configured) throw new HttpError(503, "OAuth belum dikonfigurasi.");
      const state = String(req.query.state || ""),
        saved = cookie(req, "mrn_oauth");
      if (!state || !saved || !safeEqual(state, saved))
        throw new HttpError(
          403,
          "Sesi log masuk tidak sah. Mulakan log masuk semula.",
        );
      const row = store.db
        .prepare("SELECT verifier FROM oauth WHERE state=? AND expires>?")
        .get(hash(state), Date.now()) as { verifier: string } | undefined;
      store.db.prepare("DELETE FROM oauth WHERE state=?").run(hash(state));
      cookies(res, "mrn_oauth", "", 0, "Lax");
      if (!row || typeof req.query.code !== "string")
        throw new HttpError(403, "Kod log masuk telah tamat atau tidak sah.");
      const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code: req.query.code,
            redirect_uri: `${config.apiUrl}/auth/callback`,
            code_verifier: row.verifier,
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      const oauth = (await response.json()) as { access_token?: string };
      if (!response.ok || !oauth.access_token)
        throw new HttpError(
          403,
          "GitHub tidak meluluskan log masuk. Cuba semula.",
        );
      const user = await github.authorized(oauth.access_token);
      const raw = nonce();
      store.db
        .prepare("INSERT INTO sessions VALUES(?,?,?,?,?)")
        .run(
          hash(raw),
          encrypt(oauth.access_token, config.key),
          nonce(),
          user.login,
          Date.now() + 8 * 3600000,
        );
      cookies(res, "mrn_session", raw, 8 * 3600);
      res.redirect(new URL("#guru", config.appUrl).toString());
    }),
  );
  app.use("/api", authenticate);
  app.get("/api/session", (_req, res) => {
    const s = res.locals.session as Session;
    res.json({
      login: s.login,
      csrf: s.csrf,
      repository: `${config.owner}/${config.repo}`,
    });
  });
  app.post("/api/logout", (req, res) => {
    store.db
      .prepare("DELETE FROM sessions WHERE id=?")
      .run(hash(cookie(req, "mrn_session")));
    cookies(res, "mrn_session", "", 0);
    res.json({ ok: true });
  });
  app.get(
    "/api/draft",
    asyncRoute(async (_req, res) => {
      let draft = store.getDraft();
      if (!draft) {
        const remote = await github.current(token(res));
        draft = store.initializeDraft(remote.content, remote.sha);
      }
      res.json({
        content: JSON.parse(draft.content),
        revision: draft.revision,
        updatedAt: draft.updated,
      });
    }),
  );
  app.post("/api/draft", (req, res, next) => {
    try {
      if (publishing)
        throw new HttpError(
          409,
          "Penerbitan sedang dijalankan. Tunggu sehingga selesai.",
        );
      const content = contentSchema.parse(req.body.content);
      if (typeof req.body.revision !== "string")
        throw new HttpError(400, "Versi draf diperlukan.");
      const d = store.saveDraft(content, req.body.revision);
      res.json({ revision: d.revision, updatedAt: d.updated });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/media", (req, res, next) => {
    try {
      const { mime, body } = req.body;
      if (
        typeof body !== "string" ||
        typeof mime !== "string" ||
        body.length > 8 * 1024 * 1024 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(body)
      )
        throw new HttpError(
          400,
          "Fail tidak sah atau terlalu besar. Had: 6 MB.",
        );
      const bytes = Buffer.from(body, "base64");
      let ext = "";
      if (
        mime === "image/png" &&
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      )
        ext = "png";
      if (
        mime === "image/jpeg" &&
        bytes[0] === 255 &&
        bytes[1] === 216 &&
        bytes[2] === 255
      )
        ext = "jpg";
      if (
        mime === "image/webp" &&
        bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP"
      )
        ext = "webp";
      if (
        mime === "audio/wav" &&
        bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WAVE"
      )
        ext = "wav";
      if (
        mime === "audio/mpeg" &&
        (bytes.toString("ascii", 0, 3) === "ID3" ||
          (bytes[0] === 255 && (bytes[1] & 224) === 224))
      )
        ext = "mp3";
      if (mime === "audio/ogg" && bytes.toString("ascii", 0, 4) === "OggS")
        ext = "ogg";
      if (!ext)
        throw new HttpError(
          400,
          "Format tidak disokong. Gunakan PNG, JPEG, WebP, WAV, MP3 atau OGG.",
        );
      const count = store.db
        .prepare("SELECT COUNT(*) AS n FROM media")
        .get() as { n: number };
      if (count.n >= 100)
        throw new HttpError(
          409,
          "Had fail sementara dicapai. Terbitkan atau bersihkan fail lama dahulu.",
        );
      const path = `assets/uploads/${randomUUID()}.${ext}`;
      store.db
        .prepare("INSERT INTO media VALUES(?,?,?,?)")
        .run(path, mime, body, Date.now());
      res.json({
        path,
        preview: `${config.apiUrl}/api/media/${path.split("/").pop()}`,
      });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/media/:file", (req, res) => {
    const row = store.db
      .prepare("SELECT mime,body FROM media WHERE path=?")
      .get(`assets/uploads/${req.params.file}`) as
      { mime: string; body: string } | undefined;
    if (!row) return res.sendStatus(404);
    res.type(row.mime).send(Buffer.from(row.body, "base64"));
  });
  app.post(
    "/api/publish",
    asyncRoute(async (req, res) => {
      if (publishing) throw new HttpError(409, "Penerbitan sedang dijalankan.");
      const draft = store.getDraft();
      if (!draft || draft.revision !== req.body.revision)
        throw new HttpError(409, "Simpan draf terkini sebelum menerbitkan.");
      publishing = true;
      try {
        const content = contentSchema.parse(JSON.parse(draft.content));
        const used = new Set(
          [
            content.introductionAudio,
            ...Object.values(content.soundtrack),
            ...content.missions.flatMap((m) =>
              m.activities.flatMap((a) => [a.image, a.audio, ...a.narration]),
            ),
          ].filter(Boolean),
        );
        const media = (
          store.db.prepare("SELECT path,body FROM media").all() as {
            path: string;
            body: string;
          }[]
        ).filter((m) => used.has(m.path));
        const sessionToken = token(res);
        await github.authorized(sessionToken);
        const result = await github.publish(
          sessionToken,
          content,
          draft.source_sha,
          media,
        );
        store.db
          .prepare("UPDATE draft SET source_sha=? WHERE id=1")
          .run(result.contentSha);
        store.db
          .prepare("INSERT INTO versions VALUES(?,?,?,?)")
          .run(
            result.commit,
            JSON.stringify(content),
            (res.locals.session as Session).login,
            new Date().toISOString(),
          );
        // Keep staged files until expiry so concurrent previews remain valid.
        res.json({
          commit: result.commit,
          status: "committed",
          actionsUrl: `https://github.com/${config.owner}/${config.repo}/actions`,
          message:
            "Perubahan telah dihantar ke GitHub. Deployment belum disahkan; semak status GitHub Actions.",
        });
      } finally {
        publishing = false;
      }
    }),
  );
  app.get(
    "/api/deployment/:sha",
    asyncRoute(async (req, res) => {
      if (!/^[a-f0-9]{40}$/.test(String(req.params.sha)))
        throw new HttpError(400, "SHA tidak sah.");
      const runs = await github.api<{
        workflow_runs: {
          name: string;
          status: string;
          conclusion: string | null;
          html_url: string;
        }[];
      }>(
        token(res),
        `${github.root}/actions/runs?head_sha=${req.params.sha}&per_page=10`,
      );
      const run = runs.workflow_runs.find(
        (r) => r.name === "Deploy to GitHub Pages",
      );
      res.json(
        run
          ? {
              status: run.status,
              conclusion: run.conclusion,
              url: run.html_url,
            }
          : { status: "pending", conclusion: null },
      );
    }),
  );
  app.get("/api/versions", (_req, res) =>
    res.json({
      versions: store.db
        .prepare(
          "SELECT sha,login,created FROM versions ORDER BY created DESC LIMIT 25",
        )
        .all(),
    }),
  );
  app.post(
    "/api/restore",
    asyncRoute(async (req, res) => {
      if (publishing) throw new HttpError(409, "Penerbitan sedang dijalankan.");
      const row = store.db
        .prepare("SELECT content FROM versions WHERE sha=?")
        .get(String(req.body.sha)) as { content: string } | undefined;
      if (!row) throw new HttpError(404, "Versi tidak ditemui.");
      const draft = store.saveDraft(
        contentSchema.parse(JSON.parse(row.content)),
        String(req.body.revision),
      );
      res.json({
        content: JSON.parse(draft.content),
        revision: draft.revision,
        updatedAt: draft.updated,
      });
    }),
  );
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError)
      return res.status(err.status).json({ error: err.message });
    if (err && typeof err === "object" && "issues" in err)
      return res.status(400).json({
        error:
          "Kandungan tidak sah. Semak panjang teks, ID, kedudukan objek dan jawapan.",
      });
    res.status(500).json({
      error: "Permintaan gagal. Cuba lagi atau semak konfigurasi backend.",
    });
  });
  return app;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const config = configFromEnv();
  createEditorApp(config).listen(config.port, "0.0.0.0", () =>
    console.log(
      `Teacher Editor API listening on port ${config.port}. OAuth ${config.clientId ? "configuration provided" : "not configured"}.`,
    ),
  );
}
