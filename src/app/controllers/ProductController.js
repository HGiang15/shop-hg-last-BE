const Product = require('./../models/Product');
const fs = require('fs').promises;
const path = require('path');

// Create
exports.createProduct = async (req, res) => {
	try {
		const {code, name, category, colors, price, description, detailDescription, isFeatured, images, status} = req.body;

		const quantityBySizeString = req.body.quantityBySize;

		// Parse field dạng JSON string fe gửi chuỗi json
		let parsedCategory = {};
		let parsedColors = [];
		let parsedImages = [];
		let parsedQuantityBySize = [];

		try {
			parsedCategory = typeof category === 'string' ? JSON.parse(category) : category;
			parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
			parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
			parsedQuantityBySize = typeof quantityBySizeString === 'string' ? JSON.parse(quantityBySizeString) : quantityBySizeString;
		} catch (err) {
			return res.status(400).json({message: 'Dữ liệu đầu vào không hợp lệ (category/colors/quantityBySize/images)'});
		}

		if (!name || typeof name !== 'string' || !name.trim()) {
			return res.status(400).json({message: 'Tên sản phẩm không được để trống!'});
		}

		if (!parsedCategory?.categoryId || !parsedCategory?.name) {
			return res.status(400).json({message: 'Danh mục sản phẩm không hợp lệ!'});
		}

		if (!Array.isArray(parsedColors) || parsedColors.length === 0) {
			return res.status(400).json({message: 'Phải chọn ít nhất 1 màu cho sản phẩm!'});
		}

		if (!price || isNaN(price) || Number(price) <= 0) {
			return res.status(400).json({message: 'Giá sản phẩm không hợp lệ!'});
		}

		if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
			return res.status(400).json({message: 'Phải upload ít nhất 1 hình ảnh cho sản phẩm!'});
		}

		// quantity status
		parsedQuantityBySize = parsedQuantityBySize.map((item) => ({
			...item,
			quantity: Number(item.quantity),
		}));

		const totalQuantity = parsedQuantityBySize.reduce((sum, item) => sum + item.quantity, 0);

		let resolvedStatus = status;
		if (!['active', 'inactive', 'discontinued'].includes(status)) {
			resolvedStatus = totalQuantity === 0 ? 'inactive' : 'active';
		}

		const product = new Product({
			code,
			name,
			category: parsedCategory,
			colors: parsedColors,
			quantityBySize: parsedQuantityBySize,
			price,
			images: parsedImages,
			description,
			detailDescription,
			isFeatured: isFeatured === 'true' || isFeatured === true,
			status: resolvedStatus,
			totalSold: 0,
		});

		await product.save();

		// db.products.insertOne({
		// 	code: 'SP001',
		// 	name: 'Áo Polo Nam Thể Thao',
		// 	category: {
		// 		categoryId: ObjectId('id_cua_danh_muc'), // ID của danh mục
		// 		name: 'Áo Nam',
		// 	},
		// 	colors: [
		// 		{colorId: ObjectId('id_cua_mau_do'), name: 'Đỏ', code: '#FF0000'},
		// 		{colorId: ObjectId('id_cua_mau_xanh'), name: 'Xanh', code: '#0000FF'},
		// 	],
		// 	quantityBySize: [
		// 		{sizeId: ObjectId('id_cua_size_s'), sizeName: 'S', quantity: 10},
		// 		{sizeId: ObjectId('id_cua_size_m'), sizeName: 'M', quantity: 15},
		// 	],
		// 	price: 250000,
		// 	images: ['url_anh_1', 'url_anh_2'],
		// 	description: 'Áo polo thể thao cao cấp...',
		// 	detailDescription: 'Chi tiết về chất liệu và thiết kế...',
		// 	isFeatured: false,
		// 	status: 'active',
		// 	totalSold: 0,
		// });

		res.status(201).json({
			message: 'Tạo sản phẩm thành công',
			data: product,
		});
	} catch (error) {
		console.error('Lỗi tạo sản phẩm:', error);
		res.status(500).json({
			message: 'Đã xảy ra lỗi khi tạo sản phẩm!',
			error: error.message,
		});
	}
};

