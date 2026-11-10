import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Creates a Daybook account from a username + password.
// Accounts are stored as <username>@daybook.local so no email is ever sent.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.display_name ?? "").trim().slice(0, 60) || username;

  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) {
    return json({
      error: "Username must be 3-30 characters: letters, numbers, dot, dash or underscore.",
    }, 400);
  }
  if (password.length < 6 || password.length > 72) {
    return json({ error: "Password must be 6 to 72 characters." }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error } = await admin.auth.admin.createUser({
    email: `${username}@daybook.local`,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, username },
  });

  if (error) {
    const taken = error.status === 422 || /already|exists|registered/i.test(error.message ?? "");
    if (taken) return json({ error: "That username is already taken. Pick another." }, 409);
    console.error("createUser failed", error);
    return json({ error: "Could not create the account. Try again." }, 500);
  }

  return json({ ok: true });
});
