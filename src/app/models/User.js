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
			trim: true,
			validate: {
				validator: function (v) {
					return !v || /^\d{10,15}$/.test(v);
				},
				message: 'Invalid phone number',
			},
		},
		dateOfBirth: {
			type: Date,
		},
		gender: {
			type: String,
			enum: ['Male', 'Female', 'Other'],
		},
		password: {
			type: String,
			minlength: 6,
		},
		provider: {
			type: String,
			enum: ['local', 'google'],
		},
		googleId: {
			type: String,
		},
		avatar: {
			type: String,
		},
		role: {
			type: Number,
			enum: [0, 1],
			default: 1,
		},
		verified: {
			type: Boolean,
			default: false,
		},
		status: {
			type: Number,
			enum: [0, 1],
			default: 1,
		},
	},
	{timestamps: true, versionKey: false}
);

module.exports = mongoose.model('User', UserSchema);
