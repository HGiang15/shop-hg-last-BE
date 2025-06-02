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
		sizes: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Size',
			},
		],
	},
	{timestamps: true}
);

module.exports = mongoose.model('Category', CategorySchema);
