const bcrypt = require('bcrypt');
const User = require('./../models/User');
const Cart = require('./../models/Cart');
const OTPVerification = require('./../models/OTPVerification');
const {generateToken} = require('./../../utils/jwt');
const {generateOTP} = require('./../../utils/otp');
const {sendOTPVerificationEmail} = require('./../../utils/email');

const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// auth
exports.googleLogin = async (req, res) => {
	try {
		const {token} = req.body;

		if (!token) {
			return res.status(400).json({status: 'Thất bại', message: 'Thiếu token Google.'});
		}

		// Verify token Google
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: process.env.GOOGLE_CLIENT_ID,
		});

		const {email, name, picture} = ticket.getPayload();

		if (!email) {
			return res.status(400).json({status: 'Thất bại', message: 'Token không hợp lệ.'});
		}

		// Tìm, tạo user mới
		let user = await User.findOne({email});
		if (!user) {
			user = await new User({
				name,
				email,
				// phone,
				dateOfBirth: new Date(),
				gender: 'Other',
				password: await bcrypt.hash(Date.now().toString(), 10),
				verified: true,
				role: 1,
				avatar: picture,
				provider: 'google',
				googleId: ticket.getPayload().sub,
			}).save();
		}

		if (user.status === 0) {
			return res.status(403).json({status: 'Thất bại', message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'});
		}

		const jwtToken = generateToken(user);

		res.status(200).json({
			status: 'Thành công',
			message: 'Đăng nhập Google thành công!',
			data: {id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar},
			token: jwtToken,
		});
	} catch (error) {
		console.error('Lỗi đăng nhập Google:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi đăng nhập Google.'});
	}
};

// auth
exports.register = async (req, res) => {
	try {
		const {name, email, phone, dateOfBirth, gender, password, role = 1} = req.body;

		if (!name || !email || !dateOfBirth || !gender || !password) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng không để trống bất kỳ trường nào.'});
		}

		if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
			return res.status(400).json({status: 'Thất bại', message: 'Email không hợp lệ.'});
		}
		if (!/^\d{10,15}$/.test(phone)) {
			return res.status(400).json({status: 'Thất bại', message: 'Số điện thoại không hợp lệ.'});
		}
		if (!new Date(dateOfBirth).getTime()) {
			return res.status(400).json({status: 'Thất bại', message: 'Ngày sinh không hợp lệ.'});
		}
		if (!['Male', 'Female', 'Other'].includes(gender)) {
			return res.status(400).json({status: 'Thất bại', message: 'Giới tính không hợp lệ.'});
		}
		if (password.length < 6) {
			return res.status(400).json({status: 'Thất bại', message: 'Mật khẩu quá ngắn.'});
		}

		const existingUser = await User.findOne({email});
		if (existingUser) {
			return res.status(409).json({status: 'Thất bại', message: 'Tài khoản đã tồn tại!'});
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const savedUser = await new User({
			name,
			email,
			phone,
			dateOfBirth,
			gender,
			password: hashedPassword,
			avatar: '',
			role,
			verified: false,
			provider: 'local',
		}).save();

		const otp = generateOTP();
		await new OTPVerification({userId: savedUser._id, otp}).save();

		await sendOTPVerificationEmail(
			savedUser,
			otp,
			'Xác minh Email của bạn',
			`<p>Nhập mã OTP này để xác minh địa chỉ email của bạn: <b>${otp}</b></p><p>Mã OTP này sẽ hết hạn sau <b>1 giờ</b></p>`
		);

		res.status(201).json({
			code: 'USER_PENDING_VERIFICATION',
			status: 'Đang chờ xác minh',
			message: 'Mã OTP đã được gửi đến email của bạn để xác minh.',
			data: {userId: savedUser._id, email: savedUser.email},
		});
	} catch (error) {
		console.error('Vui lòng kiểm tra lại mạng.:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi đăng ký.'});
	}
};

// auth
exports.verifyOTP = async (req, res) => {
	try {
		const {userId, otp} = req.body;

		if (!userId || !otp) {
			return res.status(400).json({status: 'Thất bại', message: 'Thiếu ID người dùng hoặc OTP.'});
		}

		const otpVerificationRecord = await OTPVerification.findOne({userId});

		if (!otpVerificationRecord) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy bản ghi OTP.'});
		}

		if (otp === otpVerificationRecord.otp) {
			await User.updateOne({_id: userId}, {verified: true});
			await OTPVerification.deleteOne({userId});

			const user = await User.findById(userId);
			const token = generateToken(user);

			res.status(200).json({
				status: 'Thành công',
				message: 'Email đã được xác minh thành công!',
				token,
				data: {id: user._id, name: user.name, email: user.email, role: user.role},
			});
		} else {
			res.status(400).json({status: 'Thất bại', message: 'OTP không hợp lệ.'});
		}
	} catch (error) {
		console.error('Lỗi xác minh OTP:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi xác minh OTP.'});
	}
};

