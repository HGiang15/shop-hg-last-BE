const Voucher = require('../models/Voucher');

exports.applyVoucher = async (req, res) => {
	const {code, orderTotal} = req.body;
	const userId = req.user._id;

	try {
		const voucher = await Voucher.findOne({code: code.toUpperCase(), isActive: true});

		if (!voucher) return res.status(404).json({message: 'Mã giảm giá không tồn tại'});

		const now = new Date();
		if (now < voucher.startDate || now > voucher.endDate) return res.status(400).json({message: 'Mã giảm giá không còn hiệu lực'});

		if (voucher.quantity <= 0) return res.status(400).json({message: 'Mã giảm giá đã hết lượt sử dụng'});

		if (orderTotal < voucher.minOrderValue)
			return res.status(400).json({message: `Đơn hàng phải từ ${voucher.minOrderValue}đ để dùng mã này`});

		// Tính giá trị giảm
		let discountAmount = 0;
		if (voucher.discountType === 'percent') {
			discountAmount = (orderTotal * voucher.discountValue) / 100;
			if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
				discountAmount = voucher.maxDiscount;
			}
		} else {
			discountAmount = voucher.discountValue;
		}

		const finalPrice = orderTotal - discountAmount;

		return res.json({
			success: true,
			message: 'Áp dụng mã thành công',
			code,
			discountAmount,
			finalPrice,
			voucherId: voucher._id,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({message: 'Lỗi máy chủ'});
	}
};

// Mã voucher khả dụng cho user
exports.getAvailableVouchersForUser = async (req, res) => {
	try {
		const userId = req.user._id;
		const now = new Date();

		const vouchers = await Voucher.find({
			isActive: true,
			quantity: {$gt: 0},
			showAt: {$lte: now},
			endDate: {$gte: now},
		}).sort({createdAt: -1});

		const result = vouchers.map((v) => ({
			...v.toObject(),
			canUse: now >= v.startDate,
		}));

		res.json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({message: 'Lỗi khi lấy danh sách voucher khả dụng'});
	}
};

// GET all vouchers Admin
exports.getAllVouchers = async (req, res) => {
	try {
		let {page = 1, limit = 10, sort = 'newest', search = '', discountType = ''} = req.query;

		page = parseInt(page);
		limit = parseInt(limit);

		const filter = {};

		if (search) {
			filter.code = {$regex: search, $options: 'i'};
		}

		if (discountType && discountType !== '') {
			filter.discountType = discountType;
		}

		let sortOption = {};
		if (sort === 'newest') {
			sortOption = {createdAt: -1};
		} else if (sort === 'oldest') {
			sortOption = {createdAt: 1};
		} else if (sort === 'discountType') {
			sortOption = {discountType: 1};
		} else {
			sortOption = {createdAt: -1};
		}

		const total = await Voucher.countDocuments(filter);

		const vouchers = await Voucher.find(filter)
			.sort(sortOption)
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
			vouchers,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({message: 'Lỗi khi lấy danh sách voucher'});
	}
};

// POST create voucher Admin
exports.createVoucher = async (req, res) => {
	try {
		const {code, discountType, discountValue, minOrderValue, maxDiscount, quantity, startDate, endDate, showAt, isActive} = req.body;

		// Validate cơ bản
		if (!code || !code.trim()) {
			return res.status(400).json({message: 'Mã voucher không được để trống'});
		}

		if (!['percent', 'fixed'].includes(discountType)) {
			return res.status(400).json({message: 'Loại giảm giá không hợp lệ'});
		}

		if (!discountValue || isNaN(discountValue) || discountValue < 0) {
			return res.status(400).json({message: 'Giá trị giảm giá không hợp lệ'});
		}

		if (!minOrderValue || isNaN(minOrderValue) || minOrderValue < 0) {
			return res.status(400).json({message: 'Giá trị đơn tối thiểu không hợp lệ'});
		}

		if (discountType === 'percent' && (!maxDiscount || isNaN(maxDiscount) || maxDiscount < 0)) {
			return res.status(400).json({message: 'Giảm tối đa không hợp lệ đối với loại giảm phần trăm'});
		}

		if (!quantity || isNaN(quantity) || quantity < 0) {
			return res.status(400).json({message: 'Số lượng không hợp lệ'});
		}

		if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
			return res.status(400).json({message: 'Ngày bắt đầu/kết thúc không hợp lệ'});
		}

		const newVoucher = new Voucher({
			code: code.trim(),
			discountType,
			discountValue,
			minOrderValue,
			maxDiscount: discountType === 'percent' ? maxDiscount : null,
			quantity,
			startDate,
			endDate,
			showAt: showAt || startDate,
			isActive: isActive !== undefined ? isActive : true,
		});

		const saved = await newVoucher.save();
		res.status(201).json(saved);
	} catch (err) {
		console.error(err);
		res.status(400).json({message: 'Tạo voucher thất bại', error: err.message});
	}
};

