/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Brand:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         name:
 *           type: string
 *           example: Toyota
 *
 *         slug:
 *           type: string
 *           example: toyota
 *
 *         logoUrl:
 *           type: string
 *           nullable: true
 *           example: https://example.com/logos/toyota.png
 *
 *         country:
 *           type: string
 *           nullable: true
 *           example: Japan
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *
 *     CreateBrandRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Toyota
 *
 *         logoUrl:
 *           type: string
 *           example: https://example.com/logos/toyota.png
 *
 *         country:
 *           type: string
 *           example: Japan
 *
 *
 *     UpdateBrandRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Toyota Motors
 *
 *         logoUrl:
 *           type: string
 *           nullable: true
 *           example: https://example.com/logos/toyota-new.png
 *
 *         country:
 *           type: string
 *           example: Japan
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *
 *     CarModel:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         name:
 *           type: string
 *           example: Camry
 *
 *         slug:
 *           type: string
 *           example: camry
 *
 *         brand:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *             name:
 *               type: string
 *               example: Toyota
 *
 *             slug:
 *               type: string
 *               example: toyota
 *
 *         yearRange:
 *           type: object
 *           properties:
 *             from:
 *               type: string
 *               example: "2018"
 *
 *             to:
 *               type: string
 *               example: "2024"
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *
 *     CreateCarModelRequest:
 *       type: object
 *       required:
 *         - name
 *         - brand
 *         - yearRange
 *       properties:
 *         name:
 *           type: string
 *           example: Camry
 *
 *         brand:
 *           type: string
 *           description: MongoDB ObjectId of the brand.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         yearRange:
 *           type: object
 *           required:
 *             - from
 *             - to
 *           properties:
 *             from:
 *               type: string
 *               example: "2018"
 *
 *             to:
 *               type: string
 *               example: "2024"
 *
 *
 *     UpdateCarModelRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Camry
 *
 *         yearRange:
 *           type: object
 *           properties:
 *             from:
 *               type: string
 *               example: "2019"
 *
 *             to:
 *               type: string
 *               example: "2025"
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *
 *     PartCategory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         name:
 *           type: string
 *           example: Engine
 *
 *         slug:
 *           type: string
 *           example: engine
 *
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: MongoDB ObjectId of the parent category. Null for a root category.
 *           example: null
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *
 *     CreatePartCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Engine
 *
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: MongoDB ObjectId of the parent category. Omit for a root category.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *
 *     UpdatePartCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Engine Parts
 *
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: MongoDB ObjectId of the parent category.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *
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
 * @openapi
 * /api/v1/vehicles/brands:
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
 * /api/v1/vehicles/brands/{id}:
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
 * /api/v1/vehicles/car-models:
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
 * /api/v1/vehicles/car-models/{id}:
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
 * /api/v1/vehicles/part-categories:
 *   get:
 *     tags:
 *       - Vehicles - Part Categories
 *     summary: Get all part categories
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Filter categories by parent category ID
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
 * /api/v1/vehicles/part-categories/{id}:
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