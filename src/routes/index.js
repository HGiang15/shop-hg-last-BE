const authRouter = require('./auth');
const productRouter = require('./product');
const colorRouter = require('./color');

function route(app) {
	app.use('/api/user', authRouter);
	app.use('/api/product', productRouter);
	app.use('/api/color', colorRouter);
}

module.exports = route;
