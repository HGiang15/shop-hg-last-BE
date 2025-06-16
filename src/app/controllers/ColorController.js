const Color = require('./../models/Color');

// Create
exports.createColor = async (req, res) => {
	try {
		const {code, name, description} = req.body;

		if (!code || !name) {
			return res.status(400).json({message: 'Vui lòng nhập mã màu và tên màu'});
		}

		const newColor = new Color({code, name, description});
		await newColor.save();

		res.status(201).json({message: 'Tạo màu thành công', data: newColor});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Read all with search and sort
exports.getAllColors = async (req, res) => {
	try {
		const {page = 1, limit = 10, sort = 'newest', search = ''} = req.query;

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

		const totalColors = await Color.countDocuments(query);
		const colors = await Color.find(query).sort(sortOption).skip(skip).limit(limitNumber);

		const totalPages = Math.ceil(totalColors / limitNumber);

		res.status(200).json({
			colors,
			totalPages,
			currentPage: pageNumber,
			totalItems: totalColors,
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Read one
exports.getColorById = async (req, res) => {
	try {
		const {id} = req.params;
		const color = await Color.findById(id);

		if (!color) {
			return res.status(404).json({message: 'Không tìm thấy màu'});
		}

		res.status(200).json(color);
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Update
exports.updateColor = async (req, res) => {
	try {
		const {id} = req.params;
		const {code, name, description} = req.body;

		const updatedColor = await Color.findByIdAndUpdate(id, {code, name, description}, {new: true});

		if (!updatedColor) {
			return res.status(404).json({message: 'Không tìm thấy màu để cập nhật'});
		}

		res.status(200).json({message: 'Cập nhật màu thành công', data: updatedColor});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Delete
exports.deleteColor = async (req, res) => {
	try {
		const {id} = req.params;
		const deletedColor = await Color.findByIdAndDelete(id);

		if (!deletedColor) {
			return res.status(404).json({message: 'Không tìm thấy màu để xóa'});
		}

		res.status(200).json({message: 'Xóa màu thành công', data: deletedColor});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Delete many colors
exports.deleteMultipleColors = async (req, res) => {
	try {
		const {ids} = req.body;

		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({message: 'Vui lòng cung cấp mảng ID cần xóa'});
		}

		const result = await Color.deleteMany({_id: {$in: ids}});

		res.status(200).json({
			message: `Đã xóa ${result.deletedCount} màu`,
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};