// auth
exports.login = async (req, res) => {
	try {
		const {email, password} = req.body;

		if (!email || !password) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng không để trống email hoặc mật khẩu.'});
		}

		const user = await User.findOne({email});
		if (!user) {
			return res.status(401).json({status: 'Thất bại', message: 'Email hoặc mật khẩu không chính xác!'});
		}

		if (!(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({status: 'Thất bại', message: 'Mật khẩu không chính xác.'});
		}

		if (!user.verified) {
			return res.status(401).json({status: 'Thất bại', message: 'Email chưa được xác minh.'});
		}

		if (user.status === 0) {
			return res.status(403).json({status: 'Thất bại', message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'});
		}

		// // Find giỏ hàng guest từ cookie
		// const cartToken = req.cookies.cartToken;
		// let guestCart = null;

		// if (cartToken) {
		// 	guestCart = await Cart.findOne({cartToken});
		// }

		// // Find giỏ hàng user trong DB
		// let userCart = await Cart.findOne({userId: user._id});

		// // Nếu có giỏ hàng của khách merge giỏ hàng
		// if (guestCart) {
		// 	if (!userCart) {
		// 		userCart = new Cart({userId: user._id, items: []});
		// 	}

		// 	for (const guestItem of guestCart.items) {
		// 		const exists = userCart.items.find(
		// 			(item) =>
		// 				item.productId.toString() === guestItem.productId.toString() &&
		// 				item.sizeId?.toString() === guestItem.sizeId?.toString()
		// 		);

		// 		if (exists) {
		// 			exists.quantity += guestItem.quantity;
		// 		} else {
		// 			userCart.items.push(guestItem);
		// 		}
		// 	}

		// 	await userCart.save();
		// 	await guestCart.deleteOne();
		// 	res.clearCookie('cartToken');
		// }

		const token = generateToken(user);

		res.status(200).json({
			status: 'Thành công',
			message: 'Đăng nhập thành công!',
			data: {id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar},
			token,
		});
	} catch (error) {
		console.error('Lỗi đăng nhập:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi đăng nhập.'});
	}
};

// auth
exports.forgotPassword = async (req, res) => {
	try {
		const {email} = req.body;

		if (!email) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng nhập email.'});
		}

		const user = await User.findOne({email});
		if (!user) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy tài khoản với email này.'});
		}

		const otp = generateOTP();
		await OTPVerification.findOneAndUpdate({userId: user._id}, {otp}, {upsert: true});

		await sendOTPVerificationEmail(
			user,
			otp,
			'Đặt lại mật khẩu của bạn',
			`<p>Nhập mã OTP này để đặt lại mật khẩu của bạn: <b>${otp}</b></p><p>Mã OTP này sẽ hết hạn sau <b>1 giờ</b></p>`
		);

		res.status(200).json({status: 'Thành công', message: 'Mã OTP đã được gửi đến email của bạn.'});
	} catch (error) {
		console.error('Lỗi quên mật khẩu:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi quên mật khẩu.'});
	}
};

// auth
exports.resetPassword = async (req, res) => {
	try {
		const {email, otp, newPassword} = req.body;

		if (!email || !otp || !newPassword) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng nhập email, OTP và mật khẩu mới.'});
		}

		const user = await User.findOne({email});
		if (!user) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy tài khoản với email này.'});
		}

		const otpVerificationRecord = await OTPVerification.findOne({userId: user._id});
		if (!otpVerificationRecord) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy bản ghi OTP.'});
		}

		if (otp !== otpVerificationRecord.otp) {
			return res.status(400).json({status: 'Thất bại', message: 'OTP không hợp lệ.'});
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await User.updateOne({_id: user._id}, {password: hashedPassword});
		await OTPVerification.deleteOne({userId: user._id});

		res.status(200).json({status: 'Thành công', message: 'Mật khẩu đã được đặt lại thành công!'});
	} catch (error) {
		console.error('Lỗi đặt lại mật khẩu:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi đặt lại mật khẩu.'});
	}
};

