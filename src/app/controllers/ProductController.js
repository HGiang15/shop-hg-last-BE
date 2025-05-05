const Product = require('./../models/Product');
const fs = require('fs').promises;
const path = require('path');
const BASE_URL = 'http://localhost:3003/uploads/';

// Create
exports.createProduct = async (req, res) => {
	try {
		const {code, name, category, colors, price, description, detailDescription} = req.body;
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
		const {code, name, category, colors, quantityBySize, price, description, detailDescription, oldImages} = req.body;

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
