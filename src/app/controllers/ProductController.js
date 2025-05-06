const Product = require('./../models/Product');
const fs = require('fs').promises;
const path = require('path');
const BASE_URL = 'http://localhost:3003/uploads/';

// Create
exports.createProduct = async (req, res) => {
	try {
		const {code, name, category, colors, price, description, detailDescription, isFeatured} = req.body;
		const quantityBySizeString = req.body.quantityBySize;
		let quantityBySize = {}; // Parse quantityBySize từ chuỗi JSON nếu nó tồn tại

		if (quantityBySizeString) {
			try {
				quantityBySize = JSON.parse(quantityBySizeString); // Chuyển đổi giá trị sang Number sau khi parse
				Object.keys(quantityBySize).forEach((size) => {
					quantityBySize[size] = Number(quantityBySize[size]);
				});
			} catch (error) {
				console.error('Lỗi parse quantityBySize:', error);
				return res.status(400).json({message: 'Dữ liệu quantityBySize không hợp lệ'});
			}
		}

		const images = req.files?.map((file) => file.filename) || [];

		const product = new Product({
			code,
			name,
			category,
			colors,
			quantityBySize: quantityBySize,
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
				...product.toObject(), // Convert to plain object
				images: product.images.map((img) => BASE_URL + img), // Include full image URLs
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
		let products = await Product.find({});

		// Thêm đường dẫn đầy đủ cho ảnh
		products = products.map((product) => {
			const productObject = product.toObject();
			return {
				...productObject,
				images: productObject.images.map((img) => BASE_URL + img),
			};
		});

		res.status(200).json(products);
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Get by id
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

// Update by id
exports.updateProduct = async (req, res) => {
	try {
		const {id} = req.params;
		const {code, name, category, colors, quantityBySize, price, description, detailDescription, oldImages, isFeatured} = req.body;

		// Lấy sản phẩm cũ từ DB
		const existingProduct = await Product.findById(id);
		if (!existingProduct) {
			return res.status(404).json({message: 'Không tìm thấy sản phẩm để cập nhật'});
		}

		// Parse colors
		let parsedColors = [];
		if (Array.isArray(colors)) parsedColors = colors;
		else if (typeof colors === 'string') parsedColors = [colors];

		// Parse quantityBySize
		let convertedQuantityBySize = {};
		if (quantityBySize) {
			const parsed = typeof quantityBySize === 'string' ? JSON.parse(quantityBySize) : quantityBySize;
			Object.keys(parsed).forEach((size) => {
				convertedQuantityBySize[size] = Number(parsed[size]);
			});
		}

		// Parse oldImages
		let retainedImages = [];
		if (oldImages) {
			retainedImages = typeof oldImages === 'string' ? JSON.parse(oldImages) : oldImages;
			retainedImages = retainedImages.map((img) => img.split('/').pop());
		}

		const newImages = req.files?.map((file) => file.filename) || [];

		// Gộp ảnh cũ còn giữ lại + ảnh mới
		const finalImages = [...retainedImages, ...newImages];

		const updateData = {
			code,
			name,
			category,
			colors: parsedColors,
			quantityBySize: convertedQuantityBySize,
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

// Filter Products
exports.filterProducts = async (req, res) => {
	try {
		const {category, colors, minPrice, maxPrice, size, isFeatured, keyword, sortBy, sortOrder, page = 1, limit = 10} = req.query;

		let filter = {};

		if (category) filter.category = category;

		if (colors) {
			if (Array.isArray(colors)) {
				filter.colors = {$in: colors};
			} else if (typeof colors === 'string') {
				filter.colors = {$in: colors.split(',')};
			}
		}

		if (minPrice || maxPrice) {
			filter.price = {};
			if (minPrice) filter.price.$gte = Number(minPrice);
			if (maxPrice) filter.price.$lte = Number(maxPrice);
		}

		if (size) filter[`quantityBySize.${size}`] = {$gt: 0};

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

		res.status(200).json({
			total,
			page: Number(page),
			totalPages: Math.ceil(total / limit),
			products,
		});
	} catch (error) {
		res.status(500).json({error: error.message});
	}
};
