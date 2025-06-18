const Connection = require('./lib/Connection');
const Model = require('./lib/Model');
const DataTypes = require('./lib/DataTypes');
const QueryBuilder = require('./lib/QueryBuilder');
const Schema = require('./lib/Schema');

/**
 * Main ClickHouse ORM class
 */
class ClickHouseORM {
  constructor(config) {
    this.connection = new Connection(config);
    this.models = new Map();
    this.DataTypes = DataTypes;
  }

  /**
   * Test database connection
   */
  async authenticate() {
    return this.connection.authenticate();
  }

  /**
   * Close database connection
   */
  async close() {
    return this.connection.close();
  }

  /**
   * Define a model
   */
  define(modelName, attributes, options = {}) {
    const model = new Model(modelName, attributes, {
      ...options,
      connection: this.connection,
      orm: this
    });
    
    this.models.set(modelName, model);
    return model;
  }

  /**
   * Get a defined model
   */
  model(modelName) {
    return this.models.get(modelName);
  }

  /**
   * Get all defined models
   */
  getModels() {
    return Array.from(this.models.values());
  }

  /**
   * Execute raw query
   */
  async query(sql, options = {}) {
    return this.connection.query(sql, options);
  }

  /**
   * Create query builder
   */
  createQueryBuilder() {
    return new QueryBuilder(this.connection);
  }

  /**
   * Sync models with database
   */
  async sync(options = {}) {
    const schema = new Schema(this.connection);
    
    for (const model of this.models.values()) {
      await schema.createTable(model, options);
    }
  }
}

module.exports = ClickHouseORM;