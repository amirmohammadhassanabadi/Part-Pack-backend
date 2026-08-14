/**
 * @openapi
 * /customers:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Create a customer
 *     description: Public customer registration endpoint. Authentication is not required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomerRequest'
 *
 *     responses:
 *       201:
 *         description: Customer created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *
 *       400:
 *         description: Invalid request data.
 *
 *       409:
 *         description: A customer with this phone number already exists.
 *
 *
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get all customers
 *     description: Returns a list of customers. Only admins and operators can access this endpoint.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter customers by phone number.
 *         example: 09121234567
 *
 *       - in: query
 *         name: fullName
 *         required: false
 *         schema:
 *           type: string
 *         description: Search customers by name.
 *         example: Ali
 *
 *       - in: query
 *         name: isActive
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter customers by active status.
 *         example: true
 *
 *     responses:
 *       200:
 *         description: Customers retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: Access denied.
 *
 *
 * /customers/{id}:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get customer by ID
 *     description: Admins and operators can access any customer. A customer can only access their own customer record.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer MongoDB ObjectId.
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *     responses:
 *       200:
 *         description: Customer retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *
 *       400:
 *         description: Invalid customer ID.
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: Customer can only access their own record.
 *
 *       404:
 *         description: Customer not found.
 *
 *
 * /customers/{id}/addresses:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Add an address to a customer
 *     description: Admins and operators can add an address to any customer. A customer can only add an address to their own account.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer MongoDB ObjectId.
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCustomerAddressRequest'
 *
 *     responses:
 *       200:
 *         description: Address added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *
 *       400:
 *         description: Invalid address data or customer ID.
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: Access denied.
 *
 *       404:
 *         description: Customer not found.
 *
 *
 * /customers/{id}/car-models:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Add a car to a customer
 *     description: Admins and operators can add a car to any customer. A customer can only add a car to their own account.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer MongoDB ObjectId.
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCustomerCarRequest'
 *
 *     responses:
 *       200:
 *         description: Car added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *
 *       400:
 *         description: Invalid car data or customer ID.
 *
 *       401:
 *         description: Authentication required.
 *
 *       403:
 *         description: Access denied.
 *
 *       404:
 *         description: Customer or car model not found.
 */