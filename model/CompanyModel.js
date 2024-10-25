const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Company = sequelize.define("company",
        {
            company_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            company_bg: {
                type: DataTypes.TEXT
            },
            email: {
                type: DataTypes.STRING
            },
            website_url: {
                type: DataTypes.STRING
            },
            tel: {
                type: DataTypes.STRING
            },
            location: {
                type: DataTypes.STRING
            },
            img_url: {
                type: DataTypes.STRING
            },
            img_desc: {
                type: DataTypes.STRING
            }
        },
        { timestamps: false });
    
    Company.associate = function (models) {
        Company.hasMany(models.Job, { foreignKey: "company_id", as: "jobs" });
        
    };
    return Company;
};