const express = require("express");
const customerController = require("../controller/customer.controller");

const router = express.Router();

router.post("/", customerController.createCustomer);
router.get("/", customerController.getAllCustomers);
router.get("/:id", customerController.getCustomerById);

router.post("/:id/addresses", customerController.addAddressToCustomer);
router.post("/:id/car-models", customerController.addCarToCustomer);
router.post("/:id/orders", customerController.addOrderToCustomer);
router.post("/:id/invoices", customerController.addInvoiceToCustomer);

module.exports = router;
