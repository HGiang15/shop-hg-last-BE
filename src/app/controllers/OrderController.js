const Order = require('../models/Order');
const Voucher = require('../models/Voucher');
const Product = require('../models/Product');
const moment = require('moment');

const {VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat, VerifyReturnUrl} = require('vnpay');

const vnpay = new VNPay({
	tmnCode: process.env.VNP_TMNCODE,
	secureSecret: process.env.VNP_HASH_SECRET,
	vnpayHost: process.env.VNP_URL,
	testMode: true,
	hashAlgorithm: 'SHA512',
	enableLog: true,
	loggerFn: ignoreLogger,
});

exports.createOrder = async (req, res) => {
	try {
		const {shippingAddress, items, note = '', voucherCode, paymentMethod} = req.body;
		const userId = req.user._id;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({message: 'Danh sách sản phẩm không hợp lệ'});
		}

		const orderItems = [];
		let totalAmount = 0;
		const stockUpdatePromises = [];

		for (const item of items) {
			const product = await Product.findById(item.productId);
			if (!product) return res.status(404).json({message: `Sản phẩm với ID ${item.productId} không tồn tại.`});

			const sizeInfo = product.quantityBySize.find((s) => s.sizeId.equals(item.sizeId));
			if (!sizeInfo) return res.status(400).json({message: `Sản phẩm "${product.name}" không có size bạn chọn.`});

			if (sizeInfo.quantity < item.quantity) {
				return res.status(400).json({message: `Sản phẩm "${product.name}" (${sizeInfo.name}) không đủ hàng.`});
			}

			orderItems.push({
				productId: item.productId,
				sizeId: item.sizeId,
				name: product.name,
				image: product.images?.[0] || '',
				color: product.colors.find((c) => c.colorId.equals(item.colorId))?.name || product.colors[0]?.name || '',
				size: sizeInfo.name,
				quantity: item.quantity,
				price: product.price,
			});

			totalAmount += product.price * item.quantity;

			//  lệnh trừ kho và thêm vào mảng promises
			const updatePromise = Product.updateOne(
				{_id: item.productId, 'quantityBySize.sizeId': item.sizeId},
				{$inc: {'quantityBySize.$.quantity': -item.quantity, totalSold: item.quantity}}
			);
			stockUpdatePromises.push(updatePromise);
		}

		let discountAmount = 0;
		let voucherId = null;

		//   ÁP DỤNG VOUCHER nếu có
		if (voucherCode) {
			const voucher = await Voucher.findOne({code: voucherCode, isActive: true});
			// Kiểm tra voucher hợp lệ
			if (!voucher || !voucher.isActive || voucher.quantity <= 0) {
				return res.status(400).json({message: 'Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng'});
			}

			// Kiểm tra thời gian hiệu lực
			const now = new Date();
			if (now < voucher.startDate || now > voucher.endDate) {
				return res.status(400).json({message: 'Mã giảm giá đã hết hạn hoặc chưa bắt đầu'});
			}

			// Kiểm tra giá trị đơn hàng tối thiểu
			if (totalAmount < voucher.minOrderValue) {
				return res.status(400).json({message: `Đơn hàng chưa đạt giá trị tối thiểu ${voucher.minOrderValue} để dùng mã`});
			}

			// Tính số tiền giảm
			if (voucher.discountType === 'fixed') {
				discountAmount = voucher.discountValue;
			} else if (voucher.discountType === 'percent') {
				discountAmount = (voucher.discountValue / 100) * totalAmount;
				if (voucher.maxDiscount) {
					discountAmount = Math.min(discountAmount, voucher.maxDiscount);
				}
			}

			// Cập nhật số lượt dùng và người dùng đã sử dụng voucher
			voucher.quantity -= 1;
			await voucher.save();
			voucherId = voucher._id;
		}

		// Nếu có lỗi ở bước này, nó sẽ nhảy vào catch và không tạo đơn hàng
		await Promise.all(stockUpdatePromises);

		// Sau khi trừ kho thành công, mới tạo đơn hàng
		const order = await Order.create({
			userId,
			shippingAddress,
			items: orderItems,
			totalAmount,
			discountAmount,
			finalAmount: totalAmount - discountAmount,
			voucherId,
			note,
			paymentMethod,
		});

		res.status(201).json(order);
	} catch (error) {
		console.error('Order creation error:', error);
		res.status(500).json({message: 'Tạo đơn hàng thất bại', error: error.message});
	}
};

exports.getUserOrders = async (req, res) => {
	try {
		const orders = await Order.find({userId: req.user._id}).populate('shippingAddress').sort({createdAt: -1});

		res.json(orders);
	} catch (error) {
		res.status(500).json({message: 'Lấy đơn hàng thất bại', error: error.message});
	}
};

