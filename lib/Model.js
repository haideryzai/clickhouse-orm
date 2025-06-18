const QueryBuilder = require('./QueryBuilder');

/**
 * Base Model class
 */
class Model {
  constructor(name, attributes, options = {}) {
    this.name = name;
    this.tableName = options.tableName || name.toLowerCase();
    this.attributes = attributes;
    this.options = options;
    this.connection = options.connection;
    this.orm = options.orm;
    this.associations = new Map();
  }

  /**
   * Create new instance
   */
  static build(values = {}) {
    const instance = new this();
    Object.assign(instance, values);
    return instance;
  }

  /**
   * Find all records
   */
  async findAll(options = {}) {
    const query = new QueryBuilder(this.connection)
      .select(options.attributes || '*')
      .from(this.tableName);

    if (options.where) {
      query.where(options.where);
    }

    if (options.orderBy) {
      query.orderBy(options.orderBy);
    }

    if (options.limit) {
      query.limit(options.limit);
    }

    if (options.offset) {
      query.offset(options.offset);
    }

    const result = await query.execute();
    return result.data || [];
  }

  /**
   * Find one record
   */
  async findOne(options = {}) {
    const results = await this.findAll({
      ...options,
      limit: 1
    });
    
    return results[0] || null;
  }

  /**
   * Find by primary key
   */
  async findByPk(id, options = {}) {
    const primaryKey = this.getPrimaryKey();
    return this.findOne({
      ...options,
      where: { [primaryKey]: id }
    });
  }

  /**
   * Create new record
   */
  async create(values, options = {}) {
    try {
      await this.connection.insert(this.tableName, values, options);
      return this.constructor.build(values);
    } catch (error) {
      throw new Error(`Failed to create ${this.name}: ${error.message}`);
    }
  }

  /**
   * Bulk create records
   */
  async bulkCreate(records, options = {}) {
    try {
      await this.connection.insert(this.tableName, records, options);
      return records;
    } catch (error) {
      throw new Error(`Failed to bulk create ${this.name}: ${error.message}`);
    }
  }

  /**
   * Count records
   */
  async count(options = {}) {
    const query = new QueryBuilder(this.connection)
      .select('COUNT(*) as count')
      .from(this.tableName);

    if (options.where) {
      query.where(options.where);
    }

    const result = await query.execute();
    return result.data[0]?.count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(options = {}) {
    const count = await this.count(options);
    return count > 0;
  }

  /**
   * Get primary key field
   */
  getPrimaryKey() {
    for (const [field, definition] of Object.entries(this.attributes)) {
      if (definition.primaryKey) {
        return field;
      }
    }
    return 'id'; // Default primary key
  }

  /**
   * Define association
   */
  associate(type, model, options = {}) {
    this.associations.set(model.name, {
      type,
      model,
      options
    });
  }

  /**
   * Has many association
   */
  hasMany(model, options = {}) {
    this.associate('hasMany', model, options);
  }

  /**
   * Belongs to association
   */
  belongsTo(model, options = {}) {
    this.associate('belongsTo', model, options);
  }

  /**
   * Has one association
   */
  hasOne(model, options = {}) {
    this.associate('hasOne', model, options);
  }
}

module.exports = Model;