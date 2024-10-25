const db = require("../model");

/**
 * Dynamically resolve the model based on the category.
 *
 * @param {string} category - The category to resolve.
 * @returns {Object} - The response object containing the model or an error message.
 */
const resolveModel = (category) => {
  console.log("Received category:", category); // Log the received category
  console.log("Available models:", Object.keys(db)); // Log available models in db
  const modelName = Object.keys(db).find(key => key.toLowerCase() === category.toLowerCase());
  if (modelName) {
    return { success: true, model: db[modelName] };
  }
  return { success: false, message: "Invalid category" };
};

module.exports = { resolveModel };