exports.getAllOrders = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;
		const status = req.query.status;

		// Nếu có truyền status thì lọc theo, không thì lấy tất cả
		const filter = {};
		if (status) {
			filter.status = status;
		}

		const orders = await Order.find(filter)
			.populate('shippingAddress')
			.populate('userId', 'name email')
			.sort({createdAt: -1})
			.skip(skip)
			.limit(limit);

		const totalItems = await Order.countDocuments(filter);
		const totalPages = Math.ceil(totalItems / limit);

		res.status(200).json({
			orders,
			currentPage: page,
			totalItems,
			totalPages,
		});
	} catch (error) {
		res.status(500).json({
			message: 'Lỗi khi lấy danh sách đơn hàng',
			error: error.message,
		});
	}
};

exports.getOrderById = async (req, res) => {
	try {
		const {id} = req.params;

		const order = await Order.findById(id).populate('userId', 'name email').populate('shippingAddress');

		if (!order) {
			return res.status(404).json({message: 'Không tìm thấy đơn hàng'});
		}

		res.status(200).json(order);
	} catch (error) {
		console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
		res.status(500).json({message: 'Lỗi server', error: error.message});
	}
};

exports.updateStatus = async (req, res) => {
	try {
		const {id} = req.params;
		const {status} = req.body;

		if (!['pending', 'shipping', 'success', 'cancelled'].includes(status)) {
			return res.status(400).json({message: 'Trạng thái không hợp lệ'});
		}

		const order = await Order.findById(id);
		if (!order) return res.status(404).json({message: 'Không tìm thấy đơn hàng'});

		const currentStatus = order.status;
		if (currentStatus === 'success' || currentStatus === 'cancelled') {
			return res.status(400).json({message: `Không thể thay đổi trạng thái của đơn hàng đã ${currentStatus}.`});
		}

		const stockUpdatePromises = [];

		// Logic khi GIAO HÀNG THÀNH CÔNG
		if (status === 'success') {
			// Không làm gì với tồn kho ở đây vì đã trừ lúc tạo đơn
			if (order.paymentMethod === 'cod') {
				order.isPaid = true;
				order.paymentTime = new Date();
			}
		}

		// Logic khi HỦY ĐƠN
		if (status === 'cancelled') {
			for (const item of order.items) {
				// Lấy lại thông tin sản phẩm để đảm bảo dữ liệu mới nhất
				const product = await Product.findById(item.productId);
				if (!product) {
					console.warn(`Product with ID ${item.productId} not found while restocking order ${order._id}`);
					continue; // Bỏ qua nếu sản phẩm đã bị xóa
				}

				// ✅ TÌM LẠI sizeId DỰA TRÊN TÊN SIZE ĐÃ LƯU TRONG ĐƠN HÀNG
				// Đây là cách làm an toàn và đáng tin cậy nhất
				const sizeInfo = product.quantityBySize.find((s) => s.name === item.size);

				if (sizeInfo) {
					const updatePromise = Product.updateOne(
						{_id: item.productId, 'quantityBySize.sizeId': sizeInfo.sizeId},
						{
							$inc: {
								'quantityBySize.$.quantity': item.quantity, // Cộng trả lại kho
								totalSold: -item.quantity,
							},
						}
					);
					stockUpdatePromises.push(updatePromise);
				} else {
					console.warn(`Size "${item.size}" not found for product ${item.productId} while restocking.`);
				}
			}
		}

		// Thực thi tất cả các lệnh cập nhật
		if (stockUpdatePromises.length > 0) {
			await Promise.all(stockUpdatePromises);
		}

		order.status = status;
		await order.save();

		const populatedOrder = await Order.findById(id).populate('shippingAddress');
		res.json(populatedOrder);
	} catch (error) {
		console.error('Update status error:', error);
		res.status(500).json({message: 'Cập nhật trạng thái thất bại', error: error.message});
	}
};

exports.deleteOrder = async (req, res) => {
	try {
		const {id} = req.params;

		// Kiểm tra đơn hàng có tồn tại không
		const order = await Order.findById(id);
		if (!order) {
			return res.status(404).json({message: 'Đơn hàng không tồn tại'});
		}

		await Order.findByIdAndDelete(id);

		res.json({message: 'Xóa đơn hàng thành công'});
	} catch (error) {
		console.error('Delete order error:', error);
		res.status(500).json({message: 'Xóa đơn hàng thất bại', error: error.message});
	}
};

