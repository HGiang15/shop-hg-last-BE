const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/getAllCart', optionalAuth, cartController.getAllCart);
router.post('/addToCart', optionalAuth, cartController.addToCart); // Cho phép cả guest và user
router.put('/updateItem', optionalAuth, cartController.updateItem);
router.delete('/removeItem/:itemId', optionalAuth, cartController.removeItem);
router.post('/mergeCart', auth, cartController.mergeCart);

module.exports = router;
