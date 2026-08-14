/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Part:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         name:
 *           type: string
 *           example: Oil Filter
 *
 *         categoryId:
 *           type: string
 *           description: MongoDB ObjectId of the part category.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - https://example.com/images/oil-filter-1.jpg
 *             - https://example.com/images/oil-filter-2.jpg
 *
 *         description:
 *           type: string
 *           example: Original engine oil filter for compatible vehicles.
 *
 *         compatibility:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of compatible car models.
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d6e
 *             - 665a7b8c9d0e1f2a3b4c5d6f
 *
 *         priceStats:
 *           type: object
 *           properties:
 *             avg:
 *               type: number
 *               nullable: true
 *               example: 450000
 *
 *             min:
 *               type: number
 *               nullable: true
 *               example: 400000
 *
 *             max:
 *               type: number
 *               nullable: true
 *               example: 500000
 *
 *             stdDev:
 *               type: number
 *               nullable: true
 *               example: 25000
 *
 *             sampleSize:
 *               type: integer
 *               example: 15
 *
 *             computedAt:
 *               type: string
 *               format: date-time
 *               nullable: true
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
 *     CreatePartRequest:
 *       type: object
 *       required:
 *         - name
 *         - categoryId
 *       properties:
 *         name:
 *           type: string
 *           example: Oil Filter
 *
 *         categoryId:
 *           type: string
 *           description: MongoDB ObjectId of the part category.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - https://example.com/images/oil-filter.jpg
 *
 *         description:
 *           type: string
 *           example: Original engine oil filter.
 *
 *         compatibility:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of compatible car models.
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d6e
 *
 *
 *     UpdatePartRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Premium Oil Filter
 *
 *         categoryId:
 *           type: string
 *           description: MongoDB ObjectId of the part category.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         images:
 *           type: array
 *           items:
 *             type: string
 *
 *         description:
 *           type: string
 *           example: Premium engine oil filter.
 *
 *         compatibility:
 *           type: array
 *           items:
 *             type: string
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *
 *     UpdatePartCompatibilityRequest:
 *       type: object
 *       required:
 *         - carModelIds
 *       properties:
 *         carModelIds:
 *           type: array
 *           items:
 *             type: string
 *           description: MongoDB ObjectIds of car models.
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d6e
 *             - 665a7b8c9d0e1f2a3b4c5d6f
 */