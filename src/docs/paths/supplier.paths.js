/**
 * @openapi
 * /suppliers:
 *   post:
 *     summary: Create a supplier
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSupplierRequest'
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Supplier'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /suppliers/matching:
 *   get:
 *     summary: Find matching suppliers
 *     description: Returns active suppliers that cover the specified brand, car model, and part category.
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the vehicle brand.
 *
 *       - in: query
 *         name: carModelId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the car model.
 *
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the part category.
 *
 *     responses:
 *       200:
 *         description: Matching suppliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Missing or invalid parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the supplier.
 *     responses:
 *       200:
 *         description: Supplier retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Invalid supplier ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /suppliers/{id}:
 *   patch:
 *     summary: Update a supplier
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the supplier.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSupplierRequest'
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Invalid supplier ID or request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier
 *     description: Deactivates a supplier.
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the supplier.
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Supplier deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Invalid supplier ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /suppliers/{id}/coverage:
 *   post:
 *     summary: Add supplier coverage
 *     description: Adds coverage configuration for a vehicle brand.
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the supplier.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddSupplierCoverageRequest'
 *     responses:
 *       200:
 *         description: Supplier coverage added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Invalid supplier or coverage data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier, brand, car model, or category not found
 *       409:
 *         description: Coverage for this brand already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /suppliers/{id}/coverage/{brandId}:
 *   put:
 *     summary: Replace supplier coverage
 *     description: Replaces the existing coverage configuration for a specific brand.
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the supplier.
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the vehicle brand.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReplaceSupplierCoverageRequest'
 *     responses:
 *       200:
 *         description: Supplier coverage replaced successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Invalid supplier, brand, or coverage data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier or coverage not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /suppliers/{id}/coverage/{brandId}:
 *   delete:
 *     summary: Remove supplier coverage
 *     description: Removes coverage for a specific brand from a supplier.
 *     tags:
 *       - Suppliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the supplier.
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the vehicle brand.
 *     responses:
 *       200:
 *         description: Supplier coverage removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Invalid supplier or brand ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier or coverage not found
 *       500:
 *         description: Internal server error
 */