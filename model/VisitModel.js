const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Visit = sequelize.define("Visit", {
    path: {
        type: DataTypes.STRING,
        allowNull: false
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
        tableName: "visitors",
    });

  return Visit;
};