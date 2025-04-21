const authRouter = require('./auth');
const productRouter = require('./product');

function route(app) {
	app.use('/api/user', authRouter);
	app.use('/api/product', productRouter);
}

module.exports = route;
