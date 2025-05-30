const cloudinary_v1 = require('cloudinary');

const cloudinary = cloudinary_v1.v2;

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECRET,
});

const uploadFile = async (file) => {
	const respon = await cloudinary.uploader.upload(file.path, {
		folder: 'shop-hg-upload',
	});
	return respon;
};

module.exports = {
	uploadFile,
	cloudinary,
};
