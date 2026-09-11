"use server";
import { createClient } from "@supabase/supabase-js";
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const parentHits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, max = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = parentHits.get(key);
  if (!entry || now > entry.resetAt) { parentHits.set(key, { count: 1, resetAt: now + windowMs }); return false; }
  if (entry.count >= max) return true;
  entry.count++; return false;
}

export async function lookupByParentEmail(email: string) {
  if (rateLimit("parent:" + email, 10, 60000)) return { success: false, message: "Terlalu banyak percobaan. Coba lagi 1 menit." };
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return { success: false, message: "Email tidak valid." };
  const { data: students, error } = await supabaseAdmin.from('students').select('id, name, subject, grade, status, tenant_id, tenants!inner(workspace_name)').eq('parent_email', normalized).limit(20) as { data: { id: string; name: string; subject: string; grade: string | null; status: string; tenant_id: string; tenants: { workspace_name: string } }[] | null; error: { message: string } | null };
  if (error) return { success: false, message: error.message };
  if (!students || students.length === 0) return { success: false, message: "Tidak ada siswa dengan email wali tersebut." };
  const studentIds = students.map(s=>s.id);
  const tenantId = students[0].tenant_id;
  const { data: fees } = await supabaseAdmin.from('fees').select('id, period, amount, status, due_date, invoice_no').in('student_id', studentIds).order('due_date', { ascending: false }).limit(20) as { data: { id: string; period: string; amount: number; status: string; due_date: string; invoice_no: string | null }[] | null };
  const { data: reports } = await supabaseAdmin.from('reports').select('id, material, progress, score, published_at, created_at, student_id').in('student_id', studentIds).not('published_at','is',null).order('created_at', { ascending: false }).limit(20) as { data: { id: string; material: string; progress: string; score: number | null; published_at: string | null; student_id: string }[] | null };
  const { data: sessions } = await supabaseAdmin.from('sessions').select('id, subject, start_at, status, student_id').in('student_id', studentIds).gte('start_at', new Date(Date.now()-7*86400000).toISOString()).order('start_at', { ascending: true }).limit(20) as { data: { id: string; subject: string; start_at: string; status: string; student_id: string }[] | null };
  return { success: true, students, fees: fees ?? [], reports: reports ?? [], sessions: sessions ?? [] };
}

export async function lookupByToken(token: string) {
  if (!token || token.length < 8) return { success: false, message: "Token tidak valid." };
  const { data: setting } = await supabaseAdmin.from('teacher_settings').select('tenant_id').eq('form_token', token).eq('form_enabled', true).maybeSingle() as { data: { tenant_id: string } | null };
  if (!setting) return { success: false, message: "Link tidak aktif." };
  const { data: students } = await supabaseAdmin.from('students').select('id, name, subject').eq('tenant_id', setting.tenant_id).eq('status','ACTIVE').limit(50) as { data: { id: string; name: string; subject: string }[] | null };
  return { success: true, tenant_id: setting.tenant_id, students: students ?? [] };
}
