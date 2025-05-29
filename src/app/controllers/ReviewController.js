const Review = require('../models/Review');
const Product = require('../models/Product');

exports.getReviewsByProductId = async (req, res) => {
	try {
		const {productId} = req.params;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const reviews = await Review.find({productId}).sort({createdAt: -1}).skip(skip).limit(limit);

		const total = await Review.countDocuments({productId});

		res.json({
			reviews,
			total,
			page,
			totalPages: Math.ceil(total / limit),
		});
	} catch (error) {
		console.error('Lỗi khi lấy đánh giá:', error);
		res.status(500).json({message: 'Lỗi server khi lấy đánh giá sản phẩm'});
	}
};

exports.addReview = async (req, res) => {
	try {
		const {productId, rating, comment} = req.body;

		// Validate đầu vào
		if (!productId || !rating || !comment) {
			return res.status(400).json({message: 'Thiếu thông tin đánh giá'});
		}
		if (rating < 1 || rating > 5) {
			return res.status(400).json({message: 'Số sao phải từ 1 đến 5'});
		}

		// Kiểm tra sản phẩm tồn tại
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({message: 'Không tìm thấy sản phẩm'});
		}

		const newReview = new Review({
			productId,
			userId: req.user._id, // ⬅️ Từ token
			name: req.user.name, // ⬅️ Từ token
			rating,
			comment,
		});

		console.log('User from token:', req.user);

		await newReview.save();
		res.status(201).json(newReview);
	} catch (error) {
		console.error('Lỗi khi thêm đánh giá:', error);
		res.status(500).json({message: 'Lỗi server khi gửi đánh giá'});
	}
};

exports.getReviewById = async (req, res) => {
	try {
		const {id} = req.params;

		const review = await Review.findById(id);

		if (!review) {
			return res.status(404).json({message: 'Không tìm thấy đánh giá'});
		}

		res.json(review);
	} catch (error) {
		console.error('Lỗi khi lấy chi tiết đánh giá:', error);
		res.status(500).json({message: 'Lỗi server khi lấy chi tiết đánh giá'});
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

		// Kiểm tra quyền người dùng
		if (review.userId.toString() !== req.user._id.toString()) {
			return res.status(403).json({message: 'Bạn không có quyền sửa đánh giá này'});
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
		const review = await Review.findById(id);

		if (!review) {
			return res.status(404).json({message: 'Không tìm thấy đánh giá để xóa'});
		}

		// Kiểm tra quyền người dùng
		if (review.userId.toString() !== req.user._id.toString()) {
			return res.status(403).json({message: 'Bạn không có quyền xóa đánh giá này'});
		}

		await review.deleteOne();
		res.json({message: 'Xóa đánh giá thành công'});
	} catch (error) {
		console.error('Lỗi khi xóa đánh giá:', error);
		res.status(500).json({message: 'Lỗi server khi xóa đánh giá'});
	}
};

exports.getAllReviewsForAdmin = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const search = req.query.search || '';

		const query = {
			$or: [{name: {$regex: search, $options: 'i'}}, {comment: {$regex: search, $options: 'i'}}],
		};

		const total = await Review.countDocuments(query);

		const reviews = await Review.find(query)
			.populate('productId', 'name') // để hiện tên sản phẩm
			.populate('userId', 'name email') // để hiện tên người dùng
			.sort({createdAt: -1})
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({
			reviews,
			total,
			page,
			totalPages: Math.ceil(total / limit),
		});
	} catch (error) {
		console.error('Lỗi khi lấy danh sách đánh giá cho admin:', error);
		res.status(500).json({message: 'Lỗi server khi lấy đánh giá'});
	}
};
