/**
 * @openapi
 * components:
 *   schemas:
 *     InvoiceCustomer:
 *       type: object
 *       required:
 *         - customerId
 *         - name
 *         - phone
 *       properties:
 *         customerId:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *         name:
 *           type: string
 *           example: John Doe
 *         phone:
 *           type: string
 *           example: "+989121234567"
 *
 *     InvoiceLine:
 *       type: object
 *       required:
 *         - partId
 *         - carModelId
 *         - title
 *         - qty
 *         - supplierId
 *         - supplierName
 *         - unitPrice
 *         - lineTotal
 *       properties:
 *         partId:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *         carModelId:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d70
 *         title:
 *           type: string
 *           example: Brake Pad
 *         qty:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         supplierId:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d71
 *         supplierName:
 *           type: string
 *           example: Part Pack
 *         partNumber:
 *           type: string
 *           nullable: true
 *           example: BP-12345
 *         unitPrice:
 *           type: number
 *           example: 2500000
 *         lineTotal:
 *           type: number
 *           example: 5000000
 *
 *     Invoice:
 *       type: object
 *       required:
 *         - orderId
 *         - customer
 *         - lines
 *         - total
 *         - status
 *         - issuedAt
 *       properties:
 *         _id:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d72
 *         orderId:
 *           type: string
 *           example: 665a7b8c9d0e1f2a3b4c5d73
 *         customer:
 *           $ref: '#/components/schemas/InvoiceCustomer'
 *         lines:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InvoiceLine'
 *         total:
 *           type: number
 *           example: 7500000
 *         status:
 *           type: string
 *           enum:
 *             - pending
 *             - paid
 *             - cancelled
 *           example: pending
 *         issuedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-08-17T12:00:00.000Z
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: 2026-08-24T12:00:00.000Z
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */