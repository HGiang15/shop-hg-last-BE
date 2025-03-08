const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
	const token = req.header('Authorization');
	if (!token) {
		return res.status(401).json({status: 'Failed', message: 'Access denied. No token provided.'});
	}

	try {
		const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		res.status(401).json({status: 'Failed', message: 'Invalid token.'});
	}
};

module.exports = authenticate;
