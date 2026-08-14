/**
 * @openapi
 * components:
 *   schemas:
 *
 *     CustomerAddress:
 *       type: object
 *       required:
 *         - title
 *         - province
 *         - city
 *         - line
 *       properties:
 *         title:
 *           type: string
 *           example: Home
 *
 *         province:
 *           type: string
 *           example: Tehran
 *
 *         city:
 *           type: string
 *           example: Tehran
 *
 *         line:
 *           type: string
 *           example: Valiasr St, No. 20
 *
 *         postalCode:
 *           type: string
 *           example: 1234567890
 *
 *
 *     CustomerCar:
 *       type: object
 *       required:
 *         - carModelId
 *       properties:
 *         carModelId:
 *           type: string
 *           description: MongoDB ObjectId of the car model.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         year:
 *           type: string
 *           example: 2022
 *
 *         vin:
 *           type: string
 *           example: IR123456789012345
 *
 *
 *     Customer:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
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
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *         role:
 *           type: string
 *           enum:
 *             - customer
 *           example: customer
 *
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CustomerAddress'
 *
 *         carModels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CustomerCar'
 *
 *         orders:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of orders belonging to the customer.
 *
 *         invoices:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of invoices belonging to the customer.
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
 *     CreateCustomerRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - phone
 *       properties:
 *         fullName:
 *           type: string
 *           minLength: 3
 *           example: Ali Ahmadi
 *
 *         phone:
 *           type: string
 *           pattern: '^09\\d{9}$'
 *           example: 09121234567
 *
 *
 *     AddCustomerAddressRequest:
 *       type: object
 *       required:
 *         - title
 *         - province
 *         - city
 *         - line
 *       properties:
 *         title:
 *           type: string
 *           example: Home
 *
 *         province:
 *           type: string
 *           example: Tehran
 *
 *         city:
 *           type: string
 *           example: Tehran
 *
 *         line:
 *           type: string
 *           example: Valiasr St, No. 20
 *
 *         postalCode:
 *           type: string
 *           example: 1234567890
 *
 *
 *     AddCustomerCarRequest:
 *       type: object
 *       required:
 *         - carModelId
 *       properties:
 *         carModelId:
 *           type: string
 *           description: MongoDB ObjectId of the car model.
 *           example: 665a7b8c9d0e1f2a3b4c5d6e
 *
 *         year:
 *           type: string
 *           example: 2022
 *
 *         vin:
 *           type: string
 *           example: IR123456789012345
 */