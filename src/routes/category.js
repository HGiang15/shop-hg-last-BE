const express = require('express');
const router = express.Router();
const categoryController = require('./../app/controllers/CategoryController');
const upload = require('./../middleware/upload');

router.post('/createCategory', upload.single('image'), categoryController.createCategory);
router.get('/getAllCategories', categoryController.getAllCategories);
router.get('/getCategoryById/:id', categoryController.getCategoryById);
router.put('/updateCategory/:id', upload.single('image'), categoryController.updateCategory);
router.delete('/deleteCategory/:id', categoryController.deleteCategory);

module.exports = router;
