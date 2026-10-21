/**
 * @openapi
 * /audit/orders/{orderId}/events:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Audit event API is retired
 *     description: Business audit events are emitted to backend application logs and are not stored for API retrieval.
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
 *       410:
 *         description: Audit events are available only in backend application logs.
 *       400:
 *         description: Invalid order ID.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Operator or admin role required.
 */
