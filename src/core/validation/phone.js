const mobilePattern = /^09\d{9}$/;

function normalizeMobile(value) {
  return typeof value === "string" ? value.trim().replace(/[۰-۹٠-٩]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  }) : value;
}

const mobileField = {
  type: String,
  required: true,
  trim: true,
  set: normalizeMobile,
  match: [mobilePattern, "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود."],
};

module.exports = { mobilePattern, normalizeMobile, mobileField };
