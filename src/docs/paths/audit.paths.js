/**
 * @openapi
 * /audit/orders/{orderId}/events:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Get the audit trail of an order
 *     description: Returns the chronological business events recorded for an order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order audit events retrieved successfully.
 *       400:
 *         description: Invalid order ID.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Operator or admin role required.
 */
