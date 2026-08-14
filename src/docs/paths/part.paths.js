/**
 * @openapi
 *
 * /parts:
 *   get:
 *     tags:
 *       - Parts
 *     summary: Get all parts
 *     description: Returns a paginated list of parts with optional filtering.
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter parts by category ID.
 *
 *       - in: query
 *         name: carModelId
 *         schema:
 *           type: string
 *         description: Filter parts compatible with a specific car model.
 *
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search parts by name.
 *
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *           default: false
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *
 *     responses:
 *       200:
 *         description: Parts retrieved successfully.
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
 *                     $ref: '#/components/schemas/Part'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 45
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *
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
 *         description: Part created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Part'
 *
 *
 * /parts/{id}:
 *   get:
 *     tags:
 *       - Parts
 *     summary: Get a part by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the part.
 *     responses:
 *       200:
 *         description: Part retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Part'
 *
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
 *         description: MongoDB ObjectId of the part.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePartRequest'
 *     responses:
 *       200:
 *         description: Part updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Part'
 *
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
 *         description: MongoDB ObjectId of the part.
 *     responses:
 *       200:
 *         description: Part deactivated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Part deactivated successfully
 *
 *
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
 *         description: MongoDB ObjectId of the part.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePartCompatibilityRequest'
 *     responses:
 *       200:
 *         description: Compatibility added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Part'
 *
 *
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
 *         description: MongoDB ObjectId of the part.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePartCompatibilityRequest'
 *     responses:
 *       200:
 *         description: Compatibility removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Part'
 */