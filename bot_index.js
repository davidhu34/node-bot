//const OpenCC = require('opencc')
//const opencczh = new OpenCC('tw2s.json')
const request = require('request')
const events = require('events')
class eventEmitter extends events {}
const { watch, unwatch } = require('melanke-watchjs')
const md5 = require('md5')
//const waker = require('./sp.js').waker()
//const waker = require('./faceDetection')
const waker = new eventEmitter()
const tts = require('./sp.js').tts()
const stt = require('./stt.js').javaStt()
const fbTextReply = require('./fbTextReply')
const conversation = require('./conversation.js')
const ifly = require('./iflyQA')()

const talker = new eventEmitter() 

let state = {
	asleep: true,
	speaking: false
}
let lines = {}
/*
waker.on('wake', () => {
	if(state.asleep) {
		stt.emit('start')
		state.asleep = false
	}
})*/
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
	console.log('watson A:',speech)
	if(speech) //tts.emit('speak', speech)
		talker.emit('talk', speech)
})

ifly.on('iot', res => {
	console.log('ifly iot:', res)
	conversation.publish(res.topic, res.payload)
})
ifly.on('a', answer => {
	console.log('ifly A:', answer)
	//tts.emit('speak', answer)
	talker.emit('talk', answer)
})
talker.on('talk', line => {
	console.log('talker get', line)
	const id = md5(String(new Date()))
	lines[id] = null
	const cue = (prop, action, newQ) => {
		console.log('watch change', line, newQ, id)
		if( newQ === 0 ) {
			console.log('to speak:', line)
			tts.emit('speak', line)
			unwatch(lines, id)
		}
	}
	watch( lines, id, cue)
	lines[id] = Object.keys(lines).length-1
})

tts.on('finish', () => {
	let hasNext = false
	Object.keys(lines).map( l => {
		if(lines[l] === 0 ) {
			delete lines[l]
		} else {
			lines[l] -= 1
			hasNext = true
		}
	})
	state.speaking = hasNext
	if (!hasNext) stt.emit('start')
//	if (!state.asleep)
//		stt.emit('start')
})

//waker.emit('wake')
//ifly.emit('q', '我肚子餓了')
const res = '你好'
conversation.publish('iot-2/evt/text/fmt/json', JSON.stringify({data:res}))
ifly.emit('q',res)


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