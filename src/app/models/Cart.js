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
		userId: {type: Schema.Types.ObjectId, ref: 'User', default: null, unique: true},
		cartToken: {type: String, default: null, unique: true},
		items: [CartItemSchema],
	},
	{timestamps: true}
);

module.exports = mongoose.model('Cart', CartSchema);

// const CartSchema = new Schema(
//     {
//         userId: {type: Schema.Types.ObjectId, ref: 'User', default: null},
//         cartToken: {type: String, default: null},

//         // Định nghĩa cấu trúc của item trực tiếp tại đây
//         items: [{
//             productId: {type: Schema.Types.ObjectId, ref: 'Product'},
//             sizeId: {type: Schema.Types.ObjectId, ref: 'Size'},
//             quantity: {type: Number, default: 1},
//             // Lưu ý: Mongoose vẫn sẽ tự động thêm một trường `_id`
//             // cho mỗi đối tượng item trong mảng này.
//         }],
//     },
//     {timestamps: true}
// );

// module.exports = mongoose.model('Cart', CartSchema);
