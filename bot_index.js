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

const waker = new eventEmitter() // dummy waker
//const waker = require('./faceDetection')
//const waker = require('./sp').waker()
//const tts = require('./sp').tts()
//const light = require('./sp').light()
//const movement = require('./movement')
const stt = require('./stt').javaStt()
const tts = require('./ttsEXE')
const iot = require('./iot')
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

waker.on('wake', (payload) => {
	if(state.asleep) {
		state.asleep = false
		if(!payload) {
			iot.publish('iot-2/evt/light/fmt/string', 'B')//light.emit('lit', 'on')
			stt.emit('start')
		} else if (Object.keys(lines).length === 0) {
			console.log('greeting:',payload.greeting)
			qs = {
				watson: 'greeting',
				ifly: 'greeting'
			}
			talker.emit('talk', payload.greeting)
		}
	}

})
waker.on('sleep', () => {
	if(!state.asleep) {
		state.asleep = true
		iot.publish('iot-2/evt/light/fmt/string', 'C')//light.emit('lit', 'on')
	}
})




const scripts = ['玩球', '到水', '倒水', '握手']
const hardcode = q => {
	for (let i = 0; i < scripts.length; i++) {
		if ( q.indexOf(scripts[i]) > -1 )
			return scripts[i]
	}
	return null
}

stt.on('result', result => {
	const res = result.replace(/\s/g, '')
	console.log('~'+res+'~')
	if (!state.speaking && !state.asleep) {
		if (res && res.length > 1 && res !== '。') {
			const mid = md5(res+String(new Date()))
			qs = {
				ifly: null,
				watson: null
			}
			state.speaking = true
			state.asking = mid

			iot.publish('iot-2/evt/light/fmt/light', 'A')
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

				console.log('TODO:', res)
				notify(()=>{})
				talker.emit('talk', scriptLine)
				//movement.emit('move', scriptMove)
			} else {
				notify(()=>{})
				console.log('to publish:', res)
				iot.publish('iot-2/evt/text/fmt/json', JSON.stringify({data:res, mid:mid}) )
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
			stt.emit('start')
		}
	} 
})

iot.on('message', (topic, payloadBuffer) =>　{
	const payload = JSON.parse(payloadBuffer)
	console.log(payload)
	
	if (payload.data) {
		const {hasAnswer, help} = payload.data
		const mid = payload.prev.mid
		let speech = fbTextReply(payload)
	  	qs.watson = speech
		
		if (speech && mid === state.asking && state.speaking) {
			request.post({
			  headers: {'content-type' : 'application/x-www-form-urlencoded'},
			  url:     'http://119.81.236.205:3998/chzw',
			  body:    "text="+speech
			}, function(error, response, body){
				console.log('chzw:',body)
				speech = body
				console.log('watson A:',speech,'| hasA:',hasAnswer)
				if (hasAnswer !== undefined && hasAnswer === false) {
					if(qs.ifly === 'noanswer' && speech) {
						console.log('noanswer watson play')
						talker.emit('talk', speech)
					} else watch(qs, 'ifly', (prop,action, val) => {
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
	} else if ( payload.wake !== undefined ) {
		if (payload.wake) waker.emit('wake', payload)
		else waker.emit('sleep')
	}
})

ifly.on('iot', res => {
	console.log('ifly iot:', res)
	let p = JSON.parse(res.payload)
	p.mid = state.asking
	//qs.watson = null
	iot.publish(res.topic, JSON.stringify(p))
})
ifly.on('a', answer => {
	console.log('ifly A:', answer)
	if(answer) {
		qs.ifly = answer
		talker.emit('talk', answer)
	} else qs.ifly = 'noanswer'
})


talker.on('talk', line => {
	console.log('talker get', line)
	const id = md5(String(new Date()))
	const cue = (prop, action, newQ) => {
		console.log('watch change', line, newQ, id)
		if( newQ === 0 ) {
			console.log('to speak:', line)
			if(line)
				tts.emit('speak', line)
			if(line && line !== '好，給我球' && line !== '好，給我水'&& line !== '好，伸出你的手') {
				//movement.emit('move')
				iot.publish('iot-2/evt/light/fmt/string', 'C')//light.emit('lit', 'off')
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
			iot.publish('iot-2/evt/light/fmt/string', 'B')//light.emit('lit', 'on')
			stt.emit('start')
		})
	}
	//if (!state.asleep)
	//	stt.emit('start')
})

/*
notify( () => {
	console.log('start')
	stt.emit('start')
})
*/