// Get all products with search, sort, pagination
exports.getAllProducts = async (req, res) => {
	try {
		const {page = 1, limit = 10, sort = 'newest', search = ''} = req.query;

		const pageNumber = parseInt(page, 10);
		const limitNumber = parseInt(limit, 10);
		const skip = (pageNumber - 1) * limitNumber;

		const query = {
			name: {$regex: search, $options: 'i'},
		};

		let sortOption = {};
		if (sort === 'newest') sortOption = {createdAt: -1};
		else if (sort === 'oldest') sortOption = {createdAt: 1};
		else if (sort === 'name_asc') sortOption = {name: 1};
		else if (sort === 'name_desc') sortOption = {name: -1};
		else if (sort === 'price_asc') sortOption = {price: 1};
		else if (sort === 'price_desc') sortOption = {price: -1};

		const totalItems = await Product.countDocuments(query);
		// db.products.countDocuments({name: {$regex: 'áo', $options: 'i'}});

		const products = await Product.find(query).sort(sortOption).skip(skip).limit(limitNumber);

		const totalPages = Math.ceil(totalItems / limitNumber);

		// Có thể thêm xử lý images nếu cần, hiện tại giữ nguyên mảng images
		const productsWithImages = products.map((product) => {
			const obj = product.toObject();
			return {
				...obj,
				images: obj.images,
			};
		});

		res.status(200).json({
			products: productsWithImages,
			totalPages,
			currentPage: pageNumber,
			totalItems,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({message: error.message});
	}
};

// Get by ID
exports.getProductById = async (req, res) => {
	try {
		const {id} = req.params;
		const product = await Product.findById(id);

		if (!product) return res.status(404).json({message: 'Không tìm thấy sản phẩm'});

		res.status(200).json(product);
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Update
exports.updateProduct = async (req, res) => {
	try {
		const {id} = req.params;
		const {code, name, category, colors, quantityBySize, price, description, detailDescription, images, isFeatured, status} = req.body;

		const existingProduct = await Product.findById(id);
		if (!existingProduct) {
			return res.status(404).json({message: 'Không tìm thấy sản phẩm để cập nhật'});
		}

		let parsedCategory = {};
		let parsedColors = [];
		let parsedImages = [];
		let parsedQuantityBySize = [];

		try {
			parsedCategory = typeof category === 'string' ? JSON.parse(category) : category;
			parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
			parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
			parsedQuantityBySize = typeof quantityBySize === 'string' ? JSON.parse(quantityBySize) : quantityBySize;
		} catch (err) {
			return res.status(400).json({message: 'Dữ liệu đầu vào không hợp lệ (category/colors/quantityBySize/images)'});
		}

		// if (!code || typeof code !== 'string' || !code.trim()) {
		// 	return res.status(400).json({message: 'Mã sản phẩm không được để trống!'});
		// }

		if (!name || typeof name !== 'string' || !name.trim()) {
			return res.status(400).json({message: 'Tên sản phẩm không được để trống!'});
		}

		if (!parsedCategory?.categoryId || !parsedCategory?.name) {
			return res.status(400).json({message: 'Danh mục sản phẩm không hợp lệ!'});
		}

		if (!Array.isArray(parsedColors) || parsedColors.length === 0) {
			return res.status(400).json({message: 'Phải chọn ít nhất 1 màu cho sản phẩm!'});
		}

		if (!price || isNaN(price) || Number(price) <= 0) {
			return res.status(400).json({message: 'Giá sản phẩm không hợp lệ!'});
		}

		if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
			return res.status(400).json({message: 'Phải có ít nhất 1 hình ảnh cho sản phẩm!'});
		}

		// size
		parsedQuantityBySize = parsedQuantityBySize.map((item) => ({
			...item,
			quantity: Number(item.quantity),
		}));

		const totalQuantity = parsedQuantityBySize.reduce((sum, item) => sum + item.quantity, 0);

		const resolvedStatus = ['active', 'inactive', 'discontinued'].includes(status)
			? status
			: totalQuantity === 0
			? 'inactive'
			: 'active';

		const updateData = {
			code,
			name,
			category: parsedCategory,
			colors: parsedColors,
			quantityBySize: parsedQuantityBySize,
			price,
			description,
			detailDescription,
			images: parsedImages,
			isFeatured: isFeatured === 'true' || isFeatured === true,
			status: resolvedStatus,
		};

		const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {new: true});

		res.status(200).json({
			message: 'Cập nhật sản phẩm thành công',
			data: updatedProduct,
		});
	} catch (error) {
		console.error('Lỗi cập nhật sản phẩm:', error);
		res.status(500).json({message: 'Đã xảy ra lỗi khi cập nhật sản phẩm!', error: error.message});
	}
};

// Delete one
exports.deleteProduct = async (req, res) => {
	try {
		const {id} = req.params;
		const deletedProduct = await Product.findByIdAndDelete(id);

		if (!deletedProduct) {
			return res.status(404).json({message: 'Không tìm thấy sản phẩm để xóa'});
		}

		res.status(200).json({message: 'Xóa sản phẩm thành công', deletedProduct});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Delete many
exports.deleteMultipleProducts = async (req, res) => {
	try {
		const {ids} = req.body;

		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({message: 'Vui lòng cung cấp mảng ID cần xóa'});
		}

		const result = await Product.deleteMany({_id: {$in: ids}});

		res.status(200).json({
			message: `Đã xóa ${result.deletedCount} sản phẩm`,
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		res.status(500).json({message: error.message});
	}
};

// Featured
exports.getFeaturedProducts = async (req, res) => {
	try {
		let products = await Product.find({isFeatured: true});

		products = products.map((product) => {
			const obj = product.toObject();
			return {
				...obj,
				images: obj.images,
			};
		});

		res.status(200).json(products);
	} catch (error) {
		console.error(error);
		res.status(500).json({message: error.message});
	}
};

// Filter
exports.filterProducts = async (req, res) => {
	try {
		const {category, colors, minPrice, maxPrice, size, isFeatured, keyword, sortBy, sortOrder, page = 1, limit = 10} = req.query;

		let filter = {};

		if (category) {
			const categoryArray = Array.isArray(category)
				? category
				: typeof category === 'string' && category.includes(',')
				? category.split(',')
				: [category];

			filter['category.categoryId'] = {$in: categoryArray};
		}

		if (colors) {
			const colorsArray = Array.isArray(colors)
				? colors
				: typeof colors === 'string' && colors.includes(',')
				? colors.split(',')
				: [colors];

			filter['colors.colorId'] = {$in: colorsArray};
		}

		if (minPrice || maxPrice) {
			filter.price = {};
			if (minPrice) filter.price.$gte = Number(minPrice);
			if (maxPrice) filter.price.$lte = Number(maxPrice);
		}

		if (size) {
			filter.quantityBySize = {
				$elemMatch: {
					sizeId: size,
					quantity: {$gt: 0},
				},
			};
		}

		if (isFeatured) filter.isFeatured = isFeatured === 'true';

		if (keyword) {
			const regex = new RegExp(keyword, 'i');
			filter.$or = [{name: regex}, {code: regex}];
		}

		let sort = {};
		if (sortBy === 'price' || sortBy === 'createdAt') {
			sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
		}

		const skip = (Number(page) - 1) * Number(limit);
		const total = await Product.countDocuments(filter);
		const products = await Product.find(filter).sort(sort).skip(skip).limit(Number(limit));

		const productsWithImages = products.map((product) => {
			const obj = product.toObject();
			return {
				...obj,
				images: obj.images,
			};
		});

		res.status(200).json({
			total,
			page: Number(page),
			totalPages: Math.ceil(total / limit),
			products: productsWithImages,
		});
	} catch (error) {
		res.status(500).json({error: error.message});
	}
};
