/**
 * @openapi
 * tags:
 *   - name: Invitations
 *     description: Supplier-specific order invitations and offers
 *
 * @openapi
 * /invitations/{token}:
 *   get:
 *     tags: [Invitations]
 *     summary: Open a supplier invitation
 *     description: Uses the single-purpose invitation token. No Bearer token is required. The token can be reused until its expiry deadline.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invitation and requested items
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean }, data: { $ref: '#/components/schemas/Invitation' } } }
 *       404: { description: Invitation not found or expired }
 *
 * /invitations/{token}/items/{itemKey}/offers:
 *   post:
 *     tags: [Invitations]
 *     summary: Submit an offer for an invited item
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *       - { in: path, name: itemKey, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SupplierOffer' }
 *     responses:
 *       201: { description: Offer created }
 *       400: { description: Invalid offer or item key }
 *       404: { description: Invitation or item not found }
 *       410: { description: Invitation expired }
 *   patch:
 *     tags: [Invitations]
 *     summary: Update a submitted offer
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *       - { in: path, name: itemKey, required: true, schema: { type: string } }
 *       - { in: path, name: offerId, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SupplierOffer' }
 *     responses:
 *       200: { description: Offer updated }
 *       400: { description: Invalid offer }
 *       404: { description: Offer or invitation not found }
 *       410: { description: Invitation expired }
 *   delete:
 *     tags: [Invitations]
 *     summary: Delete a submitted offer
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *       - { in: path, name: itemKey, required: true, schema: { type: string } }
 *       - { in: path, name: offerId, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200: { description: Offer deleted }
 *       404: { description: Offer or invitation not found }
 *       410: { description: Invitation expired }
 */
