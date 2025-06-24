const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		shippingAddress: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'UserAddress',
			required: true,
		},
		items: [
			{
				productId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Product',
					required: true,
				},
				name: String,
				image: String,
				color: String,
				size: String,
				quantity: Number,
				price: Number,
			},
		],

		status: {
			type: String,
			enum: ['pending', 'shipping', 'success', 'cancelled'],
			default: 'pending',
		},
		isPaid: {
			type: Boolean,
			default: false,
		},
		paymentMethod: {
			type: String,
			enum: ['cod', 'vnpay'],
			required: true,
		},
		paymentTime: {
			type: Date,
		},
		note: {
			type: String,
			default: '',
		},
		totalAmount: {
			type: Number,
			required: true,
		},
		discountAmount: {type: Number, default: 0},
		finalAmount: {type: Number},
		voucherId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Voucher',
			default: null,
		},
	},
	{timestamps: true}
);

module.exports = mongoose.model('Order', OrderSchema);
