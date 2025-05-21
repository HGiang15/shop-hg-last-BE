const express = require('express');
const router = express.Router();
const reviewController = require('./../app/controllers/ReviewController');

// GET: Lấy tất cả đánh giá của một sản phẩm
router.get('/getReviewsByProductId/:productId', reviewController.getReviewsByProductId);

// POST: Gửi đánh giá mới
router.post('/addReview', reviewController.addReview);

// PUT: Cập nhật đánh giá
router.put('/updateReview/:id', reviewController.updateReview);

// DELETE: Xóa đánh giá
router.delete('/deleteReview/:id', reviewController.deleteReview);

module.exports = router;
