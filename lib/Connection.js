const { createClient } = require('@clickhouse/client');

/**
 * ClickHouse connection manager
 */
class Connection {
  constructor(config) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 8123,
      username: config.username || 'default',
      password: config.password || '',
      database: config.database || 'default',
      ...config
    };
    
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize connection
   */
  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    try {
      this.client = createClient({
        host: `http://${this.config.host}:${this.config.port}`,
        username: this.config.username,
        password: this.config.password,
        database: this.config.database,
        clickhouse_settings: this.config.settings || {}
      });

      this.isConnected = true;
      return this.client;
    } catch (error) {
      throw new Error(`Failed to connect to ClickHouse: ${error.message}`);
    }
  }

  /**
   * Test connection
   */
  async authenticate() {
    try {
      const client = await this.connect();
      const result = await client.query({
        query: 'SELECT 1 as test',
        format: 'JSON'
      });
      
      return result.json();
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Execute query
   */
  async query(sql, options = {}) {
    try {
      const client = await this.connect();
      const result = await client.query({
        query: sql,
        format: options.format || 'JSON',
        query_params: options.params || {}
      });

      if (options.format === 'JSON' || !options.format) {
        return result.json();
      }
      
      return result;
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Execute insert query
   */
  async insert(table, data, options = {}) {
    try {
      const client = await this.connect();
      
      return await client.insert({
        table,
        values: Array.isArray(data) ? data : [data],
        format: options.format || 'JSON'
      });
    } catch (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
    }
  }
}

module.exports = Connection;