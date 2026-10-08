/**
 * @openapi
 * /suppliers:
 *   get:
 *     summary: List suppliers
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     description: Admin/operator endpoint used to manage suppliers.
 *     responses:
 *       200:
 *         description: Supplier list
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Supplier' } }
 *       401: { description: Authentication required }
 *       403: { description: Access denied }
 *   post:
 *     summary: Create a supplier
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateSupplierRequest' }
 *     responses:
 *       201:
 *         description: Supplier created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Supplier' }
 *       400: { description: Invalid supplier or coverage data }
 *       401: { description: Authentication required }
 *       403: { description: Access denied }
 *       409: { description: Duplicate coverage rule }
 *
 * /suppliers/matching/order-item:
 *   get:
 *     summary: Find suppliers matching an order item
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: brandId, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *       - { in: query, name: carModelId, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *       - { in: query, name: categoryId, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200:
 *         description: Matching suppliers
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Supplier' } }
 *       400: { description: Invalid query parameters }
 *       401: { description: Authentication required }
 *       403: { description: Access denied }
 *
 * /suppliers/{id}:
 *   get:
 *     summary: Get a supplier
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200:
 *         description: Supplier details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Supplier' }
 *       404: { description: Supplier not found }
 *   patch:
 *     summary: Update a supplier
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateSupplierRequest' }
 *     responses:
 *       200: { description: Supplier updated }
 *       400: { description: Invalid supplier data }
 *       404: { description: Supplier not found }
 *   delete:
 *     summary: Deactivate a supplier
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200: { description: Supplier deactivated }
 *       404: { description: Supplier not found }
 *
 * /suppliers/{id}/coverage:
 *   get:
 *     summary: Get supplier coverage rules
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200:
 *         description: Coverage rules retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/SupplierCoverageRule' }
 *       401: { description: Authentication required }
 *       403: { description: Access denied }
 *       404: { description: Supplier not found }
 *   post:
 *     summary: Add a supplier coverage rule
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddSupplierCoverageRequest' }
 *     responses:
 *       200: { description: Coverage rule added successfully }
 *       400: { description: Invalid coverage data }
 *       401: { description: Authentication required }
 *       403: { description: Access denied }
 *       404: { description: Supplier, vehicle brand, car model, or category not found }
 *       409: { description: Duplicate coverage rule }
 *
 * /suppliers/{id}/coverage/{coverageId}:
 *   put:
 *     summary: Replace a supplier coverage rule
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *       - { in: path, name: coverageId, required: true, description: Coverage rule record ID, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReplaceSupplierCoverageRequest' }
 *     responses:
 *       200: { description: Coverage rule replaced successfully }
 *       400: { description: Invalid coverage data }
 *       401: { description: Authentication required }
 *       403: { description: Access denied }
 *       404: { description: Supplier or coverage rule not found }
 *       409: { description: Duplicate coverage rule }
 *   delete:
 *     summary: Soft-delete a supplier coverage rule
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { $ref: '#/components/schemas/ObjectId' } }
 *       - { in: path, name: coverageId, required: true, description: Coverage rule record ID, schema: { $ref: '#/components/schemas/ObjectId' } }
 *     responses:
 *       200: { description: Coverage rule deactivated successfully }
 *       400: { description: Invalid supplier or coverage rule ID }
 *       401: { description: Authentication required }
 *       403: { description: Access denied }
 *       404: { description: Supplier or coverage rule not found }
 */
