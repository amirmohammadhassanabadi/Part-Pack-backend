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
 *           nullable: true
 *           example: https://example.com/logos/toyota.png
 *
 *         country:
 *           type: string
 *           nullable: true
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
 *           nullable: true
 *           example: Japan
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *
 *     CarModelBrand:
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
 *           $ref: '#/components/schemas/CarModelBrand'
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
 */