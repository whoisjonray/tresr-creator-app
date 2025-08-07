const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductTemplate = sequelize.define('ProductTemplate', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    templateId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    colors: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    canvasWidth: {
      type: DataTypes.INTEGER,
      defaultValue: 600
    },
    canvasHeight: {
      type: DataTypes.INTEGER,
      defaultValue: 600
    },
    frontImage: {
      type: DataTypes.TEXT
    },
    backImage: {
      type: DataTypes.TEXT
    },
    thumbnailImage: {
      type: DataTypes.TEXT
    },
    defaultThumbnail: {
      type: DataTypes.STRING,
      defaultValue: 'default'
    },
    colorImages: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    printAreas: {
      type: DataTypes.JSON,
      defaultValue: {
        front: { width: 200, height: 250, x: 200, y: 200 },
        back: null
      }
    },
    hasBackPrint: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'apparel'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isCustom: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.STRING
    },
    updatedBy: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'product_templates',
    timestamps: true
  });

  return ProductTemplate;
};