//const OpenCC = require('opencc')
//const opencczh = new OpenCC('tw2s.json')
const request = require('request')

//const waker = require('./sp.js').waker()
//const waker = require('./faceDetection')
const eventEmitterTemp = require('events')
const waker = new eventEmitterTemp()
const tts = require('./sp.js').tts()
const stt = require('./stt.js').javaStt()
const fbTextReply = require('./fbTextReply')
const conversation = require('./conversation.js')
const ifly = require('./iflyQA')()

let state = {
	asleep: true,
	speaking: false
}
let lines = {}

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
			ifly.emit('q',res)
		} else stt.emit('start')
	} 
})
conversation.on('message', (topic, payloadBuffer) =>　{
	const payload = JSON.parse(payloadBuffer)
	console.log(payload)
	const speech = fbTextReply(payload)
	console.log('to speak:',speech)
	if(speech) tts.emit('speak', speech)
})

ifly.on('iot', res => {
	console.log('ifly iot:', res)
	conversation.publish(res.topic, res.payload)
})
ifly.on('a', answer => {
	console.log('ifly A:', answer)
	tts.emit('speak', answer)
})




tts.on('finish', () => {
	state.speaking = false
	if (!state.asleep)
		stt.emit('start')
})

waker.emit('wake')
//ifly.emit('q', '我肚子餓了')



/*
request.post({	
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://cb8777d1.ngrok.io/ifly',
  body:    "text=我肚子餓"
}, function(error, response, body){
  console.log(JSON.parse(body).answer.text)
})
request.post({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://cb8777d1.ngrok.io/chzw',
  body:    "text=简化字，民间俗稱"
}, function(error, response, body){
  console.log(body)
})
*/