// Profile and admin
exports.changePassword = async (req, res) => {
	try {
		const userId = req.user._id;
		const {currentPassword, newPassword} = req.body;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.'});
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy người dùng.'});
		}

		const isMatch = await bcrypt.compare(currentPassword, user.password);
		if (!isMatch) {
			return res.status(400).json({status: 'Thất bại', message: 'Mật khẩu hiện tại không đúng.'});
		}

		if (newPassword.length < 6) {
			return res.status(400).json({status: 'Thất bại', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'});
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		user.password = hashedPassword;
		await user.save();

		res.status(200).json({status: 'Thành công', message: 'Đổi mật khẩu thành công!'});
	} catch (error) {
		console.error('Lỗi đổi mật khẩu:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi đổi mật khẩu.'});
	}
};

// admin
exports.createUser = async (req, res) => {
	try {
		const {name, email, phone, dateOfBirth, gender, password, role, verified = true, status = 1} = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({status: 'Thất bại', message: 'Vui lòng không để trống tên, email và mật khẩu.'});
		}

		if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
			return res.status(400).json({status: 'Thất bại', message: 'Email không hợp lệ.'});
		}

		if (phone && !/^\d{10,15}$/.test(phone)) {
			return res.status(400).json({status: 'Thất bại', message: 'Số điện thoại không hợp lệ.'});
		}
		// Validate dateOfBirth if provided
		if (dateOfBirth && !new Date(dateOfBirth).getTime()) {
			return res.status(400).json({status: 'Thất bại', message: 'Ngày sinh không hợp lệ.'});
		}

		if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
			return res.status(400).json({status: 'Thất bại', message: 'Giới tính không hợp lệ.'});
		}

		if (password.length < 6) {
			return res.status(400).json({status: 'Thất bại', message: 'Mật khẩu quá ngắn, ít nhất 6 ký tự.'});
		}

		const existingUser = await User.findOne({email});
		if (existingUser) {
			return res.status(409).json({status: 'Thất bại', message: 'Người dùng với email này đã tồn tại.'});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await new User({
			name,
			email,
			phone,
			dateOfBirth,
			gender,
			password: hashedPassword,
			avatar: '',
			role: role !== undefined ? Number(role) : 1,
			verified,
			status,
			provider: 'local',
		}).save();

		res.status(201).json({
			status: 'Thành công',
			message: 'Người dùng đã được tạo thành công!',
			data: {
				id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				role: newUser.role,
				verified: newUser.verified,
				status: newUser.status,
			},
		});
	} catch (error) {
		console.error('Lỗi tạo người dùng:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi máy chủ khi tạo người dùng.'});
	}
};

// admin
exports.updateUserByAdmin = async (req, res) => {
	try {
		const {id} = req.params;
		const updates = req.body;

		delete updates.password;
		delete updates.googleId;
		delete updates.provider;

		if (updates.email) {
			if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(updates.email)) {
				return res.status(400).json({status: 'Thất bại', message: 'Email không hợp lệ.'});
			}
			const existingUserWithEmail = await User.findOne({email: updates.email, _id: {$ne: id}});
			if (existingUserWithEmail) {
				return res.status(409).json({status: 'Thất bại', message: 'Email này đã được sử dụng bởi người dùng khác.'});
			}
		}

		if (updates.phone && !/^\d{10,15}$/.test(updates.phone)) {
			return res.status(400).json({status: 'Thất bại', message: 'Số điện thoại không hợp lệ.'});
		}

		if (updates.dateOfBirth && !new Date(updates.dateOfBirth).getTime()) {
			return res.status(400).json({status: 'Thất bại', message: 'Ngày sinh không hợp lệ.'});
		}

		if (updates.gender && !['Male', 'Female', 'Other'].includes(updates.gender)) {
			return res.status(400).json({status: 'Thất bại', message: 'Giới tính không hợp lệ.'});
		}

		const updatedUser = await User.findByIdAndUpdate(id, updates, {new: true}).select('-password');

		if (!updatedUser) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy người dùng để cập nhật.'});
		}

		res.status(200).json({status: 'Thành công', message: 'Cập nhật thông tin người dùng thành công.', data: updatedUser});
	} catch (error) {
		console.error('Lỗi cập nhật người dùng bởi Admin:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi máy chủ khi cập nhật người dùng.'});
	}
};

