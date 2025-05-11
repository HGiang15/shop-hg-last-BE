const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
	{
		code: {
			type: String,
			required: [true, 'Please enter product id'],
		},
		name: {
			type: String,
			required: [true, 'Please enter product name'],
		},
		category: [
			{
				categoryId: {
					type: Schema.Types.ObjectId,
					ref: 'Category',
					required: true,
				},
				name: {
					type: String,
					required: true,
				},
			},
		],
		colors: [
			{
				colorId: {
					type: Schema.Types.ObjectId,
					ref: 'Color',
					required: true,
				},
				name: {
					type: String,
					required: true,
				},
			},
		],
		images: {
			type: [String],
			validate: [(arr) => arr.length <= 6, '{PATH} exceeds the limit of 6'],
			default: [],
		},
		quantityBySize: [
			{
				sizeId: {
					type: Schema.Types.ObjectId,
					ref: 'Size',
					required: true,
				},
				name: {
					type: String,
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					default: 0,
				},
			},
		],
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
		isFeatured: {
			type: Boolean,
			default: false,
		},
	},
	{timestamps: true}
);

module.exports = mongoose.model('Product', ProductSchema);
