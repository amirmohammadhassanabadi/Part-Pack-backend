const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateCreateOrder,
  validateSelectOffers,
  validateOffer,
  validateCustomer,
  validateOtpRequest,
  validateOtpVerification,
} = require("../src/core/validation/validate");

test("create order validation accepts positive quantities", () => {
  const body = {
    items: [{ partId: "part-id", carModelId: "model-id", qty: 2 }],
  };
  assert.equal(validateCreateOrder(body), body);
});

test("create order validation rejects empty items", () => {
  assert.throws(() => validateCreateOrder({ items: [] }), /items/);
});

test("offer validation requires brand and quantity for available offers", () => {
  assert.throws(
    () => validateOffer({ availability: "available", unitPrice: 10 }),
    /brandName/,
  );
  assert.doesNotThrow(() => validateOffer({
    availability: "available",
    brandName: "Bosch",
    unitPrice: 10,
    availableQuantity: 2,
  }));
});

test("unavailable offers require a description", () => {
  assert.throws(
    () => validateOffer({ availability: "unavailable" }),
    /description/,
  );
});

test("customer validation requires name and phone", () => {
  assert.throws(() => validateCustomer({ fullName: "Test" }), /phone/);
  assert.doesNotThrow(() => validateCustomer({ fullName: "Test", phone: "0912" }));
});

test("selection validation requires decisions", () => {
  assert.throws(() => validateSelectOffers({ selections: [] }), /selections/);
});

test("OTP validation requires phone and verification code", () => {
  assert.throws(() => validateOtpRequest({}), /phone/);
  assert.throws(() => validateOtpVerification({ phone: "0912" }), /code/);
});
