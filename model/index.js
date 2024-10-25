const dotenv = require("dotenv");
const config = require("./../config/database");

const { Sequelize } = require("sequelize");

const env = process.env.NODE_ENV || "development";

const dbConfig = config[env];
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env.development";

dotenv.config({ path: envFile });

let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

const User = require("./UserModel")(sequelize);
const Favorite = require("./FavoriteModel")(sequelize);
const UserProfile = require("./UserProfileModel")(sequelize);
const AuthDetails = require("./AuthDetailsModel")(sequelize);
const Visit = require("./VisitModel")(sequelize);
const Job = require("./JobModel")(sequelize);
const Company = require("./CompanyModel")(sequelize);
const StudentLoan = require("./StudentLoanModel")(sequelize);
const Comment = require("./CommentModel")(sequelize);
const Discussion = require("./DiscussionModel")(sequelize);
const University = require("./UniversityModel")(sequelize);
const Scholarship = require("./ScholarshipModel")(sequelize);
const Accommodation = require("./AccommodationModel")(sequelize);
const HealthArticle = require("./HealthArticleModel")(sequelize);
const UserDevice = require("./UserDeviceModel")(sequelize);
// const Image = require('./ImageModel')(sequelize);

const models = {
  User,
  UserProfile,
  AuthDetails,
  Visit,
  University,
  Scholarship,
  Job,
  Company,
  StudentLoan,
  Favorite,
  Accommodation,
  Comment,
  HealthArticle,
  Discussion,
  UserDevice,
  // Image,
};

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    if (process.env.UPDATE_DATABASE === "true") {
      console.log("Updating database schema...");
      if (process.env.NODE_ENV === "production") {
        await sequelize.sync();
      }

      if (process.env.NODE_ENV !== "production") {
        await sequelize.sync({ alter: true });
        console.log("Database schema was updated successfully.");
      }
    } else {
      console.log(
        "Database schema update skipped. Set UPDATE_DATABASE=true to update."
      );
    }
  } catch (err) {
    console.error("Unable to connect to the database or update schema:", err);
    process.exit(1);
  }
};

initializeDatabase();

module.exports = {
  sequelize,
  Sequelize,
  ...models,
};
