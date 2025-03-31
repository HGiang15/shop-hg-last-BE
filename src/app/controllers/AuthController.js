const bcrypt = require('bcrypt');
const User = require('./../models/User');
const OTPVerification = require('./../models/OTPVerification');
const {generateToken} = require('./../../utils/jwt');
const {generateOTP} = require('./../../utils/otp');
const {sendOTPVerificationEmail} = require('./../../utils/email');

exports.register = async (req, res) => {
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

		await sendOTPVerificationEmail(
			savedUser,
			otp,
			'Xác minh Email của bạn',
			`<p>Nhập mã OTP này để xác minh địa chỉ email của bạn: <b>${otp}</b></p><p>Mã OTP này sẽ hết hạn sau <b>1 giờ</b></p>`
		);

		res.status(201).json({
			status: 'Đang chờ xác minh',
			message: 'Mã OTP đã được gửi đến email của bạn để xác minh.',
			data: {userId: savedUser._id, email: savedUser.email},
		});
	} catch (error) {
		console.error('Lỗi đăng ký:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi đăng ký.'});
	}
};

exports.verifyOTP = async (req, res) => {
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
};

exports.login = async (req, res) => {
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
};

exports.forgotPassword = async (req, res) => {
	try {
		const {email} = req.body;

		if (!email) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng nhập email.'});
		}

		const user = await User.findOne({email});
		if (!user) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy tài khoản với email này.'});
		}

		const otp = generateOTP();
		await OTPVerification.findOneAndUpdate({userId: user._id}, {otp}, {upsert: true});

		await sendOTPVerificationEmail(
			user,
			otp,
			'Đặt lại mật khẩu của bạn',
			`<p>Nhập mã OTP này để đặt lại mật khẩu của bạn: <b>${otp}</b></p><p>Mã OTP này sẽ hết hạn sau <b>1 giờ</b></p>`
		);

		res.status(200).json({status: 'Thành công', message: 'Mã OTP đã được gửi đến email của bạn.'});
	} catch (error) {
		console.error('Lỗi quên mật khẩu:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi quên mật khẩu.'});
	}
};

exports.resetPassword = async (req, res) => {
	try {
		const {email, otp, newPassword} = req.body;

		if (!email || !otp || !newPassword) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng nhập email, OTP và mật khẩu mới.'});
		}

		const user = await User.findOne({email});
		if (!user) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy tài khoản với email này.'});
		}

		const otpVerificationRecord = await OTPVerification.findOne({userId: user._id});
		if (!otpVerificationRecord) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy bản ghi OTP.'});
		}

		if (otp !== otpVerificationRecord.otp) {
			return res.status(400).json({status: 'Thất bại', message: 'OTP không hợp lệ.'});
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await User.updateOne({_id: user._id}, {password: hashedPassword});
		await OTPVerification.deleteOne({userId: user._id});

		res.status(200).json({status: 'Thành công', message: 'Mật khẩu đã được đặt lại thành công!'});
	} catch (error) {
		console.error('Lỗi đặt lại mật khẩu:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi đặt lại mật khẩu.'});
	}
};
