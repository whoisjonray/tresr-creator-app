const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CreatorMapping = sequelize.define('CreatorMapping', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sanityPersonId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'sanity_person_id',
      comment: 'Sanity person._id (e.g., k2r2aa8vmghuyr3he0p2eo5e)'
    },
    dynamicId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'dynamic_id',
      comment: 'Dynamic.xyz user ID (e.g., 31162d55-0da5-4b13-ad7c-3cafd170cebf)'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User email (e.g., whoisjonray@gmail.com)'
    },
    sanityName: {
      type: DataTypes.STRING,
      field: 'sanity_name',
      comment: 'Name in Sanity (e.g., memelord)'
    },
    sanityUsername: {
      type: DataTypes.STRING,
      field: 'sanity_username',
      comment: 'Username in Sanity'
    },
    sanityWalletAddress: {
      type: DataTypes.STRING,
      field: 'sanity_wallet_address',
      comment: 'Primary wallet from Sanity'
    },
    sanityWallets: {
      type: DataTypes.JSON,
      field: 'sanity_wallets',
      comment: 'All wallets from Sanity person',
      defaultValue: []
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
      comment: 'Whether this mapping has been verified'
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      field: 'last_synced_at',
      comment: 'Last time designs were synced from Sanity'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional metadata from Sanity'
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
    tableName: 'creator_mappings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['sanity_person_id']
      },
      {
        unique: true,
        fields: ['dynamic_id']
      },
      {
        fields: ['email']
      }
    ]
  });

  return CreatorMapping;
};