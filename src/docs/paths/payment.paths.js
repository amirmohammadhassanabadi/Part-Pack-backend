/**
 * @openapi
 * tags:
 *   - name: Payments
 *     description: Provider-independent payment session lifecycle
 *
 * @openapi
 * /payments/orders/{orderId}/session:
 *   post:
 *     tags: [Payments]
 *     summary: Create a payment session for an order
 *     description: Creates or reuses an internal payment record. The actual Iranian gateway redirect is returned only after a provider is configured.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: orderId, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       201: { description: Payment session created }
 *       400: { description: Order is not ready for payment }
 *       401: { description: Authentication required }
 *       404: { description: Order not found }
 *       503: { description: No Iranian payment provider has been configured }
 *
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get the customer's payment status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200: { description: Payment status retrieved }
 *       401: { description: Authentication required }
 *       404: { description: Payment not found }
 */
