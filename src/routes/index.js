const authRouter = require('./auth');
const productRouter = require('./product');
const colorRouter = require('./color');
const sizeRouter = require('./size');
const categoryRouter = require('./category');

function route(app) {
	app.use('/api/user', authRouter);
	app.use('/api/product', productRouter);
	app.use('/api/color', colorRouter);
	app.use('/api/size', sizeRouter);
	app.use('/api/category', categoryRouter);
}

module.exports = route;
