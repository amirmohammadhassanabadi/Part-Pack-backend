const digits = (value) => typeof value === "string" ? value.replace(/[۰-۹٠-٩]/g,
  (digit) => String(digit.charCodeAt(0) >= 0x06f0 ? digit.charCodeAt(0) - 0x06f0 : digit.charCodeAt(0) - 0x0660)) : value;
const normalizeCard = (value) => typeof value === "string" ? digits(value).replace(/[\s-]/g, "") : value;
const normalizeIban = (value) => {
  if (typeof value !== "string") return value;
  const clean = digits(value).replace(/[\s-]/g, "").toUpperCase();
  return /^\d{24}$/.test(clean) ? `IR${clean}` : clean;
};
function validCard(value) {
  const card = normalizeCard(value);
  if (typeof card !== "string" || !/^\d{16}$/.test(card) || /^(\d)\1+$/.test(card)) return false;
  const sum = [...card].reduce((total, digit, index) => {
    const n = Number(digit) * (index % 2 === 0 ? 2 : 1);
    return total + (n > 9 ? n - 9 : n);
  }, 0);
  return sum % 10 === 0;
}
function validIban(value) {
  const iban = normalizeIban(value);
  if (typeof iban !== "string" || !/^IR\d{24}$/.test(iban) || /^0+$/.test(iban.slice(4))) return false;
  const rearranged = `${iban.slice(4)}1827${iban.slice(2, 4)}`;
  return [...rearranged].reduce((remainder, digit) => (remainder * 10 + Number(digit)) % 97, 0) === 1;
}
function bankFields() {
  return {
    accountHolder: { type: String, trim: true, maxlength: 150 },
    cardNumber: { type: String, set: normalizeCard, validate: { validator: (v) => !v || validCard(v), message: "شماره کارت ۱۶ رقمی معتبر وارد کنید." } },
    iban: { type: String, set: normalizeIban, validate: { validator: (v) => !v || validIban(v), message: "شماره شبای معتبر ایران را وارد کنید." } },
  };
}
function pickBankDetails(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("اطلاعات بانکی نامعتبر است."), { statusCode: 422 });
  const result = {};
  for (const key of ["accountHolder", "cardNumber", "iban"]) {
    if (!Object.hasOwn(value, key)) continue;
    if (typeof value[key] !== "string") throw Object.assign(new Error("شماره کارت و شبا باید متنی باشند."), { statusCode: 422 });
    result[key] = key === "cardNumber" ? normalizeCard(value[key]) : key === "iban" ? normalizeIban(value[key]) : value[key].trim();
  }
  return result;
}
module.exports = { bankFields, pickBankDetails, validCard, validIban, normalizeCard, normalizeIban };
