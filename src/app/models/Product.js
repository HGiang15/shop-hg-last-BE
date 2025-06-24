const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
	{
		code: {
			type: String,
		},
		name: {
			type: String,
			required: [true, 'Please enter product name'],
		},
		category: {
			type: [
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
			validate: {
				validator: function (v) {
					return Array.isArray(v) && v.length > 0;
				},
				message: 'Sản phẩm phải có ít nhất một danh mục!',
			},
		},
		colors: {
			type: [
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
			validate: {
				validator: function (v) {
					return Array.isArray(v) && v.length > 0;
				},
				message: 'Sản phẩm phải có ít nhất một màu sắc!',
			},
		},

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
			min: [0, 'Giá sản phẩm không thể âm'],
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
		totalSold: {
			type: Number,
			default: 0,
		},
		status: {
			type: String,
			enum: ['active', 'inactive', 'discontinued'],
			default: 'active',
		},
	},
	{timestamps: true}
);

module.exports = mongoose.model('Product', ProductSchema);
