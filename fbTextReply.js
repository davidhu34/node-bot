const stockname = require('./tw_stockname.json')

module.exports = payload => {
	const { prev, type, data } = payload
	switch (type) {
		case 'websearch':
			return data.result
		case 'weather':
			return data.weather[0].narrative
		case 'stock':
			const stockCode = data.stock.split(':')
			console.log(stockCode)
			const name = stockCode[0] === 'TPE'? stockname[stockCode[1]]
				: data.name
			const l = data.info.l
			const c = data.info.c
			return name+'股價為'+l+'元，'+'本日變化為'+c+'元'
		case 'travel':
			return data.places.map(
				p => p.name
			).join('，')
		case 'movie':
			return data.movies.map(
				m => m.original_title
			).slice(0,3).join('，')
		case 'news':
			return data.news.map( n => {
				return n.title.split(' - ')[0]
			}).slice(0,3).join('，')
		case 'restaurant':
			return data.restaurants.map( r => {
				return r.name
			}).slice(0,3).join('，')
		case 'review':
			return null
		case 'hsr':
			return data.hsr
		case 'text':
		default:
			/*if (data.help) {
				request.post({
			  headers: {'content-type' : 'application/x-www-form-urlencoded'},
			  url:     'http://cb8777d1.ngrok.io/chzw',
			  body:    "text=简化字，民间俗稱"
			}, function(error, response, body){
			  console.log(body)
			})
			} else */return (data.text)?data.text: 'nulltext'
	}
}