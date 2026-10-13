const test = require("node:test");
const assert = require("node:assert/strict");
const { calculatePricing } = require("../src/modules/orders/service/orderOffer.service");
const { calculateDiscount } = require("../src/modules/orders/service/discount.service");
const { customerOrderView } = require("../src/modules/orders/service/orderView");
const { validateCreateOrder } = require("../src/core/validation/validate");

test("orders accept a part and quantity without a vehicle model", () => {
  assert.doesNotThrow(() => validateCreateOrder({ items: [{ partId: "part", qty: 2 }] }));
});
test("markup accepts zero and fractional percentages and rounds to IRR", () => {
  assert.deepEqual(calculatePricing(1000, 0), { markupAmount: 0, customerUnitPrice: 1000 });
  assert.deepEqual(calculatePricing(1001, 12.5), { markupAmount: 125, customerUnitPrice: 1126 });
  for (const margin of [-1, 101, Infinity, NaN, "5"]) assert.throws(() => calculatePricing(1000, margin));
  assert.throws(() => calculatePricing(Number.MAX_SAFE_INTEGER, 100));
  assert.throws(() => calculatePricing(1.5, 10));
});
test("discount respects validity, minimum order and caps", () => {
  const coupon = { isActive: true, type: "percent", value: 20, minimumSubtotal: 1000, maximumDiscount: 1500 };
  assert.equal(calculateDiscount(coupon, 10000), 1500);
  assert.equal(calculateDiscount({ ...coupon, type: "fixed", value: 50000 }, 1000), 1000);
  assert.throws(() => calculateDiscount(coupon, 999));
  assert.throws(() => calculateDiscount({ ...coupon, expiresAt: new Date(0) }, 10000));
  assert.throws(() => calculateDiscount({ ...coupon, isActive: false }, 10000));
});
test("customer views hide supplier cost and markup without mutating the source", () => {
  const order = { items: [{ selectedOffer: { baseUnitPrice: 1000, markupPercent: 10, markupAmount: 100, supplierId: "private", invitationId: "private", customerUnitPrice: 1100 } }] };
  const view = customerOrderView(order);
  assert.deepEqual(view.items[0].selectedOffer, { customerUnitPrice: 1100 });
  assert.equal(order.items[0].selectedOffer.baseUnitPrice, 1000);
});
