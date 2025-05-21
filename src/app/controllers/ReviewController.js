const Review = require('../models/Review');
const Product = require('../models/Product');

exports.getReviewsByProductId = async (req, res) => {
	try {
		const {productId} = req.params;
		const reviews = await Review.find({productId}).sort({createdAt: -1});
		res.json(reviews);
	} catch (error) {
		console.error('Lỗi khi lấy đánh giá:', error);
		res.status(500).json({message: 'Lỗi server khi lấy đánh giá sản phẩm'});
	}
};

exports.addReview = async (req, res) => {
	try {
		const {productId, name, rating, comment} = req.body;

		// Có thể thêm xác thực sản phẩm tồn tại nếu muốn
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({message: 'Không tìm thấy sản phẩm'});
		}

		const newReview = new Review({
			productId,
			name,
			rating,
			comment,
		});

		await newReview.save();
		res.status(201).json(newReview);
	} catch (error) {
		console.error('Lỗi khi thêm đánh giá:', error);
		res.status(500).json({message: 'Lỗi server khi gửi đánh giá'});
	}
};

exports.updateReview = async (req, res) => {
	try {
		const {id} = req.params;
		const {rating, comment} = req.body;

		const review = await Review.findById(id);
		if (!review) {
			return res.status(404).json({message: 'Không tìm thấy đánh giá'});
		}

		review.rating = rating ?? review.rating;
		review.comment = comment ?? review.comment;

		await review.save();
		res.json(review);
	} catch (error) {
		console.error('Lỗi khi cập nhật đánh giá:', error);
		res.status(500).json({message: 'Lỗi server khi cập nhật đánh giá'});
	}
};

exports.deleteReview = async (req, res) => {
	try {
		const {id} = req.params;
		const deleted = await Review.findByIdAndDelete(id);

		if (!deleted) {
			return res.status(404).json({message: 'Không tìm thấy đánh giá để xóa'});
		}

		res.json({message: 'Xóa đánh giá thành công'});
	} catch (error) {
		console.error('Lỗi khi xóa đánh giá:', error);
		res.status(500).json({message: 'Lỗi server khi xóa đánh giá'});
	}
};
