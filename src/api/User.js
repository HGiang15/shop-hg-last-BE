require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const User = require('./../app/models/User');
const bcrypt = require('bcrypt');

const generateToken = (user) => {
	return jwt.sign({id: user._id, email: user.email, role: user.role}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
};

// Đăng ký tài khoản
router.post('/register', async (req, res) => {
	try {
		let {name, email, phone, dateOfBirth, gender, password, role} = req.body;
		name = name.trim();
		email = email.trim();
		phone = phone.trim();
		dateOfBirth = dateOfBirth.trim();
		gender = gender.trim();
		password = password.trim();

		if (!name || !email || !dateOfBirth || !gender || !password) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng không để trống bất kỳ trường nào.'});
		}
		// if (!/^[a-zA-Z ]*$/.test(name)) {
		// 	return res.status(400).json({status: 'Thất bại', message: 'Tên không hợp lệ. Chỉ được chứa chữ cái và khoảng trắng.'});
		// }
		if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
			return res.status(400).json({status: 'Thất bại', message: 'Email không hợp lệ. Vui lòng nhập đúng định dạng.'});
		}
		if (!/^\d{10,15}$/.test(phone)) {
			return res.status(400).json({status: 'Thất bại', message: 'Số điện thoại không hợp lệ. Phải có từ 10 đến 15 chữ số.'});
		}
		if (!new Date(dateOfBirth).getTime()) {
			return res.status(400).json({status: 'Thất bại', message: 'Ngày sinh không hợp lệ. Vui lòng nhập đúng định dạng.'});
		}
		if (!['Male', 'Female', 'Other'].includes(gender)) {
			return res
				.status(400)
				.json({status: 'Thất bại', message: 'Giới tính không hợp lệ. Chỉ chấp nhận "Male", "Female" hoặc "Other".'});
		}
		if (password.length < 6) {
			return res.status(400).json({status: 'Thất bại', message: 'Mật khẩu quá ngắn. Vui lòng nhập hơn 6 ký tự!'});
		}
		if (![0, 1].includes(role)) {
			role = 1; // Nếu không hợp lệ, đặt mặc định là user
		}

		const existingUser = await User.findOne({email});
		if (existingUser) {
			return res.status(409).json({status: 'Thất bại', message: 'Tài khoản đã tồn tại!'});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = new User({name, email, phone, dateOfBirth, gender, password: hashedPassword, role});
		const savedUser = await newUser.save();

		// Tạo token cho user mới
		const token = generateToken(savedUser);

		res.status(201).json({
			status: 'Thành công',
			message: 'Đăng ký tài khoản thành công!',
			data: {id: savedUser._id, name, phone, dateOfBirth, gender, email, password: hashedPassword, role},
			token,
		});
	} catch (error) {
		res.status(500).json({status: 'Thất bại', message: 'Đã xảy ra lỗi khi đăng ký tài khoản. Vui lòng thử lại sau!'});
	}
});

// Đăng nhập
router.post('/login', async (req, res) => {
	try {
		let {email, password} = req.body;
		email = email.trim();
		password = password.trim();

		if (!email || !password) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng không để trống email hoặc mật khẩu.'});
		}

		const user = await User.findOne({email});
		if (!user) {
			return res.status(401).json({status: 'Thất bại', message: 'Email hoặc mật khẩu không chính xác!'});
		}

		const isPasswordMatch = await bcrypt.compare(password, user.password);
		if (!isPasswordMatch) {
			return res.status(401).json({status: 'Thất bại', message: 'Mật khẩu không chính xác. Vui lòng thử lại!'});
		}

		// Tạo token
		const token = generateToken(user);

		res.status(200).json({
			status: 'Thành công',
			message: 'Đăng nhập thành công!',
			data: {id: user._id, name: user.name, email: user.email, role: user.role},
			token,
		});
	} catch (error) {
		res.status(500).json({status: 'Thất bại', message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau!'});
	}
});

module.exports = router;
