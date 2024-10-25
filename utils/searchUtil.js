// utils/searchUtil.js
const { Op } = require('sequelize');

async function searchTable(model, query, searchableFields) {
    const whereClause = {
        [Op.or]: searchableFields.map(field => ({
            [field]: {
                [Op.like]: `%${query}%`,
            },
        })),
    };

    try {
        const results = await model.findAll({ where: whereClause });
        return results;
    } catch (error) {
        throw new Error('Search operation failed');
    }
}

module.exports = searchTable;
