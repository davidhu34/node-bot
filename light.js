const SerialPort = require('serialport')

const COMport = require('./configs').COM
const iconv = require('iconv-lite')
const bufferConcat = require('buffer-concat')
const events = require('events')
class eventEmitter extends events {}

	const light = new eventEmitter() 
	const sp = new SerialPort(COMport.light, {
	    baudrate: 115200,
		parser: SerialPort.parsers.readline("\n")
	})
	sp.on("open", () => {
		 console.log('Light port opened')
		 setTimeout( () => {sp.write('A') }, 5000)
	})
	light.on('lit', state => {
		console.log('lit:',state)
		switch (state) {
			case 'on':
				sp.write('A')
				break;
			case 'bling':
				sp.write('B')
				break;
			case 'off':
			default:
				sp.write('C')
				break;
			return;
		}
	})
