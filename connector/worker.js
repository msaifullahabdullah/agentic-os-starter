// Agentic OS brain connector, starter edition.
//
// v5, 2026-09-26. Built from the proven v3 connector, with one
// change: sign in is a password you choose (the BRAIN_PASSWORD secret) instead of a
// Google Cloud app, so anyone can set it up in minutes. Everything else is the same:
// refresh tokens, conflict safe writes, path guards and argument guards.
//
// Cloudflare Worker, zero dependencies, so it can be pasted straight into the
// dashboard editor or deployed with wrangler.
//
// v3, 2026-09-14. Two changes from v2:
//   U1  Refresh tokens. Sign in once; the client renews silently forever after.
//   U2  Every write retries on conflict, so a fact is never lost when two things
//       save at the same moment.
//
// The brain on GitHub is the only source of truth. Every write is a real commit.

// Wrong passwords allowed from one address before a 15 minute pause, and from
// everywhere together per hour, so the password cannot be guessed by brute force.
const MAX_TRIES_PER_IP = 5;
const MAX_TRIES_TOTAL = 30;
const TRY_WINDOW = 900;

// How long a granted access token lasts before the client must renew it.
const ACCESS_TTL = 60 * 60 * 24 * 30;        // 30 days
// How long a refresh token lasts. Slides: every renewal issues a fresh one, so
// using the brain at all within this window means never signing in again.
const REFRESH_TTL = 60 * 60 * 24 * 400;      // 400 days
// A rotated refresh token keeps working this long, so a client that loses the
// response to a renewal can safely retry instead of being locked out.
const REFRESH_GRACE = 120;                   // 2 minutes

const AUTHCODE_TTL = 300;
const REQ_TTL = 600;
const CLIENT_TTL = 60 * 60 * 24 * 30;

// Write retry settings (U2).
const WRITE_ATTEMPTS = 5;

