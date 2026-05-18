const partRepository = require("../repositories/part.repository");

class PartService {
  normalizePartNumber(partNumber) {
    return partNumber.replace(/[\s-]/g, "").toUpperCase();
  }

  generateSlug(name, partNumber) {
    const base = `${name}-${partNumber}`;
    return base
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async createPart(data) {
    const normalized = this.normalizePartNumber(data.partNumber);
    data.normalizedPartNumber = normalized;

    const existing =
      await partRepository.findByNormalizedPartNumber(normalized);

    if (existing) {
      throw new Error("Part with this number already exists");
    }

    if (!data.slug) {
      data.slug = this.generateSlug(data.name, data.partNumber);
    }

    return partRepository.create(data);
  }

  async getParts({ onlyActive = true, limit = 50, skip = 0 } = {}) {
    const filter = {};

    if (onlyActive) {
      filter.isActive = true;
    }

    return partRepository.findAll(filter, { limit, skip });
  }

  async getPartById(id) {
    const part = await partRepository.findById(id);

    if (!part) {
      throw new Error("Part not found");
    }

    return part;
  }

  async searchParts(query) {
    const normalized = this.normalizePartNumber(query);
    return partRepository.search(normalized);
  }

  async updatePart(id, data) {
    if (data.partNumber) {
      data.normalizedPartNumber = this.normalizePartNumber(data.partNumber);
    }

    const part = await partRepository.updateById(id, data);

    if (!part) {
      throw new Error("Part not found");
    }

    return part;
  }

  async deletePart(id) {
    const part = await partRepository.deleteById(id);

    if (!part) {
      throw new Error("Part not found");
    }

    return part;
  }
}

module.exports = new PartService();
