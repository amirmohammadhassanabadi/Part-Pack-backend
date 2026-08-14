/**
 * @openapi
 * /api/v1/suppliers:
 *   post:
 *     summary: Create a supplier
 *     description: Creates a new supplier.
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
 *
 *       400:
 *         description: Invalid request data
 *
 *       401:
 *         description: Authentication required
 *
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *
 *       409:
 *         description: Supplier already exists
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @openapi
 * /api/v1/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     description: Returns all suppliers. Optional filters can be added later if needed.
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
 *
 *       401:
 *         description: Authentication required
 *
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @openapi
 * /api/v1/suppliers/matching:
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
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *       - in: query
 *         name: carModelId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the car model.
 *         example: 665a7b8c9d0e1f2a3b4c5d70
 *
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the part category.
 *         example: 665a7b8c9d0e1f2a3b4c5d72
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
 *
 *       400:
 *         description: Missing or invalid brandId, carModelId, or categoryId
 *
 *       401:
 *         description: Authentication required
 *
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @openapi
 * /api/v1/suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     description: Returns a single supplier with its coverage information.
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
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *     responses:
 *       200:
 *         description: Supplier retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *
 *       400:
 *         description: Invalid supplier ID
 *
 *       401:
 *         description: Authentication required
 *
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *
 *       404:
 *         description: Supplier not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @openapi
 * /api/v1/suppliers/{id}:
 *   patch:
 *     summary: Update a supplier
 *     description: Updates one or more fields of an existing supplier.
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
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
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
 *
 *       400:
 *         description: Invalid supplier ID or request data
 *
 *       401:
 *         description: Authentication required
 *
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *
 *       404:
 *         description: Supplier not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @openapi
 * /api/v1/suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier
 *     description: Permanently deletes a supplier.
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
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
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
 *
 *       400:
 *         description: Invalid supplier ID
 *
 *       401:
 *         description: Authentication required
 *
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *
 *       404:
 *         description: Supplier not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @openapi
 * /api/v1/suppliers/{id}/coverage:
 *   post:
 *     summary: Add supplier coverage
 *     description: Adds coverage for a vehicle brand to a supplier.
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
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
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
 *
 *       400:
 *         description: Invalid supplier or coverage data
 *
 *       401:
 *         description: Authentication required
 *
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *
 *       404:
 *         description: Supplier, brand, car model, or category not found
 *
 *       409:
 *         description: Coverage for this brand already exists
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @openapi
 * /api/v1/suppliers/{id}/coverage/{brandId}:
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
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the vehicle brand.
 *         example: 665a7b8c9d0e1f2a3b4c5d70
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReplaceSupplierCoverageRequest'
 *
 *     responses:
 *       200:
 *         description: Supplier coverage replaced successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *
 *       400:
 *         description: Invalid supplier, brand, or coverage data
 *
 *       401:
 *         description: Authentication required
 *
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *
 *       404:
 *         description: Supplier, brand, car model, category, or coverage not found
 *
 *       500:
 *         description: Internal server error
 */
/**
 * @openapi
 * /api/v1/suppliers/{id}/coverage/{brandId}:
 *   delete:
 *     summary: Remove supplier coverage
 *     description: Removes the coverage configuration for a specific brand from a supplier.
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
 *         example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the vehicle brand.
 *         example: 665a7b8c9d0e1f2a3b4c5d70
 *
 *     responses:
 *       200:
 *         description: Supplier coverage removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *
 *       400:
 *         description: Invalid supplier or brand ID
 *
 *       401:
 *         description: Authentication required
 *
 *       403:
 *         description: Access denied. Admin or Operator role required.
 *
 *       404:
 *         description: Supplier or coverage not found
 *
 *       500:
 *         description: Internal server error
 */