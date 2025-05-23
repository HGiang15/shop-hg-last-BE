const Order = require('../models/Order');
const Product = require('../models/Product');

exports.createOrder = async (req, res) => {
	try {
		const {shippingAddress, items} = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({message: 'Danh sách sản phẩm không hợp lệ'});
		}

		// Lấy danh sách productId để fetch từ DB
		const productIds = items.map((item) => item.productId);
		const products = await Product.find({_id: {$in: productIds}});

		// Map productId => product data
		const productMap = {};
		products.forEach((product) => {
			productMap[product._id] = product;
		});

		// Xây dựng lại danh sách items an toàn
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
				price: product.price, // Lấy từ DB chứ không dùng client
			};
		});

		const totalAmount = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

		const order = await Order.create({
			userId: req.user._id,
			shippingAddress,
			items: orderItems,
			totalAmount,
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

// Chắc cái này bên admin thôi
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

exports.deleteOrder = async (req, res) => {
	try {
		const {id} = req.params;

		// Kiểm tra đơn hàng có tồn tại không
		const order = await Order.findById(id);
		if (!order) {
			return res.status(404).json({message: 'Đơn hàng không tồn tại'});
		}

		// Chỉ cho phép người sở hữu đơn hoặc admin xóa (nếu có logic admin thì check thêm ở đây)
		// Ví dụ: nếu bạn có req.user.role thì có thể kiểm tra quyền ở đây
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
