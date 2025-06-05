const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
	{
		code: {type: String, required: true, unique: true}, // Mã giảm giá
		discountType: {type: String, enum: ['percent', 'fixed'], required: true}, // Kiểu giảm giá
		discountValue: {type: Number, required: true}, // Giá trị giảm
		minOrderValue: {type: Number, default: 0}, // Đơn hàng tối thiểu
		maxDiscount: {type: Number}, // Giảm tối đa (nếu là %)
		quantity: {type: Number, required: true}, // Số lượt còn lại
		startDate: {type: Date, required: true},
		endDate: {type: Date, required: true},
		isActive: {type: Boolean, default: true},
		usedBy: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	},
	{timestamps: true}
);

module.exports = mongoose.model('Voucher', voucherSchema);
