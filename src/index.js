require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const db = require('./config/db');
const UserRouter = require('./api/User');

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
// app.use(express.json());

// For accepting post form data
const bodyParser = require('express').json;
app.use(bodyParser());

// Route login, register cho User
app.use('/user', UserRouter);

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
