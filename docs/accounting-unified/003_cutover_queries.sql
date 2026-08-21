-- Deprecated: tips must not appear in accounting list/summary.
-- Sale income is persisted as BILL_SALE rows (see V74 in qr-service).
-- Manual entries remain in tbl_user_accounting_entry with source_type = MANUAL.

SELECT
  ae.id,
  ae.entry_type,
  ae.amount,
  ae.currency,
  ae.occurred_at,
  ae.note,
  ae.source_bill_id AS bill_id,
  ae.source_order_id,
  ae.id AS entry_id,
  ae.source_type
FROM tbl_user_accounting_entry ae
WHERE ae.source_type IN ('MANUAL', 'BILL_SALE')
  AND (:from IS NULL OR ae.occurred_at >= :from)
  AND (:to IS NULL OR ae.occurred_at <= :to);
