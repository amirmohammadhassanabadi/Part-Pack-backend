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
 *         selectedOffer:
 *           $ref: "#/components/schemas/SelectedOffer"
 *
 *
 *     SelectedOffer:
 *       type: object
 *       nullable: true
 *       properties:
 *         invitationId:
 *           type: string
 *         supplierId:
 *           type: string
 *         offerId:
 *           type: string
 *         brandName:
 *           type: string
 *         manufacturerName:
 *           type: string
 *           nullable: true
 *         partNumber:
 *           type: string
 *           nullable: true
 *         unitPrice:
 *           type: number
 *           minimum: 0
 *         selectedQuantity:
 *           type: integer
 *           minimum: 1
 *         selectedAt:
 *           type: string
 *           format: date-time
 *         selectedBy:
 *           type: string

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
 *             - supplier_invitation
 *             - collecting_offers
 *             - offers_ready
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
 *         invoiceId:
 *           type: string
 *           nullable: true
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
 *
 *     SelectOrderOffersRequest:
 *       type: object
 *       required:
 *         - selections
 *       properties:
 *         selections:
 *           type: array
 *           minItems: 1
 *           items:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - itemKey
 *                   - offerId
 *                 properties:
 *                   itemKey:
 *                     type: string
 *                     example: "665f1c8e2f8c1b0012345678:665f1c8e2f8c1b0098765432"
 *                   offerId:
 *                     type: string
 *                   selectedQuantity:
 *                     type: integer
 *                     minimum: 1
 *               - type: object
 *                 required:
 *                   - itemKey
 *                   - availability
 *                   - reason
 *                 properties:
 *                   itemKey:
 *                     type: string
 *                   availability:
 *                     type: string
 *                     enum: [unavailable]
 *                   reason:
 *                     type: string
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
