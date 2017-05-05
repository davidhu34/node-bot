const exec = require('child_process').execFile
const events = require('events')
class eventEmitter extends events {}

const avg = arr => {
	let sum = 0
	for (let i = 0; i < arr.length; i++) {
		sum += arr[i]
	}
	return sum / arr.length
}
const command = 'face_detection/Face_detect.exe'
const face = new eventEmitter()

let hasFace = false
let state = []
const detection = exec( command,
	(err, stdout, stderr) => {
		if (err) {
			console.log(err)
			return;
		} else {
			//console.log('stdout', stdout)
			//console.log('stderr', stderr)
			console.log('stt done')
		}
	}
)
detection.stdout.on('data', data => {
	state = state.slice( state.length < 30? 0:1 ).push(Number(data[15]))
	if (hasFace && avg(state) < 0.5) {
		hasFace = false
		face.emit('wake')
	} else if (!hasFace && avg(state) > 0.5) {
		hasFace = true
	}
})
detection.stderr.on('data', data => {
	console.log('stderr:',data)
})
module.exports = face