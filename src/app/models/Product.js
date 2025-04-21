const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Please enter product name'],
		},
		quantity: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
			default: 0,
		},
		image: {
			type: String,
			required: false,
		},
		description: {
			type: String,
			required: false,
		},
		detailDescription: {
			type: String,
			required: false,
		},
	},
	{timestamps: true}
);

module.exports = mongoose.model('Product', ProductSchema);
