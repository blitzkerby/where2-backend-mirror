const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Scholarship = sequelize.define('Scholarship', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        university_id: {
            type: DataTypes.INTEGER, 
            allowNull: false, 
            references: {      
                model: 'University', 
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        image_url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        image_alt: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contacts: {
            type: DataTypes.JSON,  
            allowNull: true
        },
        location: {  
            type: DataTypes.STRING,  
            allowNull: true  
        },
        university: {  
            type: DataTypes.STRING,  
            allowNull: true  
        },
        status: {  
            type: DataTypes.ENUM('open', 'closed'),  
            allowNull: false  
        },
        websiteLink:{
            type: DataTypes.STRING,
            allowNull:true
        },
        instagramLink:{
            type: DataTypes.STRING,
            allowNull:true
        },
        facebookLink:{
            type: DataTypes.STRING,
            allowNull:true
        },
        telegramLink:{
            type: DataTypes.STRING,
            allowNull:true
        },
        twitterLink:{
            type: DataTypes.STRING,
            allowNull:true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        timestamps: true, 
        createdAt: 'created_at',
        updatedAt: 'updated_at', 
        tableName: 'Scholarship'
    });

    return Scholarship;
};
