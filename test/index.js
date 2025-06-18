const ClickHouseORM = require('../index');

async function runTests() {
  console.log('🧪 Running ClickHouse ORM Tests...\n');

  const orm = new ClickHouseORM({
    host: 'localhost',
    port: 8123,
    username: 'default',
    password: '',
    database: 'test_orm'
  });

  let passedTests = 0;
  let totalTests = 0;

  function test(name, testFn) {
    totalTests++;
    console.log(`Running: ${name}`);
    
    try {
      testFn();
      console.log(`✅ PASSED: ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
    }
    console.log('');
  }

  async function asyncTest(name, testFn) {
    totalTests++;
    console.log(`Running: ${name}`);
    
    try {
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
    }
    console.log('');
  }

  try {
    // Test 1: Connection
    await asyncTest('Connection Test', async () => {
      await orm.authenticate();
    });

    // Test 2: Model Definition
    test('Model Definition', () => {
      const User = orm.define('User', {
        id: {
          type: orm.DataTypes.UInt32,
          primaryKey: true
        },
        name: orm.DataTypes.String,
        email: orm.DataTypes.String
      });

      if (!User) throw new Error('Model not created');
      if (User.name !== 'User') throw new Error('Model name incorrect');
    });

    // Test 3: Data Types
    test('Data Types', () => {
      const types = orm.DataTypes;
      
      if (types.String !== 'String') throw new Error('String type incorrect');
      if (types.UInt32 !== 'UInt32') throw new Error('UInt32 type incorrect');
      if (types.Decimal(10, 2) !== 'Decimal(10, 2)') throw new Error('Decimal type incorrect');
      if (types.Array(types.String) !== 'Array(String)') throw new Error('Array type incorrect');
    });

    // Test 4: Query Builder
    test('Query Builder', () => {
      const queryBuilder = orm.createQueryBuilder();
      
      const sql = queryBuilder
        .select(['name', 'email'])
        .from('users')
        .where({ age: { gte: 18 } })
        .orderBy('name', 'ASC')
        .limit(10)
        .build();

      const expectedSql = "SELECT name, email FROM users WHERE age >= '18' ORDER BY name ASC LIMIT 10";
      if (!sql.includes('SELECT name, email FROM users')) {
        throw new Error('Query builder SQL incorrect');
      }
    });

    // Test 5: Model Methods
    test('Model Methods', () => {
      const User = orm.define('TestUser', {
        id: { type: orm.DataTypes.UInt32, primaryKey: true },
        name: orm.DataTypes.String
      });

      if (typeof User.findAll !== 'function') throw new Error('findAll method missing');
      if (typeof User.findOne !== 'function') throw new Error('findOne method missing');
      if (typeof User.create !== 'function') throw new Error('create method missing');
      if (typeof User.count !== 'function') throw new Error('count method missing');
    });

    // Test 6: Associations
    test('Associations', () => {
      const User = orm.define('AssocUser', {
        id: { type: orm.DataTypes.UInt32, primaryKey: true }
      });
      
      const Post = orm.define('AssocPost', {
        id: { type: orm.DataTypes.UInt32, primaryKey: true },
        user_id: orm.DataTypes.UInt32
      });

      User.hasMany(Post, { foreignKey: 'user_id' });
      Post.belongsTo(User, { foreignKey: 'user_id' });

      if (User.associations.size === 0) throw new Error('Association not created');
    });

    // Test 7: Schema Generation
    await asyncTest('Schema Generation', async () => {
      const TestModel = orm.define('SchemaTest', {
        id: {
          type: orm.DataTypes.UInt32,
          primaryKey: true
        },
        name: {
          type: orm.DataTypes.String,
          comment: 'Test name field'
        },
        created_at: {
          type: orm.DataTypes.DateTime,
          defaultValue: 'now()'
        }
      }, {
        tableName: 'schema_test',
        engine: 'MergeTree()',
        orderBy: 'id'
      });

      // This should not throw an error
      await orm.sync();
    });

    // Test 8: Complex Conditions
    test('Complex Conditions', () => {
      const queryBuilder = orm.createQueryBuilder();
      
      queryBuilder.where({
        age: { gte: 18, lte: 65 },
        name: { like: 'John%' },
        status: { in: ['active', 'pending'] }
      });

      const conditions = queryBuilder.query.where;
      if (conditions.length === 0) throw new Error('Conditions not applied');
    });

    // Test 9: Model Registry
    test('Model Registry', () => {
      const User = orm.define('RegistryUser', {
        id: { type: orm.DataTypes.UInt32, primaryKey: true }
      });

      const retrievedModel = orm.model('RegistryUser');
      if (!retrievedModel) throw new Error('Model not found in registry');
      if (retrievedModel !== User) throw new Error('Retrieved model is different');
    });

    // Test 10: Error Handling
    await asyncTest('Error Handling', async () => {
      try {
        // This should fail with invalid SQL
        await orm.query('INVALID SQL STATEMENT');
        throw new Error('Should have thrown an error');
      } catch (error) {
        if (!error.message.includes('Query execution failed')) {
          throw new Error('Wrong error type');
        }
      }
    });

  } catch (error) {
    console.error('Test setup error:', error.message);
  } finally {
    await orm.close();
  }

  // Test Results
  console.log('🏁 Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed');
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = runTests;