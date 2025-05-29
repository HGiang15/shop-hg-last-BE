// config/vnpay.config.js
module.exports = {
	vnp_TmnCode: process.env.VNP_TMNCODE,
	vnp_HashSecret: process.env.VNP_HASH_SECRET,
	vnp_Url: process.env.VNP_URL, // https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
	vnp_ReturnUrl: process.env.NODE_ENV === 'development' ? process.env.VNP_RETURN_URL_DEV : process.env.VNP_RETURN_URL_PRODUCTION,
};
