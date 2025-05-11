const Product = require('./../models/Product');
const fs = require('fs').promises;
const path = require('path');
const BASE_URL = 'http://localhost:3003/uploads/';

// Create
exports.createProduct = async (req, res) => {
	try {
		const {code, name, category, colors, price, description, detailDescription, isFeatured} = req.body;

		const quantityBySizeString = req.body.quantityBySize;

		let parsedCategory = {};
		let parsedColors = [];
		let parsedQuantityBySize = [];

		try {
			parsedCategory = typeof category === 'string' ? JSON.parse(category) : category;
			parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
			parsedQuantityBySize = typeof quantityBySizeString === 'string' ? JSON.parse(quantityBySizeString) : quantityBySizeString;
		} catch (error) {
			return res.status(400).json({message: 'Dữ liệu đầu vào không hợp lệ (category/colors/quantityBySize)'});
		}

		parsedQuantityBySize = parsedQuantityBySize.map((item) => ({
			...item,
			quantity: Number(item.quantity),
		}));

		const images = req.files?.map((file) => file.filename) || [];

		const product = new Product({
			code,
			name,
			category: parsedCategory,
			colors: parsedColors,
			quantityBySize: parsedQuantityBySize,
			price,
			images,
			description,
			detailDescription,
			isFeatured: isFeatured === 'true' || isFeatured === true,
		});

		await product.save();

		res.status(201).json({
			message: 'Tạo sản phẩm thành công',
			data: {
				...product.toObject(),
				images: product.images.map((img) => BASE_URL + img),
			},
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({error: error.message});
	}
};

// Get all
exports.getAllProducts = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 5;
		const skip = (page - 1) * limit;

		const products = await Product.find({}).skip(skip).limit(limit);
		const totalItems = await Product.countDocuments({});
		const totalPages = Math.ceil(totalItems / limit);

		const productsWithImages = products.map((product) => {
			const productObject = product.toObject();
			return {
				...productObject,
				images: productObject.images.map((img) => BASE_URL + img),
			};
		});

		res.status(200).json({
			products: productsWithImages,
			currentPage: page,
			totalItems,
			totalPages,
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Get by ID
exports.getProductById = async (req, res) => {
	try {
		const {id} = req.params;
		const product = await Product.findById(id);

		if (!product) return res.status(404).json({message: 'Không tìm thấy sản phẩm'});

		res.status(200).json(product);
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Update
exports.updateProduct = async (req, res) => {
	try {
		const {id} = req.params;
		const {code, name, category, colors, quantityBySize, price, description, detailDescription, oldImages, isFeatured} = req.body;

		const existingProduct = await Product.findById(id);
		if (!existingProduct) {
			return res.status(404).json({message: 'Không tìm thấy sản phẩm để cập nhật'});
		}

		let parsedCategory = {};
		let parsedColors = [];
		let parsedQuantityBySize = [];

		try {
			parsedCategory = typeof category === 'string' ? JSON.parse(category) : category;
			parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
			parsedQuantityBySize = typeof quantityBySize === 'string' ? JSON.parse(quantityBySize) : quantityBySize;
		} catch (error) {
			return res.status(400).json({message: 'Dữ liệu đầu vào không hợp lệ'});
		}

		parsedQuantityBySize = parsedQuantityBySize.map((item) => ({
			...item,
			quantity: Number(item.quantity),
		}));

		let retainedImages = [];
		if (oldImages) {
			retainedImages = typeof oldImages === 'string' ? JSON.parse(oldImages) : oldImages;
			retainedImages = retainedImages.map((img) => img.split('/').pop());
		}
		const newImages = req.files?.map((file) => file.filename) || [];
		const finalImages = [...retainedImages, ...newImages];

		const updateData = {
			code,
			name,
			category: parsedCategory,
			colors: parsedColors,
			quantityBySize: parsedQuantityBySize,
			price,
			description,
			detailDescription,
			images: finalImages,
			isFeatured: isFeatured === 'true' || isFeatured === true,
		};

		const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {new: true});

		res.status(200).json({
			message: 'Cập nhật sản phẩm thành công',
			data: {
				...updatedProduct.toObject(),
				images: updatedProduct.images.map((img) => BASE_URL + img),
			},
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({message: error.message});
	}
};

// Delete one
exports.deleteProduct = async (req, res) => {
	try {
		const {id} = req.params;
		const deletedProduct = await Product.findByIdAndDelete(id);

		if (!deletedProduct) {
			return res.status(404).json({message: 'Không tìm thấy sản phẩm để xóa'});
		}

		res.status(200).json({message: 'Xóa sản phẩm thành công', deletedProduct});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Delete many
exports.deleteMultipleProducts = async (req, res) => {
	try {
		const {ids} = req.body;

		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({message: 'Vui lòng cung cấp mảng ID cần xóa'});
		}

		const result = await Product.deleteMany({_id: {$in: ids}});

		res.status(200).json({
			message: `Đã xóa ${result.deletedCount} sản phẩm`,
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Featured
exports.getFeaturedProducts = async (req, res) => {
	try {
		let products = await Product.find({isFeatured: true});

		products = products.map((product) => {
			const obj = product.toObject();
			return {
				...obj,
				images: obj.images.map((img) => BASE_URL + img),
			};
		});

		res.status(200).json(products);
	} catch (error) {
		console.error(error);
		res.status(500).json({message: error.message});
	}
};

// Filter
exports.filterProducts = async (req, res) => {
	try {
		const {category, colors, minPrice, maxPrice, size, isFeatured, keyword, sortBy, sortOrder, page = 1, limit = 10} = req.query;

		let filter = {};

		if (category) {
			const categoryArray = Array.isArray(category)
				? category
				: typeof category === 'string' && category.includes(',')
				? category.split(',')
				: [category];

			filter['category.categoryId'] = {$in: categoryArray};
		}

		if (colors) {
			const colorsArray = Array.isArray(colors)
				? colors
				: typeof colors === 'string' && colors.includes(',')
				? colors.split(',')
				: [colors];

			filter['colors.colorId'] = {$in: colorsArray};
		}

		if (minPrice || maxPrice) {
			filter.price = {};
			if (minPrice) filter.price.$gte = Number(minPrice);
			if (maxPrice) filter.price.$lte = Number(maxPrice);
		}

		if (size) {
			filter.quantityBySize = {
				$elemMatch: {
					sizeId: size,
					quantity: {$gt: 0},
				},
			};
		}

		if (isFeatured) filter.isFeatured = isFeatured === 'true';

		if (keyword) {
			const regex = new RegExp(keyword, 'i');
			filter.$or = [{name: regex}, {code: regex}];
		}

		let sort = {};
		if (sortBy === 'price' || sortBy === 'createdAt') {
			sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
		}

		const skip = (Number(page) - 1) * Number(limit);
		const total = await Product.countDocuments(filter);
		const products = await Product.find(filter).sort(sort).skip(skip).limit(Number(limit));

		const productsWithImages = products.map((product) => {
			const obj = product.toObject();
			return {
				...obj,
				images: obj.images.map((img) => BASE_URL + img),
			};
		});

		res.status(200).json({
			total,
			page: Number(page),
			totalPages: Math.ceil(total / limit),
			products: productsWithImages,
		});
	} catch (error) {
		res.status(500).json({error: error.message});
	}
};
