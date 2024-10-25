const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AuthDetails = sequelize.define("AuthDetails", {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    verificationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verificationCodeExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "user",
      allowNull: false,
      validate: {
        isIn: [['user', 'admin', 'developer']],
      },
    }
  }, {
    timestamps: true,
    tableName: "auth_details",
  });

  AuthDetails.associate = function(models) {
    AuthDetails.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AuthDetails;
};


