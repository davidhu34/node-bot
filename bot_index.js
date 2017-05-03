const waker = require('./sp.js').waker()
const tts = require('./sp.js').tts()
const stt = require('./stt.js').javaStt()

const conversation = require('./conversation.js')

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

stt.on('result', res => {
	if (!state.speaking && res.replace(/\s/g, '')) {
		console.log(res)
		state.speaking = true
		tts.emit('speak', res)
	}
})

tts.on('finish', () => {
	state.speaking = false
	stt.emit('start')
})