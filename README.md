# ClickHouse ORM

A Sequelize-like ORM for ClickHouse database with TypeScript support, connection management, model definitions, query building, and relationship handling.

## Features

- 🚀 **Easy Connection Management** - Simple configuration and connection handling
- 📊 **Model-Based ORM** - Define models with attributes and relationships
- 🔍 **Query Builder** - Fluent API for building complex queries
- 🔗 **Relationships** - Support for hasMany, belongsTo, and hasOne associations
- 📝 **Schema Management** - Automatic table creation and migration support
- 🛡️ **Type Safety** - Built with TypeScript support in mind
- ⚡ **Performance** - Optimized for ClickHouse's columnar database architecture

## Installation

```bash
npm install chouse-orm @clickhouse/client
```

## Quick Start

```javascript
const ClickHouseORM = require('chouse-orm');

// Initialize ORM
const orm = new ClickHouseORM({
  host: 'localhost',
  port: 8123,
  username: 'default',
  password: '',
  database: 'mydb'
});

// Test connection
await orm.authenticate();
console.log('Connected to ClickHouse!');
```

## Model Definition

```javascript
const { DataTypes } = orm;

// Define User model
const User = orm.define('User', {
  id: {
    type: DataTypes.UInt32,
    primaryKey: true
  },
  name: {
    type: DataTypes.String,
    comment: 'User full name'
  },
  email: {
    type: DataTypes.String,
    index: true
  },
  age: {
    type: DataTypes.UInt8,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DateTime,
    defaultValue: 'now()'
  }
}, {
  tableName: 'users',
  engine: 'MergeTree()',
  orderBy: 'id'
});

// Define Post model
const Post = orm.define('Post', {
  id: {
    type: DataTypes.UInt32,
    primaryKey: true
  },
  title: DataTypes.String,
  content: DataTypes.String,
  user_id: DataTypes.UInt32,
  published_at: DataTypes.DateTime
}, {
  tableName: 'posts',
  engine: 'MergeTree()',
  orderBy: 'id'
});
```

## Relationships

```javascript
// Define associations
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Sync models (create tables)
await orm.sync();
```

## Basic Operations

### Create Records

```javascript
// Create single user
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Bulk create users
const users = await User.bulkCreate([
  { name: 'Alice', email: 'alice@example.com', age: 25 },
  { name: 'Bob', email: 'bob@example.com', age: 35 }
]);
```

### Find Records

```javascript
// Find all users
const allUsers = await User.findAll();

// Find with conditions
const adults = await User.findAll({
  where: {
    age: { gte: 18 }
  }
});

// Find one user
const user = await User.findOne({
  where: { email: 'john@example.com' }
});

// Find by primary key
const userById = await User.findByPk(1);

// Find with limit and offset
const paginatedUsers = await User.findAll({
  limit: 10,
  offset: 20,
  orderBy: ['name', 'ASC']
});
```

### Complex Queries

```javascript
// Query with multiple conditions
const users = await User.findAll({
  where: {
    age: { gte: 18, lte: 65 },
    email: { like: '%@gmail.com' },
    name: { in: ['John', 'Jane', 'Bob'] }
  },
  orderBy: [['created_at', 'DESC'], ['name', 'ASC']],
  limit: 50
});

// Count records
const userCount = await User.count({
  where: { age: { gte: 18 } }
});

// Check existence
const hasAdults = await User.exists({
  where: { age: { gte: 18 } }
});
```

## Query Builder

```javascript
// Using query builder directly
const queryBuilder = orm.createQueryBuilder();

const result = await queryBuilder
  .select(['name', 'email', 'age'])
  .from('users')
  .where({ age: { gte: 18 } })
  .orderBy('name', 'ASC')
  .limit(10)
  .execute();

// Complex joins
const usersWithPosts = await queryBuilder
  .select(['u.name', 'u.email', 'COUNT(p.id) as post_count'])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id')
  .groupBy(['u.id', 'u.name', 'u.email'])
  .having('COUNT(p.id) > 0')
  .orderBy('post_count', 'DESC')
  .execute();
```

## Data Types

