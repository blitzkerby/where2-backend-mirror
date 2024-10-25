const { DataTypes } = require("sequelize");

const constructS3Url = () => {
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/profile-pictures/default-profile.jpg`;
};

module.exports = (sequelize) => {
  const UserProfile = sequelize.define("UserProfile", {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profilePictureUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: constructS3Url(),
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    entity: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: "user_profiles",
  });

  UserProfile.associate = function(models) {
    UserProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserProfile;
};


