"use server";

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with Service Role Key (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createTenantManual(data: {
  workspaceName: string;
  teacherName: string;
  email: string;
  planId: string | null;
  status: string;
  password?: string;
}) {
  try {
    const authData = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password || "Password123!",
      email_confirm: true,
    });

    if (authData.error) throw authData.error;

    const userId = authData.data.user.id;

    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        teacher_user_id: userId,
        workspace_name: data.workspaceName,
        status: data.status,
        plan_id: data.planId || null,
      })
      .select("id")
      .single();

    if (tenantError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw tenantError;
    }

    const tenantId = tenantData.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      tenant_id: tenantId,
      name: data.teacherName,
      email: data.email,
      role: "TEACHER",
    });

    if (profileError) {
      await supabaseAdmin.from("tenants").delete().eq("id", tenantId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    return { success: true, message: "Guru berhasil ditambahkan!" };
  } catch (error: any) {
    console.error("Error creating tenant:", error);
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

export async function deleteTenantManual(tenantId: string) {
  try {
    // Dapatkan ID user dari tenant untuk dihapus dari Auth
    const { data: tenant, error: fetchError } = await supabaseAdmin
      .from('tenants')
      .select('teacher_user_id')
      .eq('id', tenantId)
      .single();

    if (fetchError || !tenant) throw new Error("Tenant tidak ditemukan");

    const userId = tenant.teacher_user_id;

    // Hapus data terkait secara manual (karena tidak ada ON DELETE CASCADE)
    await supabaseAdmin.from('class_members').delete().eq('tenant_id', tenantId);
    await supabaseAdmin.from('attendance').delete().eq('tenant_id', tenantId);
    await supabaseAdmin.from('sessions').delete().eq('tenant_id', tenantId);
    await supabaseAdmin.from('classes').delete().eq('tenant_id', tenantId);
    await supabaseAdmin.from('students').delete().eq('tenant_id', tenantId);
    
    // Hapus profil user
    await supabaseAdmin.from('profiles').delete().eq('tenant_id', tenantId);
    
    // Hapus tenant
    await supabaseAdmin.from('tenants').delete().eq('id', tenantId);

    // Hapus user dari Auth (Supabase GoTrue)
    if (userId) {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteUserError) throw deleteUserError;
    }

    return { success: true, message: "Workspace guru beserta seluruh datanya berhasil dihapus." };
  } catch (error: any) {
    console.error("Error deleting tenant:", error);
    return { success: false, message: error.message || "Terjadi kesalahan saat menghapus tenant." };
  }
}