// admin
exports.getListUser = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const {search = '', sort = 'newest', role, status} = req.query;

		const query = {
			name: {$regex: search, $options: 'i'},
		};

		if (role === '0' || role === '1') {
			query.role = Number(role);
		}

		if (status === '0' || status === '1') {
			query.status = Number(status);
		}

		// Sắp xếp
		let sortOption = {};
		if (sort === 'newest') sortOption = {createdAt: -1};
		else if (sort === 'oldest') sortOption = {createdAt: 1};
		else if (sort === 'name_asc') sortOption = {name: 1};
		else if (sort === 'name_desc') sortOption = {name: -1};

		const totalUsers = await User.countDocuments(query);
		const users = await User.find(query).sort(sortOption).skip(skip).limit(limit).select('-password');

		const mappedUsers = users.map((user) => ({
			id: user._id,
			name: user.name,
			phone: user.phone,
			email: user.email,
			role: user.role === 0 ? 'Quản trị' : 'Người dùng',
			status: user.status === 1 ? 'Đang hoạt động' : 'Không hoạt động',
		}));

		res.status(200).json({
			status: 'Thành công',
			data: mappedUsers,
			pagination: {
				totalItems: totalUsers,
				currentPage: page,
				totalPages: Math.ceil(totalUsers / limit),
			},
		});
	} catch (error) {
		console.error('Lỗi lấy danh sách người dùng:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi lấy danh sách người dùng.'});
	}
};

exports.getUserById = async (req, res) => {
	try {
		const {id} = req.params;

		const user = await User.findById(id).select('-password');
		if (!user) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy người dùng.'});
		}

		res.status(200).json({status: 'Thành công', data: user});
	} catch (error) {
		console.error('Lỗi lấy người dùng theo ID:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi máy chủ.'});
	}
};

// admin
exports.deleteUser = async (req, res) => {
	try {
		const {id} = req.params;

		if (!id) {
			return res.status(400).json({status: 'Thất bại', message: 'Thiếu ID người dùng.'});
		}

		const deletedUser = await User.findByIdAndDelete(id);

		if (!deletedUser) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy người dùng để xóa.'});
		}

		res.status(200).json({
			status: 'Thành công',
			message: 'Người dùng đã được xóa thành công!',
			data: {id: deletedUser._id, name: deletedUser.name},
		});
	} catch (error) {
		console.error('Lỗi khi xóa người dùng:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi máy chủ khi xóa người dùng.'});
	}
};

// admin
exports.updateUserStatus = async (req, res) => {
	try {
		const {id} = req.params;
		const {status} = req.body;

		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({message: 'Không tìm thấy người dùng'});
		}

		if (status !== undefined) {
			user.status = status === 1 ? 1 : 0;
			await user.save();

			res.status(200).json({message: 'Cập nhật trạng thái thành công'});
		} else {
			res.status(400).json({message: 'Thiếu thông tin trạng thái'});
		}
	} catch (error) {
		console.error('Lỗi cập nhật trạng thái người dùng:', error);
		res.status(500).json({message: 'Lỗi server'});
	}
};

// admin
exports.updateUserRole = async (req, res) => {
	try {
		const {id} = req.params;
		const {role} = req.body;

		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({message: 'Không tìm thấy người dùng'});
		}

		if (role !== undefined) {
			if (role === 'Quản trị') {
				user.role = 0;
			} else if (role === 'Người dùng') {
				user.role = 1;
			} else {
				return res.status(400).json({message: 'Vai trò không hợp lệ. Vai trò phải là "Quản trị" hoặc "Người dùng".'});
			}

			await user.save();
			res.status(200).json({message: 'Cập nhật vai trò thành công'});
		} else {
			res.status(400).json({message: 'Thiếu thông tin vai trò'});
		}
	} catch (error) {
		console.error('Lỗi cập nhật vai trò người dùng:', error);
		res.status(500).json({message: 'Lỗi server'});
	}
};

// edit user profile
exports.editUser = async (req, res) => {
	try {
		const {id} = req.params;
		const updates = req.body;

		delete updates.password;
		delete updates.email;

		const updatedUser = await User.findByIdAndUpdate(id, updates, {new: true}).select('-password');
		if (!updatedUser) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy người dùng để cập nhật.'});
		}

		res.status(200).json({status: 'Thành công', message: 'Cập nhật thông tin thành công.', data: updatedUser});
	} catch (error) {
		console.error('Lỗi cập nhật người dùng:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi máy chủ.'});
	}
};

// user
exports.getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select('-password');
		if (!user) {
			return res.status(404).json({status: 'Thất bại', message: 'Không tìm thấy người dùng.'});
		}

		res.status(200).json({
			status: 'Thành công',
			data: {
				id: user._id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				dateOfBirth: user.dateOfBirth,
				gender: user.gender,
				avatar: user.avatar,
				role: user.role,
				status: user.status,
				provider: user.provider,
			},
		});
	} catch (error) {
		console.error('Lỗi lấy thông tin người dùng:', error);
		res.status(500).json({status: 'Thất bại', message: 'Lỗi máy chủ.'});
	}
};
