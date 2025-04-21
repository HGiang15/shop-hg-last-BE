const swaggerJSDoc = require('swagger-jsdoc');

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'NodeJS API Project for MongoDB',
			version: '1.0.0',
		},
		servers: [
			{
				url: 'http://localhost:3003/',
			},
		],
	},
	apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
