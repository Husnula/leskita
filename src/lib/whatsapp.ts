import { formatRupiah } from "./format";
export function compileTemplate(tpl: string, vars: Record<string,string|number>) {
  let out = tpl;
  for (const [k,v] of Object.entries(vars)) out = out.replaceAll(`{{${k}}}`, String(v));
  return out;
}
export function buildFeeWaMessage(fee: { period: string; amount: number; due_date: string; students?: { name: string } | null }, settings: { whatsapp_template?: string | null; payment_instructions?: string | null }) {
  const tpl = settings.whatsapp_template || `Halo Bapak/Ibu wali {{student}},\n\nTagihan les periode {{period}} sebesar {{amount}} jatuh tempo {{due_date}}.\n{{payment_instructions}}\n\nTerima kasih.`;
  return compileTemplate(tpl, {
    student: fee.students?.name ?? "-",
    period: fee.period,
    amount: formatRupiah(fee.amount),
    due_date: fee.due_date,
    payment_instructions: settings.payment_instructions ?? "",
  });
}
export function buildWaLink(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  const normalized = digits.startsWith("0") ? "62" + digits.slice(1) : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
export async function sendViaProvider(_phone: string, _message: string) {
  throw new Error("WA provider belum dikonfigurasi. Set WA_PROVIDER_URL & WA_PROVIDER_TOKEN di .env, lalu implementasi di supabase/functions/send-wa/index.ts. ponytail: wa.me link cukup sampai volume >50/bulan.");
}
