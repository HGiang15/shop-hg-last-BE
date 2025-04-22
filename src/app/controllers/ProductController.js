const Product = require('./../models/Product');
const fs = require('fs').promises;
const path = require('path');
const BASE_URL = 'http://localhost:3003/uploads/';

// Create
exports.createProduct = async (req, res) => {
	try {
		const {code, name, category, colors, quantityBySize, price, description, detailDescription} = req.body;

		// Chuyển đổi quantityBySize từ string sang number
		let convertedQuantityBySize = {};
		if (quantityBySize && typeof quantityBySize === 'object') {
			Object.keys(quantityBySize).forEach((size) => {
				convertedQuantityBySize[size] = Number(quantityBySize[size]);
			});
		}

		// Lấy danh sách tên file ảnh
		const images = req.files?.map((file) => file.filename) || [];

		const product = new Product({
			code,
			name,
			category,
			colors,
			quantityBySize: convertedQuantityBySize,
			price,
			images,
			description,
			detailDescription,
		});

		await product.save();

		res.status(201).json({
			message: 'Tạo sản phẩm thành công',
			data: {
				...product.toObject(), // Convert to plain object to include uuid
				images: product.images.map((img) => BASE_URL + img), // Include full image URLs
			},
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({error: error.message});
	}
};

// Get all
exports.getAllProduct = async (req, res) => {
	try {
		let products = await Product.find({});

		// Thêm đường dẫn đầy đủ cho ảnh
		products = products.map((product) => {
			const productObject = product.toObject();
			return {
				...productObject,
				images: productObject.images.map((img) => BASE_URL + img),
				uuid: productObject.uuid, // Include uuid in the response
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
		const {code, name, category, colors, quantityBySize, price, description, detailDescription} = req.body;

		// Chuyển đổi quantityBySize từ string sang number
		let convertedQuantityBySize = {};
		if (quantityBySize && typeof quantityBySize === 'object') {
			Object.keys(quantityBySize).forEach((size) => {
				convertedQuantityBySize[size] = Number(quantityBySize[size]);
			});
		}

		// Nếu có ảnh mới thì lấy tên file ảnh
		const images = req.files?.map((file) => file.filename);

		// Tạo đối tượng dữ liệu cần cập nhật
		const updateData = {
			code,
			name,
			category,
			colors,
			quantityBySize: convertedQuantityBySize,
			price,
			description,
			detailDescription,
		};

		// Nếu có ảnh mới thì cập nhật lại
		if (images && images.length > 0) {
			updateData.images = images;
		}

		// Tìm và cập nhật sản phẩm theo ID
		const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {new: true});

		if (!updatedProduct) {
			return res.status(404).json({message: 'Không tìm thấy sản phẩm để cập nhật'});
		}

		res.status(200).json({
			message: 'Cập nhật sản phẩm thành công',
			data: updatedProduct,
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