```javascript
const { DataTypes } = require('chouse-orm');

// Numeric types
DataTypes.UInt8        // 0 to 255
DataTypes.UInt16       // 0 to 65535
DataTypes.UInt32       // 0 to 4294967295
DataTypes.UInt64       // 0 to 18446744073709551615
DataTypes.Int8         // -128 to 127
DataTypes.Int16        // -32768 to 32767
DataTypes.Int32        // -2147483648 to 2147483647
DataTypes.Int64        // -9223372036854775808 to 9223372036854775807
DataTypes.Float32      // Single precision floating point
DataTypes.Float64      // Double precision floating point
DataTypes.Decimal(18, 2) // Decimal with precision and scale

// String types
DataTypes.String       // Variable length string
DataTypes.FixedString(10) // Fixed length string

// Date and time types
DataTypes.Date         // Date (YYYY-MM-DD)
DataTypes.DateTime     // DateTime (YYYY-MM-DD HH:MM:SS)
DataTypes.DateTime64(3) // DateTime with millisecond precision

// Special types
DataTypes.UUID         // UUID type
DataTypes.Boolean      // Boolean (stored as UInt8)
DataTypes.JSON         // JSON type (experimental)

// Array types
DataTypes.Array(DataTypes.String) // Array of strings
DataTypes.Array(DataTypes.UInt32) // Array of integers

// Nullable types
DataTypes.Nullable(DataTypes.String) // Nullable string

// Low cardinality (for better compression)
DataTypes.LowCardinality(DataTypes.String)

// Enum types
DataTypes.Enum8({
  'active': 1,
  'inactive': 2,
  'pending': 3
})
```

## Advanced Features

### Custom Engines

```javascript
const User = orm.define('User', attributes, {
  engine: 'ReplacingMergeTree()',
  orderBy: 'id',
  settings: {
    'index_granularity': 8192
  }
});
```

### Raw Queries

```javascript
// Execute raw SQL
const result = await orm.query(`
  SELECT 
    toYYYYMM(created_at) as month,
    COUNT(*) as user_count
  FROM users 
  WHERE age >= 18
  GROUP BY month
  ORDER BY month DESC
`);

// With parameters
const result = await orm.query(
  'SELECT * FROM users WHERE age >= {age:UInt8}',
  { params: { age: 18 } }
);
```

### Working with Relationships

```javascript
// Get user with posts
const user = await User.findByPk(1);
const posts = await user.getPosts();

// Count user posts
const postCount = await user.countPosts();

// Check if user has posts
const hasPosts = await user.hasPosts();

// Get post with user
const post = await Post.findByPk(1);
const author = await post.getUser();
```

### Schema Management

```javascript
// Check if table exists
const exists = await orm.connection.query(`
  SELECT COUNT(*) as count 
  FROM system.tables 
  WHERE name = 'users'
`);

// Describe table structure
const structure = await orm.connection.query('DESCRIBE TABLE users');

// Drop table
await orm.connection.query('DROP TABLE IF EXISTS temp_table');
```

## Configuration Options

```javascript
const orm = new ClickHouseORM({
  // Connection settings
  host: 'localhost',
  port: 8123,
  username: 'default',
  password: '',
  database: 'mydb',
  
  // ClickHouse specific settings
  settings: {
    max_execution_time: 60,
    max_memory_usage: 10000000000,
    use_uncompressed_cache: 0,
    load_balancing: 'round_robin'
  },
  
  // Connection options
  timeout: 30000,
  compression: true
});
```

## Error Handling

```javascript
try {
  await User.create({
    name: 'John Doe',
    email: 'invalid-email' // This might cause validation error
  });
} catch (error) {
  if (error.message.includes('Duplicate entry')) {
    console.log('User already exists');
  } else {
    console.error('Database error:', error.message);
  }
}
```

## Best Practices

1. **Use appropriate data types** - ClickHouse is optimized for specific data types
2. **Define proper ORDER BY** - Essential for MergeTree engines
3. **Use LowCardinality** - For string columns with limited unique values
4. **Batch inserts** - Use `bulkCreate` for better performance
5. **Index strategically** - Add indexes on frequently queried columns
6. **Monitor queries** - Use ClickHouse system tables for performance monitoring

## Migration Example

```javascript
// migrations/001_create_users.js
const { DataTypes } = require('clickhouse-orm');

module.exports = {
  up: async (orm) => {
    const User = orm.define('User', {
      id: {
        type: DataTypes.UInt32,
        primaryKey: true
      },
      name: DataTypes.String,
      email: DataTypes.String,
      created_at: {
        type: DataTypes.DateTime,
        defaultValue: 'now()'
      }
    });

    await orm.sync();
  },

  down: async (orm) => {
    await orm.query('DROP TABLE IF EXISTS users');
  }
};
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Basic ORM functionality
- Model definitions and relationships
- Query builder
- Schema management
- Connection handling

## Support

For support, please open an issue on GitHub or contact the maintainers.

## Acknowledgments

- Inspired by [Sequelize](https://sequelize.org/)
- Built for [ClickHouse](https://clickhouse.com/)
- Uses [@clickhouse/client](https://github.com/ClickHouse/clickhouse-js)