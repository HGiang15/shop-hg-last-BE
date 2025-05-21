const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
	try {
		const {shippingAddress, items} = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({message: 'Danh sách sản phẩm không hợp lệ'});
		}

		const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

		const order = await Order.create({
			userId: req.user._id,
			shippingAddress,
			items,
			totalAmount,
		});

		res.status(201).json(order);
	} catch (error) {
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

// Chắc cái này bên admin thôi
exports.getAllOrders = async (req, res) => {
	try {
		const orders = await Order.find().populate('shippingAddress').populate('userId', 'name email').sort({createdAt: -1});

		res.json(orders);
	} catch (error) {
		res.status(500).json({message: 'Lỗi khi lấy danh sách đơn hàng', error: error.message});
	}
};

exports.updateStatus = async (req, res) => {
	try {
		const {id} = req.params;
		const {status} = req.body;

		if (!['pending', 'shipping', 'delivered', 'cancelled'].includes(status)) {
			return res.status(400).json({message: 'Trạng thái không hợp lệ'});
		}

		const updated = await Order.findByIdAndUpdate(id, {status}, {new: true}).populate('shippingAddress');

		res.json(updated);
	} catch (error) {
		res.status(500).json({message: 'Cập nhật trạng thái thất bại', error: error.message});
	}
};
