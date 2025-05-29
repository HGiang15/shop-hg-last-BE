// const jwt = require('jsonwebtoken');

// module.exports = (req, res, next) => {
// 	const authHeader = req.headers.authorization;
// 	if (!authHeader || !authHeader.startsWith('Bearer ')) {
// 		return res.status(401).json({message: 'Unauthorized'});
// 	}

// 	const token = authHeader.split(' ')[1];

// 	try {
// 		const decoded = jwt.verify(token, process.env.JWT_SECRET); // Lấy thông tin từ token
// 		req.user = decoded; // Ví dụ decoded = { id: '...', name: '...', iat: ..., exp: ... }
// 		next();
// 	} catch (err) {
// 		return res.status(403).json({message: 'Token không hợp lệ'});
// 	}
// };

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({message: 'Unauthorized'});
	}

	const token = authHeader.split(' ')[1];
	console.log('Token nhận được:', token);
	console.log('JWT_SECRET:', process.env.JWT_SECRET);

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log('Decoded token:', decoded);

		req.user = {_id: decoded.id, name: decoded.name}; // giả sử token có chứa name
		next();
	} catch (err) {
		console.error('Lỗi verify token:', err.message);
		return res.status(403).json({message: 'Token không hợp lệ'});
	}
};
