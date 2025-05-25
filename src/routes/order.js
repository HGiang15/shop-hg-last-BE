const express = require('express');
const router = express.Router();
const orderController = require('../app/controllers/OrderController');
const auth = require('../middleware/auth');

// Người dùng
router.post('/create-order', auth, orderController.createOrder);
router.get('/my-order', auth, orderController.getUserOrders);
router.delete('/delete-order/:id', auth, orderController.deleteOrder);

// Admin
router.get('/getAllOrders', orderController.getAllOrders);
router.put('/update-status/:id', orderController.updateStatus);
router.get('/getOrderById/:id', orderController.getOrderById);

module.exports = router;
