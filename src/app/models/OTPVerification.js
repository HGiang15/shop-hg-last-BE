const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OTPVerificationSchema = new Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'User',
	},
	otp: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 3600,
	},
});

const OTPVerification = mongoose.model('OTPVerification', OTPVerificationSchema);

module.exports = OTPVerification;
