const {cloudinary, uploadFile} = require('../../config/cloudinary');

const MAX_FILE = 10;

exports.uploadSingleFile = async (req, res) => {
	try {
		const fileImage = req.file;

		if (!fileImage) {
			return res.status(400).json({message: 'Không tìm thấy file đầu vào!'});
		}

		const result = await cloudinary.uploader.upload(fileImage.path, {
			folder: 'shop-hg-upload',
		});

		return res.status(200).json({
			message: 'Upload file thành công!',
			data: result.secure_url,
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || 'Upload file thất bại!',
		});
	}
};

exports.uploadMultipleFile = async (req, res) => {
	try {
		const files = req.files || [];

		if (files.length === 0) {
			return res.status(400).json({message: 'Không tìm thấy file đầu vào!'});
		}

		if (files.length > MAX_FILE) {
			return res.status(400).json({message: `Upload tối đa ${MAX_FILE} file`});
		}

		const uploadResults = await Promise.all(
			files.map(async (file) => {
				const result = await uploadFile(file);
				return result?.secure_url;
			})
		);

		const validUrls = uploadResults.filter(Boolean);

		if (validUrls.length === 0) {
			return res.status(400).json({message: 'Không có dữ liệu upload!'});
		}

		return res.status(200).json({
			message: 'Upload file thành công!',
			data: validUrls,
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || 'Upload file thất bại!',
		});
	}
};
