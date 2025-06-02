const Category = require('../models/Category');
const Size = require('./../models/Size');

// Create
exports.createSize = async (req, res) => {
	try {
		const {name, description} = req.body;

		if (!name) {
			return res.status(400).json({message: 'Vui lòng nhập tên kích cỡ'});
		}

		const newSize = new Size({name, description});
		await newSize.save();

		res.status(201).json({message: 'Tạo kích cỡ thành công', data: newSize});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

exports.getSizesByCategory = async (req, res) => {
	try {
		const {categoryId} = req.params;

		const category = await Category.findById(categoryId).populate('sizes');

		if (!category) {
			return res.status(404).json({message: 'Không tìm thấy danh mục'});
		}

		res.status(200).json({sizes: category.sizes});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Get all sizes with search, sort, pagination
exports.getAllSizes = async (req, res) => {
	try {
		const {page = 1, limit = 5, sort = 'newest', search = ''} = req.query;

		const pageNumber = parseInt(page, 10);
		const limitNumber = parseInt(limit, 10);
		const skip = (pageNumber - 1) * limitNumber;

		// Tìm kiếm theo tên ko phân biệt hoa thường
		const query = {
			name: {$regex: search, $options: 'i'},
		};

		// Xử lý sort
		let sortOption = {};
		if (sort === 'newest') sortOption = {createdAt: -1};
		else if (sort === 'oldest') sortOption = {createdAt: 1};
		else if (sort === 'name_asc') sortOption = {name: 1};
		else if (sort === 'name_desc') sortOption = {name: -1};

		const totalItems = await Size.countDocuments(query);
		const totalPages = Math.ceil(totalItems / limitNumber);

		const sizes = await Size.find(query).sort(sortOption).skip(skip).limit(limitNumber);

		res.status(200).json({
			sizes,
			currentPage: pageNumber,
			totalPages,
			totalItems,
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Read one
exports.getSizeById = async (req, res) => {
	try {
		const {id} = req.params;
		const size = await Size.findById(id);

		if (!size) {
			return res.status(404).json({message: 'Không tìm thấy kích cỡ'});
		}

		res.status(200).json(size);
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Update
exports.updateSize = async (req, res) => {
	try {
		const {id} = req.params;
		const {name, description} = req.body;

		const updatedSize = await Size.findByIdAndUpdate(id, {name, description}, {new: true});

		if (!updatedSize) {
			return res.status(404).json({message: 'Không tìm thấy kích cỡ để cập nhật'});
		}

		res.status(200).json({message: 'Cập nhật kích cỡ thành công', data: updatedSize});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Delete
exports.deleteSize = async (req, res) => {
	try {
		const {id} = req.params;
		const deletedSize = await Size.findByIdAndDelete(id);

		if (!deletedSize) {
			return res.status(404).json({message: 'Không tìm thấy kích cỡ để xóa'});
		}

		res.status(200).json({message: 'Xóa kích cỡ thành công', data: deletedSize});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};
