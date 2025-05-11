module.exports = (req, res, next) => {
	const token = req.headers.authorization;
	if (!token) return res.status(401).json({message: 'Unauthorized'});
	req.user = {_id: '6638f8f16b3a6b22fd2345d0'};
	next();
};
