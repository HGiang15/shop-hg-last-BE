const Product = require('./../models/Product');
const fs = require('fs').promises;
const path = require('path');

// Create
exports.createProduct = async (req, res) => {
	try {
		const {code, name, category, colors, price, description, detailDescription, isFeatured, images} = req.body;

		const quantityBySizeString = req.body.quantityBySize;

		let parsedCategory = {};
		let parsedColors = [];
		let parsedImages = [];
		let parsedQuantityBySize = [];

		try {
			parsedCategory = typeof category === 'string' ? JSON.parse(category) : category;
			parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
			parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
			parsedQuantityBySize = typeof quantityBySizeString === 'string' ? JSON.parse(quantityBySizeString) : quantityBySizeString;
		} catch (error) {
			return res.status(400).json({message: 'Dữ liệu đầu vào không hợp lệ (category/colors/quantityBySize)'});
		}

		parsedQuantityBySize = parsedQuantityBySize.map((item) => ({
			...item,
			quantity: Number(item.quantity),
		}));

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
			status: ['active', 'inactive', 'discontinued'].includes(req.body.status) ? req.body.status : 'active',
			totalSold: 0,
		});

		await product.save();
		console.log('Dữ liệu nhận được:', req.body);
		res.status(201).json({
			message: 'Tạo sản phẩm thành công',
			data: product,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({error: error.message});
	}
};

// Get all products with search, sort, pagination
exports.getAllProducts = async (req, res) => {
	try {
		const {page = 1, limit = 10, sort = 'newest', search = ''} = req.query;

		const pageNumber = parseInt(page, 10);
		const limitNumber = parseInt(limit, 10);
		const skip = (pageNumber - 1) * limitNumber;

		// Tìm kiếm theo tên ko phân biệt hoa thường
		const query = {
			name: {$regex: search, $options: 'i'},
		};

		// Xử lý sort
		let sortOption = {};
		if (sort === 'newest') sortOption = {createdAt: -1};
		else if (sort === 'oldest') sortOption = {createdAt: 1};
		else if (sort === 'name_asc') sortOption = {name: 1};
		else if (sort === 'name_desc') sortOption = {name: -1};
		else if (sort === 'price_asc') sortOption = {price: 1};
		else if (sort === 'price_desc') sortOption = {price: -1};

		const totalItems = await Product.countDocuments(query);
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
			parsedQuantityBySize = typeof quantityBySize === 'string' ? JSON.parse(quantityBySize) : quantityBySize;
			parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
		} catch (error) {
			return res.status(400).json({message: 'Dữ liệu đầu vào không hợp lệ'});
		}

		parsedQuantityBySize = parsedQuantityBySize.map((item) => ({
			...item,
			quantity: Number(item.quantity),
		}));

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
		};

		// Tính tổng số lượng mới
		const totalQuantity = parsedQuantityBySize.reduce((sum, item) => sum + item.quantity, 0);

		// Ưu tiên dùng status nếu gửi lên, nếu không thì tự động cập nhật
		if (status) {
			updateData.status = status;
		} else {
			updateData.status = totalQuantity === 0 ? 'discontinued' : 'active';
		}

		const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {new: true});

		res.status(200).json({
			message: 'Cập nhật sản phẩm thành công',
			data: updatedProduct,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({message: error.message});
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
