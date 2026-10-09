/**
 * @openapi
 * /orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create a new order
 *     description: Creates a new order for the authenticated customer.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateOrderRequest"
 *
 *     responses:
 *       201:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Order"
 *
 *       400:
 *         description: Invalid order data.
 *
 *       401:
 *         description: Authentication required.
 */
/**
 * @openapi
 * /orders/my-orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get customer's orders
 *     description: Returns the authenticated customer's orders with pagination.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of orders per page. Maximum 100.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         example: 20
 *
 *     responses:
 *       200:
 *         description: Customer orders retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Order"
 *                 pagination:
 *                   $ref: "#/components/schemas/Pagination"
 *
 *       401:
 *         description: Authentication required.
 */
/**
 * @openapi
 * /orders/my-orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get a customer's order
 *     description: Returns a single order belonging to the authenticated customer.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *         example: "665f1c8e2f8c1b001234abcd"
 *
 *     responses:
 *       200:
 *         description: Order retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Order"
 *
 *       400:
 *         description: Invalid order ID.
 *
 *       401:
 *         description: Authentication required.
 *
 *       404:
 *         description: Order not found.
 */

/**
 * @openapi
 * /orders/my-orders/{id}/offers:
 *   get:
 *     tags: [Orders]
 *     summary: Get offers available to the customer
 *     description: Returns only operator-shortlisted offers. Supplier identity, supplier price and markup details are never returned.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200:
 *         description: Customer-facing offer board
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId: { $ref: '#/components/schemas/ObjectId' }
 *                     orderStatus: { type: string, example: customer_selection }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           itemKey: { type: string }
 *                           title: { type: string }
 *                           requestedQuantity: { type: integer }
 *                           offers:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 _id: { $ref: '#/components/schemas/ObjectId' }
 *                                 brandName: { type: string }
 *                                 manufacturerName: { type: string, nullable: true }
 *                                 partNumber: { type: string, nullable: true }
 *                                 availableQuantity: { type: integer }
 *                                 customerUnitPrice: { type: number }
 *       400: { description: Offers are not ready for customer selection }
 *       401: { description: Authentication required }
 *       404: { description: Order not found }
 *
 * /orders/my-orders/{id}/select-offers:
 *   post:
 *     tags: [Orders]
 *     summary: Select one offer per order item
 *     description: The customer selects exactly one shortlisted offer for every order item. The order then moves to awaiting_payment.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [selections]
 *             properties:
 *               selections:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [itemKey, offerId]
 *                   properties:
 *                     itemKey: { type: string }
 *                     offerId: { $ref: '#/components/schemas/ObjectId' }
 *                     selectedQuantity: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Customer offers selected and payment preparation opened }
 *       400: { description: Invalid or incomplete selection }
 *       401: { description: Authentication required }
 *       404: { description: Order or offer not found }
 */

/**
 * @openapi
 * /orders/my-orders/{id}/checkout:
 *   post:
 *     tags: [Orders]
 *     summary: Prepare an order for payment
 *     description: Selects an existing customer address or creates a new saved address, stores an immutable address snapshot on the order, and returns the payment amount. No payment is performed by this endpoint.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [addressId]
 *                 properties:
 *                   addressId: { $ref: '#/components/schemas/ObjectId' }
 *               - type: object
 *                 required: [address]
 *                 properties:
 *                   address: { $ref: '#/components/schemas/CustomerAddress' }
 *     responses:
 *       200: { description: Checkout prepared and payment amount calculated }
 *       400: { description: Invalid address, order state, or selected pricing }
 *       401: { description: Authentication required }
 *       404: { description: Order, customer, or address not found }
 */

/**
 * @openapi
 * /orders/operator/{id}/invitations:
 *   get:
 *     tags: [Orders]
 *     summary: Get supplier invitations for an order
 *     description: Operator-only view of the supplier invitations created for the order.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200:
 *         description: Invitations retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Invitation' } }
 *       401: { description: Authentication required }
 *       403: { description: Operator role required }
 *       404: { description: Order not found }
 *
 * /orders/operator/{id}/offers:
 *   get:
 *     tags: [Orders]
 *     summary: Get the offer board for an order
 *     description: Returns all supplier offers grouped by order item for operator review.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200:
 *         description: Offer board retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, additionalProperties: true }
 *       401: { description: Authentication required }
 *       403: { description: Operator role required }
 *       404: { description: Order not found }
 */
/**
 * @openapi
 * /orders/operator/{id}/select-offers:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Select supplier offers for an order
 *     description: Selects one available supplier offer per item, or marks an item unavailable.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/SelectOrderOffersRequest"
 *     responses:
 *       200:
 *         description: Offer decisions saved successfully.
 *       400:
 *         description: Every item must have a valid offer selection or unavailable decision.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Access denied. Operator role required.
 *       404:
 *         description: Order not found.
 */
/**
 * @openapi
 * /orders/operator:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get orders for operator dashboard
 *     description: Returns orders for the operator dashboard with optional status filtering and pagination.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         description: Filter orders by their current status.
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - supplier_invitation
 *             - collecting_offers
 *             - offers_ready
 *             - confirmed
 *             - cancelled
 *         example: pending
 *
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of orders per page. Maximum 100.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         example: 20
 *
 *     responses:
 *       200:
 *         description: Orders retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Order"
 *                 pagination:
 *                   $ref: "#/components/schemas/Pagination"
 *
 *       400:
 *         description: Invalid order status.
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: Access denied. Operator role required.
 */
/**
 * @openapi
 * /orders/operator/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get an order by ID for operator
 *     description: Returns a single order for the authenticated operator.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *         example: "665f1c8e2f8c1b001234abcd"
 *
 *     responses:
 *       200:
 *         description: Order retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Order"
 *
 *       400:
 *         description: Invalid order ID.
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: Access denied. Operator role required.
 *
 *       404:
 *         description: Order not found.
 */
/**
 * @openapi
 * /orders/operator/{id}/confirm:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Confirm an order
 *     description: >
 *       Confirms an order after the customer has accepted the quotation.
 *       The order status changes from offers_ready to confirmed and a pending
 *       invoice is created with all available and unavailable lines.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *         example: "665f1c8e2f8c1b001234abcd"
 *
 *     responses:
 *       200:
 *         description: Order confirmed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Order"
 *
 *       400:
 *         description: Order cannot be confirmed from its current state.
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: Access denied. Operator role required.
 *
 *       404:
 *         description: Order not found.
 */
/**
 * @openapi
 * /orders/operator/{id}/cancel:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Cancel an order
 *     description: Cancels an order and any associated pending invoice. Orders with paid invoices cannot be cancelled.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *         example: "665f1c8e2f8c1b001234abcd"
 *
 *     responses:
 *       200:
 *         description: Order cancelled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Order"
 *
 *       400:
 *         description: Order cannot be cancelled.
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: Access denied. Operator role required.
 *
 *       404:
 *         description: Order not found.
 */
