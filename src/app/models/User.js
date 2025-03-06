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
	},
	{timeseries: true, versionKey: false}
);

module.exports = mongoose.model('User', UserSchema);
