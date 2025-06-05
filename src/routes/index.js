const authRouter = require('./auth');
const productRouter = require('./product');
const colorRouter = require('./color');
const sizeRouter = require('./size');
const categoryRouter = require('./category');
const cartRouter = require('./cart');
const userAddressRouter = require('./userAddress');
const orderRouter = require('./order');
const locationRouter = require('./location');
const reviewRouter = require('./review');
const uploadRouter = require('./upload');
const voucherRouter = require('./voucher');

function route(app) {
	app.use('/api/user', authRouter);
	app.use('/api/product', productRouter);
	app.use('/api/color', colorRouter);
	app.use('/api/size', sizeRouter);
	app.use('/api/category', categoryRouter);
	app.use('/api/cart', cartRouter);
	app.use('/api/order', orderRouter);
	app.use('/api/user-addresses', userAddressRouter);
	app.use('/api/locations', locationRouter);
	app.use('/api/review', reviewRouter);
	app.use('/api/voucher', voucherRouter);
	app.use('/api/upload', uploadRouter);
}

module.exports = route;
