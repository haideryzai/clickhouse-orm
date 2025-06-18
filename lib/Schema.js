const DataTypes = require('./DataTypes');

/**
 * Schema management for ClickHouse
 */
class Schema {
  constructor(connection) {
    this.connection = connection;
  }

  /**
   * Create table from model
   */
  async createTable(model, options = {}) {
    const sql = this.generateCreateTableSQL(model, options);
    
    try {
      await this.connection.query(sql);
      console.log(`Table ${model.tableName} created successfully`);
    } catch (error) {
      if (!error.message.includes('already exists') || !options.force) {
        throw error;
      }
    }
  }

  /**
   * Generate CREATE TABLE SQL
   */
  generateCreateTableSQL(model, options = {}) {
    const columns = [];
    const indexes = [];
    let primaryKey = null;
    let orderBy = null;

    // Process attributes
    for (const [fieldName, definition] of Object.entries(model.attributes)) {
      const column = this.generateColumnDefinition(fieldName, definition);
      columns.push(column);

      if (definition.primaryKey) {
        primaryKey = fieldName;
      }

      if (definition.index) {
        indexes.push(fieldName);
      }
    }

    // Determine engine and order by
    const engine = model.options.engine || 'MergeTree()';
    
    if (primaryKey) {
      orderBy = `ORDER BY ${primaryKey}`;
    } else if (model.options.orderBy) {
      orderBy = `ORDER BY ${model.options.orderBy}`;
    } else {
      // Default order by first column
      const firstColumn = Object.keys(model.attributes)[0];
      orderBy = `ORDER BY ${firstColumn}`;
    }

    let sql = `CREATE TABLE`;
    
    if (options.ifNotExists !== false) {
      sql += ` IF NOT EXISTS`;
    }

    sql += ` ${model.tableName} (\n`;
    sql += `  ${columns.join(',\n  ')}\n`;
    sql += `) ENGINE = ${engine}`;
    
    if (orderBy) {
      sql += `\n${orderBy}`;
    }

    // Add settings if provided
    if (model.options.settings) {
      const settings = Object.entries(model.options.settings)
        .map(([key, value]) => `${key} = ${value}`)
        .join(', ');
      sql += `\nSETTINGS ${settings}`;
    }

    return sql;
  }

  /**
   * Generate column definition
   */
  generateColumnDefinition(fieldName, definition) {
    let sql = `${fieldName} `;

    // Handle different definition formats
    if (typeof definition === 'string') {
      sql += definition;
    } else if (typeof definition === 'object') {
      // Data type
      if (definition.type) {
        sql += definition.type;
      } else {
        throw new Error(`Data type is required for field ${fieldName}`);
      }

      // Default value
      if (definition.defaultValue !== undefined) {
        if (typeof definition.defaultValue === 'string') {
          sql += ` DEFAULT '${definition.defaultValue}'`;
        } else {
          sql += ` DEFAULT ${definition.defaultValue}`;
        }
      }

      // Codec
      if (definition.codec) {
        sql += ` CODEC(${definition.codec})`;
      }

      // Comment
      if (definition.comment) {
        sql += ` COMMENT '${definition.comment}'`;
      }
    }

    return sql;
  }

  /**
   * Drop table
   */
  async dropTable(tableName, options = {}) {
    let sql = `DROP TABLE`;
    
    if (options.ifExists !== false) {
      sql += ` IF EXISTS`;
    }
    
    sql += ` ${tableName}`;

    try {
      await this.connection.query(sql);
      console.log(`Table ${tableName} dropped successfully`);
    } catch (error) {
      throw new Error(`Failed to drop table ${tableName}: ${error.message}`);
    }
  }

  /**
   * Check if table exists
   */
  async tableExists(tableName) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM system.tables 
      WHERE name = '${tableName}'
    `;
    
    const result = await this.connection.query(sql);
    return result.data[0]?.count > 0;
  }

  /**
   * Get table schema
   */
  async describeTable(tableName) {
    const sql = `DESCRIBE TABLE ${tableName}`;
    const result = await this.connection.query(sql);
    return result.data || [];
  }

  /**
   * Add column to table
   */
  async addColumn(tableName, columnName, definition) {
    const columnDef = this.generateColumnDefinition(columnName, definition);
    const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`;
    
    try {
      await this.connection.query(sql);
      console.log(`Column ${columnName} added to ${tableName}`);
    } catch (error) {
      throw new Error(`Failed to add column: ${error.message}`);
    }
  }

  /**
   * Drop column from table
   */
  async dropColumn(tableName, columnName) {
    const sql = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
    
    try {
      await this.connection.query(sql);
      console.log(`Column ${columnName} dropped from ${tableName}`);
    } catch (error) {
      throw new Error(`Failed to drop column: ${error.message}`);
    }
  }
}

module.exports = Schema;