const mongoose = require('mongoose');

const ColorSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			default: '',
			trim: true,
		},
	},
	{timestamps: true}
);

module.exports = mongoose.model('Color', ColorSchema);
