const request = require('request')

module.exports = text => {
	request.post({
	  headers: {'content-type' : 'application/x-www-form-urlencoded'},
	  url:     'http://cb8777d1.ngrok.io/ifly',
	  body:    "text="+text
	}, function(err, response, body){
		if (err) { console.log(err)
		} else {
			console.log(JSON.parse(body).answer.text) 
		}
	})
}

