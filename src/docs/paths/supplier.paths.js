/**
 * @openapi
 * /suppliers/{id}/coverage:
 *   get:
 *     summary: Get supplier coverage rules
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coverage rules retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier not found
 *
 *   post:
 *     summary: Add a supplier coverage rule
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddSupplierCoverageRequest'
 *     responses:
 *       200:
 *         description: Coverage rule added successfully
 *       400:
 *         description: Invalid coverage data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier, vehicle brand, car model, or category not found
 *       409:
 *         description: Duplicate coverage rule
 *
 * /suppliers/{id}/coverage/{coverageId}:
 *   put:
 *     summary: Replace a supplier coverage rule
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: coverageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReplaceSupplierCoverageRequest'
 *     responses:
 *       200:
 *         description: Coverage rule replaced successfully
 *       400:
 *         description: Invalid coverage data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier or coverage rule not found
 *       409:
 *         description: Duplicate coverage rule
 *
 *   delete:
 *     summary: Soft-delete a supplier coverage rule
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: coverageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coverage rule deactivated successfully
 *       400:
 *         description: Invalid supplier or coverage rule ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Supplier or coverage rule not found
 */