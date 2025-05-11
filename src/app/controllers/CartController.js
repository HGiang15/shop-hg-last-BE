const Cart = require('../models/Cart');
const generateCartToken = require('../../utils/generateCartToken');
const Color = require('../models/Color');
const Size = require('../models/Size');

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

	const cart = await Cart.findOne(identifier);
	if (!cart) return res.status(404).json({message: 'Cart not found'});

	const item = cart.items.id(itemId);
	if (!item) return res.status(404).json({message: 'Item not found'});

	item.quantity = quantity;
	await cart.save();
	res.json(cart);
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

exports.mergeCart = async (req, res) => {
	const userId = req.user.id;
	const cartToken = req.cookies.cartToken;

	if (!cartToken) {
		return res.status(400).json({message: 'No guest cart to merge'});
	}

	try {
		const guestCart = await Cart.findOne({cartToken});
		let userCart = await Cart.findOne({userId});

		// Nếu không có giỏ người dùng, tạo mới
		if (!userCart) {
			userCart = new Cart({userId, items: []});
		}

		if (guestCart) {
			for (const guestItem of guestCart.items) {
				const existing = userCart.items.find(
					(item) =>
						item.productId.toString() === guestItem.productId.toString() &&
						item.sizeId?.toString() === guestItem.sizeId?.toString()
				);

				if (existing) {
					existing.quantity += guestItem.quantity;
				} else {
					userCart.items.push(guestItem);
				}
			}

			await userCart.save();
			await guestCart.deleteOne(); // Xoá giỏ khách
			res.clearCookie('cartToken'); // Xoá cookie
			return res.json({message: 'Cart merged successfully'});
		}

		// Không có giỏ khách, chỉ trả về giỏ người dùng
		await userCart.save();
		return res.json({message: 'No guest cart found, user cart ready'});
	} catch (err) {
		console.error(err);
		res.status(500).json({message: 'Error merging cart'});
	}
};
