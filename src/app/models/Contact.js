const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Họ và tên là bắt buộc'],
			trim: true,
		},
		email: {
			type: String,
			required: [true, 'Email là bắt buộc'],
			trim: true,
		},
		phone: {
			type: String,
			trim: true,
			default: '',
		},
		subject: {
			type: String,
			required: [true, 'Chủ đề là bắt buộc'],
		},
		message: {
			type: String,
			required: [true, 'Nội dung tin nhắn là bắt buộc'],
		},
		status: {
			type: String,
			enum: ['new', 'read', 'replied'],
			default: 'new',
		},
		attachments: {
			type: [String],
			default: [],
		},
	},
	{
		timestamps: true,
	}
);

const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;
