const express = require('express');
const router = express.Router();
const productController = require('./../app/controllers/ProductController');

router.post('/createProduct', productController.createProduct);

router.get('/getAllProducts', productController.getAllProducts);

router.get('/getProductById/:id', productController.getProductById);

router.put('/updateProduct/:id', productController.updateProduct);

router.delete('/deleteProduct/:id', productController.deleteProduct);

router.delete('/deleteMultipleProducts', productController.deleteMultipleProducts);

router.get('/featuredProducts', productController.getFeaturedProducts);

router.get('/filterProducts', productController.filterProducts);

module.exports = router;
