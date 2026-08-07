# Smart report data model (qr-service contract)

This site is a BFF over qr-service. Persistence lives in qr-service. Expected schema:

## `tbl_smart_report_events` (lifecycle; replaces `tbl_smart_report_job`)

Tracks report lifecycle only — no AI payload.

| Column | Type | Notes |
| --- | --- | --- |
| `process_id` | `UUID` PK | Was `job_id`; API still exposes as `jobId` |
| `user_id` | `BIGINT` NOT NULL | Owner |
| `menu_id` | `BIGINT` NOT NULL | Menu scope |
| `menu_name` | `VARCHAR(255)` NOT NULL | Snapshot at enqueue |
| `from_date` | `DATE` NOT NULL | Report range start |
| `to_date` | `DATE` NOT NULL | Report range end |
| `locale` | `VARCHAR(16)` | Default `tr` |
| `status` | `VARCHAR(32)` NOT NULL | See statuses |
| `error_code` | `VARCHAR(64)` | On failure |
| `error_message` | `TEXT` | On failure |
| `created_at` | `TIMESTAMPTZ` NOT NULL | Event start / enqueue time |
| `updated_at` | `TIMESTAMPTZ` | |
| `completed_at` | `TIMESTAMPTZ` | When terminal |
| `notification_sent_at` | `TIMESTAMPTZ` | Email notify marker |

**Statuses:** `queued` → `processing` → `completed` | `failed`

- **qr-service** inserts with `queued` when POST enqueue runs.
- Intermediate `processing` when AI starts (status event).
- **qr-service** sets `completed` (or `failed`) when consuming the AI status/result message.

Indexes: `(user_id, created_at DESC)`, `(user_id, status, created_at DESC)`, `(menu_id, status)`.

## `tbl_smart_report_results` (AI payload; new)

Written by **qr-service** when it consumes a successful AI response.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `BIGSERIAL` PK | |
| `menu_id` | `BIGINT` NOT NULL | |
| `process_id` | `UUID` NOT NULL UNIQUE | FK → `tbl_smart_report_events.process_id` |
| `result_text` | `TEXT` NOT NULL | AI description / markdown (or serialized result) |
| `created_at` | `TIMESTAMPTZ` NOT NULL DEFAULT NOW() | |

Detail GET joins event + result and maps `result_text` into the existing `result` DTO (`rawMarkdown` / structured fields as available).

## `tbl_user_entitlement.last_usage`

| Column | Type | Notes |
| --- | --- | --- |
| `last_usage` | `TIMESTAMPTZ` NULL | Set when a smart-report entitlement is consumed (enqueue or complete — qr-service decides; prefer enqueue) |

Quota / reporting UI uses `last_usage` (and/or quota DTO `lastUsage`) to decide whether the period allowance is already used.

## API expectations (this BFF)

| Endpoint | Behavior |
| --- | --- |
| `POST /analytics/menu/{menuId}/smart-reports` | Insert event `queued`; return `{ jobId, status: "queued" }` |
| Status consumer | On AI success: write `tbl_smart_report_results`, set event `completed`, update entitlement `last_usage` if not already |
| `GET /analytics/smart-reports` | History: **completed** events for user (optional `status=completed`) |
| `GET /analytics/smart-reports/{jobId}` | Event metadata + result from results table |
| `GET /analytics/smart-reports/quota` | `{ period, limit, used, remaining, resetsAt, lastUsage? }` |
| `GET /purchases/my/entitlements` | Include `lastUsage` on items |

## Proposed Flyway (qr-service)

See `docs/smart-report-qr-service-migration.sql`.
