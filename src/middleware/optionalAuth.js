const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

	const token = authHeader.split(' ')[1];

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = {
			id: decoded.id,
			name: decoded.name,
			role: decoded.role,
		};
	} catch (err) {
		if (process.env.NODE_ENV === 'development') {
			console.warn('Optional JWT decode failed:', err.message);
		}
	}
	next();
};
