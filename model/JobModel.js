/**
 * MANUALLY REVERTED BACK TO STABLE VERSION (ft#3.6-Cleanup)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Job = sequelize.define("Job", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'companies',
                key: 'company_id'
            }
        },
        company_name: {
            type: DataTypes.STRING
        },
        job_desc: {
            type: DataTypes.TEXT
        },
        job_require: {
            type: DataTypes.TEXT
        },
        location: {
            type: DataTypes.STRING
        },
        salary: {
            type: DataTypes.FLOAT
        },
        position: {
            type: DataTypes.STRING
        },
        deadline: {
            type: DataTypes.DATEONLY
        },
        work_hour: {
            type: DataTypes.STRING
        }
    }, {
        timestamps: false,
        tableName: "Job"
     });

    Job.associate = function (models) {
        Job.belongsTo(models.Company, { foreignKey: "company_id", as: "company" });
        
    };
    return Job;
};
