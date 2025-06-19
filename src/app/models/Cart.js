const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Giỏ người dùng đã đăng nhập và Giỏ khách vãng lai
const CartItemSchema = new Schema({
	productId: {type: Schema.Types.ObjectId, ref: 'Product'},
	sizeId: {type: Schema.Types.ObjectId, ref: 'Size'},
	quantity: {type: Number, default: 1},
});

const CartSchema = new Schema(
	{
		userId: {type: Schema.Types.ObjectId, ref: 'User', default: null},
		cartToken: {type: String, default: null},
		items: [CartItemSchema],
	},
	{timestamps: true}
);

module.exports = mongoose.model('Cart', CartSchema);
