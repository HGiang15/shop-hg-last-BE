const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		image: {
			type: String,
			required: true,
		},

		sizes: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: 'Size',
				},
			],
			validate: {
				validator: function (array) {
					return Array.isArray(array) && array.length > 0;
				},
				message: 'Danh mục phải có ít nhất một kích cỡ (size)!',
			},
		},
	},
	{timestamps: true}
);

module.exports = mongoose.model('Category', CategorySchema);
