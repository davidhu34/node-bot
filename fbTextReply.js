const stockname = require('./tw_stockname.json')

module.exports = payload => {
	const { prev, type, data } = payload
	switch (type) {
		case 'weather':
			return data.weather.narrative
		case 'stock':
			const stockCode = data.stock.split(':')
			console.log(stockCode)
			const name = stockCode[0] === 'TPE'? stockname[stockCode[1]]
				: data.name
			const l = data.info.l
			const c = data.info.c
			return name+'股價為'+l+'元，'+'本日表現為'+c+'元'
		case 'travel':
			return data.places.map(
				p => p.name
			).join('，')
		case 'movie':
			return data.movies.map(
				m => m.original_title
			).join('，')
		case 'text':
		default:
			return data.text
	}
}