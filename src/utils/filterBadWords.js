let filter = null;

async function loadFilter() {
	if (!filter) {
		const {Filter} = await import('bad-words');
		filter = new Filter();
		filter.addWords('fuck', 'shit', 'bitch');
	}
}

const vietnameseBlacklist = ['đmm', 'dmm', 'dm', 'vcl', 'vl', 'cl', 'clgt', 'ngu', 'địt', 'chó', 'lồn', 'đụ', 'cc', 'cặc', 'dcm'];

function containsVietnameseBadWord(text) {
	const lowerText = text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
	return vietnameseBlacklist.some((word) => lowerText.includes(word));
}

async function isProfane(text) {
	await loadFilter();
	return filter.isProfane(text) || containsVietnameseBadWord(text);
}

module.exports = {
	isProfane,
};
