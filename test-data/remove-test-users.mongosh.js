// Run only after the test flow is complete and TEST_AUTH_ENABLED is disabled.
(() => {
  if (["admin", "config", "local"].includes(db.getName())) {
    throw new Error("Select the application test database first");
  }

  const phones = [
    "09128498876", // admin
    "09128498877", // customer
    "09128498878", // supplier 1
    "09128498879", // supplier 2
    "09128498880", // operator
  ];
  const auths = db.auths.find({ phone: { $in: phones } }).toArray();
  const customerIds = auths.filter((entry) => entry.refModel === "Customer").map((entry) => entry.refId);
  const supplierIds = auths.filter((entry) => entry.refModel === "Supplier").map((entry) => entry.refId);

  const linkedOrders = db.orders.countDocuments({ "customer.customerId": { $in: customerIds } });
  const linkedInvitations = db.invitations.countDocuments({ supplierId: { $in: supplierIds } });
  const linkedInvoices = db.invoices.countDocuments({ customerId: { $in: customerIds } });
  if (linkedOrders || linkedInvitations || linkedInvoices) {
    throw new Error(`Refusing to delete test users: ${linkedOrders} orders, ${linkedInvitations} invitations, ${linkedInvoices} invoices still reference them. Archive/delete those test sales records first.`);
  }

  const result = {
    auths: db.auths.deleteMany({ phone: { $in: phones } }).deletedCount,
    staffs: db.staffs.deleteMany({ phone: { $in: [phones[0], phones[4]] } }).deletedCount,
    customers: db.customers.deleteMany({ phone: phones[1] }).deletedCount,
    suppliers: db.suppliers.deleteMany({ "contacts.mobile": { $in: [phones[2], phones[3]] } }).deletedCount,
  };

  print(`Removed test users from ${db.getName()}`);
  printjson(result);
})();