exports.getDashboardStats = async (req, res) => {
	try {
		// Lấy ngày hiện tại
		const todayStart = moment().startOf('day').toDate();
		const todayEnd = moment().endOf('day').toDate();
		const monthStart = moment().startOf('month').toDate();
		const monthEnd = moment().endOf('month').toDate();
		const yearStart = moment().startOf('year').toDate();
		const yearEnd = moment().endOf('year').toDate();

		// Tổng số đơn hàng
		const totalOrders = await Order.countDocuments();

		// Đơn hàng thành công
		const successOrders = await Order.countDocuments({status: 'success'});

		// Đơn hàng bị hủy
		const cancelledOrders = await Order.countDocuments({status: 'cancelled'});

		// Tổng doanh thu (chỉ tính đơn thành công và đã thanh toán)
		const totalRevenueAgg = await Order.aggregate([
			{$match: {status: 'success', isPaid: true}},
			{$group: {_id: null, total: {$sum: '$totalAmount'}}},
		]);
		const totalRevenue = totalRevenueAgg[0]?.total || 0;

		// Doanh thu trong ngày
		const dailyRevenueAgg = await Order.aggregate([
			{
				$match: {
					status: 'success',
					isPaid: true,
					paymentTime: {$gte: todayStart, $lte: todayEnd},
				},
			},
			{$group: {_id: null, total: {$sum: '$totalAmount'}}},
		]);
		const dailyRevenue = dailyRevenueAgg[0]?.total || 0;

		// Doanh thu trong tháng
		const monthlyRevenueAgg = await Order.aggregate([
			{
				$match: {
					status: 'success',
					isPaid: true,
					paymentTime: {$gte: monthStart, $lte: monthEnd},
				},
			},
			{$group: {_id: null, total: {$sum: '$totalAmount'}}},
		]);
		const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

		// Doanh thu trong năm
		const yearlyRevenueAgg = await Order.aggregate([
			{
				$match: {
					status: 'success',
					isPaid: true,
					paymentTime: {$gte: yearStart, $lte: yearEnd},
				},
			},
			{$group: {_id: null, total: {$sum: '$totalAmount'}}},
		]);
		const yearlyRevenue = yearlyRevenueAgg[0]?.total || 0;

		res.json({
			orderStats: {
				totalOrders,
				successOrders,
				cancelledOrders,
			},
			revenueStats: {
				totalRevenue,
				dailyRevenue,
				monthlyRevenue,
				yearlyRevenue,
			},
		});
	} catch (error) {
		console.error('Error fetching dashboard stats:', error);
		res.status(500).json({message: 'Lỗi lấy thống kê dashboard', error: error.message});
	}
};

exports.getRevenueChartData = async (req, res) => {
	try {
		const currentYear = moment().year();

		const monthlyRevenue = await Order.aggregate([
			{
				$match: {
					status: 'success',
					isPaid: true,
					paymentTime: {
						$gte: new Date(`${currentYear}-01-01`),
						$lte: new Date(`${currentYear}-12-31`),
					},
				},
			},
			{
				$group: {
					_id: {$month: '$paymentTime'},
					revenue: {$sum: '$totalAmount'},
				},
			},
			{
				$sort: {_id: 1},
			},
		]);

		// Khởi tạo đầy đủ 12 tháng (kể cả nếu không có doanh thu)
		const result = Array.from({length: 12}, (_, i) => {
			const month = (i + 1).toString().padStart(2, '0');
			const found = monthlyRevenue.find((item) => item._id === i + 1);
			return {
				month,
				revenue: found ? found.revenue : 0,
			};
		});

		res.status(200).json(result);
	} catch (error) {
		console.error('Lỗi lấy dữ liệu biểu đồ doanh thu:', error);
		res.status(500).json({message: 'Lỗi server', error: error.message});
	}
};

// Chart day
exports.getRevenueByDayInMonthCurrentYear = async (req, res) => {
	try {
		const now = moment();
		const currentYear = now.year();
		const currentMonth = now.month(); // 0-based (0 = January)
		const startOfMonth = moment([currentYear, currentMonth]).startOf('month').toDate();
		const endOfMonth = moment([currentYear, currentMonth]).endOf('month').toDate();

		const dailyRevenue = await Order.aggregate([
			{
				$match: {
					status: 'success',
					isPaid: true,
					paymentTime: {$gte: startOfMonth, $lte: endOfMonth},
				},
			},
			{
				$group: {
					// Nhóm theo ngày trong tháng (dayOfMonth)
					_id: {$dayOfMonth: '$paymentTime'},
					revenue: {$sum: '$totalAmount'},
				},
			},
			{$sort: {_id: 1}},
		]);

		const daysInMonth = now.daysInMonth();

		const result = Array.from({length: daysInMonth}, (_, i) => {
			const day = i + 1;
			const found = dailyRevenue.find((item) => item._id === day);
			return {
				day: `Ngày ${day}`,
				revenue: found ? found.revenue : 0,
			};
		});

		res.json(result);
	} catch (error) {
		res.status(500).json({message: 'Lỗi lấy dữ liệu biểu đồ theo ngày trong tháng hiện tại', error: error.message});
	}
};

