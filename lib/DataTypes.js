/**
 * ClickHouse data types
 */
const DataTypes = {
  // Numeric types
  UInt8: 'UInt8',
  UInt16: 'UInt16',
  UInt32: 'UInt32',
  UInt64: 'UInt64',
  Int8: 'Int8',
  Int16: 'Int16',
  Int32: 'Int32',
  Int64: 'Int64',
  Float32: 'Float32',
  Float64: 'Float64',
  Decimal: (precision, scale) => `Decimal(${precision}, ${scale})`,

  // String types
  String: 'String',
  FixedString: (length) => `FixedString(${length})`,

  // Date and time types
  Date: 'Date',
  DateTime: 'DateTime',
  DateTime64: (precision = 3) => `DateTime64(${precision})`,

  // Boolean type
  Boolean: 'UInt8', // ClickHouse doesn't have native boolean

  // Array types
  Array: (type) => `Array(${type})`,

  // Nullable types
  Nullable: (type) => `Nullable(${type})`,

  // Enum types
  Enum8: (values) => `Enum8(${Object.entries(values).map(([k, v]) => `'${k}' = ${v}`).join(', ')})`,
  Enum16: (values) => `Enum16(${Object.entries(values).map(([k, v]) => `'${k}' = ${v}`).join(', ')})`,

  // UUID type
  UUID: 'UUID',

  // JSON type (experimental)
  JSON: 'JSON',

  // Low cardinality
  LowCardinality: (type) => `LowCardinality(${type})`,

  // Helper methods
  isNumeric: (type) => {
    const numericTypes = ['UInt8', 'UInt16', 'UInt32', 'UInt64', 'Int8', 'Int16', 'Int32', 'Int64', 'Float32', 'Float64'];
    return numericTypes.includes(type) || type.startsWith('Decimal');
  },

  isString: (type) => {
    return type === 'String' || type.startsWith('FixedString');
  },

  isDate: (type) => {
    return ['Date', 'DateTime'].includes(type) || type.startsWith('DateTime64');
  },

  isArray: (type) => {
    return type.startsWith('Array');
  },

  isNullable: (type) => {
    return type.startsWith('Nullable');
  }
};

module.exports = DataTypes;