require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const db = require('./config/db');
const route = require('./routes');

// Kết nối DB
db.connect();

// Khởi tạo app với express
const app = express();
const port = 3003;

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
