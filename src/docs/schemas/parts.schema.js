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
 *             - https://example.com/images/oil-filter.jpg
 *
 *         description:
 *           type: string
 *           nullable: true
 *           example: Genuine oil filter for Toyota vehicles.
 *
 *         compatibility:
 *           type: array
 *           items:
 *             type: string
 *           description: MongoDB ObjectIds of compatible car models.
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
 *               example: 1250000
 *
 *             min:
 *               type: number
 *               nullable: true
 *               example: 1000000
 *
 *             max:
 *               type: number
 *               nullable: true
 *               example: 1500000
 *
 *             stdDev:
 *               type: number
 *               nullable: true
 *               example: 125000
 *
 *             sampleSize:
 *               type: integer
 *               example: 25
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
 *           example: Genuine oil filter for Toyota vehicles.
 *
 *         compatibility:
 *           type: array
 *           items:
 *             type: string
 *           description: MongoDB ObjectIds of compatible car models.
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
 *           example:
 *             - https://example.com/images/premium-oil-filter.jpg
 *
 *         description:
 *           type: string
 *           example: Premium oil filter for Toyota vehicles.
 *
 *         compatibility:
 *           type: array
 *           items:
 *             type: string
 *           description: MongoDB ObjectIds of compatible car models.
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *
 *     CompatibilityRequest:
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