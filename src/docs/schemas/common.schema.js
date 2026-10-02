/**
 * @openapi
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       pattern: '^[a-fA-F0-9]{24}$'
 *       example: 665a7b8c9d0e1f2a3b4c5d6e
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: false }
 *         message: { type: string, example: Validation failed }
 *     AuthUser:
 *       type: object
 *       properties:
 *         id: { $ref: '#/components/schemas/ObjectId' }
 *         userId: { $ref: '#/components/schemas/ObjectId' }
 *         role: { type: string, enum: [customer, operator, admin] }
 *         phone: { type: string, example: '09121234567' }
 *         fullName: { type: string, nullable: true }
 *     SupplierOffer:
 *       type: object
 *       required: [availability]
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         availability: { $ref: '#/components/schemas/Availability' }
 *         brandName: { type: string, nullable: true, description: Free-text supplier brand; not a catalog reference. }
 *         manufacturerName: { type: string, nullable: true }
 *         partNumber: { type: string, nullable: true }
 *         unitPrice: { type: number, format: double, minimum: 0, nullable: true }
 *         availableQuantity: { type: integer, minimum: 0, default: 0 }
 *         description: { type: string, nullable: true }
 *         selected: { type: boolean }
 *         submittedAt: { type: string, format: date-time }
 *     InvitationItem:
 *       type: object
 *       properties:
 *         itemKey: { type: string, example: 'partId:carModelId' }
 *         partId: { $ref: '#/components/schemas/ObjectId' }
 *         carModelId: { $ref: '#/components/schemas/ObjectId' }
 *         categoryId: { $ref: '#/components/schemas/ObjectId' }
 *         title: { type: string }
 *         requestedQuantity: { type: integer, minimum: 1 }
 *         offers:
 *           type: array
 *           items: { $ref: '#/components/schemas/SupplierOffer' }
 *     Invitation:
 *       type: object
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         orderId: { $ref: '#/components/schemas/ObjectId' }
 *         supplierId: { $ref: '#/components/schemas/ObjectId' }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/InvitationItem' }
 *         token:
 *           type: object
 *           properties:
 *             expiresAt: { type: string, format: date-time }
 *             usedAt: { type: string, format: date-time, nullable: true }
 *         lifecycle:
 *           type: object
 *           properties:
 *             status: { type: string, enum: [sent, opened, responded, expired] }
 *             sentAt: { type: string, format: date-time, nullable: true }
 *             openedAt: { type: string, format: date-time, nullable: true }
 *             respondedAt: { type: string, format: date-time, nullable: true }
 *     AuditEvent:
 *       type: object
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         orderId: { $ref: '#/components/schemas/ObjectId' }
 *         type: { type: string }
 *         actorId: { $ref: '#/components/schemas/ObjectId' }
 *         metadata: { type: object, additionalProperties: true }
 *         createdAt: { type: string, format: date-time }
