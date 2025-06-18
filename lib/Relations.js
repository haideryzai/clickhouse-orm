/**
 * Relationship handling for ClickHouse ORM
 */
class Relations {
  constructor(orm) {
    this.orm = orm;
  }

  /**
   * Setup model associations
   */
  setupAssociations() {
    const models = this.orm.getModels();
    
    for (const model of models) {
      for (const [associatedModelName, association] of model.associations) {
        const associatedModel = this.orm.model(associatedModelName);
        
        if (!associatedModel) {
          throw new Error(`Associated model ${associatedModelName} not found`);
        }

        this.createAssociationMethods(model, associatedModel, association);
      }
    }
  }

  /**
   * Create association methods on model
   */
  createAssociationMethods(model, associatedModel, association) {
    const { type, options } = association;
    
    switch (type) {
      case 'hasMany':
        this.createHasManyMethods(model, associatedModel, options);
        break;
      case 'belongsTo':
        this.createBelongsToMethods(model, associatedModel, options);
        break;
      case 'hasOne':
        this.createHasOneMethods(model, associatedModel, options);
        break;
    }
  }

  /**
   * Create hasMany association methods
   */
  createHasManyMethods(model, associatedModel, options) {
    const foreignKey = options.foreignKey || `${model.name.toLowerCase()}_id`;
    const as = options.as || associatedModel.name.toLowerCase() + 's';

    // Get associated records
    model.prototype[`get${this.capitalize(as)}`] = async function(findOptions = {}) {
      const primaryKey = model.prototype.getPrimaryKey();
      const whereCondition = {
        [foreignKey]: this[primaryKey]
      };

      return associatedModel.findAll({
        ...findOptions,
        where: {
          ...whereCondition,
          ...(findOptions.where || {})
        }
      });
    };

    // Count associated records
    model.prototype[`count${this.capitalize(as)}`] = async function(findOptions = {}) {
      const primaryKey = model.prototype.getPrimaryKey();
      const whereCondition = {
        [foreignKey]: this[primaryKey]
      };

      return associatedModel.count({
        ...findOptions,
        where: {
          ...whereCondition,
          ...(findOptions.where || {})
        }
      });
    };

    // Check if has associated records
    model.prototype[`has${this.capitalize(as)}`] = async function(findOptions = {}) {
      const count = await this[`count${this.capitalize(as)}`](findOptions);
      return count > 0;
    };
  }

  /**
   * Create belongsTo association methods
   */
  createBelongsToMethods(model, associatedModel, options) {
    const foreignKey = options.foreignKey || `${associatedModel.name.toLowerCase()}_id`;
    const as = options.as || associatedModel.name.toLowerCase();

    // Get associated record
    model.prototype[`get${this.capitalize(as)}`] = async function(findOptions = {}) {
      if (!this[foreignKey]) {
        return null;
      }

      const primaryKey = associatedModel.prototype.getPrimaryKey();
      return associatedModel.findOne({
        ...findOptions,
        where: {
          [primaryKey]: this[foreignKey],
          ...(findOptions.where || {})
        }
      });
    };
  }

  /**
   * Create hasOne association methods
   */
  createHasOneMethods(model, associatedModel, options) {
    const foreignKey = options.foreignKey || `${model.name.toLowerCase()}_id`;
    const as = options.as || associatedModel.name.toLowerCase();

    // Get associated record
    model.prototype[`get${this.capitalize(as)}`] = async function(findOptions = {}) {
      const primaryKey = model.prototype.getPrimaryKey();
      const whereCondition = {
        [foreignKey]: this[primaryKey]
      };

      return associatedModel.findOne({
        ...findOptions,
        where: {
          ...whereCondition,
          ...(findOptions.where || {})
        }
      });
    };
  }

  /**
   * Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Create join query for associations
   */
  createJoinQuery(model, includes) {
    const QueryBuilder = require('./QueryBuilder');
    const query = new QueryBuilder(model.connection);
    
    query.select('*').from(model.tableName);

    for (const include of includes) {
      const association = model.associations.get(include.model);
      
      if (!association) {
        throw new Error(`Association ${include.model} not found on ${model.name}`);
      }

      const joinCondition = this.buildJoinCondition(model, association, include);
      query.leftJoin(association.model.tableName, joinCondition);
    }

    return query;
  }

  /**
   * Build join condition
   */
  buildJoinCondition(model, association, include) {
    const { type, options } = association;
    
    switch (type) {
      case 'hasMany':
      case 'hasOne':
        const foreignKey = options.foreignKey || `${model.name.toLowerCase()}_id`;
        const primaryKey = model.getPrimaryKey();
        return `${model.tableName}.${primaryKey} = ${association.model.tableName}.${foreignKey}`;
        
      case 'belongsTo':
        const belongsToForeignKey = options.foreignKey || `${association.model.name.toLowerCase()}_id`;
        const belongsToPrimaryKey = association.model.getPrimaryKey();
        return `${model.tableName}.${belongsToForeignKey} = ${association.model.tableName}.${belongsToPrimaryKey}`;
        
      default:
        throw new Error(`Unknown association type: ${type}`);
    }
  }
}

module.exports = Relations;