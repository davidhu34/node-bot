const cp = require('child_process')
const exec = cp.exec
const events = require('events')
const player = require('play-sound')()

const speak = cb => {
	player.play('./notify.mp3', {timeout: 1000}, err => {
		if(err) console.log('notify sound err:', err)
		else cb()
	})
}

class eventEmitter extends events {}

const file = 'tts_sample.exe'
const tts = new eventEmitter()
tts.on('speak', line => {
	console.log('tts start')
	const command = file + ' \"'+ line.replace(/\s/g,'') +'。。。\" speech.wav'
	console.log('executing:', command)
	const ttsout = exec( command ,
		(err, stdout, stderr) => {
			if (err) {
				console.log('tts_sample err:', err)
				return;	
			} else {
				console.log('stdout', stdout)
				console.log('stderr', stderr)
				console.log('tts done')
				player.play('speech.wav',err => {
					if(err) console.log('speech sound err:', err)
					else tts.emit('finish')
				})
			}
		}
	)
})


module.exports = tts