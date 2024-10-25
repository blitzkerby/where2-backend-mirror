const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Comment = sequelize.define("Comment", {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [1, 200]
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      discussionId: {
        type: DataTypes.UUID,
        allowNull: false
      }
    }, {
      tableName: "comments"
    });
  
    Comment.associate = function(models) {
      Comment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Comment.belongsTo(models.Discussion, { foreignKey: 'discussionId', as: 'discussion', onDelete:'CASCADE' });
    };
  
    return Comment;
  };