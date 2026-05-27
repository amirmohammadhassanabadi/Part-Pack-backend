const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Middlewares
const errorHandler = require('./core/middlewares/errorHandler');

// Modules Importing
// const { vehicleRouter } = require("./modules/vehicles");
const supplierRouter = require("./modules/suppliers");
// const partRouter = require("./modules/parts");
// const { orderRouter } = require("./modules/orders");

// App
const app = express();

app.use(morgan('dev'));
app.use(express.json()); // برای پارس کردن Body درخواست‌ها
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.get("/", (req, res) => {
  res.send("API is running");
});

// Health Check
app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
})

// Routers
// app.use("/api/v1/vehicles", vehicleRouter);
app.use("/api/v1/suppliers", (req, res, next) => {console.log("step-1");
}, supplierRouter);
// app.use("/api/v1/parts", partRouter);
// app.use("/api/v1/orders", orderRouter);

// فعال‌سازی مدیریت خطای مرکزی
app.use(errorHandler);

module.exports = app;
