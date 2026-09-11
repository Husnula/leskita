-- Fase 0: indexes + constraints + storage-friendly fixes
create unique index if not exists uq_fees_invoice_no on fees(invoice_no) where invoice_no is not null;
create index if not exists idx_students_tenant on students(tenant_id);
create index if not exists idx_sessions_tenant_start on sessions(tenant_id, start_at);
create index if not exists idx_fees_tenant_period on fees(tenant_id, period);
create index if not exists idx_fees_tenant_status on fees(tenant_id, status);
alter table fees add constraint chk_fees_amount_nonneg check (amount >= 0);
alter table students add constraint chk_students_fee_nonneg check (fee_amount >= 0);
