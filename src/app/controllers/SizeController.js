const Category = require('../models/Category');
const Size = require('./../models/Size');

// Create
exports.createSize = async (req, res) => {
	try {
		const {name, description} = req.body;

		if (!name) {
			return res.status(400).json({message: 'Vui lòng nhập tên kích cỡ'});
		}

		// db.sizes.insertOne({
		// 	name: 'Size XL',
		// 	description: 'Chiều dài chân (cm): 28',
		// 	createdAt: ISODate('2025-06-25T10:00:00.000Z'), // MongoDB tự thêm hoặc bạn có thể thêm thủ công
		// 	updatedAt: ISODate('2025-06-25T10:00:00.000Z'),
		// });

		const newSize = new Size({name, description});
		await newSize.save();

		res.status(201).json({message: 'Tạo kích cỡ thành công', data: newSize});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Lấy size theo danh mục
exports.getSizesByCategory = async (req, res) => {
	try {
		const {categoryId} = req.params;

		const category = await Category.findById(categoryId).populate('sizes');
		//   db.categories.aggregate([
		//   {
		//   $match: { _id: ObjectId("685a19a30506867599f17b80") }
		//   },
		//   {
		//   $lookup: {
		//   from: "sizes", // Tên collection của model Size
		//   localField: "sizes", // Trường chứa ID trong collection categories
		//   foreignField: "_id", // Trường ID trong collection sizes
		//   as: "sizes" // Tên trường mới sẽ chứa kết quả populate
		//   }
		//   },
		//   { $limit: 1 } // Chỉ lấy 1 tài liệu sau khi lookup
		//   ]);
		//   không cần populate và chỉ muốn tìm theo ID:
		//   db.categories.findOne({ _id: ObjectId("685a19a30506867599f17b80") });

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

		const query = {
			name: {$regex: search, $options: 'i'},
		};

		let sortOption = {};
		if (sort === 'newest') sortOption = {createdAt: -1};
		else if (sort === 'oldest') sortOption = {createdAt: 1};
		else if (sort === 'name_asc') sortOption = {name: 1};
		else if (sort === 'name_desc') sortOption = {name: -1};

		const totalItems = await Size.countDocuments(query);
		// db.sizes.countDocuments({ name: { $regex: 'áo', $options: 'i' } }); // Ví dụ với search = 'áo'
		const totalPages = Math.ceil(totalItems / limitNumber);

		const sizes = await Size.find(query).sort(sortOption).skip(skip).limit(limitNumber);

		// db.sizes.aggregate([
		// 	{
		// 		$match: {
		// 			name: {$regex: 'size', $options: 'i'},
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
		// ]);

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
		// db.sizes.findOne({ _id: ObjectId("60c72b2f9b1d8e001c8e4d2a") });
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
		// db.sizes.findOneAndUpdate(
		// 	{_id: ObjectId('60c72b2f9b1d8e001c8e4d2a')},
		// 	{$set: {name: 'Size L (Cập nhật)', description: 'Size lớn hơn'}},
		// 	{returnDocument: 'after'} // Tương đương với { new: true } của Mongoose
		// );

		// chỉ muốn cập nhật và không cần trả về tài liệu
		// db.sizes.updateOne({_id: ObjectId('60c72b2f9b1d8e001c8e4d2a')}, {$set: {name: 'Size L (Cập nhật)', description: 'Size lớn hơn'}});

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
		// db.sizes.findOneAndDelete({ _id: ObjectId("60c72b2f9b1d8e001c8e4d2a") });

		if (!deletedSize) {
			return res.status(404).json({message: 'Không tìm thấy kích cỡ để xóa'});
		}

		res.status(200).json({message: 'Xóa kích cỡ thành công', data: deletedSize});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Delete multiple Sizes
exports.deleteMultipleSizes = async (req, res) => {
	try {
		const {ids} = req.body;

		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({message: 'Vui lòng cung cấp mảng ID cần xóa'});
		}

		const result = await Size.deleteMany({_id: {$in: ids}});

		// db.sizes.deleteMany({
		// 	_id: {
		// 		$in: [ObjectId('60c72b2f9b1d8e001c8e4d2a'), ObjectId('60c72b2f9b1d8e001c8e4d2b')],
		// 	},
		// });

		res.status(200).json({
			message: `Đã xóa ${result.deletedCount} kích cỡ`,
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};
