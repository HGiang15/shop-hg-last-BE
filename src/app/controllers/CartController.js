const Cart = require('../models/Cart');
const generateCartToken = require('../../utils/generateCartToken');
const Color = require('../models/Color');
const Size = require('../models/Size');
const Product = require('../models/Product');

exports.getAllCart = async (req, res) => {
	const identifier = req.user ? {userId: req.user.id} : {cartToken: req.cookies.cartToken};

	const cart = await Cart.findOne(identifier)
		.populate({path: 'items.productId', select: '-quantityBySize'})
		.populate({path: 'items.sizeId', select: 'name'});

	res.json(cart || {items: []});
};

exports.addToCart = async (req, res) => {
	const {productId, quantity, sizeId} = req.body;
	const user = req.user;
	let cartToken = req.cookies.cartToken;

	try {
		// --- Tìm hoặc tạo giỏ hàng ---
		let identifier = user ? {userId: user.id} : {cartToken};
		if (!user && !cartToken) {
			const newCartToken = generateCartToken();
			res.cookie('cartToken', newCartToken, {httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000});
			identifier.cartToken = newCartToken;
		}

		let cart = await Cart.findOne(identifier);
		if (!cart) cart = new Cart({...identifier, items: []});

		// --- Logic tìm và cộng dồn số lượng ---
		const existingItem = cart.items.find((item) => item.productId.equals(productId) && item.sizeId.equals(sizeId));

		if (existingItem) {
			existingItem.quantity += quantity;
		} else {
			cart.items.push({productId, quantity, sizeId});
		}

		await cart.save();
		const populatedCart = await Cart.findOne(identifier).populate('items.productId').populate('items.sizeId');
		res.json(populatedCart);
	} catch (error) {
		console.error('Add to cart error:', error);
		res.status(500).json({message: 'Lỗi hệ thống khi thêm vào giỏ hàng.'});
	}
};

exports.updateItem = async (req, res) => {
	const {itemId, quantity} = req.body;
	const identifier = req.user ? {userId: req.user.id} : {cartToken: req.cookies.cartToken};

	if (quantity <= 0) {
		// Nếu số lượng <= 0, ta coi như là xóa sản phẩm đó
		return exports.removeItem(req, res); // Gọi hàm removeItem để xử lý
	}

	try {
		const cart = await Cart.findOneAndUpdate({...identifier, 'items._id': itemId}, {$set: {'items.$.quantity': quantity}}, {new: true})
			.populate('items.productId')
			.populate('items.sizeId');

		if (!cart) {
			return res.status(404).json({message: 'Món hàng không tìm thấy trong giỏ'});
		}

		res.json(cart);
	} catch (error) {
		console.error('Update item error:', error);
		res.status(500).json({message: 'Lỗi hệ thống khi cập nhật giỏ hàng.'});
	}
};

exports.removeItem = async (req, res) => {
	const {itemId} = req.params;
	const identifier = req.user ? {userId: req.user.id} : {cartToken: req.cookies.cartToken};

	try {
		const cart = await Cart.findOneAndUpdate(
			identifier,
			{$pull: {items: {_id: itemId}}}, // Dùng $pull để xóa item khỏi mảng
			{new: true}
		)
			.populate('items.productId')
			.populate('items.sizeId');

		if (!cart) {
			return res.status(404).json({message: 'Giỏ hàng không tìm thấy'});
		}

		res.json(cart);
	} catch (error) {
		console.error('Remove item error:', error);
		res.status(500).json({message: 'Lỗi hệ thống khi xóa sản phẩm.'});
	}
};

// Merge giỏ hàng từ khách và người dùng sau khi đăng nhập
exports.mergeCart = async (req, res) => {
	const userId = req.user._id;
	const cartToken = req.cookies.cartToken;

	if (!cartToken) {
		return res.status(200).json({message: 'No guest cart to merge.', cart: null});
	}

	try {
		const guestCart = await Cart.findOne({cartToken});
		let userCart = await Cart.findOne({userId});

		if (!guestCart || guestCart.items.length === 0) {
			if (guestCart) {
				await Cart.deleteOne({cartToken});
			}
			res.clearCookie('cartToken');
			return res.json({message: 'Guest cart is empty, nothing to merge.', cart: userCart});
		}

		if (!userCart) {
			guestCart.userId = userId;
			guestCart.cartToken = null;
			await guestCart.save();
			res.clearCookie('cartToken');

			const populatedCart = await Cart.findById(guestCart._id)
				.populate({path: 'items.productId'})
				.populate({path: 'items.sizeId', select: 'name'});
			return res.json({message: 'Guest cart assigned to user successfully.', cart: populatedCart});
		}

		for (const guestItem of guestCart.items) {
			const existingItem = userCart.items.find(
				(item) =>
					item.productId.toString() === guestItem.productId.toString() && item.sizeId?.toString() === guestItem.sizeId?.toString()
			);

			if (existingItem) {
				existingItem.quantity += guestItem.quantity;
			} else {
				userCart.items.push({
					productId: guestItem.productId,
					sizeId: guestItem.sizeId,
					quantity: guestItem.quantity,
				});
			}
		}

		await userCart.save();

		await Cart.deleteOne({cartToken});
		res.clearCookie('cartToken');

		const populatedCart = await Cart.findOne({userId})
			.populate({path: 'items.productId'})
			.populate({path: 'items.sizeId', select: 'name'});

		res.json({message: 'Carts merged successfully', cart: populatedCart});
	} catch (err) {
		return res.status(500).json({message: 'Error merging cart'});
	}
};
