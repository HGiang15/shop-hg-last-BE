const Category = require('./../models/Category');
const fs = require('fs').promises;

// Create
exports.createCategory = async (req, res) => {
	try {
		const {name, image} = req.body;
		let sizes = [];

		try {
			sizes = JSON.parse(req.body.sizes);
		} catch (err) {
			return res.status(400).json({message: 'Danh sách kích cỡ không hợp lệ (không parse được JSON).'});
		}

		if (!name) {
			return res.status(400).json({message: 'Vui lòng nhập tên danh mục!'});
		}

		if (!image) {
			return res.status(400).json({message: 'Vui lòng chọn ảnh danh mục!'});
		}

		if (!Array.isArray(sizes)) {
			return res.status(400).json({message: 'Danh sách kích cỡ không hợp lệ (không phải mảng).'});
		}

		const category = new Category({name, image, sizes});
		await category.save();

		// db.categories.insertOne({
		// 	name: 'Tên Danh Mục Mới',
		// 	image: 'duong_dan_anh.jpg',
		// 	sizes: ['id_size_1', 'id_size_2'], // Các ObjectId của size
		// });

		res.status(201).json({
			message: 'Tạo danh mục thành công',
			data: category,
		});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

// Get All Categories with search and sort
exports.getAllCategories = async (req, res) => {
	try {
		const {page = 1, limit = 5, sort = 'newest', search = ''} = req.query;

		const pageNumber = parseInt(page, 10);
		const limitNumber = parseInt(limit, 10);
		const skip = (pageNumber - 1) * limitNumber;

		const query = {
			name: {$regex: search, $options: 'i'},
		};

		let sortOption = {};
		if (sort === 'newest') sortOption = {createdAt: -1}; // Z-A
		else if (sort === 'oldest') sortOption = {createdAt: 1}; // A-Z
		else if (sort === 'name_asc') sortOption = {name: 1};
		else if (sort === 'name_desc') sortOption = {name: -1};

		const totalItems = await Category.countDocuments(query);
		// db.categories.countDocuments({ name: { $regex: 'áo', $options: 'i' } }).
		const totalPages = Math.ceil(totalItems / limitNumber);

		const categories = await Category.find(query).sort(sortOption).skip(skip).limit(limitNumber).populate('sizes');

		// db.categories.aggregate([
		// 	{
		// 		$match: {
		// 			name: {$regex: 'áo', $options: 'i'},
		// 		},
		// 	},
		// 	{
		// 		$sort: {createdAt: -1},
		// 	},
		// 	{
		// 		$skip: 5,
		// 	},
		// 	{
		// 		$limit: 5,
		// 	},
		// 	{
		// 		$lookup: {
		// 			from: 'sizes', // Tên collection của sizes
		// 			localField: 'sizes', // Trường chứa ID trong collection categories
		// 			foreignField: '_id', // Trường ID trong collection sizes
		// 			as: 'sizes', // Tên trường mới sẽ chứa kết quả populate
		// 		},
		// 	},
		// ]);

		const result = categories.map((c) => ({
			...c.toObject(),
			image: c.image,
		}));

		res.status(200).json({
			categories: result,
			currentPage: pageNumber,
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
		const {id} = req.params;
		const category = await Category.findById(id).populate('sizes');
		if (!category) return res.status(404).json({message: 'Không tìm thấy danh mục'});

		res.status(200).json({
			...category.toObject(),
			image: category.image,
		});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

exports.updateCategory = async (req, res) => {
	try {
		const {id} = req.params;
		let {name, image, sizes} = req.body;

		try {
			if (typeof sizes === 'string') {
				sizes = JSON.parse(sizes);
			}
		} catch (err) {
			return res.status(400).json({message: 'Danh sách kích cỡ không hợp lệ (không parse được JSON).'});
		}

		if (!Array.isArray(sizes)) {
			return res.status(400).json({message: 'Danh sách kích cỡ không hợp lệ (không phải mảng).'});
		}

		const category = await Category.findByIdAndUpdate(id, {name, image, sizes}, {new: true});

		// db.categories.findOneAndUpdate(
		// 	{_id: ObjectId('685a19a30506867599f17b80')},
		// 	{
		// 		$set: {
		// 			name: 'Tên Mới',
		// 			image: 'duong_dan_anh_moi.jpg',
		// 			sizes: [ObjectId('id_size_moi_1'), ObjectId('id_size_moi_2')],
		// 		},
		// 	},
		// 	{returnDocument: 'after'} // giống new: true của Mongoose
		// );

		if (!category) return res.status(404).json({message: 'Không tìm thấy danh mục'});

		return res.status(200).json({
			message: 'Cập nhật danh mục thành công',
			data: category,
		});
	} catch (err) {
		return res.status(500).json({message: err.message});
	}
};

// Delete
exports.deleteCategory = async (req, res) => {
	try {
		const category = await Category.findByIdAndDelete(req.params.id);
		// db.categories.findOneAndDelete({ _id: ObjectId("685a19a30506867599f17b80") });

		if (!category) return res.status(404).json({message: 'Không tìm thấy danh mục để xoá'});

		res.status(200).json({message: 'Xoá danh mục thành công', data: category});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

exports.deleteMultipleCategories = async (req, res) => {
	try {
		const {ids} = req.body;

		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({message: 'Vui lòng cung cấp mảng ID cần xoá'});
		}

		const result = await Category.deleteMany({_id: {$in: ids}});

		// db.categories.deleteMany({
		// 	_id: {
		// 		$in: [ObjectId('id_cat_1'), ObjectId('id_cat_2')],
		// 	},
		// });

		res.status(200).json({
			message: `Đã xoá ${result.deletedCount} danh mục`,
			deletedCount: result.deletedCount,
		});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};
