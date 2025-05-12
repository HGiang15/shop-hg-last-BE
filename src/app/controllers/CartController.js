const Cart = require('../models/Cart');
const generateCartToken = require('../../utils/generateCartToken');
const Color = require('../models/Color');
const Size = require('../models/Size');
const Product = require('../models/Product');

exports.getAllCart = async (req, res) => {
	const cartToken = req.cookies.cartToken;
	const user = req.user;

	const identifier = user ? {userId: user.id} : {cartToken};
	const cart = await Cart.findOne(identifier).populate('items.productId').populate('items.sizeId');

	res.json(cart || {items: []});
};

exports.addToCart = async (req, res) => {
	const {productId, quantity, sizeId} = req.body;
	console.log('Add to cart body:', req.body);

	const user = req.user;
	let cartToken = req.cookies.cartToken;

	if (!user && !cartToken) {
		cartToken = generateCartToken();
		res.cookie('cartToken', cartToken, {
			httpOnly: true,
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});
	}

	const identifier = user ? {userId: user.id} : {cartToken};
	let cart = await Cart.findOne(identifier);
	if (!cart) cart = new Cart({...identifier, items: []});

	const existingItem = cart.items.find((item) => item.productId.toString() === productId && item.sizeId?.toString() === sizeId);

	if (existingItem) {
		existingItem.quantity += quantity;
	} else {
		let sizeName = '';
		if (sizeId) {
			const size = await Size.findById(sizeId);
			sizeName = size?.name || '';
		}

		cart.items.push({productId, quantity, sizeId, sizeName});
	}

	await cart.save();
	const populatedCart = await Cart.findOne(identifier).populate('items.productId').populate('items.sizeId');

	res.json(populatedCart);
};

exports.updateItem = async (req, res) => {
	const {itemId, quantity} = req.body;
	const identifier = req.user ? {userId: req.user.id} : {cartToken: req.cookies.cartToken};

	if (quantity <= 0) {
		return res.status(400).json({message: 'Số lượng phải lớn hơn 0'});
	}

	// Tìm giỏ hàng dựa trên userId hoặc cartToken
	const cart = await Cart.findOne(identifier);
	if (!cart) return res.status(404).json({message: 'Giỏ hàng không tồn tại'});

	// Tìm sản phẩm trong giỏ hàng
	const item = cart.items.id(itemId);
	if (!item) return res.status(404).json({message: 'Món hàng không tìm thấy'});

	// Cập nhật số lượng sản phẩm trong giỏ hàng
	item.quantity = quantity;
	await cart.save();

	// Tính lại tổng tiền cho món hàng
	const updatedItem = cart.items.id(itemId);
	const product = await Product.findById(updatedItem.productId); // Lấy thông tin sản phẩm
	const itemTotal = product.price * updatedItem.quantity; // Tổng tiền của món hàng

	// Tính tổng tiền của giỏ hàng
	const totalAmount = cart.items.reduce((sum, item) => {
		const product = item.productId;
		return sum + product.price * item.quantity;
	}, 0);

	// Trả về thông tin món hàng đã cập nhật và tổng tiền
	res.json({
		item: {
			_id: updatedItem._id,
			productId: updatedItem.productId,
			quantity: updatedItem.quantity,
			sizeId: updatedItem.sizeId,
			sizeName: updatedItem.sizeName,
			price: product.price,
			totalAmount: itemTotal, // Tổng tiền của món hàng
		},
		cartTotal: totalAmount, // Tổng giỏ hàng
	});
};

exports.removeItem = async (req, res) => {
	const {itemId} = req.params;
	const identifier = req.user ? {userId: req.user.id} : {cartToken: req.cookies.cartToken};

	const cart = await Cart.findOne(identifier);
	if (!cart) return res.status(404).json({message: 'Cart not found'});

	cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
	await cart.save();
	res.json(cart);
};

// Merge giỏ hàng từ khách và người dùng sau khi đăng nhập
exports.mergeCart = async (req, res) => {
	const userId = req.user.id; // Lấy ID người dùng đã đăng nhập
	const localItems = req.body.localItems || []; // Lấy giỏ hàng từ frontend (localItems)

	try {
		// Tìm giỏ hàng của người dùng
		let userCart = await Cart.findOne({userId});

		// Nếu không có giỏ hàng của người dùng, tạo mới
		if (!userCart) {
			userCart = new Cart({userId, items: []});
		}

		// Duyệt qua các item trong giỏ hàng của khách (localItems) và merge vào giỏ hàng người dùng
		for (const guestItem of localItems) {
			// Kiểm tra xem item đã có trong giỏ người dùng chưa
			const existing = userCart.items.find(
				(item) =>
					item.productId.toString() === guestItem.productId.toString() && item.sizeId?.toString() === guestItem.sizeId?.toString()
			);

			// Nếu đã có, cộng số lượng
			if (existing) {
				existing.quantity += guestItem.quantity;
			} else {
				// Nếu chưa có, thêm item mới vào giỏ
				userCart.items.push(guestItem);
			}
		}

		// Lưu giỏ hàng người dùng sau khi merge
		await userCart.save();

		// Xoá giỏ khách nếu có
		if (req.cookies.cartToken) {
			await Cart.deleteOne({cartToken: req.cookies.cartToken}); // Xoá cart khách
			res.clearCookie('cartToken'); // Clear cookie cartToken
		}

		return res.json({message: 'Cart merged successfully'});
	} catch (err) {
		console.error(err);
		return res.status(500).json({message: 'Error merging cart'});
	}
};
