/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Staff:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId of the staff member.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         fullName:
 *           type: string
 *           example: Ali Ahmadi
 *
 *         phone:
 *           type: string
 *           example: 09121234567
 *
 *         role:
 *           type: string
 *           enum:
 *             - admin
 *             - operator
 *           example: operator
 *
 *         permissions:
 *           type: array
 *           description: Independent operator departments; only admins may edit. Admin has all departments.
 *           items: { type: string, enum: [sales, supply] }
 *           example: [sales]
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
 *     UpdateStaffRequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           example: Ali Ahmadi
 *
 *         phone:
 *           type: string
 *           pattern: '^09\\d{9}$'
 *           example: 09121234567
 *
 *         role:
 *           type: string
 *           enum:
 *             - admin
 *             - operator
 *           example: operator
 *
 *         permissions:
 *           type: array
 *           description: Independent operator departments; only admins may edit. Admin has all departments.
 *           items: { type: string, enum: [sales, supply] }
 *           example: [sales]
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *
 *     UpdateStaffStatusRequest:
 *       type: object
 *       required:
 *         - isActive
 *       properties:
 *         permissions:
 *           type: array
 *           description: Independent operator departments; only admins may edit. Admin has all departments.
 *           items: { type: string, enum: [sales, supply] }
 *           example: [sales]
 *
 *         isActive:
 *           type: boolean
 *           example: false
 */