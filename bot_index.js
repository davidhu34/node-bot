//const OpenCC = require('opencc')
//const opencczh = new OpenCC('tw2s.json')
const request = require('request')
const events = require('events')
class eventEmitter extends events {}
const { watch, unwatch } = require('melanke-watchjs')
const md5 = require('md5')
const player = require('play-sound')()
const notify = cb => {
	player.play('./notify.mp3', {timeout: 1000}, err => {
		if(err) console.log('notify sound err:', err)
		else cb()
	})
}

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
	speaking: false,
	asking: null
}
let lines = {}
let qs = {}
/*
waker.on('wake', () => {
	ding.play(() => {
		if(state.asleep) {
			stt.emit('start')
			state.asleep = false
		}
	})
})*/
stt.on('result', result => {
	const res = result.replace(/\s/g, '')
	console.log('~'+res+'~')
	if (!state.speaking) {
		if (res && res !== '。') {
			const mid = md5(res)
			qs = {
				ifly: null,
				watson: null
			}
			notify(()=>{})
			console.log('to publish:', res)
			state.speaking = true
			state.asking = mid
			//tts.emit('speak', res)
			conversation.publish('iot-2/evt/text/fmt/json', JSON.stringify({data:res, mid:mid}) )
			ifly.emit('q',res)
			setTimeout(() => {
				if(!qs.watson) {
					console.log('6s time up watson')
					qs.watson = 'noreply'
					talker.emit('talk','')
				}
			},6000)
		} else stt.emit('start')
	} 
})

conversation.on('message', (topic, payloadBuffer) =>　{
	const payload = JSON.parse(payloadBuffer)
	console.log(payload)
	const {hasAnswer, help} = payload.data
	const mid = payload.prev.mid
	let speech = fbTextReply(payload)
  	qs.watson = speech

if(help){

	request.post({
	  headers: {'content-type' : 'application/x-www-form-urlencoded'},
	  url:     'http://cb8777d1.ngrok.io/chzw',
	  body:    "text="+speech
	}, function(error, response, body){
		speech = body
		console.log('watson A:',speech)
		if (speech && mid === state.asking) {
			console.log(hasAnswer)
			if (hasAnswer !== undefined && hasAnswer === false) {
				watch(qs, 'ifly', (prop,action, val) => {
					if (val === 'noanswer' && speech) {
						console.log('noanswer watson play')
						talker.emit('talk', speech)
					}
					unwatch(qs, 'ifly')
				})
			} else talker.emit('talk', speech)
		} else {
			qs.watson = 'nullreply'
			talker.emit('talk', '')
		}
	})
}else{
	console.log('watson A:',speech)
	if (speech && mid === state.asking) {
		console.log(hasAnswer)
		if (hasAnswer !== undefined && hasAnswer === false) {
			watch(qs, 'ifly', (prop,action, val) => {
				if (val === 'noanswer' && speech) {
					console.log('noanswer watson play')
					talker.emit('talk', speech)
				}
				unwatch(qs, 'ifly')
			})
		} else talker.emit('talk', speech)
	} else {
		qs.watson = 'nullreply'
		talker.emit('talk', '')
	}
}
})

ifly.on('iot', res => {
	console.log('ifly iot:', res)
	qs.watson = null
	conversation.publish(res.topic, res.payload)
})
ifly.on('a', answer => {
	console.log('ifly A:', answer)
	//tts.emit('speak', answer)
	if(answer) {
		qs.ifly = answer
		talker.emit('talk', answer)
	} else qs.ifly = 'noanswer'
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
	if (!hasNext && qs.watson && qs.ifly) {
		state.asking = null
		notify( () => {stt.emit('start')} )
	}
//	if (!state.asleep)
//		stt.emit('start')
})

//waker.emit('wake')
//ifly.emit('q', '我肚子餓了')
/*const res = '你好'
conversation.publish('iot-2/evt/text/fmt/json', JSON.stringify({data:res}))
ifly.emit('q',res)
*/
notify( () => {
	stt.emit('start')
})
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
  //console.log(response)
  return 'hi'
})

*/
