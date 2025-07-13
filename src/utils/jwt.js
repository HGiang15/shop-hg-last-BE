const jwt = require('jsonwebtoken');

exports.generateToken = (user) => {
	return jwt.sign({id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar}, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};
