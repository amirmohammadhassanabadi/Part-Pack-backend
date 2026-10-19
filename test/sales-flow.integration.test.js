const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Order = require("../src/modules/orders/model/order.model");
const OrderOffer = require("../src/modules/orders/model/orderOffer.model");
const Invitation = require("../src/modules/invitation/model/invitation.model");
const Invoice = require("../src/modules/invoice/model/invoice.model");
const Payment = require("../src/modules/payment/model/payment.model");
const Customer = require("../src/modules/customer/model/customer.model");
const Part = require("../src/modules/parts/model/part.model");
const Auth = require("../src/modules/auth/model/auth.model");
const supplierService = require("../src/modules/suppliers/service/supplier.service");
const Supplier = require("../src/modules/suppliers/model/supplier.model");
const Brand = require("../src/modules/vehicles/model/brand.model");
const CarModel = require("../src/modules/vehicles/model/carModel.model");
const Category = require("../src/modules/vehicles/model/partCategory.models");
const Discount = require("../src/modules/orders/model/discount.model");
const orderService = require("../src/modules/orders/service/order.service");
const invitationService = require("../src/modules/invitation/service/invitation.service");
const offersService = require("../src/modules/orders/service/orderOffer.service");
const { prepareCheckout } = require("../src/modules/orders/service/checkout.service");
const paymentService = require("../src/modules/payment/service/payment.service");

