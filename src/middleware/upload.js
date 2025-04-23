const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đường dẫn đến thư mục uploads bên trong src
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, {recursive: true});
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir); // Lưu trực tiếp vào thư mục đã tạo trong src
	},
	filename: (req, file, cb) => {
		const uniqueName = Date.now() + '-' + file.originalname;
		cb(null, uniqueName);
	},
});

const fileFilter = (req, file, cb) => {
	const allowedTypes = /jpeg|jpg|png|webp|gif/;
	const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype);
	if (isValid) {
		cb(null, true);
	} else {
		cb(new Error('Định dạng ảnh không hợp lệ'));
	}
};

const upload = multer({
	storage,
	fileFilter,
	// limits: {fileSize: 5 * 1024 * 1024}, // tối đa 5MB mỗi ảnh
});

module.exports = upload;
