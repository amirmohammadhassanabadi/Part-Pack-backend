/**
 * @openapi
 * components:
 *   schemas:
 *
 *     SupplierContacts:
 *       type: object
 *       required:
 *         - mobile
 *       properties:
 *         mobile:
 *           type: string
 *           example: 09121234567
 *         landLine:
 *           type: string
 *           example: 02188776655
 *         telegram:
 *           type: string
 *           example: "@supplier_company"
 *
 *     SupplierCoverageRule:
 *       type: object
 *       required:
 *         - vehicleBrandId
 *         - carModelIds
 *         - partCategoryIds
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId of the coverage rule.
 *         vehicleBrandId:
 *           type: string
 *           description: MongoDB ObjectId of the vehicle brand.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *         carModelIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *           description: Active car models belonging to vehicleBrandId.
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d70
 *             - 665a7b8c9d0e1f2a3b4c5d71
 *         partCategoryIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *           description: Active part categories covered by this rule.
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d72
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     SupplierStats:
 *       type: object
 *       properties:
 *         totalPartsSold:
 *           type: number
 *           example: 125
 *         totalRevenue:
 *           type: number
 *           example: 450000000
 *         score:
 *           type: number
 *           example: 4.5
 *         lastCalculatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     Supplier:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: Tehran Auto Parts
 *         address:
 *           type: string
 *           nullable: true
 *         contacts:
 *           $ref: '#/components/schemas/SupplierContacts'
 *         coverageRules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupplierCoverageRule'
 *         stats:
 *           $ref: '#/components/schemas/SupplierStats'
 *         balance:
 *           type: number
 *           example: 15000000
 *         balanceUpdatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     CreateSupplierRequest:
 *       type: object
 *       required:
 *         - name
 *         - contacts
 *       properties:
 *         name:
 *           type: string
 *           example: Tehran Auto Parts
 *         address:
 *           type: string
 *         contacts:
 *           $ref: '#/components/schemas/SupplierContacts'
 *         coverageRules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupplierCoverageRule'
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     UpdateSupplierRequest:
 *       type: object
 *       description: Coverage rules must be managed through the dedicated coverage endpoints.
 *       properties:
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         contacts:
 *           $ref: '#/components/schemas/SupplierContacts'
 *         balance:
 *           type: number
 *         balanceUpdatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isActive:
 *           type: boolean
 *
 *     AddSupplierCoverageRequest:
 *       type: object
 *       required:
 *         - vehicleBrandId
 *         - carModelIds
 *         - partCategoryIds
 *       properties:
 *         vehicleBrandId:
 *           type: string
 *           description: Active vehicle brand ID.
 *         carModelIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *         partCategoryIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *
 *     ReplaceSupplierCoverageRequest:
 *       $ref: '#/components/schemas/AddSupplierCoverageRequest'
 */