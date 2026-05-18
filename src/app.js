const express = require("express");
const cors = require("cors");

// Modules Importing
const { vehicleRouter } = require("./modules/vehicles");
const supplierRouter = require("./modules/suppliers");
const partRouter = require("./modules/parts");

// App
const app = express();

app.use(express.json()); // برای پارس کردن Body درخواست‌ها
app.use(cors());
app.use(express.json());

// routes
app.get("/", (req, res) => {
  res.send("API is running");
});

// Routers
app.use("/api/v1/vehicles", vehicleRouter);
app.use("/api/v1/suppliers", supplierRouter);
app.use("/api/v1/parts", partRouter);

module.exports = app;
