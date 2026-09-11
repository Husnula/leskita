import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const env = fs.readFileSync(".env.local","utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] ?? "").trim();
const url = get("NEXT_PUBLIC_SUPABASE_URL");
const service = get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !service) { console.error("missing env"); process.exit(1); }
const supabase = createClient(url, service, { auth: { autoRefreshToken: false } });
const email = "pakhusnulid@gmail.com";
console.log("target", email, "url", url.slice(0,30)+"...");

// 1. cek profiles
let { data: prof, error: e1 } = await supabase.from("profiles").select("id,email,role,tenant_id").eq("email", email).maybeSingle();
console.log("profiles lookup:", prof, e1?.message ?? "");

// 2. cek auth.users via admin
let userId = prof?.id ?? null;
if (!userId) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) console.error("listUsers error", error.message);
  const u = data?.users?.find(x => x.email?.toLowerCase() === email.toLowerCase());
  console.log("auth user found:", u ? { id: u.id, email: u.email } : "NOT FOUND");
  userId = u?.id ?? null;
  if (!u) {
    console.error("User belum ada di auth.users — suruh login sekali dulu atau daftar.");
    process.exit(0);
  }
}

// 3. upsert profiles role ADMIN
if (prof) {
  const { data, error } = await supabase.from("profiles").update({ role: "ADMIN" }).eq("id", userId).select("id,email,role").single();
  if (error) { console.error("update error", error.message); process.exit(1); }
  console.log("updated:", data);
} else {
  const { data, error } = await supabase.from("profiles").insert({ id: userId, email, role: "ADMIN", name: "Pak Husnul" }).select("id,email,role").single();
  if (error) { console.error("insert error", error.message); process.exit(1); }
  console.log("inserted:", data);
}

// 4. verifikasi is_admin via profiles count
const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("email", email).eq("role", "ADMIN");
console.log("verify ADMIN count:", count);
console.log("DONE — re-login pakhusnulid@gmail.com untuk aktif.");
