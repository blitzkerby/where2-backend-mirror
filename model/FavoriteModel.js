
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Favorite = sequelize.define("Favorite", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        card: {
            type: DataTypes.INTEGER,
        },
        categories: {
            type: DataTypes.STRING,
        }
    }, { timestamps: false });
 
    Favorite.associate = function (models) {
        Favorite.belongsTo(models.User, { foreignKey: 'user_id', as: 'users' });
        Favorite.belongsTo(models.StudentLoan, { foreignKey: 'card', as: 'loan' });
        Favorite.belongsTo(models.Job,{ foreignKey: 'card', as: 'job'});
        Favorite.belongsTo(models.University, { foreignKey: 'card', as: 'university' });
        Favorite.belongsTo(models.Scholarship, { foreignKey: 'card', as: 'scholarship' });
        Favorite.belongsTo(models.Accommodation, { foreignKey: 'card', as: 'accommodation' });
    }

    return Favorite;
}