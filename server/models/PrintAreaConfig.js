const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PrintAreaConfig = sequelize.define('PrintAreaConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    configKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Configuration key (e.g., "global_print_areas")'
    },
    configData: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'JSON configuration data'
    },
    lastModifiedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Email of user who last modified this config'
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version number for change tracking'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this configuration is active'
    }
  }, {
    tableName: 'print_area_configs',
    timestamps: true, // Adds createdAt and updatedAt
    indexes: [
      {
        unique: true,
        fields: ['configKey']
      }
    ],
    comment: 'Persistent storage for print area configurations'
  });

  // Class method to get configuration with fallback
  PrintAreaConfig.getConfig = async function(key, defaultValue = null) {
    try {
      const config = await this.findOne({
        where: { 
          configKey: key,
          isActive: true 
        }
      });
      return config ? config.configData : defaultValue;
    } catch (error) {
      console.error(`Failed to get config ${key}:`, error);
      return defaultValue;
    }
  };

  // Class method to set configuration
  PrintAreaConfig.setConfig = async function(key, data, modifiedBy = null) {
    try {
      const [config, created] = await this.upsert({
        configKey: key,
        configData: data,
        lastModifiedBy: modifiedBy,
        version: created ? 1 : sequelize.literal('version + 1'),
        isActive: true
      }, {
        returning: true
      });
      
      console.log(`✅ Config ${key} ${created ? 'created' : 'updated'} by ${modifiedBy}`);
      return config;
    } catch (error) {
      console.error(`Failed to set config ${key}:`, error);
      throw error;
    }
  };

  return PrintAreaConfig;
};