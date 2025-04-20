require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const db = require('./config/db');
const route = require('./routes');

// Kết nối DB
db.connect();

// Khởi tạo app với express
const app = express();
const port = 3003;

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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// xu ly data form submit len
app.use(
	express.urlencoded({
		extended: true,
	})
);

// cors
app.use(cors());

// HTTP logger
app.use(morgan('combined'));

// Phân tích JSON bodies
app.use(express.json());

route(app); // router all

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
