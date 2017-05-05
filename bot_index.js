//const OpenCC = require('opencc')
//const opencczh = new OpenCC('tw2s.json')
const request = require('request')

//const waker = require('./sp.js').waker()
const waker = require('./faceDetection')
const tts = require('./sp.js').tts()
const stt = require('./stt.js').javaStt()
const fbTextReply = require('./fbTextReply')
const conversation = require('./conversation.js')
/*
request.post({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://cb8777d1.ngrok.io/ifly',
  body:    "text=我肚子餓"
}, function(error, response, body){
  console.log(JSON.parse(body).answer.text)
})*/
let state = {
	asleep: true,
	speaking: false
}

waker.on('wake', () => {
	if(state.asleep) {
		stt.emit('start')
		state.asleep = false
	}
})
stt.on('result', result => {
	const res = result.replace(/\s/g, '')
	console.log('~'+res+'~')
	if (!state.speaking) {
		if (res) {
			console.log('to publish:', res)
			state.speaking = true
			//tts.emit('speak', res)
			conversation.publish('iot-2/evt/text/fmt/json', JSON.stringify({data:res}))
		} else stt.emit('start')
	} 
})
conversation.on('message', (topic, payloadBuffer) =>　{
	const payload = JSON.parse(payloadBuffer)
	console.log(payload)
	const speech = fbTextReply(payload)
	console.log('to speak:',speech)
	tts.emit('speak', speech)
})
tts.on('finish', () => {
	state.speaking = false
	stt.emit('start')
})