const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dynamicId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'dynamic_id'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'creator'),
    defaultValue: 'creator',
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // For impersonation tracking
  lastImpersonatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_impersonated_at'
  },
  lastImpersonatedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_impersonated_by'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'user_roles',
  timestamps: true,
  underscored: true
});

  return UserRole;
};