// Chart year
exports.getRevenueByYear = async (req, res) => {
	try {
		const currentYear = moment().year();
		const startYear = currentYear - 4;

		const yearlyRevenue = await Order.aggregate([
			{
				$match: {
					status: 'success',
					isPaid: true,
					paymentTime: {
						$gte: new Date(`${startYear}-01-01`),
						$lte: new Date(`${currentYear}-12-31`),
					},
				},
			},
			{
				$group: {
					_id: {$year: '$paymentTime'},
					revenue: {$sum: '$totalAmount'},
				},
			},
			{$sort: {_id: 1}},
		]);

		const result = Array.from({length: 5}, (_, i) => {
			const year = startYear + i;
			const found = yearlyRevenue.find((item) => item._id === year);
			return {
				year: `Năm ${year}`,
				revenue: found ? found.revenue : 0,
			};
		});

		res.json(result);
	} catch (error) {
		res.status(500).json({message: 'Lỗi lấy dữ liệu biểu đồ theo năm', error: error.message});
	}
};

exports.createPaymentUrl = async (req, res) => {
	try {
		const {orderId, amount} = req.body;
		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({message: 'Không tìm thấy đơn hàng'});
		}

		const paymentUrl = vnpay.buildPaymentUrl({
			vnp_Amount: amount * 100,
			vnp_IpAddr: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip,
			vnp_TxnRef: orderId,
			vnp_OrderInfo: `Thanh toán ${orderId}`,
			vnp_OrderType: ProductCode.Other,
			vnp_ReturnUrl: process.env.NODE_ENV === 'development' ? process.env.VNP_RETURN_URL_DEV : process.env.VNP_RETURN_URL_PRODUCTION,
			vnp_Locale: VnpLocale.VN,
		});

		console.log('🔗 Redirect đến:', paymentUrl);
		console.log('🔍 TMNCODE đang dùng:', process.env.VNP_TMNCODE);

		res.status(200).json(paymentUrl);
	} catch (err) {
		console.error(err);
		res.status(500).json({message: 'Lỗi tạo URL thanh toán', error: err.message});
	}
};

exports.returnPayment = async (req, res) => {
	try {
		const verify = vnpay.verifyReturnUrl(req.query);

		const {vnp_TxnRef, vnp_ResponseCode} = req.query;

		if (!verify.isVerified) {
			return res.status(400).json({message: 'Dữ liệu không hợp lệ (chữ ký sai)'});
		}

		if (vnp_ResponseCode === '00') {
			const order = await Order.findById(vnp_TxnRef);

			if (!order) {
				return res.status(404).json({message: 'Không tìm thấy đơn hàng'});
			}

			if (!order.isPaid) {
				order.isPaid = true;
				order.paymentMethod = 'vnpay';
				order.paymentTime = new Date();
				await order.save();
			}

			return res.redirect(`http://localhost:3000/payment?orderId=${vnp_TxnRef}&vnp_ResponseCode=${vnp_ResponseCode}`);
		} else {
			return res.redirect(`http://localhost:3000/payment?orderId=${vnp_TxnRef}&vnp_ResponseCode=${vnp_ResponseCode}`);
		}
	} catch (error) {
		console.error('Lỗi xử lý returnPayment:', error);
		return res.status(500).json({message: 'Lỗi máy chủ khi xử lý thanh toán', error: error.message});
	}
};

// Transaction history
exports.getOrderHistory = async (req, res) => {
	try {
		const userId = req.user._id;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const {status, isPaid, paymentMethod, sort = 'desc'} = req.query;

		const query = {userId};

		if (status) query.status = status;
		if (isPaid === 'true') query.isPaid = true;
		if (isPaid === 'false') query.isPaid = false;
		if (paymentMethod) query.paymentMethod = paymentMethod;

		const [orders, total] = await Promise.all([
			Order.find(query)
				.sort({createdAt: sort === 'asc' ? 1 : -1})
				.skip(skip)
				.limit(limit)
				.populate('shippingAddress')
				.populate('voucherId')
				.lean(),
			Order.countDocuments(query),
		]);

		res.status(200).json({
			orders,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
			total,
		});
	} catch (error) {
		console.error('Lỗi lấy lịch sử đơn hàng:', error);
		res.status(500).json({message: 'Lấy lịch sử giao dịch thất bại', error: error.message});
	}
};
