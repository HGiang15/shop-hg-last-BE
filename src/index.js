require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const db = require('./config/db');
const route = require('./routes');

// Kết nối DB
db.connect();

// Khởi tạo app với express
const app = express();
const port = 3003;

// Swagger docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Trỏ public folder chứa ảnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(
	express.urlencoded({
		extended: true,
	})
);
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

route(app); // router all

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
