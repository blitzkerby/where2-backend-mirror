/**
 * MANUALLY REVERTED BACK TO STABLE VERSION (ft#3.6-Cleanup)
 */

const { DataTypes, Op } = require("sequelize");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Email already exists" },
        validate: {
          isEmail: { msg: "Please provide a valid email!" },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [6, Infinity],
        },
      },
      passwordChangedAt: {
        type: DataTypes.DATE,
      },
      passwordResetToken: {
        type: DataTypes.STRING,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      hooks: {
        beforeSave: async (user) => {
          if (user.changed('password')) {
            console.log("Password changed, hashing...");
            try {
              const hashedPassword = await bcrypt.hash(user.password, 12);
              console.log("Original password:", user.password);
              console.log("Hashed password:", hashedPassword);
              user.password = hashedPassword;
              user.passwordConfirm = undefined;
            } catch (error) {
              console.error("Error hashing password:", error);
            }
          }
        },
        beforeFind: (options) => {
          if (!options.where) {
            options.where = {};
          }
          // options.where.isActive = { [Op.ne]: false };
        },
      },
      timestamps: true,
      tableName: "users",
    }
  );

  User.prototype.correctPassword = async function (candidatePassword) {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Candidate password:", candidatePassword);
      console.log("Stored hashed password:", this.password);
    }

    if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      console.error("Stored password is not a bcrypt hash!");
      return false;
    }

    try {
      const isMatch = await bcrypt.compare(candidatePassword, this.password);
      if (process.env.NODE_ENV !== 'production') {
        console.log("Password match result:", isMatch);
      }
      return isMatch;
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return false;
    }
  };

  User.prototype.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  };

  User.prototype.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
  };

  User.associate = function(models) {
    User.hasOne(models.UserProfile, { foreignKey: 'userId', as: 'profile' });
    User.hasOne(models.AuthDetails, { foreignKey: 'userId', as: 'authDetails' });
    User.hasMany(models.Favorite, { foreignKey: 'user_id', as: 'users' });
    User.hasMany(models.Discussion, { foreignKey: 'userId', as: 'discussions', onDelete: 'CASCADE' });
    User.hasMany(models.Comment, { foreignKey: 'userId', as: 'comments', onDelete: 'CASCADE' });
    User.hasMany(models.UserDevice, { foreignKey: 'userId', as: 'devices' });
  };

  return User;
};


