const validateSupplierCreate = (req, res, next) => {
  const { name, phoneNumbers } = req.body;
  const errors = [];

  // 1. بررسی نام (Required در Schema)
  if (!name || !name.trim()) {
    errors.push({
      field: "name",
      message: "وارد کردن نام تأمین‌کننده الزامی است.",
    });
  }

  // 2. بررسی شماره بله (به عنوان فیلد ارتباطی اجباری سیستم)
  if (!phoneNumbers?.bale || !phoneNumbers.bale.trim()) {
    errors.push({
      field: "phoneNumbers.bale",
      message: "وارد کردن شماره بله برای هماهنگی‌ها الزامی است.",
    });
  }

  // اگر خطایی وجود داشت، برگرد و به کنترلر نرو
  if (errors.length > 0) {
    // ایجاد یک شیء خطا و پاس دادن به مدیریت خطای مرکزی
    const error = new Error("خطای اعتبار سنجی");
    error.statusCode = 400;
    error.errors = errors; // لیست فیلدهایی که مشکل دارن
    return next(error);
  }

  next();
};

module.exports = { validateSupplierCreate };
