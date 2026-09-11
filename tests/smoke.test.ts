import { describe, it, expect } from "vitest";
import { formatRupiah, generateInvoiceNo } from "../src/lib/format";
import { compileTemplate, buildWaLink } from "../src/lib/whatsapp";
import fs from "node:fs";
describe("leskita smoke", () => {
  it("formatRupiah", () => { expect(formatRupiah(100000)).toContain("Rp"); expect(formatRupiah(0)).toContain("0"); });
  it("invoiceNo unique", () => { const a = generateInvoiceNo(); const b = generateInvoiceNo(); expect(a.startsWith("INV-")).toBe(true); expect(a).not.toBe(b); });
  it("compileTemplate", () => { expect(compileTemplate("Halo {{name}}", { name: "Budi" })).toBe("Halo Budi"); });
  it("buildWaLink normalizes 08", () => { expect(buildWaLink("08123456789","hi")).toContain("628123456789"); expect(buildWaLink("62812","x")).toContain("62812"); });
  it("audit migration exists", () => { expect(fs.existsSync("supabase/migrations/003_fase3_hardening.sql")).toBe(true); });
  it("avatar migration exists", () => { expect(fs.existsSync("supabase/migrations/004_fase4_avatar.sql")).toBe(true); });
  it("cron route exists", () => { expect(fs.existsSync("src/app/api/cron/suspend-trials/route.ts")).toBe(true); });
  it("forgot+reset exist", () => { expect(fs.existsSync("src/app/forgot/page.tsx")).toBe(true); expect(fs.existsSync("src/app/reset/page.tsx")).toBe(true); });
  it("vercel cron exists", () => { expect(fs.existsSync("vercel.json")).toBe(true); });
});
