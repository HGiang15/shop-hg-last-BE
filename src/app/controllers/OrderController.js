const Order = require('../models/Order');
const Product = require('../models/Product');
const moment = require('moment');
const config = require('../../config/vnpay.config');

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
		const {shippingAddress, items, note = ''} = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({message: 'Danh sách sản phẩm không hợp lệ'});
		}

		const productIds = items.map((item) => item.productId);
		const products = await Product.find({_id: {$in: productIds}});

		const productMap = {};
		products.forEach((product) => {
			productMap[product._id] = product;
		});

		const orderItems = items.map((item) => {
			const product = productMap[item.productId];
			if (!product) {
				throw new Error(`Không tìm thấy sản phẩm với ID: ${item.productId}`);
			}

			return {
				productId: item.productId,
				name: item.name || product.name,
				image: product.images?.[0] || '',
				color: item.color || '',
				size: item.size || '',
				quantity: item.quantity,
				price: product.price,
			};
		});

		const totalAmount = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

		const order = await Order.create({
			userId: req.user._id,
			shippingAddress,
			items: orderItems,
			totalAmount,
			note,
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

		const updated = await Order.findByIdAndUpdate(id, {status}, {new: true}).populate('shippingAddress');

		res.json(updated);
	} catch (error) {
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

		if (order.userId.toString() !== req.user._id.toString()) {
			return res.status(403).json({message: 'Bạn không có quyền xóa đơn hàng này'});
		}

		await Order.findByIdAndDelete(id);

		res.json({message: 'Xóa đơn hàng thành công'});
	} catch (error) {
		console.error('Delete order error:', error);
		res.status(500).json({message: 'Xóa đơn hàng thất bại', error: error.message});
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
			vnp_ReturnUrl: process.env.VNP_RETURN_URL,
			vnp_Locale: VnpLocale.VN,
		});

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
