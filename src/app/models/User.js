const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		phone: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			match: [/^\d{10,15}$/, 'Invalid phone number'], // Số điện thoại từ 10-15 số
		},
		dateOfBirth: {
			type: Date,
			required: true,
		},
		gender: {
			type: String,
			enum: ['Male', 'Female', 'Other'],
			required: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		role: {type: Number, enum: [0, 1], default: 1},
		verified: {
			type: Boolean,
		},
		status: {type: Number, enum: [0, 1], default: 1},
	},
	{timeseries: true, versionKey: false}
);

module.exports = mongoose.model('User', UserSchema);
