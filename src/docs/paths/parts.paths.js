/**
 * @openapi
 * tags:
 *   - name: Parts
 *     description: Vehicle part management
 *
 *
 * @openapi
 * /parts:
 *   get:
 *     tags:
 *       - Parts
 *     summary: Get all parts
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter parts by category ID
 *
 *       - in: query
 *         name: carModelId
 *         schema:
 *           type: string
 *         description: Filter parts compatible with a specific car model
 *
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search parts by name
 *
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *         description: Return only active parts
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of parts per page
 *
 *     responses:
 *       200:
 *         description: List of parts
 *
 *   post:
 *     tags:
 *       - Parts
 *     summary: Create a part
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePartRequest'
 *     responses:
 *       201:
 *         description: Part created successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *
 *
 * @openapi
 * /parts/{id}:
 *   get:
 *     tags:
 *       - Parts
 *     summary: Get part by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the part
 *     responses:
 *       200:
 *         description: Part found
 *       404:
 *         description: Part not found
 *
 *   put:
 *     tags:
 *       - Parts
 *     summary: Update a part
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the part
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePartRequest'
 *     responses:
 *       200:
 *         description: Part updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Part not found
 *
 *   delete:
 *     tags:
 *       - Parts
 *     summary: Deactivate a part
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the part
 *     responses:
 *       200:
 *         description: Part deactivated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Part not found
 *
 *
 * @openapi
 * /parts/{id}/compatibility/add:
 *   post:
 *     tags:
 *       - Parts
 *     summary: Add car model compatibility
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the part
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompatibilityRequest'
 *     responses:
 *       200:
 *         description: Compatibility added successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Part not found
 *
 *
 * @openapi
 * /parts/{id}/compatibility/remove:
 *   post:
 *     tags:
 *       - Parts
 *     summary: Remove car model compatibility
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the part
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompatibilityRequest'
 *     responses:
 *       200:
 *         description: Compatibility removed successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Part not found
 */