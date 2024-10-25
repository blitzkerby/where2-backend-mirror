const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserDevice = sequelize.define("UserDevice", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deviceType: {
      type: DataTypes.ENUM('mobile', 'tablet', 'desktop'),
      allowNull: false,
    },
    deviceName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    browserName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    browserVersion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    osName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    osVersion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastUsed: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: "user_devices",
    indexes: [
      {
        fields: ['userId'],
      },
    ],
  });

  UserDevice.associate = function(models) {
    UserDevice.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserDevice;
};