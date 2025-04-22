const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Please enter product name'],
		},
		category: {
			type: String,
			required: [true, 'Please enter product category'],
		},
		colors: {
			type: [String],
			default: [],
		},
		images: {
			type: [String],
			validate: [(arr) => arr.length <= 6, '{PATH} exceeds the limit of 6'],
			default: [],
		},
		quantityBySize: {
			type: Object,
			required: true,
		},
		price: {
			type: Number,
			required: true,
			default: 0,
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
