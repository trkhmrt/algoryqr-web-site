## BillClose service update

`TableBillService.finalizeBillClose()` flow:

1. Bill status `CLOSED`
2. `closedAt` set
3. `paymentMethod` set
4. `tipAmount` set from payload (nullable; stored on bill only)
5. Save bill + revoke table sessions
6. Publish `BillClosedEvent` (AFTER_COMMIT)
7. `@Async` `BillClosedAccountingListener` → `UserAccountingService.recordBillSale(billId)`
   - Inserts one `BILL_SALE` / `GELIR` row with `amount = bill.totalAmount`
   - Does **not** write tip (`BILL_TIP` never created)
   - Sets `menuId`, `sourceBillId`, optional `sourceOrderId` (only when bill items share exactly one order id)
   - Idempotent via `existsBySourceTypeAndSourceBillId` + unique index

## Accounting entries list update

`UserAccountingService.listForCurrentUser()`:

- Reads stored rows only: `source_type IN (MANUAL, BILL_SALE)`
- Tips are excluded from list and from `summary.totalGelir`
- Response item shape matches `EntryResponse` (numeric `id`, `sourceType`, `sourceBillId`, `sourceOrderId`, …)

## Detail

`GET /accounting/entries/{entryId}/detail` returns line items from linked order (if `sourceOrderId`) or bill items (if only `sourceBillId`).

## Delete rule

- `MANUAL` rows deletable with `/accounting/entries/{entryId}`
- `BILL_SALE` rows non-deletable

## Cutover sequence

1. Deploy service with async BILL_SALE writer + list change
2. Run `V74__backfill_bill_sale_accounting_entries.sql` (Flyway)
3. Validate: closed bills have BILL_SALE rows; tips not in accounting totals
