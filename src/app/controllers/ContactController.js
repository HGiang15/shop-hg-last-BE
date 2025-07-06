const Contact = require('./../models/Contact');
const nodemailer = require('nodemailer');

// User Người dùng gửi tin nhắn liên hệ
exports.createContactMessage = async (req, res) => {
	try {
		const {name, email, phone, subject, message, attachments = []} = req.body;

		if (!name || !email || !subject || !message) {
			return res.status(400).json({message: 'Vui lòng điền đầy đủ các trường bắt buộc.'});
		}

		const newContact = new Contact({name, email, phone, subject, message, attachments});
		const savedContact = await newContact.save();

		res.status(201).json({
			success: true,
			message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
			contact: savedContact,
		});
	} catch (error) {
		console.error('Lỗi khi lưu tin nhắn liên hệ:', error);
		res.status(500).json({success: false, message: 'Đã có lỗi xảy ra phía máy chủ.'});
	}
};

// admin Trả lời tin nhắn của khách hàng qua email
exports.replyToMessage = async (req, res) => {
	try {
		const {replyMessage, attachments = []} = req.body;
		const messageId = req.params.id;

		if (!replyMessage) {
			return res.status(400).json({message: 'Nội dung trả lời không được để trống.'});
		}

		const originalMessage = await Contact.findById(messageId);
		if (!originalMessage) {
			return res.status(404).json({message: 'Không tìm thấy tin nhắn gốc.'});
		}

		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.AUTH_EMAIL,
				pass: process.env.AUTH_PASS,
			},
		});

		const imageHtml = attachments
			.map(
				(url) =>
					`<a href="${url}" target="_blank"><img src="${url}" alt="Hình ảnh đính kèm" style="max-width: 150px; margin: 5px; border-radius: 5px;" /></a>`
			)
			.join('');

		await transporter.sendMail({
			from: `"TCSPorts Support" <${process.env.AUTH_EMAIL}>`,
			to: originalMessage.email,
			subject: `Re: ${originalMessage.subject}`,
			html: `
                <p>Chào ${originalMessage.name},</p>
                <p>Cảm ơn bạn đã liên hệ với TCSPorts. Chúng tôi xin trả lời thắc mắc của bạn như sau:</p>
                <div style="background-color:#f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    ${replyMessage.replace(/\n/g, '<br>')}
                </div>
                ${attachments.length > 0 ? `<div><p><strong>Tệp đính kèm từ chúng tôi:</strong></p>${imageHtml}</div>` : ''}
                <p>Nếu có bất kỳ câu hỏi nào khác, bạn có thể trả lời trực tiếp email này.</p>
                <p>Trân trọng,<br>Đội ngũ TCSPorts</p>
            `,
		});

		originalMessage.status = 'replied';
		await originalMessage.save();

		res.status(200).json({success: true, message: 'Gửi trả lời thành công!'});
	} catch (error) {
		console.error('Lỗi khi gửi email trả lời:', error);
		res.status(500).json({success: false, message: 'Gửi trả lời thất bại.'});
	}
};

// admin Lấy tất cả tin nhắn (có phân trang)
exports.getAllMessages = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const {search, sort, status} = req.query;

		const filter = {};

		if (search) {
			filter.name = {$regex: search, $options: 'i'};
		}

		if (status && ['new', 'read', 'replied'].includes(status)) {
			filter.status = status;
		}

		let sortOptions = {createdAt: -1};
		if (sort === 'oldest') {
			sortOptions = {createdAt: 1};
		}

		const messages = await Contact.find(filter).sort(sortOptions).skip(skip).limit(limit);

		const totalMessages = await Contact.countDocuments(filter);

		res.status(200).json({
			messages,
			currentPage: page,
			totalPages: Math.ceil(totalMessages / limit),
			totalMessages,
		});
	} catch (error) {
		res.status(500).json({message: 'Lỗi khi lấy danh sách tin nhắn.'});
	}
};

// admin Lấy chi tiết một tin nhắn
exports.getMessageById = async (req, res) => {
	try {
		const message = await Contact.findById(req.params.id);
		if (!message) {
			return res.status(404).json({message: 'Không tìm thấy tin nhắn.'});
		}
		res.status(200).json(message);
	} catch (error) {
		res.status(500).json({message: 'Lỗi khi lấy chi tiết tin nhắn.'});
	}
};

// admin Cập nhật trạng thái tin nhắn
exports.updateMessageStatus = async (req, res) => {
	try {
		const {status} = req.body;
		if (!['new', 'read', 'replied'].includes(status)) {
			return res.status(400).json({message: 'Trạng thái không hợp lệ.'});
		}

		const updatedMessage = await Contact.findByIdAndUpdate(req.params.id, {status}, {new: true});

		if (!updatedMessage) {
			return res.status(404).json({message: 'Không tìm thấy tin nhắn để cập nhật.'});
		}

		res.status(200).json({message: 'Cập nhật trạng thái thành công.', contact: updatedMessage});
	} catch (error) {
		res.status(500).json({message: 'Lỗi khi cập nhật trạng thái.'});
	}
};

// admin Xóa một tin nhắn
exports.deleteMessage = async (req, res) => {
	try {
		const deletedMessage = await Contact.findByIdAndDelete(req.params.id);
		if (!deletedMessage) {
			return res.status(404).json({message: 'Không tìm thấy tin nhắn để xóa.'});
		}
		res.status(200).json({message: 'Xóa tin nhắn thành công.'});
	} catch (error) {
		res.status(500).json({message: 'Lỗi khi xóa tin nhắn.'});
	}
};
