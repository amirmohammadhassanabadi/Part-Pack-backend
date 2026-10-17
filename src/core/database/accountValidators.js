const stringName = { bsonType: "string", pattern: "\\S" };
const mobile = { bsonType: "string", pattern: "^09[0-9]{9}$" };
const active = { bsonType: "bool" };
const validators = {
  customers: { $jsonSchema: { bsonType: "object", required: ["fullName", "phone", "isActive"],
    properties: { fullName: stringName, phone: mobile, isActive: active } } },
  suppliers: { $jsonSchema: { bsonType: "object", required: ["name", "contacts", "isActive"],
    properties: { name: stringName, isActive: active, contacts: { bsonType: "object", required: ["mobile"], properties: { mobile } } } } },
  staffs: { $jsonSchema: { bsonType: "object", required: ["fullName", "phone", "role", "isActive"],
    properties: { fullName: stringName, phone: mobile, isActive: active, role: { enum: ["admin", "operator"] } } } },
  auths: { $and: [
    { $jsonSchema: { bsonType: "object", required: ["phone", "role", "refModel", "refId", "isActive"],
      properties: { phone: mobile, refId: { bsonType: "objectId" }, isActive: active } } },
    { $or: [{ role: "supplier", refModel: "Supplier" }, { role: "customer", refModel: "Customer" }, { role: { $in: ["admin", "operator"] }, refModel: "Staff" }] },
  ] },
};

// Idempotently add our constraints without replacing any pre-existing validator.
function includesValidator(existing, required) {
  return JSON.stringify(existing) === JSON.stringify(required)
    || Array.isArray(existing?.$and) && existing.$and.some((entry) => includesValidator(entry, required));
}
async function installAccountValidators(db) {
  for (const [name, required] of Object.entries(validators)) {
    let [collection] = await db.listCollections({ name }).toArray();
    if (!collection) {
      try {
        await db.createCollection(name, { validator: required, validationLevel: "strict", validationAction: "error" });
        continue;
      } catch (error) {
        if (error.code !== 48) throw error; // Another process created the collection.
        [collection] = await db.listCollections({ name }).toArray();
      }
    }
    const previous = collection?.options?.validator;
    const validator = !previous || !Object.keys(previous).length ? required
      : includesValidator(previous, required) ? previous : { $and: [previous, required] };
    await db.command({ collMod: name, validator, validationLevel: "strict", validationAction: "error" });
  }
}

module.exports = { installAccountValidators };