// GET one voucher by ID Admin
exports.getVoucherById = async (req, res) => {
	try {
		const voucher = await Voucher.findById(req.params.id);
		if (!voucher) return res.status(404).json({message: 'Không tìm thấy voucher'});
		res.json(voucher);
	} catch (err) {
		res.status(500).json({message: 'Lỗi khi lấy thông tin voucher'});
	}
};

// PUT update voucher Admin
exports.updateVoucher = async (req, res) => {
	try {
		const {code, discountType, discountValue, minOrderValue, maxDiscount, quantity, startDate, endDate, showAt, isActive} = req.body;

		if (!code || typeof code !== 'string' || code.trim() === '') {
			return res.status(400).json({message: 'Mã voucher không được để trống'});
		}

		if (!['fixed', 'percent'].includes(discountType)) {
			return res.status(400).json({message: 'Loại giảm giá không hợp lệ'});
		}

		if (isNaN(discountValue) || discountValue < 0) {
			return res.status(400).json({message: 'Giá trị giảm giá không hợp lệ'});
		}

		if (isNaN(minOrderValue) || minOrderValue < 0) {
			return res.status(400).json({message: 'Đơn tối thiểu không hợp lệ'});
		}

		if (discountType === 'percent') {
			if (maxDiscount === undefined || isNaN(maxDiscount) || maxDiscount < 0) {
				return res.status(400).json({message: 'Giảm tối đa không hợp lệ với loại phần trăm'});
			}
		}

		if (isNaN(quantity) || quantity < 0) {
			return res.status(400).json({message: 'Số lượng không hợp lệ'});
		}

		if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
			return res.status(400).json({message: 'Ngày bắt đầu/kết thúc không hợp lệ'});
		}

		if (!showAt) {
			return res.status(400).json({message: 'Vui lòng chọn ngày hiển thị'});
		}

		const updated = await Voucher.findByIdAndUpdate(req.params.id, req.body, {new: true});

		if (!updated) {
			return res.status(404).json({message: 'Không tìm thấy voucher'});
		}

		res.json(updated);
	} catch (err) {
		console.error(err);
		res.status(400).json({message: 'Cập nhật voucher thất bại', error: err.message});
	}
};

// DELETE voucher
exports.deleteVoucher = async (req, res) => {
	try {
		const deleted = await Voucher.findByIdAndDelete(req.params.id);
		if (!deleted) return res.status(404).json({message: 'Không tìm thấy voucher'});
		res.json({message: 'Xoá voucher thành công'});
	} catch (err) {
		res.status(500).json({message: 'Xoá voucher thất bại'});
	}
};

// DELETE many vouchers
exports.deleteMultipleVouchers = async (req, res) => {
	try {
		const {ids} = req.body;

		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({message: 'Vui lòng cung cấp mảng ID voucher cần xóa'});
		}

		const result = await Voucher.deleteMany({_id: {$in: ids}});

		res.status(200).json({
			message: `Đã xóa ${result.deletedCount} voucher`,
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({message: 'Xóa nhiều voucher thất bại', error: error.message});
	}
};
