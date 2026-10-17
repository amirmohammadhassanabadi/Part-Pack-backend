// Run in mongosh after selecting the application's test database.
(() => {
  if (["admin", "config", "local"].includes(db.getName())) {
    throw new Error("Select the application test database first: use YOUR_TEST_DATABASE");
  }

  const now = new Date();
  const accounts = [
    { phone: "09128498876", name: "مدیر تست پارت‌پک", role: "admin", collection: "staffs", model: "Staff" },
    { phone: "09128498877", name: "مشتری تست پارت‌پک", role: "customer", collection: "customers", model: "Customer" },
    { phone: "09128498878", name: "تأمین‌کننده تست اول", role: "supplier", collection: "suppliers", model: "Supplier" },
    { phone: "09128498879", name: "تأمین‌کننده تست دوم", role: "supplier", collection: "suppliers", model: "Supplier" },
    { phone: "09128498880", name: "اپراتور تست تأمین و فروش", role: "operator", collection: "staffs", model: "Staff" },
  ];

  // Refuse ambiguous duplicate records before writing any account.
  for (const account of accounts) {
    const filter = account.role === "supplier" ? { "contacts.mobile": account.phone } : { phone: account.phone };
    if (db.getCollection(account.collection).countDocuments(filter) > 1 || db.auths.countDocuments({ phone: account.phone }) > 1) {
      throw new Error(`Duplicate phone records must be resolved first: ${account.phone}`);
    }
  }

  for (const account of accounts) {
    const collection = db.getCollection(account.collection);
    const filter = account.role === "supplier" ? { "contacts.mobile": account.phone } : { phone: account.phone };
    const onInsert = { createdAt: now, __v: 0 };
    const updates = { isActive: true, updatedAt: now };

    if (account.role === "supplier") {
      Object.assign(onInsert, {
        name: account.name,
        address: "تهران، انبار تست",
        coverageRules: [],
        stats: { totalPartsSold: 0, totalRevenue: 0, score: 0, lastCalculatedAt: null },
        balance: 0,
        balanceUpdatedAt: null,
      });
    } else {
      onInsert.fullName = account.name;
      updates.role = account.role;
      if (account.role === "customer") {
        Object.assign(onInsert, {
          orders: [], invoices: [], carModels: [],
          addresses: [
            { _id: new ObjectId(), title: "خانه", province: "تهران", city: "تهران", line: "خیابان تست، کوچه نمونه، پلاک ۱۰", postalCode: "1234567890" },
            { _id: new ObjectId(), title: "محل کار", province: "البرز", city: "کرج", line: "بلوار نمونه، ساختمان تست، طبقه ۲", postalCode: "1234567891" },
          ],
        });
      }
    }

    collection.updateOne(filter, { $set: updates, $setOnInsert: onInsert }, { upsert: true });
    const profile = collection.findOne(filter);
    db.auths.updateOne(
      { phone: account.phone },
      {
        $set: { role: account.role, refModel: account.model, refId: profile._id, isActive: true, updatedAt: now },
        $setOnInsert: { createdAt: now, __v: 0 },
      },
      { upsert: true },
    );
  }

  print(`Test accounts ready in database: ${db.getName()}`);
  printjson(db.auths.find(
    { phone: { $in: accounts.map((account) => account.phone) } },
    { phone: 1, role: 1, refModel: 1, refId: 1, isActive: 1 },
  ).toArray());
})();