// Set SALES_TEST_MONGO_URL to an isolated replica set; each run uses its own database.
test("sales flow with an isolated MongoDB replica set", { skip: !process.env.SALES_TEST_MONGO_URL }, async (t) => {
  await mongoose.connect(process.env.SALES_TEST_MONGO_URL, { dbName: `sales_flow_test_${crypto.randomBytes(8).toString("hex")}` });
  t.after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  await Promise.all([Invoice.init(), Payment.init(), Invitation.init(), Discount.init()]);
  const category = await Category.create({ name: "Brakes", slug: "brakes" });
  const brand = await Brand.create({ name: "Test brand", slug: "test-brand" });
  const model = await CarModel.create({ name: "Test model", slug: "test-model", brand: brand._id, yearRange: { from: "2020", to: "2026" } });
  const customer = await Customer.create({ nationalCode: "1234567891", fullName: "Flow customer", phone: "09120000000" });
  const operatorId = new mongoose.Types.ObjectId();
  const parts = await Part.create([
    { name: "Brake pad", categoryId: category._id, compatibility: [model._id] },
    { name: "Brake disc", categoryId: category._id, compatibility: [model._id] },
  ]);
  const items = parts.map((part) => ({ partId: String(part._id), qty: 2 }));
  const supplier = await Supplier.create({ nationalCode: "1234567891", name: "Supplier", contacts: { mobile: "09120000001" }, coverageRules: [{ vehicleBrandId: brand._id, carModelIds: [model._id], partCategoryIds: [category._id] }] });
  const address = { title: "Home", province: "Tehran", city: "Tehran", line: "Test address" };

  await t.test("supplier profile preserves login contacts and recovers legacy mobile for coverage saves", async () => {
    const id = new mongoose.Types.ObjectId();
    await Supplier.collection.insertOne({ _id: id, name: "Legacy", contacts: { landLine: "02100000000" }, coverageRules: [], isActive: true });
    await Auth.create({ phone: "09120000009", role: "supplier", refModel: "Supplier", refId: id });
    const profile = await supplierService.getSupplierById(String(id));
    assert.equal(profile.contacts?.mobile, undefined);
    const updated = await supplierService.updateMyProfile(String(id), { name: "Updated", address: "New address", contacts: { mobile: "" }, isActive: false });
    assert.equal(updated.name, "Updated");
    assert.equal(updated.address, "New address");
    assert.equal(updated.contacts.mobile, "09120000009");
    assert.equal(updated.contacts.landLine, "02100000000");
    assert.equal(updated.isActive, true);
    await Supplier.collection.updateOne({ _id: id }, { $unset: { "contacts.mobile": "" } });
    const covered = await supplierService.addCoverage(String(id), { vehicleBrandId: String(brand._id), carModelIds: [String(model._id)], partCategoryIds: [String(category._id)] });
    assert.equal(covered.contacts.mobile, "09120000009");
    assert.equal(covered.coverageRules[0].vehicleBrandId.name, "Test brand");
    assert.equal(covered.coverageRules[0].carModelIds[0].name, "Test model");
    await assert.rejects(supplierService.updateMyProfile(String(id), { name: " " }), { name: "ValidationError" });
    await Supplier.deleteOne({ _id: id });
    await Auth.deleteOne({ refId: id });
  });

  await t.test("no model is needed and no-response orders reach operator review", async () => {
    const order = await orderService.createOrder(String(customer._id), items);
    assert.equal(order.status, "supplier_invitation");
    assert.equal(order.items[0].carModelId, null);
    const invitations = await Invitation.find({ orderId: order._id });
    assert.equal(invitations.length, 1);
    assert.equal(String(invitations[0].supplierId), String(supplier._id));
    await assert.rejects(offersService.createOperatorOffer(String(order._id), {}, String(operatorId)), /deadline/);
    await Invitation.updateMany({ orderId: order._id }, { $set: { "token.expiresAt": new Date(0) } });
    await invitationService.expireDueInvitations();
    assert.equal((await Order.findById(order._id)).status, "operator_review");
    await offersService.shortlistOffers(String(order._id), [], String(operatorId));
    const board = await offersService.getCustomerOfferBoard(String(order._id), String(customer._id));
    assert.equal(board.items.length, 2);
    assert.ok(board.items.every((item) => item.offers[0].availability === "unavailable" && item.offers[0].customerUnitPrice === 0));
    await assert.rejects(offersService.selectCustomerOffers(String(order._id), [], String(customer._id)), /At least one/);
    assert.equal((await Order.findById(order._id)).status, "customer_selection");
    assert.equal(await Invoice.countDocuments({ orderId: order._id }), 0);
  });

  let orderId, invoiceId;
  await t.test("supplier CRUD uses offerId and publication supports supplier plus manual options", async () => {
    const order = await orderService.createOrder(String(customer._id), items);
    orderId = String(order._id);
    const invitation = await Invitation.findOne({ orderId });
    const token = crypto.randomBytes(32).toString("hex");
    invitation.token.hash = crypto.createHash("sha256").update(token).digest("hex");
    await invitation.save();
    const own = await invitationService.listSupplierInvitations(String(supplier._id));
    assert.ok(own.invitations.some((entry) => String(entry.id) === String(invitation._id)));
    assert.ok(own.invitations.every((entry) => !("token" in entry)));
    assert.ok(own.invitations.every((entry) => entry.createdAt));
    const filtered = await invitationService.listSupplierInvitations(String(supplier._id), { search: orderId, status: "sent", limit: 1 });
    assert.equal(filtered.pagination.total, 1);
    assert.equal(String(filtered.invitations[0].orderId), orderId);
    assert.equal((await invitationService.listSupplierInvitations(String(supplier._id), { search: ".*" })).pagination.total, 0);
    assert.equal((await invitationService.listSupplierInvitations(String(supplier._id), { status: "expired", search: orderId })).pagination.total, 0);
    assert.equal((await invitationService.listSupplierInvitations(String(supplier._id), { from: "2099-01-01" })).pagination.total, 0);
    await assert.rejects(invitationService.listSupplierInvitations(String(supplier._id), { from: "invalid" }), /Invalid date/);
    const stranger = String(new mongoose.Types.ObjectId());
    assert.equal((await invitationService.listSupplierInvitations(stranger)).invitations.length, 0);
    await assert.rejects(invitationService.getSupplierInvitation(String(invitation._id), stranger), /not found/);
    await invitationService.getSupplierInvitation(String(invitation._id), String(supplier._id));
    const itemKey = invitation.items[0].itemKey;
    await Supplier.updateOne({ _id: supplier._id }, { $unset: { nationalCode: "" } });
    const blockedOffer = { availability: "unavailable", description: "Incomplete profile" };
    await assert.rejects(invitationService.addOffer(token, itemKey, blockedOffer), { code: "PROFILE_INCOMPLETE" });
    await assert.rejects(invitationService.addOffer(String(invitation._id), itemKey, blockedOffer, String(supplier._id)), { code: "PROFILE_INCOMPLETE" });
    assert.equal((await Invitation.findById(invitation._id)).items[0].offers.length, 0);
    await Supplier.updateOne({ _id: supplier._id }, { $set: { nationalCode: "1234567891" } });
    await invitationService.addOffer(token, itemKey, { availability: "available", brandName: "Supplier brand", unitPrice: 1000, availableQuantity: 2 });
    await assert.rejects(invitationService.addOffer(String(invitation._id), itemKey, { availability: "unavailable", description: "Other supplier" }, stranger), /not found/);
    const ownOffer = await invitationService.addOffer(String(invitation._id), itemKey, { availability: "unavailable", description: "Own account" }, String(supplier._id));
    await invitationService.updateOffer(String(invitation._id), itemKey, String(ownOffer.offer._id), { availability: "unavailable", description: "Updated by owner" }, String(supplier._id));
    await invitationService.deleteOffer(String(invitation._id), itemKey, String(ownOffer.offer._id), String(supplier._id));
    let saved = await Invitation.findById(invitation._id);
    const offerId = String(saved.items[0].offers[0]._id);
    await invitationService.updateOffer(token, itemKey, offerId, { availability: "available", brandName: "Supplier brand", unitPrice: 2000, availableQuantity: 2 });
    await invitationService.addOffer(token, itemKey, { availability: "unavailable", description: "No stock" });
    saved = await Invitation.findById(invitation._id);
    await invitationService.deleteOffer(token, itemKey, String(saved.items[0].offers[1]._id));
    assert.equal((await Invitation.findById(invitation._id)).items[0].offers.length, 1);
    await Invitation.updateOne({ _id: invitation._id }, { $set: { "token.expiresAt": new Date(0) } });
    await invitationService.expireDueInvitations();
    const expiredView = await invitationService.getSupplierInvitation(String(invitation._id), String(supplier._id));
    assert.equal(expiredView.lifecycle.status, "expired");
    await assert.rejects(invitationService.addOffer(String(invitation._id), itemKey, { availability: "unavailable", description: "Too late" }, String(supplier._id)), /expired/);
    await assert.rejects(invitationService.addOffer(token, itemKey, { availability: "unavailable", description: "Too late" }), /expired/);
    const manual = await offersService.createOperatorOffer(orderId, { itemKey, brandName: "Manual brand", baseUnitPrice: 3000, availableQuantity: 2, markupPercent: 0 }, String(operatorId));
    const selection = { itemKey, source: "supplier", invitationId: String(invitation._id), offerId, markupPercent: 10 };
    await assert.rejects(offersService.shortlistOffers(orderId, [selection, { ...selection, offerId: String(new mongoose.Types.ObjectId()) }], String(operatorId)), /not found/);
    assert.equal(await OrderOffer.countDocuments({ orderId, status: "shortlisted" }), 0);
    assert.equal((await Order.findById(orderId)).status, "operator_review");
    await offersService.shortlistOffers(orderId, [selection, { itemKey, source: "operator", offerId: String(manual._id), markupPercent: 0 }], String(operatorId));
    const board = await offersService.getCustomerOfferBoard(orderId, String(customer._id));
    assert.equal(board.items[0].offers.length, 2);
    assert.ok(board.items[0].offers.every((offer) => !("baseUnitPrice" in offer) && !("markupPercent" in offer)));
    assert.equal(board.items[1].offers[0].customerUnitPrice, 0);
    assert.equal((await Order.findById(orderId)).items[1].unitPrice, 0);
    await assert.rejects(offersService.getCustomerOfferBoard(orderId, String(new mongoose.Types.ObjectId())), /not found/);
    const chosen = board.items[0].offers.find((offer) => offer.customerUnitPrice === 3000);
    const decision = { itemKey, offerId: String(chosen._id), selectedQuantity: 1 };
    await assert.rejects(offersService.selectCustomerOffers(orderId, [decision, {
      itemKey: board.items[1].itemKey, offerId: String(board.items[1].offers[0]._id),
    }], String(customer._id)), /Unavailable/);
    assert.equal((await Order.findById(orderId)).status, "customer_selection");
    assert.equal(await OrderOffer.countDocuments({ orderId, status: "selected" }), 0);
    const concurrent = await Promise.allSettled([
      offersService.selectCustomerOffers(orderId, [decision], String(customer._id)),
      offersService.selectCustomerOffers(orderId, [decision], String(customer._id)),
    ]);
    assert.equal(concurrent.filter((result) => result.status === "fulfilled").length, 1);
    const selected = concurrent.find((result) => result.status === "fulfilled").value;
    assert.equal(selected.status, "awaiting_payment");
    invoiceId = selected.invoiceId;
    const invoice = await Invoice.findOne({ orderId });
    assert.equal(String(invoiceId), String(invoice._id));
    assert.equal(invoice.lines.length, 2);
    assert.equal(invoice.total, 3000);
    assert.equal(invoice.lines[1].availability, "unavailable");
    assert.equal(invoice.lines[1].lineTotal, 0);
    assert.equal(invoice.lines[0].supplierId, null);
    await assert.rejects(offersService.selectCustomerOffers(orderId, [{ itemKey, offerId: String(chosen._id) }], String(customer._id)), /not accepting/);
    assert.equal(await Invoice.countDocuments({ orderId }), 1);
  });
  await t.test("invoice access is restricted to its customer and does not expose operator pricing", async () => {
    const controller = require("../src/modules/invoice/controller/invoice.controller");
    const req = { params: { orderId }, user: { role: "customer", userId: String(customer._id) } };
    let body, failure;
    const res = { status: () => res, json: (value) => { body = value; } };
    await controller.getInvoiceByOrderId(req, res, (error) => { failure = error; });
    assert.equal(failure, undefined);
    assert.equal(String(body.orderId), orderId);
    assert.ok(body.lines.every((line) => !("supplierId" in line) && !("supplierName" in line)));
    req.user.userId = String(new mongoose.Types.ObjectId());
    body = null;
    await controller.getInvoiceByOrderId(req, res, (error) => { failure = error; });
    assert.equal(failure.statusCode, 404);
    assert.equal(body, null);
  });
  await t.test("address and discounts update the same invoice and failed checkouts roll back", async () => {
    await Discount.create({ code: "SALE20", type: "percent", value: 20 });
    await assert.rejects(prepareCheckout(orderId, String(customer._id), { address, discountCode: "INVALID" }), /تخفیف/);
    assert.equal((await Customer.findById(customer._id)).addresses.length, 0);
    const checkout = await prepareCheckout(orderId, String(customer._id), { address, discountCode: "sale20" });
    assert.equal(checkout.payment.amount, 2400);
    const invoice = await Invoice.findById(invoiceId);
    assert.equal(invoice.subtotal, 3000);
    assert.equal(invoice.discountAmount, 600);
    assert.equal(invoice.total, 2400);
    assert.equal(invoice.shippingAddress.line, address.line);
    assert.equal((await Customer.findById(customer._id)).addresses.length, 1);
    const other = await Customer.create({ nationalCode: "1234567891", fullName: "Other", phone: "09120000002", addresses: [address] });
    await assert.rejects(prepareCheckout(orderId, String(customer._id), { addressId: String(other.addresses[0]._id) }), /not found/);
    const previousProvider = process.env.PAYMENT_PROVIDER;
    delete process.env.PAYMENT_PROVIDER;
    try { await assert.rejects(paymentService.createSessionForOrder(orderId, String(customer._id)), /gateway/); }
    finally { if (previousProvider !== undefined) process.env.PAYMENT_PROVIDER = previousProvider; }
    assert.equal((await Payment.findOne({ orderId })).status, "not_configured");
    assert.equal((await Order.findById(orderId)).status, "awaiting_payment");
    assert.equal((await Invoice.findById(invoiceId)).status, "pending");
    const savedCustomer = await Customer.findById(customer._id);
    await prepareCheckout(orderId, String(customer._id), { addressId: String(savedCustomer.addresses[0]._id) });
    assert.equal((await Invoice.findById(invoiceId)).total, 3000);
  });
  await t.test("zero-total settlement is consistent across order, invoice and payment", async () => {
    await Discount.create({ code: "FREE", type: "percent", value: 100 });
    const saved = await Customer.findById(customer._id);
    const checkout = await prepareCheckout(orderId, String(customer._id), { addressId: String(saved.addresses[0]._id), discountCode: "FREE" });
    assert.equal(checkout.order.status, "paid");
    const payment = await Payment.findOne({ orderId });
    assert.equal(payment.status, "succeeded");
    assert.equal(payment.amount, 0);
    assert.equal(String(checkout.order.paymentId), String(payment._id));
    assert.equal((await Invoice.findById(invoiceId)).status, "paid");
    await assert.rejects(prepareCheckout(orderId, String(customer._id), { addressId: String(saved.addresses[0]._id) }), /status/);
  });
  await t.test("operator pagination and literal search apply across all records", async () => {
    const list = await orderService.getOperatorOrders({ phase: "sales", limit: 1 });
    assert.equal(list.pagination.total, 2);
    assert.equal(list.orders.length, 1);
    assert.equal((await orderService.getOperatorOrders({ search: "[" })).orders.length, 0);
    assert.equal((await orderService.getCustomerOrders(String(customer._id), { status: "paid" })).pagination.total, 1);
  });
  await t.test("customer and supplier lists, counts and details remain scoped to the signed-in account", async () => {
    const otherCustomer = await Customer.create({ nationalCode: "1234567891", fullName: "Other customer", phone: "09120000008" });
    const otherOrder = await orderService.createOrder(String(otherCustomer._id), items);
    const ownOrders = await orderService.getCustomerOrders(String(customer._id));
    const otherOrders = await orderService.getCustomerOrders(String(otherCustomer._id));
    assert.ok(ownOrders.orders.every((order) => String(order.customer.customerId) === String(customer._id)));
    assert.equal(otherOrders.pagination.total, 1);
    assert.equal(String(otherOrders.orders[0]._id), String(otherOrder._id));
    assert.equal((await orderService.getCustomerOrders(String(customer._id), { search: String(otherOrder._id) })).pagination.total, 0);
    await assert.rejects(orderService.getCustomerOrderById(String(customer._id), String(otherOrder._id)), /not found/i);
    await assert.rejects(orderService.getCustomerOrderById(String(otherCustomer._id), orderId), /not found/i);

    const otherSupplier = await Supplier.create({ nationalCode: "1234567891", name: "Other supplier", contacts: { mobile: "09120000007" } });
    const originalInvitation = await Invitation.findOne({ orderId: otherOrder._id, supplierId: supplier._id });
    const otherInvitationData = originalInvitation.toObject();
    delete otherInvitationData._id;
    otherInvitationData.supplierId = otherSupplier._id;
    otherInvitationData.token.hash = crypto.randomBytes(32).toString("hex");
    const otherInvitation = await Invitation.create(otherInvitationData);
    const ownInvitations = await invitationService.listSupplierInvitations(String(supplier._id), { search: String(otherOrder._id), supplierId: String(otherSupplier._id) });
    assert.equal(ownInvitations.pagination.total, 1);
    assert.equal(String(ownInvitations.invitations[0].id), String(originalInvitation._id));
    assert.ok(ownInvitations.invitations.every((entry) => String(entry.supplierId) === String(supplier._id)));
    const otherInvitations = await invitationService.listSupplierInvitations(String(otherSupplier._id));
    assert.equal(otherInvitations.pagination.total, 1);
    assert.equal(String(otherInvitations.invitations[0].id), String(otherInvitation._id));
    await assert.rejects(invitationService.getSupplierInvitation(String(otherInvitation._id), String(supplier._id)), /not found/i);
    await assert.rejects(invitationService.getSupplierInvitation(String(originalInvitation._id), String(otherSupplier._id)), /not found/i);
    await assert.rejects(invitationService.addOffer(String(otherInvitation._id), otherInvitation.items[0].itemKey, { availability: "unavailable", description: "Unauthorized" }, String(supplier._id)), /not found/i);
    assert.equal((await Invitation.findById(otherInvitation._id)).items[0].offers.length, 0);
  });

  await t.test("quotation countdown uses the last active deadline and exposes no supplier data", async () => {
    const order = await orderService.createOrder(String(customer._id), items);
    const first = await Invitation.findOne({ orderId: order._id, supplierId: supplier._id });
    const early = new Date(Date.now() + 10 * 60000);
    const late = new Date(Date.now() + 20 * 60000);
    first.token.expiresAt = early;
    await first.save();
    const template = first.toObject();
    delete template._id;
    await Invitation.create({ ...template, supplierId: new mongoose.Types.ObjectId(), lifecycle: { status: "responded" }, token: { ...template.token, hash: crypto.randomBytes(32).toString("hex"), expiresAt: late } });
    await Invitation.create({ ...template, supplierId: new mongoose.Types.ObjectId(), lifecycle: { status: "expired" }, token: { ...template.token, hash: crypto.randomBytes(32).toString("hex"), expiresAt: new Date(Date.now() + 30 * 60000) } });
    const own = await orderService.getCustomerOrders(String(customer._id), { search: String(order._id) });
    assert.equal(own.orders.length, 1);
    assert.deepEqual(own.orders[0].activityTimer, { type: "quotation", expiresAt: late });
    const operator = await orderService.getOperatorOrders({ search: String(order._id) });
    assert.deepEqual(operator.orders[0].activityTimer, own.orders[0].activityTimer);
    const supplierView = await invitationService.listSupplierInvitations(String(supplier._id), { search: String(order._id) });
    assert.equal(supplierView.invitations[0].expiresAt.getTime(), early.getTime());
    await Invitation.updateMany({ orderId: order._id }, { $set: { "token.expiresAt": new Date(0) } });
    assert.equal((await orderService.getCustomerOrders(String(customer._id), { search: String(order._id) })).orders[0].activityTimer, null);
    await invitationService.expireDueInvitations();
    const finished = await orderService.getCustomerOrders(String(customer._id), { search: String(order._id) });
    assert.equal(finished.orders[0].status, "operator_review");
    assert.equal(finished.orders[0].activityTimer, null);
    assert.equal((await orderService.getCustomerOrders(String(customer._id), { status: "paid" })).orders[0].activityTimer, null);
  });

});