export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (err) {
      return json({ error: "worker_exception", message: String((err && err.stack) || err) }, 500);
    }
  }
};

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = url.origin;

  if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));

  if (path === "/.well-known/oauth-protected-resource" || path === "/.well-known/oauth-protected-resource/mcp") {
    return json({ resource: `${origin}/mcp`, authorization_servers: [origin] });
  }

  if (path === "/.well-known/oauth-authorization-server" || path === "/.well-known/openid-configuration") {
    return json({
      issuer: origin,
      authorization_endpoint: `${origin}/authorize`,
      token_endpoint: `${origin}/token`,
      registration_endpoint: `${origin}/register`,
      response_types_supported: ["code"],
      // U1: refresh_token advertised so clients know they can renew silently.
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["brain"]
    });
  }

  if (path === "/register" && request.method === "POST") {
    const body = await safeJson(request);
    const clientId = "mcp-" + crypto.randomUUID();
    const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
    await env.OAUTH.put(`client:${clientId}`, JSON.stringify({ redirect_uris: redirectUris }), { expirationTtl: CLIENT_TTL });
    return json({
      client_id: clientId,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"]
    }, 201);
  }

  if (path === "/authorize" && request.method === "GET") {
    const p = url.searchParams;
    const clientReq = {
      client_id: p.get("client_id") || "",
      redirect_uri: p.get("redirect_uri") || "",
      state: p.get("state") || "",
      code_challenge: p.get("code_challenge") || "",
      code_challenge_method: p.get("code_challenge_method") || ""
    };
    if (!clientReq.redirect_uri || !clientReq.code_challenge) {
      return json({ error: "invalid_request", message: "redirect_uri and PKCE code_challenge are required" }, 400);
    }
    // Only send the sign-in back to an address the client registered.
    const client = clientReq.client_id ? await env.OAUTH.get(`client:${clientReq.client_id}`) : null;
    if (!client) return html(page("Start again", "<p>This sign-in link is not recognised. Remove the connector in Claude and add it again.</p>"), 400);
    const uris = JSON.parse(client).redirect_uris || [];
    if (uris.length && !uris.includes(clientReq.redirect_uri)) return html(page("Start again", "<p>This sign-in link does not match the app that asked for it.</p>"), 400);
    if (!passwordReady(env)) return html(page("Almost there", "<p>This brain has no password yet. In Cloudflare, open this Worker, then Settings, Variables and Secrets, and add a secret called <b>BRAIN_PASSWORD</b> of at least 12 characters.</p>"), 500);
    const reqId = b64url(crypto.getRandomValues(new Uint8Array(24)));
    await env.OAUTH.put(`req:${reqId}`, JSON.stringify(clientReq), { expirationTtl: REQ_TTL });
    return html(signInPage(env, reqId, ""));
  }

  if (path === "/authorize" && request.method === "POST") {
    const form = await request.formData().catch(() => null);
    const reqId = form ? String(form.get("req") || "") : "";
    const given = form ? String(form.get("password") || "") : "";
    const stored = reqId ? await env.OAUTH.get(`req:${reqId}`) : null;
    if (!stored) return html(page("Start again", "<p>This sign-in took too long. Go back to Claude and connect again.</p>"), 400);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (await tooManyTries(env, ip)) return html(page("Too many tries", "<p>Wrong password too many times. Wait 15 minutes, then try again.</p>"), 429);
    if (!passwordReady(env) || !(await sameSecret(given, env.BRAIN_PASSWORD))) {
      await countFailure(env, ip);
      return html(signInPage(env, reqId, "That password is not right. Try again."), 401);
    }
    await env.OAUTH.delete(`req:${reqId}`);
    const clientReq = JSON.parse(stored);
    const authCode = b64url(crypto.getRandomValues(new Uint8Array(24)));
    await env.OAUTH.put(`authcode:${authCode}`, JSON.stringify({
      client_id: clientReq.client_id,
      redirect_uri: clientReq.redirect_uri,
      code_challenge: clientReq.code_challenge,
      email: "owner"
    }), { expirationTtl: AUTHCODE_TTL });
    const back = new URL(clientReq.redirect_uri);
    back.searchParams.set("code", authCode);
    if (clientReq.state) back.searchParams.set("state", clientReq.state);
    return Response.redirect(back.toString(), 302);
  }

  if (path === "/token" && request.method === "POST") {
    const form = await request.formData().catch(() => null);
    if (!form) return json({ error: "invalid_request" }, 400);
    const grantType = form.get("grant_type");
    if (grantType === "authorization_code") return await grantAuthCode(form, env);
    if (grantType === "refresh_token") return await grantRefresh(form, env);
    return json({ error: "unsupported_grant_type" }, 400);
  }

  if (path === "/mcp") {
    const auth = request.headers.get("Authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return unauthorized(origin);
    const tokenHash = hex(new Uint8Array(await sha256(m[1])));
    const session = await env.OAUTH.get(`token:${tokenHash}`);
    if (!session) return unauthorized(origin);
    const email = JSON.parse(session).email;
    if (request.method === "GET") return new Response("Method Not Allowed", { status: 405 });
    const rpc = await safeJson(request);
    const result = await handleMcp(rpc, env, email);
    if (result === null) return cors(new Response(null, { status: 202 }));
    return json(result);
  }

  if (path === "/" || path === "") {
    return html(page("Your brain is ready", `<p>One last step, in Claude:</p><ol>
<li>Open <b>Settings</b>, then <b>Connectors</b>, then <b>Add custom connector</b>.</li>
<li>Name it <b>My-Brain</b>.</li>
<li>Paste this link:<div class="url"><code id="u">${escapeHtml(origin)}/mcp</code><button type="button" id="c">Copy</button></div></li>
<li>Click <b>Connect</b> and type your brain password.</li></ol>`,
      { script: `document.getElementById("c").onclick=function(){var b=this,t=document.getElementById("u").textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Copied";},function(){var r=document.createRange();r.selectNodeContents(document.getElementById("u"));var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent="Selected";});};` }));
  }
  return json({ error: "not_found" }, 404);
}

/* ---------- v5: password sign in ---------- */

function passwordReady(env) { return typeof env.BRAIN_PASSWORD === "string" && env.BRAIN_PASSWORD.length >= 12; }

