import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET ?? "leskita-cron"}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.from('tenants').update({ status: 'SUSPENDED' } as never).eq('status','TRIAL').lt('trial_end', new Date().toISOString()).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ suspended: (data as { id: string }[] | null)?.length ?? 0, at: new Date().toISOString() });
}
export async function POST(request: Request) { return GET(request); }
