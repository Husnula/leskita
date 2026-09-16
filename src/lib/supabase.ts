import { createClient as createBrowserClient } from "./supabase/client";

// ponytail: singleton anon client cukup untuk MVP client components. Untuk konsistensi, prefer `import { createClient } from "@/lib/supabase/client"` per-component bila perlu fresh instance. Jangan expose service_role di client.
export const supabase = createBrowserClient();