async function sameSecret(a, b) {
  // Compare hashes in constant time so timing reveals nothing about the password.
  const x = new Uint8Array(await sha256(String(a))), y = new Uint8Array(await sha256(String(b)));
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function tooManyTries(env, ip) {
  const [mine, all] = await Promise.all([env.OAUTH.get(`fail:${ip}`), env.OAUTH.get("fail:all")]);
  return Number(mine || 0) >= MAX_TRIES_PER_IP || Number(all || 0) >= MAX_TRIES_TOTAL;
}

async function countFailure(env, ip) {
  const mine = Number((await env.OAUTH.get(`fail:${ip}`)) || 0) + 1;
  const all = Number((await env.OAUTH.get("fail:all")) || 0) + 1;
  await env.OAUTH.put(`fail:${ip}`, String(mine), { expirationTtl: TRY_WINDOW });
  await env.OAUTH.put("fail:all", String(all), { expirationTtl: 3600 });
}

function page(title, body, opts = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px;background:#09090B;color:#FAFAFA;font:18px/1.5 Geist,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.g{position:fixed;border-radius:50%;filter:blur(30px);pointer-events:none}
.g1{width:520px;height:460px;left:-160px;top:-180px;background:radial-gradient(closest-side,rgba(126,34,206,.55),transparent)}
.g2{width:560px;height:480px;right:-200px;bottom:-220px;background:radial-gradient(closest-side,rgba(14,116,144,.5),transparent)}
main{position:relative;width:100%;max-width:440px;background:rgba(24,24,27,.78);border:1px solid rgba(255,255,255,.09);border-radius:24px;padding:36px 30px;box-shadow:0 30px 80px -30px rgba(0,0,0,.9);backdrop-filter:blur(8px)}
.mark{display:flex;align-items:center;gap:12px;margin-bottom:28px;font-weight:600;font-size:16px;color:#D4D4D8}
.mark i{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#A78BFA,#2DD4BF);display:flex;align-items:center;justify-content:center}
h1{font-size:30px;line-height:1.15;letter-spacing:-.02em;margin:0 0 10px;font-weight:600}
p{color:#D4D4D8;margin:10px 0}
.err{color:#FECDD3;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.35);border-radius:12px;padding:10px 14px}
label{display:block;margin-top:22px;font-size:15px;font-weight:500;color:#E4E4E7}
.pw{position:relative;margin-top:8px}
input{width:100%;height:60px;padding:0 92px 0 18px;border-radius:16px;border:1.5px solid #3F3F46;background:#09090B;color:#FAFAFA;font:inherit;font-size:20px;outline:none}
input:focus{border-color:#A78BFA;box-shadow:0 0 0 4px rgba(167,139,250,.2)}
.show{position:absolute;right:8px;top:8px;height:44px;padding:0 14px;border-radius:12px;border:0;background:#27272A;color:#E4E4E7;font:inherit;font-size:15px;cursor:pointer}
.go{width:100%;height:60px;margin-top:16px;border:0;border-radius:16px;background:#FAFAFA;color:#09090B;font:inherit;font-weight:600;font-size:19px;cursor:pointer}
.go:hover{background:#E4E4E7}
.foot{margin-top:22px;font-size:14px;color:#A1A1AA;display:flex;gap:8px;align-items:center}
ol{padding:0;margin:20px 0 0;list-style:none;counter-reset:s}
ol li{counter-increment:s;position:relative;padding:0 0 18px 50px;color:#E4E4E7}
ol li::before{content:counter(s);position:absolute;left:0;top:-2px;width:34px;height:34px;border-radius:50%;background:#27272A;border:1px solid #3F3F46;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:16px}
.url{display:flex;gap:8px;margin-top:8px}
.url code{flex:1;min-width:0;background:#09090B;border:1px solid #3F3F46;border-radius:12px;padding:12px 14px;font-size:15px;word-break:break-all;color:#FAFAFA}
.url button{flex:0 0 auto;border:0;border-radius:12px;padding:0 16px;background:#FAFAFA;color:#09090B;font:inherit;font-weight:600;font-size:16px;cursor:pointer}
b{color:#FAFAFA}
@media (max-width:420px){main{padding:28px 20px}h1{font-size:26px}}
</style></head><body><div class="g g1"></div><div class="g g2"></div><main>
<div class="mark"><i><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#09090B" stroke-width="2"><rect x="6.5" y="6.5" width="11" height="11"/><rect x="6.5" y="6.5" width="11" height="11" transform="rotate(45 12 12)"/></svg></i>Agentic OS</div>
<h1>${escapeHtml(title)}</h1>${body}
<div class="foot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>Private. Only your password opens this brain.</div>
</main>${opts.script ? `<script>${opts.script}</script>` : ""}</body></html>`;
}

function signInPage(env, reqId, error) {
  const name = env.BRAIN_NAME ? `${escapeHtml(env.BRAIN_NAME)}'s brain` : "your brain";
  return page(env.BRAIN_NAME ? `Welcome back, ${env.BRAIN_NAME}` : "Welcome back",
    `<p>Type your password to connect ${name} to Claude.</p>${error ? `<p class="err">${escapeHtml(error)}</p>` : ""}
<form method="post" action="/authorize"><input type="hidden" name="req" value="${escapeHtml(reqId)}">
<label for="pw">Brain password</label>
<div class="pw"><input id="pw" type="password" name="password" autocomplete="current-password" required autofocus><button type="button" class="show" id="show">Show</button></div>
<button class="go" type="submit">Connect</button></form>`,
    { script: `document.getElementById("show").onclick=function(){var i=document.getElementById("pw"),t=i.type==="password";i.type=t?"text":"password";this.textContent=t?"Hide":"Show";i.focus();};` });
}

/* ---------- U1: token issuing, with refresh ---------- */

async function issueTokens(env, email, clientId) {
  const accessToken = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const refreshToken = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const atHash = hex(new Uint8Array(await sha256(accessToken)));
  const rtHash = hex(new Uint8Array(await sha256(refreshToken)));

  // Only hashes are stored, so a dump of KV cannot be replayed as a token.
  await env.OAUTH.put(`token:${atHash}`, JSON.stringify({ email, created: Date.now() }), { expirationTtl: ACCESS_TTL });
  await env.OAUTH.put(`refresh:${rtHash}`, JSON.stringify({ email, client_id: clientId || "", created: Date.now() }), { expirationTtl: REFRESH_TTL });

  return json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TTL,
    refresh_token: refreshToken,
    scope: "brain"
  });
}

async function grantAuthCode(form, env) {
  const code = form.get("code");
  const verifier = form.get("code_verifier");
  const redirectUri = form.get("redirect_uri");
  const stored = code ? await env.OAUTH.get(`authcode:${code}`) : null;
  if (!stored) return json({ error: "invalid_grant", message: "code not found or expired" }, 400);
  const rec = JSON.parse(stored);
  await env.OAUTH.delete(`authcode:${code}`);

  if (redirectUri && rec.redirect_uri && redirectUri !== rec.redirect_uri) {
    return json({ error: "invalid_grant", message: "redirect_uri mismatch" }, 400);
  }
  const challenge = b64url(new Uint8Array(await sha256(verifier || "")));
  if (challenge !== rec.code_challenge) {
    return json({ error: "invalid_grant", message: "PKCE verification failed" }, 400);
  }
  return await issueTokens(env, rec.email, rec.client_id);
}

async function grantRefresh(form, env) {
  const rt = form.get("refresh_token");
  const clientId = form.get("client_id") || "";
  if (!rt) return json({ error: "invalid_request", message: "refresh_token is required" }, 400);

  const rtHash = hex(new Uint8Array(await sha256(rt)));
  const raw = await env.OAUTH.get(`refresh:${rtHash}`);
  if (!raw) return json({ error: "invalid_grant", message: "refresh token not found or expired" }, 400);
  const rec = JSON.parse(raw);

  // A public client proves nothing but its identity, so bind the token to it.
  if (rec.client_id && clientId && rec.client_id !== clientId) {
    return json({ error: "invalid_grant", message: "refresh token was issued to a different client" }, 400);
  }

  // Rotate on use. The old token survives only the grace window, long enough for
  // a client that lost the response to retry, short enough to be useless later.
  await env.OAUTH.put(`refresh:${rtHash}`, JSON.stringify({ ...rec, superseded: true }), { expirationTtl: REFRESH_GRACE });

  return await issueTokens(env, rec.email, rec.client_id || clientId);
}

/* ---------- MCP ---------- */

const TOOLS = [
  { name: "read_brain", description: "Read a file from the Brain repo by its path (for example identity/about-me.md).",
    inputSchema: { type: "object", properties: { path: { type: "string", description: "Repo-relative file path" } }, required: ["path"] } },
  { name: "list_brain", description: "List files under a directory of the Brain repo (default: repo root).",
    inputSchema: { type: "object", properties: { path: { type: "string", description: "Directory path, default empty for root" } } } },
  { name: "append_diary", description: "Append a dated note to today's diary file (creates it from the template if missing).",
    inputSchema: { type: "object", properties: { text: { type: "string", description: "Text to append under the Log section" }, date: { type: "string", description: "Optional YYYY-MM-DD, defaults to today (UTC)" } }, required: ["text"] } },
  { name: "capture_fact", description: "Append a dated fact to a pillar file (append-only). Use the routing table in AGENTS.md.",
    inputSchema: { type: "object", properties: { path: { type: "string", description: "Pillar file path, for example memory/people.md" }, text: { type: "string", description: "The fact to append" } }, required: ["path", "text"] } },
  { name: "add_open_loop", description: "Append a task to context/open-loops.md under the Open section (append-only).",
    inputSchema: { type: "object", properties: { text: { type: "string", description: "The task text" } }, required: ["text"] } },
  { name: "edit_diary", description: "Replace a unique snippet inside a diary file. Diary-only by construction. Requires a unique match.",
    inputSchema: { type: "object", properties: { date: { type: "string", description: "YYYY-MM-DD of the diary file to edit" }, find: { type: "string", description: "Exact text to find (must be unique in the file)" }, replace: { type: "string", description: "Replacement text" } }, required: ["date", "find", "replace"] } }
];

async function handleMcp(rpc, env, email) {
  if (!rpc || rpc.jsonrpc !== "2.0") return rpcError(rpc && rpc.id, -32600, "Invalid Request");
  const { method, id, params } = rpc;
  if (id === undefined || id === null) return null;

  if (method === "initialize") {
    return rpcOk(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "agentic-os-brain", version: "3.0.0" }
    });
  }
  if (method === "ping") return rpcOk(id, {});
  if (method === "tools/list") return rpcOk(id, { tools: TOOLS });
  if (method === "tools/call") {
    const name = params && params.name;
    const args = (params && params.arguments) || {};
    try {
      const text = await callTool(name, args, env);
      return rpcOk(id, { content: [{ type: "text", text }] });
    } catch (e) {
      return rpcOk(id, { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true });
    }
  }
  return rpcError(id, -32601, `Method not found: ${method}`);
}

/* ---------------------------------------------------------------------------
 * Path guards. Two rules, enforced in code rather than by good behaviour.
 *
 * 1. archive/ is never served through the connector. It holds raw exports of
 *    whole conversation histories. Nothing in normal use needs them, so a
 *    confused, hijacked or over eager session cannot pull them out. To read
 *    the archive, go to GitHub directly and decrypt it by hand.
 * 2. Writes are limited to an allowlist of brain paths. CONSTITUTION.md,
 *    AGENTS.md, CLAUDE.md, the skills and the worker's own source cannot be
 *    written by any tool here. The constitution says only the owner edits it;
 *    this makes that
 *    structural instead of a promise.
 * ------------------------------------------------------------------------ */

const READ_DENY = ["archive/", ".git/", ".github/"];
const WRITE_ALLOW_DIRS = [
  "identity/", "context/", "memory/", "records/", "finance/", "clients/",
  "people/", "diary/", "chief/", "inbox/", "outputs/", "agents/",
];
const WRITE_ALLOW_FILES = ["LOG.md", "INDEX.md"];

function normalisePath(path) {
  const p = String(path == null ? "" : path);
  if (p.startsWith("/") || p.includes("..") || p.includes("\\") || p.includes("\0")) {
    throw new Error(`Invalid path: ${p}`);
  }
  return p;
}

function assertReadable(path) {
  const p = normalisePath(path);
  const lower = p.toLowerCase();
  for (const deny of READ_DENY) {
    if (lower === deny.slice(0, -1) || lower.startsWith(deny)) {
      throw new Error(
        `Refused: ${p} is not readable through this connector. The archive holds raw ` +
        `conversation history and is deliberately out of reach. Open it on GitHub if you need it.`
      );
    }
  }
  return p;
}

function assertWritable(path) {
  const p = normalisePath(path);
  if (!p) throw new Error("A path is required.");
  if (WRITE_ALLOW_FILES.includes(p)) return p;
  if (WRITE_ALLOW_DIRS.some((d) => p.startsWith(d))) return p;
  throw new Error(
    `Refused: this connector cannot write to ${p}. Writes are limited to the brain's ` +
    `own pages. CONSTITUTION.md, AGENTS.md, CLAUDE.md, .claude/, connector/ and archive/ are ` +
    `changed by hand in a commit, never by a tool call.`
  );
}

/* ---------------------------------------------------------------------------
 * Argument guards. Added 2026-09-17 after a real failure.
 *
 * A schema only describes the arguments; nothing enforces it. An agent once
 * sent capture_fact with no usable text and the literal word "undefined" was
 * written into the brain. So every write tool now proves its arguments before
 * it touches the repo, and a bad call fails loudly instead of writing junk.
 * ------------------------------------------------------------------------- */

function requireText(value, field, tool) {
  if (typeof value !== "string") {
    throw new Error(
      `${tool}: "${field}" is required and must be a string, but got ` +
      `${value === undefined ? "nothing" : typeof value}. Nothing was written. ` +
      `Check the argument name against the tool's schema and call it again.`
    );
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${tool}: "${field}" was empty. Nothing was written.`);
  }
  if (/^(undefined|null|NaN|\[object Object\])$/i.test(trimmed)) {
    throw new Error(
      `${tool}: "${field}" came through as the literal string "${trimmed}", which is ` +
      `almost always a value that failed to resolve. Nothing was written.`
    );
  }
  return trimmed;
}

async function callTool(name, args, env) {
  switch (name) {
    case "read_brain": {
      const rpath = assertReadable(args.path);
      const file = await ghRead(env, rpath);
      if (file === null) throw new Error(`File not found: ${rpath}`);
      return file.text;
    }
    case "list_brain": {
      const lpath = assertReadable(args.path || "");
      const items = (await ghList(env, lpath)).filter((i) => {
        try { assertReadable(i.path); return true; } catch { return false; }
      });
      return items.length ? items.map((i) => `${i.type === "dir" ? "[dir] " : "      "}${i.path}`).join("\n") : "(empty)";
    }
    case "append_diary": {
      const entry = requireText(args.text, "text", "append_diary");
      const date = validDate(args.date) || todayUTC();
      const path = diaryPath(date);
      await ghWrite(env, path, (text) => {
        const body = text !== null ? text : diaryTemplate(date);
        return appendUnderSection(body, "## Log", `- ${entry}`);
      }, `diary: append ${date}`);
      return `Appended to ${path}.`;
    }
    case "capture_fact": {
      const fact = requireText(args.text, "text", "capture_fact");
      requireText(args.path, "path", "capture_fact");
      assertWritable(args.path);
      const line = `- ${todayUTC()} ${fact}`;
      await ghWrite(env, args.path, (text) => {
        const base = text !== null ? text.replace(/\s*$/, "") : `# ${args.path}`;
        return `${base}\n${line}\n`;
      }, `capture: ${args.path}`);
      return `Appended a dated fact to ${args.path}.`;
    }
    case "add_open_loop": {
      const task = requireText(args.text, "text", "add_open_loop");
      const path = "context/open-loops.md";
      await ghWrite(env, path, (text) => {
        const body = text !== null ? text : "# Open loops\n\n## Open\n\n## Done\n";
        return appendUnderSection(body, "## Open", `- ${todayUTC()} [ ] ${task}`);
      }, "open-loop: add");
      return `Added task to ${path}.`;
    }
    case "edit_diary": {
      const date = validDate(args.date);
      if (!date) throw new Error("A valid YYYY-MM-DD date is required.");
      requireText(args.find, "find", "edit_diary");
      if (typeof args.replace !== "string") throw new Error('edit_diary: "replace" is required and must be a string. Nothing was written.');
      const path = diaryPath(date);
      await ghWrite(env, path, (text) => {
        if (text === null) throw new Error(`No diary file for ${date}.`);
        const count = occurrences(text, args.find);
        if (count === 0) throw new Error("The find text was not found.");
        if (count > 1) throw new Error(`The find text appears ${count} times; it must be unique.`);
        return text.replace(args.find, args.replace);
      }, `diary: edit ${date}`);
      return `Edited ${path}.`;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/* ---------- GitHub ---------- */

function ghBase(env) {
  return `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents`;
}
function ghHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "agentic-os-connector",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function ghRead(env, path) {
  const branch = env.REPO_BRANCH || "main";
  const r = await fetch(`${ghBase(env)}/${encodePath(path)}?ref=${branch}`, { headers: ghHeaders(env) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub read failed (${r.status}): ${await r.text()}`);
  const data = await r.json();
  if (Array.isArray(data)) throw new Error(`${path} is a directory, not a file.`);
  return { text: b64decode(data.content), sha: data.sha };
}

async function ghList(env, path) {
  const branch = env.REPO_BRANCH || "main";
  const r = await fetch(`${ghBase(env)}/${encodePath(path)}?ref=${branch}`, { headers: ghHeaders(env) });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`GitHub list failed (${r.status}): ${await r.text()}`);
  const data = await r.json();
  if (!Array.isArray(data)) return [{ type: "file", path: data.path }];
  return data.map((d) => ({ type: d.type, path: d.path }));
}

async function ghPutRaw(env, path, content, sha, message) {
  const branch = env.REPO_BRANCH || "main";
  const body = { message, content: b64encode(content), branch };
  if (sha) body.sha = sha;
  const r = await fetch(`${ghBase(env)}/${encodePath(path)}`, {
    method: "PUT",
    headers: { ...ghHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (r.ok) return { ok: true, status: r.status };
  return { ok: false, status: r.status, text: await r.text() };
}

// U2. The write that cannot lose a fact.
//
// GitHub rejects a write whose file version is stale, which happens whenever two
// things save to the same file at once. Rather than fail, re-read the file and
// re-apply the change to the fresh text, then try again. Because every change here
// is an append, replaying it on newer content is always safe: the other writer's
// line survives and ours lands after it.
//
// `transform` receives the current file text, or null if the file does not exist,
// and returns the new text. It may throw to abort without retrying.
async function ghWrite(env, path, transform, message) {
  let lastError = "";
  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt++) {
    const file = await ghRead(env, path);
    const body = transform(file ? file.text : null);
    const res = await ghPutRaw(env, path, body, file && file.sha, message);
    if (res.ok) return;

    // 409 and 422 both mean "your version of the file was stale". Anything else
    // is a real failure and retrying would only hide it.
    if (res.status === 409 || res.status === 422) {
      lastError = `${res.status} ${res.text}`;
      await sleep(120 * Math.pow(2, attempt) + Math.floor(Math.random() * 80));
      continue;
    }
    throw new Error(`GitHub write failed (${res.status}): ${res.text}`);
  }
  throw new Error(`GitHub write to ${path} failed after ${WRITE_ATTEMPTS} attempts because another write kept winning the race. Nothing was saved, so try again. Last error: ${lastError}`);
}

/* ---------- helpers ---------- */

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function diaryPath(date) {
  const [y, m] = date.split("-");
  return `diary/${y}/${m}/${date}.md`;
}
function diaryTemplate(date) {
  return `# Diary — ${date}\n\n## Focus\n\n## Log\n\n## Handoff\n`;
}
function appendUnderSection(body, header, line) {
  const idx = body.indexOf(header);
  if (idx === -1) return body.replace(/\s*$/, "") + `\n\n${header}\n${line}\n`;
  const after = idx + header.length;
  const nextHeader = body.indexOf("\n## ", after);
  const insertAt = nextHeader === -1 ? body.length : nextHeader;
  const head = body.slice(0, insertAt).replace(/\s*$/, "");
  const tail = body.slice(insertAt);
  return `${head}\n${line}\n${tail}`;
}
function occurrences(hay, needle) {
  if (!needle) return 0;
  let n = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}
function validDate(s) { return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; }
function todayUTC() { return new Date().toISOString().slice(0, 10); }
function encodePath(path) { return String(path).split("/").filter(Boolean).map(encodeURIComponent).join("/"); }

function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(String(b64).replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function b64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function hex(bytes) { return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(""); }
async function sha256(str) { return await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)); }

function rpcOk(id, result) { return { jsonrpc: "2.0", id, result }; }
function rpcError(id, code, message) { return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }; }

function json(obj, status = 200, extra = {}) {
  return cors(new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...extra } }));
}
function html(inner, status = 200) {
  return cors(new Response(`<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;max-width:40rem;margin:4rem auto;padding:0 1rem">${inner}</body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }));
}
function unauthorized(origin) {
  return cors(new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`
    }
  }));
}
function cors(resp) {
  const h = new Headers(resp.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Mcp-Session-Id, mcp-protocol-version");
  return new Response(resp.body, { status: resp.status, headers: h });
}
async function safeJson(request) {
  try { return await request.json(); } catch { return {}; }
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
