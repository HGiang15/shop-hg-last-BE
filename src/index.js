require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const db = require('./config/db');
const route = require('./routes');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
require('./config/passport');

db.connect();

// Khởi tạo app với express
const app = express();
const port = 3003;

// -----------------------------
app.use(
	cors({
		origin: ['http://localhost:3000', 'https://shop-hg-last-n4tq.vercel.app'],
		credentials: true,
	})
);

// Cookie & Session Middleware
app.use(cookieParser());
app.use(
	session({
		secret: 'secret',
		resave: false,
		saveUninitialized: true,
	})
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Passport Middleware
// app.use(passport.initialize());
// app.use(passport.session());

// Logging & Static files
app.use(morgan('combined'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

route(app);

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
