/**
 * @openapi
 * tags:
 *   - name: Vehicles - Brands
 *     description: Vehicle brand management
 *
 *   - name: Vehicles - Car Models
 *     description: Car model management
 *
 *   - name: Vehicles - Part Categories
 *     description: Vehicle part category management
 *
 *
 * /vehicles/brands:
 *   get:
 *     tags:
 *       - Vehicles - Brands
 *     summary: Get all brands
 *     parameters:
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *         description: Return only active brands
 *     responses:
 *       200:
 *         description: List of brands
 *
 *   post:
 *     tags:
 *       - Vehicles - Brands
 *     summary: Create a brand
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBrandRequest'
 *     responses:
 *       201:
 *         description: Brand created successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *
 *
 * /vehicles/brands/{id}:
 *   get:
 *     tags:
 *       - Vehicles - Brands
 *     summary: Get brand by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand found
 *       404:
 *         description: Brand not found
 *
 *   put:
 *     tags:
 *       - Vehicles - Brands
 *     summary: Update a brand
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
 *             $ref: '#/components/schemas/UpdateBrandRequest'
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Brand not found
 *
 *   delete:
 *     tags:
 *       - Vehicles - Brands
 *     summary: Deactivate a brand
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
 *         description: Brand deactivated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Brand not found
 *
 *
 * /vehicles/car-models:
 *   get:
 *     tags:
 *       - Vehicles - Car Models
 *     summary: Get all car models
 *     parameters:
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *         description: Filter car models by brand ID
 *
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *         description: Return only active car models
 *
 *     responses:
 *       200:
 *         description: List of car models
 *
 *   post:
 *     tags:
 *       - Vehicles - Car Models
 *     summary: Create a car model
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCarModelRequest'
 *     responses:
 *       201:
 *         description: Car model created successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *
 *
 * /vehicles/car-models/{id}:
 *   get:
 *     tags:
 *       - Vehicles - Car Models
 *     summary: Get car model by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car model found
 *       404:
 *         description: Car model not found
 *
 *   put:
 *     tags:
 *       - Vehicles - Car Models
 *     summary: Update a car model
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
 *             $ref: '#/components/schemas/UpdateCarModelRequest'
 *     responses:
 *       200:
 *         description: Car model updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Car model not found
 *
 *   delete:
 *     tags:
 *       - Vehicles - Car Models
 *     summary: Deactivate a car model
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
 *         description: Car model deactivated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Car model not found
 *
 *
 * /vehicles/part-categories:
 *   get:
 *     tags:
 *       - Vehicles - Part Categories
 *     summary: Get all part categories
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Filter categories by parent category ID. Omit to return all categories.
 *
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *         description: Return only active categories
 *
 *     responses:
 *       200:
 *         description: List of part categories
 *
 *   post:
 *     tags:
 *       - Vehicles - Part Categories
 *     summary: Create a part category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePartCategoryRequest'
 *     responses:
 *       201:
 *         description: Part category created successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *
 *
 * /vehicles/part-categories/{id}:
 *   get:
 *     tags:
 *       - Vehicles - Part Categories
 *     summary: Get part category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Part category found
 *       404:
 *         description: Part category not found
 *
 *   put:
 *     tags:
 *       - Vehicles - Part Categories
 *     summary: Update a part category
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
 *             $ref: '#/components/schemas/UpdatePartCategoryRequest'
 *     responses:
 *       200:
 *         description: Part category updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Part category not found
 *
 *   delete:
 *     tags:
 *       - Vehicles - Part Categories
 *     summary: Deactivate a part category
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
 *         description: Part category deactivated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Part category not found
 */