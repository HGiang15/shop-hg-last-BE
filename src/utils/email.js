const nodemailer = require('nodemailer');
const User = require('./../app/models/User');
const OTPVerification = require('./../app/models/OTPVerification');

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

exports.sendOTPVerificationEmail = async ({_id, email}, otp, subject, html) => {
	const mailOptions = {
		from: process.env.AUTH_EMAIL,
		to: email,
		subject: subject,
		html: html,
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
