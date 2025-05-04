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

// Read all
exports.getAllSizes = async (req, res) => {
	try {
		const sizes = await Size.find({});
		res.status(200).json(sizes);
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
