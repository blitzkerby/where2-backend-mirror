/**
 * MANUALLY REVERTED BACK TO STABLE VERSION (ft#3.6-Cleanup)
 */

const DataTypes = require("sequelize");
const { sequelize } = require("./../config/database");

module.exports = (sequelize) => {
  const Accommodation = sequelize.define(
    "Accommodation",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      price: {
        type: DataTypes.STRING,
      },
      availability: {
        type: DataTypes.INTEGER,
      },
      size: {
        type: DataTypes.STRING,
      },
      location: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
      },
      google_map: {
        type: DataTypes.STRING,
      },
      image_url: {
        type: DataTypes.JSON,
      },
      contact: {
        type: DataTypes.STRING,
      },
    },
    {
      timestamps: false,
      tableName: "Accommodation",
    }
  );
  return Accommodation;
};
