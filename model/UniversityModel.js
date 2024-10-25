const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const University = sequelize.define("University", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    website: { type: DataTypes.STRING, allowNull: true },
    telegram_url: { type: DataTypes.STRING, allowNull: true },
    facebook_url: { type: DataTypes.STRING, allowNull: true },
    instagram_url: { type: DataTypes.STRING, allowNull: true },
    image_url: { type: DataTypes.STRING, allowNull: true },
    image_alt: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "University",
  });
  return University;
};