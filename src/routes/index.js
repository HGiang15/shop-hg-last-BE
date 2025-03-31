const authRouter = require('./auth');

function route(app) {
	app.use('/user', authRouter);
}

module.exports = route;
