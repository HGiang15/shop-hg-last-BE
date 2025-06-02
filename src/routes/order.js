const express = require('express');
const router = express.Router();
const orderController = require('../app/controllers/OrderController');
const auth = require('../middleware/auth');

router.post('/create-order', auth, orderController.createOrder);
router.get('/my-order', auth, orderController.getUserOrders);
router.delete('/delete-order/:id', auth, orderController.deleteOrder);
router.get('/getAllOrders', orderController.getAllOrders);
router.put('/update-status/:id', orderController.updateStatus);
router.get('/getOrderById/:id', orderController.getOrderById);
router.get('/dashboard-stats', auth, orderController.getDashboardStats);
router.get('/revenue-chart', auth, orderController.getRevenueChartData);
router.get('/revenue-by-day', auth, orderController.getRevenueByDayInMonthCurrentYear);
router.get('/revenue-by-year', auth, orderController.getRevenueByYear);

router.post('/create-payment-url', auth, orderController.createPaymentUrl);
router.get('/vnpay-return', orderController.returnPayment);

module.exports = router;
