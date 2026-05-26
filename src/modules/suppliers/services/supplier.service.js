const supplierRepository = require("../repositories/supplier.repository");
const AppError = require("../../../core/utils/appError");

class SupplierService {
  async _generateSupplierCode() {
    // ۱. آخرین تأمین‌کننده ثبت شده را پیدا کن (بر اساس کد)
    const lastSupplier = await supplierRepository.findLastOne();

    let nextNumber = 1001; // شماره شروع برای اولین تأمین‌کننده

    if (lastSupplier && lastSupplier.code) {
      // ۲. استخراج عدد از کد (مثلاً از SUP-1025 عدد 1025 را بردار)
      const lastCodeParts = lastSupplier.code.split("-");
      const lastNumber = parseInt(lastCodeParts[1], 10);

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `SUP-${nextNumber}`;
  }

  async createSupplier(supplierDto) {
    const { name, phoneNumbers } = supplierDto;

    // ۱. بررسی تکراری بودن نام (Name Check)
    const existingName = await supplierRepository.findOne({ name });
    if (existingName) {
      throw new AppError("تأمین‌کننده‌ای با این نام قبلاً ثبت شده است.", 400);
    }

    // ۲. بررسی تکراری بودن شماره بله (Bale Number Check)
    // با توجه به ساختار nested در اسکیما: phoneNumbers.bale
    const existingBale = await supplierRepository.findOne({
      "phoneNumbers.bale": phoneNumbers.bale,
    });

    if (existingBale) {
      throw new AppError("این شماره بله متعلق به تأمین‌کننده دیگری است.", 400);
    }

    // ۳. حالا که خیالمون راحته تکراری نیست، کد جدید رو تولید می‌کنیم
    const code = await this._generateSupplierCode();

    // ۴. غنی‌سازی دیتا (Data Enrichment)
    const finalData = {
      ...supplierDto,
      code,
      isActive: false, // به صورت پیش‌فرض غیرفعال تا توسط ادمین تایید شود
    };

    // ۵. ذخیره نهایی در دیتابیس
    return await supplierRepository.create(finalData);
  }

  async getSuppliers({ onlyActive = true } = {}) {
    const filter = {};

    if (onlyActive) {
      filter.isActive = true;
    }

    return supplierRepository.findAll(filter);
  }

  async getSupplierById(id) {
    const supplier = await supplierRepository.findById(id);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }

  async updateSupplier(id, data) {
    const supplier = await supplierRepository.updateById(id, data);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }

  async deleteSupplier(id) {
    const supplier = await supplierRepository.deleteById(id);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }
}

module.exports = new SupplierService();
