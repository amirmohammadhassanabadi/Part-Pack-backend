const Part = require("../models/part.model");

class PartRepository {
  async create(data) {
    return Part.create(data);
  }

  async findAll(filter = {}, options = {}) {
    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;

    return Part.find(filter)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .populate("brand")
      .populate("suppliers")
      .populate("compatibleCarModels");
  }

  async findById(id) {
    return Part.findById(id)
      .populate("brand")
      .populate("suppliers")
      .populate("compatibleCarModels");
  }

  async findByPartNumber(partNumber) {
    return Part.findOne({ partNumber });
  }

  async findByNormalizedPartNumber(normalizedPartNumber) {
    return Part.findOne({ normalizedPartNumber });
  }

  async search(query) {
    return Part.find({
      $or: [
        { partNumber: query },
        { normalizedPartNumber: query },
        { oemNumbers: query },
      ],
    });
  }

  async updateById(id, data) {
    return Part.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id) {
    return Part.findByIdAndDelete(id);
  }
}

module.exports = new PartRepository();
