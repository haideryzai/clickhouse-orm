/**
 * Query builder for ClickHouse
 */
class QueryBuilder {
  constructor(connection) {
    this.connection = connection;
    this.query = {
      select: [],
      from: '',
      joins: [],
      where: [],
      groupBy: [],
      having: [],
      orderBy: [],
      limit: null,
      offset: null
    };
  }

  /**
   * Select fields
   */
  select(fields) {
    if (typeof fields === 'string') {
      this.query.select = fields === '*' ? ['*'] : [fields];
    } else if (Array.isArray(fields)) {
      this.query.select = fields;
    }
    return this;
  }

  /**
   * From table
   */
  from(table) {
    this.query.from = table;
    return this;
  }

  /**
   * Join tables
   */
  join(table, condition, type = 'INNER') {
    this.query.joins.push({
      type,
      table,
      condition
    });
    return this;
  }

  /**
   * Left join
   */
  leftJoin(table, condition) {
    return this.join(table, condition, 'LEFT');
  }

  /**
   * Right join
   */
  rightJoin(table, condition) {
    return this.join(table, condition, 'RIGHT');
  }

  /**
   * Where conditions
   */
  where(conditions) {
    if (typeof conditions === 'string') {
      this.query.where.push(conditions);
    } else if (typeof conditions === 'object') {
      for (const [field, value] of Object.entries(conditions)) {
        if (Array.isArray(value)) {
          this.query.where.push(`${field} IN (${value.map(v => `'${v}'`).join(', ')})`);
        } else if (typeof value === 'object' && value !== null) {
          this.handleComplexCondition(field, value);
        } else {
          this.query.where.push(`${field} = '${value}'`);
        }
      }
    }
    return this;
  }

  /**
   * Handle complex conditions
   */
  handleComplexCondition(field, condition) {
    for (const [operator, value] of Object.entries(condition)) {
      switch (operator) {
        case 'gt':
          this.query.where.push(`${field} > '${value}'`);
          break;
        case 'gte':
          this.query.where.push(`${field} >= '${value}'`);
          break;
        case 'lt':
          this.query.where.push(`${field} < '${value}'`);
          break;
        case 'lte':
          this.query.where.push(`${field} <= '${value}'`);
          break;
        case 'ne':
          this.query.where.push(`${field} != '${value}'`);
          break;
        case 'like':
          this.query.where.push(`${field} LIKE '${value}'`);
          break;
        case 'in':
          this.query.where.push(`${field} IN (${value.map(v => `'${v}'`).join(', ')})`);
          break;
        case 'notIn':
          this.query.where.push(`${field} NOT IN (${value.map(v => `'${v}'`).join(', ')})`);
          break;
      }
    }
  }

  /**
   * Group by
   */
  groupBy(fields) {
    if (typeof fields === 'string') {
      this.query.groupBy = [fields];
    } else if (Array.isArray(fields)) {
      this.query.groupBy = fields;
    }
    return this;
  }

  /**
   * Having conditions
   */
  having(conditions) {
    if (typeof conditions === 'string') {
      this.query.having.push(conditions);
    }
    return this;
  }

  /**
   * Order by
   */
  orderBy(field, direction = 'ASC') {
    if (typeof field === 'string') {
      this.query.orderBy.push(`${field} ${direction}`);
    } else if (Array.isArray(field)) {
      this.query.orderBy = field;
    }
    return this;
  }

  /**
   * Limit results
   */
  limit(count) {
    this.query.limit = count;
    return this;
  }

  /**
   * Offset results
   */
  offset(count) {
    this.query.offset = count;
    return this;
  }

  /**
   * Build SQL query
   */
  build() {
    let sql = `SELECT ${this.query.select.join(', ')} FROM ${this.query.from}`;

    // Add joins
    for (const join of this.query.joins) {
      sql += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
    }

    // Add where conditions
    if (this.query.where.length > 0) {
      sql += ` WHERE ${this.query.where.join(' AND ')}`;
    }

    // Add group by
    if (this.query.groupBy.length > 0) {
      sql += ` GROUP BY ${this.query.groupBy.join(', ')}`;
    }

    // Add having
    if (this.query.having.length > 0) {
      sql += ` HAVING ${this.query.having.join(' AND ')}`;
    }

    // Add order by
    if (this.query.orderBy.length > 0) {
      sql += ` ORDER BY ${this.query.orderBy.join(', ')}`;
    }

    // Add limit and offset
    if (this.query.limit !== null) {
      sql += ` LIMIT ${this.query.limit}`;
    }

    if (this.query.offset !== null) {
      sql += ` OFFSET ${this.query.offset}`;
    }

    return sql;
  }

  /**
   * Execute query
   */
  async execute() {
    const sql = this.build();
    return this.connection.query(sql);
  }
}

module.exports = QueryBuilder;