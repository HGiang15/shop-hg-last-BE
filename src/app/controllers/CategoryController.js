const Category = require('./../models/Category');
const fs = require('fs').promises;
const BASE_URL = 'http://localhost:3003/uploads/';

// Create
exports.createCategory = async (req, res) => {
	try {
		const {name} = req.body;
		const image = req.file?.filename;

		if (!image) {
			return res.status(400).json({message: 'Vui lòng chọn ảnh danh mục'});
		}

		const category = new Category({name, image});
		await category.save();

		res.status(201).json({
			message: 'Tạo danh mục thành công',
			data: {
				...category.toObject(),
				image: BASE_URL + category.image,
			},
		});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

// Get All
exports.getAllCategories = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 5;
		const skip = (page - 1) * limit;

		const totalItems = await Category.countDocuments();
		const totalPages = Math.ceil(totalItems / limit);

		const categories = await Category.find().sort({createdAt: -1}).skip(skip).limit(limit);

		const result = categories.map((c) => ({
			...c.toObject(),
			image: BASE_URL + c.image,
		}));

		res.status(200).json({
			categories: result,
			currentPage: page,
			totalPages,
			totalItems,
		});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

// Get by id
exports.getCategoryById = async (req, res) => {
	try {
		const category = await Category.findById(req.params.id);
		if (!category) return res.status(404).json({message: 'Không tìm thấy danh mục'});

		res.status(200).json({
			...category.toObject(),
			image: BASE_URL + category.image,
		});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

exports.getCategoryByName = async (req, res) => {
	try {
		const {name} = req.params;

		const category = await Category.findOne({name: name});
		if (!category) {
			return res.status(404).json({message: 'Không tìm thấy danh mục'});
		}

		res.status(200).json({
			...category.toObject(),
			image: BASE_URL + category.image,
		});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

// Update
exports.updateCategory = async (req, res) => {
	try {
		const {name} = req.body;
		const image = req.file?.filename;

		const category = await Category.findById(req.params.id);
		if (!category) return res.status(404).json({message: 'Không tìm thấy danh mục'});

		// Nếu có ảnh mới, xoá ảnh cũ
		if (image && category.image) {
			await fs.unlink(`./src/uploads/${category.image}`).catch(() => {});
		}

		category.name = name || category.name;
		if (image) category.image = image;

		await category.save();

		res.status(200).json({
			message: 'Cập nhật danh mục thành công',
			data: {
				...category.toObject(),
				image: BASE_URL + category.image,
			},
		});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

// Delete
exports.deleteCategory = async (req, res) => {
	try {
		const category = await Category.findByIdAndDelete(req.params.id);
		if (!category) return res.status(404).json({message: 'Không tìm thấy danh mục để xoá'});

		await fs.unlink(`./src/uploads/${category.image}`).catch(() => {});

		res.status(200).json({message: 'Xoá danh mục thành công', data: category});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};
