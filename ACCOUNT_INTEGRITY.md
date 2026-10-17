# Account integrity

Required identity fields are a nonblank name, a valid Iranian mobile (`09` plus
nine digits), an active/inactive flag, and a matching Auth record with the correct
role, model and profile ID. Address and supplier coverage are optional.

On startup the backend installs strict MongoDB collection validators for customers,
suppliers, staff and auth records. Invalid inserts and updates are rejected even
when they bypass Mongoose. Existing collection validators are preserved. The
database credential must permit `listCollections`, `createCollection` and `collMod`.
The backend fails startup if it cannot enforce these constraints.

Creation and identity updates use required replica-set transactions. Deploy the
infra replica-set configuration before this backend version. A failed Auth write
rolls back its profile write. Phone changes and active status are synchronized
between the profile and Auth. New logins and refreshes reject missing or inconsistent
identities. MongoDB does not provide foreign-key constraints; profile/Auth links
are therefore enforced by the transactional account service and checked by the
admin account report.

Existing invalid records are not automatically removed or populated with placeholder
names or phone numbers. In the admin Users page, choose «اطلاعات ناقص», open Details,
review the listed problems, and save the user's real name and mobile. The admin-only
`GET /api/v1/users` returns persisted values and integrity issues; `PATCH
/api/v1/users/:kind/:id` repairs customer, supplier, staff or orphan login records.
Multiple/conflicting login links are reported and rejected rather than reassigned
to another person. The repair API creates a missing login or missing profile only
within the same transaction.

Supplier self-service can recover a missing legacy mobile from its uniquely linked
supplier login account, then persist both the mobile and missing reference model.
It rejects an identity that cannot be recovered; valid coverage does not hide the
unresolved identity defect. Historical inactive coverage is kept separate from
identity validation.

Verification against isolated, disposable databases:

```bash
SALES_TEST_MONGO_URL='mongodb://127.0.0.1:27017/?replicaSet=rs0' \
  node --test test/account-integrity.integration.test.js test/supplier-coverage.integration.test.js test/sales-flow.integration.test.js
```
