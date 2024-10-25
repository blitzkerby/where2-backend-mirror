const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StudentLoan = sequelize.define("StudentLoan",
        {
        loan_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        bank_name: {
            type: DataTypes.STRING,
        },
        loan_type: {
            type: DataTypes.STRING,
        },
        interest_rate: {
            type: DataTypes.FLOAT,
        },
        loan_limit: {
            type: DataTypes.INTEGER,
        },
        loan_term: {
            type: DataTypes.DATEONLY,
        },
        address: {
            type: DataTypes.STRING,
        },
        img_url: {
            type: DataTypes.STRING,
        },
        image_alt: {
            type: DataTypes.STRING,
            },
        info_link:{
            type: DataTypes.STRING
        }
    
        }, {
            timestamps: false,
        tableName: 'StudentLoan'
     });

    StudentLoan.associate = function(models){
  
    }
    return StudentLoan;
}