const authRouter = require('./auth');
const productRouter = require('./product');
const colorRouter = require('./color');
const sizeRouter = require('./size');

function route(app) {
	app.use('/api/user', authRouter);
	app.use('/api/product', productRouter);
	app.use('/api/color', colorRouter);
	app.use('/api/size', sizeRouter);
}

module.exports = route;
