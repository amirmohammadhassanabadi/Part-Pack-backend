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
 *             - quoting
 *             - quoted
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
 * /orders/operator/{id}/start-quoting:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Start quoting an order
 *     description: Changes the order status from pending to quoting.
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
 *         description: Order status changed to quoting successfully.
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
 *         description: Order cannot be moved to quoting.
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
 * /orders/operator/{id}/items/{itemIndex}:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Update an order item's availability and price
 *     description: Allows the operator to set the availability status, availability description, and unit price for an order item.
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
 *       - name: itemIndex
 *         in: path
 *         required: true
 *         description: Zero-based index of the item in the order's items array.
 *         schema:
 *           type: integer
 *           minimum: 0
 *         example: 0
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateOrderItemPricingRequest"
 *
 *     responses:
 *       200:
 *         description: Order item updated successfully.
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
 *         description: Invalid availability or pricing data.
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: Access denied. Operator role required.
 *
 *       404:
 *         description: Order or order item not found.
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
 *       The order status changes from quoted to confirmed.
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
 * /orders/operator/{id}/submit-quote:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Submit an order quotation
 *     description: >
 *       Submits the quotation after the operator has processed every
 *       order item. The order status changes from quoting to quoted.
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
 *         description: Quotation submitted successfully.
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
 *         description: >
 *           The quotation cannot be submitted. One or more items may
 *           still be pending, missing a required price or description,
 *           or all items may be unavailable.
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
 *     description: Cancels an order that has not yet been confirmed.
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