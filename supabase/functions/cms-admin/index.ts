// cms-admin: admin-only user management for the TechnoBayit CMS (Supabase Edge Function, free tier).
// Actions (POST JSON {action, ...}):
//   list                         -> users with email, role, last sign-in            (admin)
//   invite {email, role, name}   -> creates the user, sets the role, returns a one-time
//                                   "set your password" link to send to the writer  (admin)
//   reset_link {user_id}         -> one-time password-reset link for that user      (admin)
//   remove {user_id}             -> deletes the account (posts stay, author cleared) (admin, not self)
//   bootstrap {code, email}      -> first admin only: one-time code created in SQL by the site owner
// The service role key is read from the function's environment; it never reaches the browser.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PAGES = [
  "https://knigstone-max.github.io/techsite/admin/",
  "http://localhost:8000/techsite/admin/",
];
const ROLES = ["admin", "editor", "writer"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function pageFor(req: Request, wanted?: string) {
  if (wanted && ADMIN_PAGES.includes(wanted)) return wanted;
  const origin = req.headers.get("origin") || "";
  return ADMIN_PAGES.find((p) => p.startsWith(origin + "/")) || ADMIN_PAGES[0];
}

async function makeLink(type: "invite" | "recovery", email: string, page: string, name?: string) {
  const { data, error } = await admin.auth.admin.generateLink(
    type === "invite" ? { type, email, options: { data: { display_name: name || null } } } : { type, email },
  );
  if (error) throw error;
  const th = data.properties?.hashed_token;
  if (!th) throw new Error("no token returned");
  return { user: data.user, link: `${page}?token_hash=${encodeURIComponent(th)}&type=${type}` };
}

async function invite(req: Request, email: string, role: string, name: string | undefined, page: string) {
  email = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "bad_email" }, 400);
  if (!ROLES.includes(role)) return json({ error: "bad_role" }, 400);
  const { user, link } = await makeLink("invite", email, page, name);
  if (!user) throw new Error("user not created");
  const upd: Record<string, string> = { role };
  if (name) upd.display_name = name.slice(0, 60);
  const { error } = await admin.from("profiles").upsert({ id: user.id, ...upd });
  if (error) throw error;
  return json({ ok: true, user_id: user.id, link, expires_note: "link works once, within 24 hours or less" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let body: Record<string, any>;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const page = pageFor(req, body.page);

  try {
    if (body.action === "bootstrap") {
      const code = String(body.code || "");
      const email = String(body.email || "").trim().toLowerCase();
      if (code.length < 24) return json({ error: "forbidden" }, 403);
      const h = await sha256(code);
      const { data: row } = await admin.from("bootstrap_codes").select("email").eq("code_hash", h).maybeSingle();
      if (!row || row.email.toLowerCase() !== email) return json({ error: "forbidden" }, 403);
      await admin.from("bootstrap_codes").delete().eq("code_hash", h);
      return await invite(req, email, "admin", body.name, page);
    }

    // Everything else: the caller must be a signed-in admin.
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: who } = await admin.auth.getUser(token);
    if (!who?.user) return json({ error: "not_signed_in" }, 401);
    const { data: me } = await admin.from("profiles").select("role").eq("id", who.user.id).maybeSingle();
    if (me?.role !== "admin") return json({ error: "admins_only" }, 403);

    if (body.action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const { data: profs } = await admin.from("profiles").select("id, display_name, role");
      const byId = new Map((profs || []).map((p) => [p.id, p]));
      return json({
        users: data.users.map((u) => ({
          id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
          confirmed: !!u.email_confirmed_at, display_name: byId.get(u.id)?.display_name ?? null,
          role: byId.get(u.id)?.role ?? null, is_bot: (u.email || "").endsWith(".invalid"),
        })),
      });
    }
    if (body.action === "invite") return await invite(req, body.email, body.role, body.name, page);
    if (body.action === "reset_link") {
      const { data, error } = await admin.auth.admin.getUserById(String(body.user_id || ""));
      if (error || !data.user?.email) return json({ error: "not_found" }, 404);
      const { link } = await makeLink("recovery", data.user.email, page);
      return json({ ok: true, link });
    }
    if (body.action === "remove") {
      const id = String(body.user_id || "");
      if (id === who.user.id) return json({ error: "cannot_remove_self" }, 400);
      const { data: target } = await admin.from("profiles").select("role").eq("id", id).maybeSingle();
      if (target?.role === "admin") {
        const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
        if ((count || 0) <= 1) return json({ error: "last_admin" }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      return json({ ok: true });
    }
    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    const status = /already been registered|already registered|exists/i.test(msg) ? 409 : 500;
    return json({ error: status === 409 ? "already_exists" : "server_error", detail: msg.slice(0, 200) }, status);
  }
});
