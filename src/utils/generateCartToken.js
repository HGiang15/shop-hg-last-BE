const {v4: uuidv4} = require('uuid');

const generateCartToken = () => uuidv4();

module.exports = generateCartToken;
