require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('./../app/models/User');
const OTPVerification = require('./../app/models/OTPVerification');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.AUTH_EMAIL,
		pass: process.env.AUTH_PASS,
	},
});

transporter.verify((error, success) => {
	if (error) {
		console.error('Lỗi xác minh transporter:', error);
	} else {
		console.log('Transporter sẵn sàng gửi email:', success);
	}
});

const sendOTPVerificationEmail = async ({_id, email}, otp) => {
	const mailOptions = {
		from: process.env.AUTH_EMAIL,
		to: email,
		subject: 'Xác minh Email của bạn',
		html: `<p>Nhập mã OTP này để xác minh địa chỉ email của bạn: <b>${otp}</b></p><p>Mã OTP này sẽ hết hạn sau <b>1 giờ</b></p>`,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(`OTP đã được gửi đến ${email}`);
		return true;
	} catch (error) {
		console.error('Lỗi gửi email OTP:', error);
		await User.deleteOne({_id});
		await OTPVerification.deleteOne({userId: _id});
		throw new Error('Lỗi gửi email OTP.');
	}
};

const generateToken = (user) =>
	jwt.sign({id: user._id, email: user.email, role: user.role}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});

// Register
router.post('/register', async (req, res) => {
	try {
		const {name, email, phone, dateOfBirth, gender, password, role = 1} = req.body;

		if (!name || !email || !dateOfBirth || !gender || !password) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng không để trống bất kỳ trường nào.'});
		}

		if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
			return res.status(400).json({status: 'Thất bại', message: 'Email không hợp lệ.'});
		}
		if (!/^\d{10,15}$/.test(phone)) {
			return res.status(400).json({status: 'Thất bại', message: 'Số điện thoại không hợp lệ.'});
		}
		if (!new Date(dateOfBirth).getTime()) {
			return res.status(400).json({status: 'Thất bại', message: 'Ngày sinh không hợp lệ.'});
		}
		if (!['Male', 'Female', 'Other'].includes(gender)) {
			return res.status(400).json({status: 'Thất bại', message: 'Giới tính không hợp lệ.'});
		}
		if (password.length < 6) {
			return res.status(400).json({status: 'Thất bại', message: 'Mật khẩu quá ngắn.'});
		}

		const existingUser = await User.findOne({email});
		if (existingUser) {
			return res.status(409).json({status: 'Thất bại', message: 'Tài khoản đã tồn tại!'});
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const savedUser = await new User({name, email, phone, dateOfBirth, gender, password: hashedPassword, role, verified: false}).save();

		const otp = generateOTP();
		await new OTPVerification({userId: savedUser._id, otp}).save();

		await sendOTPVerificationEmail(savedUser, otp);

		res.status(201).json({
			status: 'Đang chờ xác minh',
			message: 'Mã OTP đã được gửi đến email của bạn để xác minh.',
			data: {userId: savedUser._id, email: savedUser.email},
		});
	} catch (error) {
		console.error('Lỗi đăng ký:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi đăng ký.'});
	}
});

// VerifyOTP
router.post('/verifyOTP', async (req, res) => {
	try {
		const {userId, otp} = req.body;

		if (!userId || !otp) {
			return res.status(400).json({status: 'Thất bại', message: 'Thiếu ID người dùng hoặc OTP.'});
		}

		const otpVerificationRecord = await OTPVerification.findOne({userId});

		if (!otpVerificationRecord) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy bản ghi OTP.'});
		}

		if (otp === otpVerificationRecord.otp) {
			await User.updateOne({_id: userId}, {verified: true});
			await OTPVerification.deleteOne({userId});

			const user = await User.findById(userId);
			const token = generateToken(user);

			res.status(200).json({
				status: 'Thành công',
				message: 'Email đã được xác minh thành công!',
				token,
				data: {id: user._id, name: user.name, email: user.email, role: user.role},
			});
		} else {
			res.status(400).json({status: 'Thất bại', message: 'OTP không hợp lệ.'});
		}
	} catch (error) {
		console.error('Lỗi xác minh OTP:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi xác minh OTP.'});
	}
});

// Login
router.post('/login', async (req, res) => {
	try {
		const {email, password} = req.body;

		if (!email || !password) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng không để trống email hoặc mật khẩu.'});
		}

		const user = await User.findOne({email});
		if (!user) {
			return res.status(401).json({status: 'Thất bại', message: 'Email hoặc mật khẩu không chính xác!'});
		}

		if (!(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({status: 'Thất bại', message: 'Mật khẩu không chính xác.'});
		}

		if (!user.verified) {
			return res.status(401).json({status: 'Thất bại', message: 'Email chưa được xác minh.'});
		}

		const token = generateToken(user);
		res.status(200).json({
			status: 'Thành công',
			message: 'Đăng nhập thành công!',
			data: {id: user._id, name: user.name, email: user.email, role: user.role},
			token,
		});
	} catch (error) {
		console.error('Lỗi đăng nhập:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi đăng nhập.'});
	}
});

module.exports = router;
