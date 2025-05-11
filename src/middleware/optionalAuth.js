// ko bắt buộc token
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) return next();

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
	} catch (err) {
		console.error('JWT optional decode failed');
	}
	next();
};
