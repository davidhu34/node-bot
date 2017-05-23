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

//const waker = new eventEmitter() // dummy waker
//const waker = require('./faceDetection')
const waker = require('./sp').waker()
const tts = require('./sp').tts()
//const light = require('./sp').light()
const stt = require('./stt').javaStt()
const movement = require('./movement')
const conversation = require('./conversation')
const ifly = require('./iflyQA')()
const fbTextReply = require('./fbTextReply')

const talker = new eventEmitter() 

let state = {
	asleep: true,
	speaking: false,
	asking: null
}
let lines = {}
let qs = {}

const scripts = ['玩球', '到水', '倒水', '握手']
const hardcode = q => {
	for (let i = 0; i < scripts.length; i++) {
		if ( q.indexOf(scripts[i]) > -1 )
			return scripts[i]
	}
	return null
}


waker.on('wake', () => {
	if(state.asleep) {
		notify(() => {
			//light.emit('lit', 'on')
			stt.emit('start')
			state.asleep = false
		})
	}
})
stt.on('result', result => {
	const res = result.replace(/\s/g, '')
	console.log('~'+res+'~')
	if (!state.speaking) {
		if (res && res !== '。') {
			const scripted = hardcode(res)
			if (scripted) {
				let scriptLine = ''
				let scriptMove = ''
				switch(scripted) {
					case '玩球':
						scriptLine = '好，給我球'
						scriptMove = 'ball'
						break
					case '握手':
						scriptLine = '好，伸出你的手'
						scriptMove = 'hand'
						break
					case '到水':
					case '倒水':
					default:
						scriptLine = '好，給我水'
						scriptMove = 'water'
						break
				}
				const mid = md5(res+String(new Date()))
				qs = {
					ifly: null,
					watson: null
				}
				notify(()=>{})
				console.log('TODO:', res)
				state.speaking = true
				state.asking = mid
				talker.emit('talk', scriptLine)
				movement.emit('move', scriptMove)
			} else {
				const mid = md5(res+String(new Date()))
				qs = {
					ifly: null,
					watson: null
				}
				notify(()=>{})
				console.log('to publish:', res)
				state.speaking = true
				state.asking = mid
				conversation.publish('iot-2/evt/text/fmt/json', JSON.stringify({data:res, mid:mid}) )
				ifly.emit('q',res)
				setTimeout(() => {
					if(!qs.watson) {
						console.log('6s time up watson')
						qs.watson = 'noreply'
						talker.emit('talk','')
					}
				},6000)
			}
		} else {
			//stt.emit('start')
			state.asleep = true
		}
	} 
})

conversation.on('message', (topic, payloadBuffer) =>　{
	const payload = JSON.parse(payloadBuffer)
	console.log(payload)
	const {hasAnswer, help} = payload.data
	const mid = payload.prev.mid
	let speech = fbTextReply(payload)
  	qs.watson = speech

	if (speech && mid === state.asking && state.speaking) {
		request.post({
		  headers: {'content-type' : 'application/x-www-form-urlencoded'},
		  url:     'http://cb8777d1.ngrok.io/chzw',
		  body:    "text="+speech
		}, function(error, response, body){
			speech = body
			console.log('watson A:',speech)
		
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
		})
	} else if ( payload.type !== 'review' && state.speaking && mid === state.asking) {
		qs.watson = 'nullreply'
		talker.emit('talk', '')
	}
})

ifly.on('iot', res => {
	console.log('ifly iot:', res)
	let p = JSON.parse(res.payload)
	p.mid = state.asking
	//qs.watson = null
	conversation.publish(res.topic, JSON.stringify(p))
})
ifly.on('a', answer => {
	console.log('ifly A:', answer)
	if(answer) {
		qs.ifly = answer
		talker.emit('talk', answer)
	} else qs.ifly = 'noanswer'
})
movement.on('endscript',() => {
	qs = {
		watson: 'endscript',
		ifly: 'endscript'
	}
	talker.emit('talk', '')
})


talker.on('talk', line => {
	console.log('talker get', line)
	const id = md5(String(new Date()))
	const cue = (prop, action, newQ) => {
		console.log('watch change', line, newQ, id)
		if( newQ === 0 ) {
			console.log('to speak:', line)
			tts.emit('speak', line)
			if(line && line !== '好，給我球' && line !== '好，給我水'&& line !== '好，伸出你的手') {
				movement.emit('move')
				//light.emit('lit', 'off')
			}
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
	console.log('on finish:',qs.watson, qs.ifly, hasNext )
	if (!hasNext && qs.watson && qs.ifly) {
		state.speaking = hasNext
		state.asking = null
		notify( () => {
			//light.emit('lit', 'on')
			stt.emit('start')
		})
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
//	stt.emit('start')
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
