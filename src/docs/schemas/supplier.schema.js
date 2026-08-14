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
 *
 *         landLine:
 *           type: string
 *           example: 02188776655
 *
 *         telegram:
 *           type: string
 *           example: "@supplier_company"
 *
 *
 *     SupplierCoverage:
 *       type: object
 *       required:
 *         - brandId
 *       properties:
 *         brandId:
 *           type: string
 *           description: MongoDB ObjectId of the vehicle brand.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         allModels:
 *           type: boolean
 *           description: Whether the supplier covers all car models of this brand.
 *           default: false
 *           example: true
 *
 *         carModelIds:
 *           type: array
 *           description: Car model IDs covered by the supplier when allModels is false.
 *           items:
 *             type: string
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d70
 *             - 665a7b8c9d0e1f2a3b4c5d71
 *
 *         allCategory:
 *           type: boolean
 *           description: Whether the supplier covers all part categories.
 *           default: false
 *           example: true
 *
 *         categoryIds:
 *           type: array
 *           description: Part category IDs covered by the supplier when allCategory is false.
 *           items:
 *             type: string
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d72
 *             - 665a7b8c9d0e1f2a3b4c5d73
 *
 *
 *     SupplierStats:
 *       type: object
 *       properties:
 *         totalPartsSold:
 *           type: number
 *           example: 125
 *
 *         totalRevenue:
 *           type: number
 *           example: 450000000
 *
 *         score:
 *           type: number
 *           example: 4.5
 *
 *         lastCalculatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: 2026-08-14T10:30:00.000Z
 *
 *
 *     Supplier:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId of the supplier.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         name:
 *           type: string
 *           example: Tehran Auto Parts
 *
 *         address:
 *           type: string
 *           nullable: true
 *           example: Tehran, Karim Khan St, No. 25
 *
 *         contacts:
 *           $ref: '#/components/schemas/SupplierContacts'
 *
 *         coverage:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupplierCoverage'
 *
 *         stats:
 *           $ref: '#/components/schemas/SupplierStats'
 *
 *         balance:
 *           type: number
 *           example: 15000000
 *
 *         balanceUpdatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: 2026-08-14T10:30:00.000Z
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
 *     CreateSupplierRequest:
 *       type: object
 *       required:
 *         - name
 *         - contacts
 *       properties:
 *         name:
 *           type: string
 *           example: Tehran Auto Parts
 *
 *         address:
 *           type: string
 *           example: Tehran, Karim Khan St, No. 25
 *
 *         contacts:
 *           $ref: '#/components/schemas/SupplierContacts'
 *
 *         coverage:
 *           type: array
 *           description: Initial supplier coverage configuration.
 *           items:
 *             $ref: '#/components/schemas/SupplierCoverage'
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *
 *     UpdateSupplierRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Tehran Auto Parts
 *
 *         address:
 *           type: string
 *           example: Tehran, Karim Khan St, No. 25
 *
 *         contacts:
 *           $ref: '#/components/schemas/SupplierContacts'
 *
 *         coverage:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupplierCoverage'
 *
 *         balance:
 *           type: number
 *           example: 20000000
 *
 *         balanceUpdatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *
 *     AddSupplierCoverageRequest:
 *       type: object
 *       required:
 *         - brandId
 *       properties:
 *         brandId:
 *           type: string
 *           description: MongoDB ObjectId of the vehicle brand.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         allModels:
 *           type: boolean
 *           default: false
 *           example: false
 *
 *         carModelIds:
 *           type: array
 *           description: Required when allModels is false.
 *           items:
 *             type: string
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d70
 *
 *         allCategory:
 *           type: boolean
 *           default: false
 *           example: false
 *
 *         categoryIds:
 *           type: array
 *           description: Required when allCategory is false.
 *           items:
 *             type: string
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d72
 *
 *
 *     ReplaceSupplierCoverageRequest:
 *       type: object
 *       properties:
 *         allModels:
 *           type: boolean
 *           default: false
 *           example: true
 *
 *         carModelIds:
 *           type: array
 *           description: Required when allModels is false.
 *           items:
 *             type: string
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d70
 *
 *         allCategory:
 *           type: boolean
 *           default: false
 *           example: true
 *
 *         categoryIds:
 *           type: array
 *           description: Required when allCategory is false.
 *           items:
 *             type: string
 *           example:
 *             - 665a7b8c9d0e1f2a3b4c5d72
 */