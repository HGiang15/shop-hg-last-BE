const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('./../app/controllers/UploadController');
// const auth = require('../middleware/auth');

const storage = multer.diskStorage({
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now());
	},
});

const upload = multer({storage});

router.post('/upload-single-file', upload.single('file'), uploadController.uploadSingleFile);
router.post('/upload-multiple-file', upload.array('files'), uploadController.uploadMultipleFile);

module.exports = router;
