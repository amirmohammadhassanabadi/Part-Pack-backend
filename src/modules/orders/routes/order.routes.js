const router = require("express").Router();
const orderController = require("../controllers/order.controller");

// ایجاد سفارش
router.post("/", orderController.create);

// دریافت بر اساس ID
router.get("/:id", orderController.getOne);

// دریافت بر اساس orderCode
router.get("/code/:code", orderController.getByCode);

// لیست سفارش‌ها
router.get("/", orderController.list);

// آپدیت
router.patch("/:id", orderController.update);

// حذف
router.delete("/:id", orderController.delete);

module.exports = router;
