const Review = require('../models/Review');
const Product = require('../models/Product');
const {isProfane} = require('../../utils/filterBadWords');
const Order = require('../models/Order');

exports.getReviewsByProductId = async (req, res) => {
	try {
		const {productId} = req.params;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const reviews = await Review.find({productId}).populate('userId', 'name avatar').sort({createdAt: -1}).skip(skip).limit(limit);

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

		if (!productId || !rating || !comment) {
			return res.status(400).json({
				errorCode: 'REVIEW_MISSING_FIELDS',
				message: 'Thiếu thông tin đánh giá',
			});
		}

		if (await isProfane(comment)) {
			return res.status(400).json({
				errorCode: 'REVIEW_PROFANE_COMMENT',
				message: 'Nội dung đánh giá chứa từ ngữ không phù hợp',
			});
		}

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({
				errorCode: 'PRODUCT_NOT_FOUND',
				message: 'Không tìm thấy sản phẩm',
			});
		}

		const hasPurchased = await Order.exists({
			userId: req.user._id,
			'items.productId': productId,
			status: 'success',
			isPaid: true,
		});

		if (!hasPurchased) {
			return res.status(403).json({
				errorCode: 'REVIEW_NOT_ELIGIBLE',
				message: 'Bạn cần mua thành công sản phẩm này để được đánh giá',
			});
		}

		const newReview = new Review({
			productId,
			userId: req.user._id,
			name: req.user.name,
			rating,
			comment,
		});

		await newReview.save();
		res.status(201).json(newReview);
	} catch (error) {
		console.error('Lỗi khi thêm đánh giá:', error);
		res.status(500).json({
			errorCode: 'REVIEW_SERVER_ERROR',
			message: 'Lỗi server khi gửi đánh giá',
		});
	}
};

// Lấy tất cả đánh giả của 1 người dùng
exports.getReviewsByUser = async (req, res) => {
	try {
		const userId = req.user._id;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const reviews = await Review.find({userId}).populate('productId', 'name images').sort({createdAt: -1}).skip(skip).limit(limit);

		const total = await Review.countDocuments({userId});

		res.json({
			reviews,
			total,
			page,
			totalPages: Math.ceil(total / limit),
		});
	} catch (error) {
		console.error('Lỗi khi lấy đánh giá của người dùng:', error);
		res.status(500).json({message: 'Lỗi server khi lấy đánh giá của người dùng'});
	}
};

// chi tiết đánh giá bên Admin
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
			return res.status(404).json({
				errorCode: 'REVIEW_NOT_FOUND',
				message: 'Không tìm thấy đánh giá',
			});
		}

		if (review.userId.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				errorCode: 'REVIEW_PERMISSION_DENIED',
				message: 'Bạn không có quyền sửa đánh giá này',
			});
		}

		if (comment && (await isProfane(comment))) {
			return res.status(400).json({
				errorCode: 'REVIEW_PROFANE_COMMENT',
				message: 'Nội dung đánh giá chứa từ ngữ không phù hợp',
			});
		}

		review.rating = rating ?? review.rating;
		review.comment = comment ?? review.comment;

		await review.save();
		res.json(review);
	} catch (error) {
		console.error('Lỗi khi cập nhật đánh giá:', error);
		res.status(500).json({
			errorCode: 'REVIEW_SERVER_ERROR',
			message: 'Lỗi server khi cập nhật đánh giá',
		});
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
		if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 0) {
			return res.status(403).json({message: 'Bạn không có quyền xóa đánh giá này'});
		}

		await review.deleteOne();
		res.json({message: 'Xóa đánh giá thành công'});
	} catch (error) {
		console.error('Lỗi khi xóa đánh giá:', error);
		res.status(500).json({message: 'Lỗi server khi xóa đánh giá'});
	}
};

exports.deleteMultipleReviews = async (req, res) => {
	try {
		const {ids} = req.body;

		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({message: 'Vui lòng cung cấp mảng ID cần xóa'});
		}

		const result = await Review.deleteMany({_id: {$in: ids}});

		res.status(200).json({
			message: `Đã xóa ${result.deletedCount} đánh giá`,
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

exports.getAllReviewsForAdmin = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const search = req.query.search || '';
		const rating = req.query.rating;
		const sort = req.query.sort;

		const matchStage = {};

		if (rating) {
			matchStage.rating = parseInt(rating);
		}

		const sortOption = sort === 'oldest' ? {createdAt: 1} : {createdAt: -1}; // default: mới nhất

		const pipeline = [
			{
				$lookup: {
					from: 'users',
					localField: 'userId',
					foreignField: '_id',
					as: 'user',
				},
			},
			{$unwind: {path: '$user', preserveNullAndEmptyArrays: true}},
			{
				$lookup: {
					from: 'products',
					localField: 'productId',
					foreignField: '_id',
					as: 'product',
				},
			},
			{$unwind: {path: '$product', preserveNullAndEmptyArrays: true}},
			{
				$match: {
					...matchStage,
					$or: [{'user.name': {$regex: search, $options: 'i'}}, {comment: {$regex: search, $options: 'i'}}],
				},
			},
			{$sort: sortOption},
			{
				$facet: {
					data: [{$skip: (page - 1) * limit}, {$limit: limit}],
					totalCount: [{$count: 'count'}],
				},
			},
		];

		const result = await Review.aggregate(pipeline);
		const reviews = result[0]?.data || [];
		const total = result[0]?.totalCount[0]?.count || 0;

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
