const errorHandler = (err, req, res, next) => {
  req.auditErrorCode = String(err.code || err.name || "REQUEST_FAILED").replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 80);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // شیء پاسخ نهایی که فرانت‌اند همیشه دریافت می‌کند
  let response = {
    success: false,
    status: err.status,
    message: err.message,
  };

  if (err.code) response.code = err.code;

  if (err.code === 121) {
    err.statusCode = 400;
    response.message = "اطلاعات الزامی حساب ناقص یا نامعتبر است؛ ادمین باید اطلاعات کاربر را تکمیل کند.";
  }

  // اگر خطای ولیدیشن (از سمت Validator ما) باشد، لیست ارورها را اضافه می‌کنیم
  if (err.errors) {
    response.errors = err.errors;
  }

  // مدیریت خطاهای خاص MongoDB/Mongoose برای یکپارچگی بیشتر
  // خطای تکراری بودن (Duplicate Key Error)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    response.message = `مقدار وارد شده برای ${field} تکراری است.`;
    err.statusCode = 400;
  }

  // خطای اعتبارسنجی خود Mongoose
  if (err.name === 'ValidationError') {
    response.message = 'خطای اعتبارسنجی داده‌ها';
    response.errors = Object.values(err.errors).map(el => ({
      field: el.path,
      message: el.message
    }));
    err.statusCode = 400;
  }

  // در محیط توسعه (Development) استک‌تریس رو هم بفرست برای دیباگ خودت
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

module.exports = errorHandler;
