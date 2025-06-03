const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({message: 'Unauthorized'});
	}

	const token = authHeader.split(' ')[1];

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		req.user = {_id: decoded.id, name: decoded.name, role: decoded.role};
		next();
	} catch (err) {
		console.error('Lỗi verify token:', err.message);
		return res.status(403).json({message: 'Token không hợp lệ'});
	}
};
