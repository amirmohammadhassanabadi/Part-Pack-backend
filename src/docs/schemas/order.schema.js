/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Availability:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum:
 *             - pending
 *             - available
 *             - unavailable
 *           example: pending
 *
 *         description:
 *           type: string
 *           nullable: true
 *           example: null
 *
 *
 *     OrderItem:
 *       type: object
 *       required:
 *         - partId
 *         - carModelId
 *         - categoryId
 *         - title
 *         - qty
 *         - availability
 *         - unitPrice
 *       properties:
 *         partId:
 *           type: string
 *           example: "665f1c8e2f8c1b0012345678"
 *
 *         carModelId:
 *           type: string
 *           example: "665f1c8e2f8c1b0098765432"
 *
 *         categoryId:
 *           type: string
 *           example: "665f1c8e2f8c1b0055555555"
 *
 *         title:
 *           type: string
 *           example: "Front Brake Pad"
 *
 *         qty:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *
 *         availability:
 *           $ref: "#/components/schemas/Availability"
 *
 *         unitPrice:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *           example: null
 *
 *
 *     OrderCustomer:
 *       type: object
 *       required:
 *         - customerId
 *         - name
 *         - phone
 *       properties:
 *         customerId:
 *           type: string
 *           example: "665f1c8e2f8c1b0011111111"
 *
 *         name:
 *           type: string
 *           example: "John Doe"
 *
 *         phone:
 *           type: string
 *           example: "09121234567"
 *
 *
 *     Order:
 *       type: object
 *       required:
 *         - _id
 *         - status
 *         - customer
 *         - items
 *         - invitations
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         _id:
 *           type: string
 *           example: "665f1c8e2f8c1b001234abcd"
 *
 *         status:
 *           type: string
 *           enum:
 *             - pending
 *             - quoting
 *             - quoted
 *             - confirmed
 *             - cancelled
 *           example: pending
 *
 *         customer:
 *           $ref: "#/components/schemas/OrderCustomer"
 *
 *         items:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/OrderItem"
 *
 *         invitations:
 *           type: array
 *           items:
 *             type: object
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-12T10:00:00.000Z"
 *
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-12T10:05:00.000Z"
 *
 *
 *     CreateOrderItem:
 *       type: object
 *       required:
 *         - partId
 *         - carModelId
 *         - qty
 *       properties:
 *         partId:
 *           type: string
 *           example: "665f1c8e2f8c1b0012345678"
 *
 *         carModelId:
 *           type: string
 *           example: "665f1c8e2f8c1b0098765432"
 *
 *         qty:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *
 *
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: "#/components/schemas/CreateOrderItem"
 *
 *
 *     UpdateOrderItemPricingRequest:
 *       type: object
 *       required:
 *         - availability
 *       properties:
 *         availability:
 *           type: object
 *           required:
 *             - status
 *           properties:
 *             status:
 *               type: string
 *               enum:
 *                 - available
 *                 - unavailable
 *               example: available
 *
 *             description:
 *               type: string
 *               nullable: true
 *               example: null
 *
 *         unitPrice:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *           example: 2500000
 * 
 *     Pagination:
 *       type: object
 *       required:
 *         - page
 *         - limit
 *         - total
 *         - pages
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 20
 *
 *         total:
 *           type: integer
 *           minimum: 0
 *           example: 45
 *
 *         pages:
 *           type: integer
 *           minimum: 0
 *           example: 3
 */