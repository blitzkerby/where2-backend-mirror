const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Discussion = sequelize.define("Discussion", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [10, 255]
      }
    },
    author: {
      type: DataTypes.STRING,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 10000]
      }
    },
    location: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pathname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: "discussions"
  });

  Discussion.associate = function(models) {
    Discussion.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Discussion.hasMany(models.Comment, { foreignKey: 'discussionId', as: 'comments', onDelete: 'CASCADE' });
  };

  return Discussion;
};
