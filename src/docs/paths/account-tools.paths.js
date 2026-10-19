/**
 * @openapi
 * /auth/sessions:
 *   get:
 *     tags: [Auth]
 *     summary: List refresh-token sessions owned by the signed-in account
 *     description: Returns device metadata and opaque session IDs, never tokens. Legacy devices may have unknown metadata. Current session is determined by the access token sid.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Own active sessions in data }
 *       401: { description: Authentication required }
 *   delete:
 *     tags: [Auth]
 *     summary: End all other sessions while preserving this device
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Other sessions revoked }
 *       401: { description: Authentication required }
 * /auth/sessions/{id}:
 *   delete:
 *     tags: [Auth]
 *     summary: Revoke one owned session including its access and refresh tokens
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Session revoked; current indicates whether this device was ended }
 *       404: { description: Session is missing or belongs to someone else }
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an unpaid order with a reason and explicit confirmation
 *     description: Customers may cancel only their own orders; admin and operator may cancel accessible orders. Suppliers are forbidden. Active or successful payments prevent cancellation. Cancels pending invoice, expires invitations, preserves history and releases reserved packs atomically.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason, confirm]
 *             properties:
 *               reason: { type: string, minLength: 3, maxLength: 1000 }
 *               confirm: { type: boolean, enum: [true] }
 *     responses:
 *       200: { description: Cancelled order in data }
 *       400: { description: Invalid reason or missing confirmation }
 *       403: { description: Supplier or unsupported role }
 *       404: { description: Order missing or not owned by customer }
 *       409: { description: Already cancelled or payment is active/successful }
 * /discounts:
 *   get:
 *     tags: [Discounts]
 *     summary: List discount codes (admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Codes in data }
 *       403: { description: Admin required }
 *   post:
 *     tags: [Discounts]
 *     summary: Create a discount code (admin only; amounts in IRR)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DiscountInput' }
 *     responses:
 *       201: { description: Created code in data }
 *       400: { description: Duplicate code or invalid settings }
 *       403: { description: Admin required }
 * /discounts/{id}:
 *   put:
 *     tags: [Discounts]
 *     summary: Edit or deactivate a discount without changing past invoices (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DiscountInput' }
 *     responses:
 *       200: { description: Updated code in data }
 *       400: { description: Invalid settings }
 *       403: { description: Admin required }
 *       404: { description: Code not found }
 * components:
 *   schemas:
 *     DiscountInput:
 *       type: object
 *       description: Empty restriction arrays allow all. Alternatives within a group use OR; different groups use AND. Categories include descendants. Brands are vehicle brands; model and brand limits use the order's selected vehicle. Bundle-only discounts cannot have category/vehicle restrictions. Minimum subtotal is checked against the full order; discount value and cap apply only to matching lines. Expiry/status are rechecked before starting payment.
 *       required: [name, code, type, value, expiresAt]
 *       properties:
 *         name: { type: string, maxLength: 150 }
 *         code: { type: string, pattern: '^[A-Za-z0-9_-]{3,40}$' }
 *         type: { type: string, enum: [percent, fixed] }
 *         value: { type: number, minimum: 0, description: 'Percent up to 100 or positive fixed IRR amount' }
 *         minimumSubtotal: { type: integer, minimum: 0 }
 *         maximumDiscount: { type: integer, minimum: 0, nullable: true }
 *         startsAt: { type: string, format: date-time, nullable: true }
 *         expiresAt: { type: string, format: date-time }
 *         isActive: { type: boolean }
 *         applicableTo: { type: string, enum: [all, parts, bundles] }
 *         categoryIds: { type: array, items: { type: string } }
 *         modelIds: { type: array, items: { type: string } }
 *         brandIds: { type: array, items: { type: string } }
 */
