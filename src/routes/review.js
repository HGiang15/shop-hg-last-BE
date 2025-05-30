const express = require('express');
const router = express.Router();
const reviewController = require('./../app/controllers/ReviewController');
const auth = require('../middleware/auth');

// GET: Lấy tất cả đánh giá của một sản phẩm
router.get('/get-reviews-by-product-id/:productId', reviewController.getReviewsByProductId);

// GET:
router.get('/get-all-reviews-for-admin/:productId', reviewController.getAllReviewsForAdmin);

// POST: Gửi đánh giá mới
router.post('/add-review', auth, reviewController.addReview);

// GET: Chi tiết 1 đánh giá
router.get('/get-review/:id', auth, reviewController.getReviewById);

// PUT: Cập nhật đánh giá
router.put('/update-review/:id', auth, reviewController.updateReview);

// DELETE: Xóa đánh giá
router.delete('/delete-review/:id', auth, reviewController.deleteReview);

module.exports = router;
