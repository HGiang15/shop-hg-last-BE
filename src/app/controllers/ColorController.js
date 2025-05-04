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

// Read all
exports.getAllColors = async (req, res) => {
	try {
		const colors = await Color.find({});
		res.status(200).json(colors);
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
