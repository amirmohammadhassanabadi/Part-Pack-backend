/**
 * @openapi
 * /api/v1/invoices:
 *   get:
 *     summary: Get all invoices
 *     description: Returns all invoices.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/v1/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     description: Returns a single invoice.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the invoice.
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid invoice ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/v1/invoices/order/{orderId}:
 *   get:
 *     summary: Get invoice by order ID
 *     description: Returns the invoice associated with an order.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the order.
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid order ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/v1/invoices/{id}/pay:
 *   patch:
 *     summary: Mark invoice as paid
 *     description: Marks a pending invoice as paid.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the invoice.
 *     responses:
 *       200:
 *         description: Invoice marked as paid successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid invoice ID or invoice cannot be paid
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/v1/invoices/{id}/cancel:
 *   patch:
 *     summary: Cancel invoice
 *     description: Cancels a pending invoice.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the invoice.
 *     responses:
 *       200:
 *         description: Invoice cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid invoice ID or invoice cannot be cancelled
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */