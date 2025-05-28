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
		totalAmount: {
			type: Number,
			required: true,
		},
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
			enum: ['cod', 'vnpay', 'paypal'],
		},
		paymentTime: {
			type: Date,
		},
		note: {
			type: String,
			default: '',
		},
	},
	{timestamps: true}
);

module.exports = mongoose.model('Order', OrderSchema);
