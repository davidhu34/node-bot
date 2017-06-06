const SerialPort = require('serialport')

const COMport = require('./configs').COM
const iconv = require('iconv-lite')
const bufferConcat = require('buffer-concat')
const events = require('events')
class eventEmitter extends events {}

const ttsBuffer = text => {
		const params = ['m54', 'h0']
		const paramsStr = '['+params.join('][')+']'
		const ttscmd = paramsStr+text
		const b = ttscmd.match(/[^\x00-\xff]/g)
       	const buflen = ( ttscmd.length + (b? b.length: 0) )+2
				
		let buf1 = new Buffer(5)
		buf1[0] = 0xFD
		buf1[1] = 0x00
		buf1[2] = buflen//Number(14).toString(16)  
		buf1[3] = 0x01  
		buf1[4] = 0x02
			
		const big5buf = iconv.encode(ttscmd, 'BIG5')
		const b3 = bufferConcat([buf1, big5buf])
		console.log(b3.toString('hex'))
		return b3
}

const spTTS = () => {
	const tts = new eventEmitter() 
	const sp = new SerialPort(COMport.tts, {
	    baudrate: 9600
	})
	sp.on("open", () => {
		 console.log('Local TTS port opened')
	})
	sp.on('data', data => {
		const hexstr = new Buffer(data).toString('hex')
		console.log('tts on Data '+hexstr)
		if (hexstr.indexOf('41') > -1){
			console.log('Starting Playing')
		}
		if (hexstr.indexOf('4f') > -1) {
			console.log('Finish Playing')
			tts.emit('finish')
		}
	})

	tts.on('speak', text => {
		if(!text) tts.emit('finish')
		sp.write(ttsBuffer(text))
	})
	return tts

}
const spWaker = () => {
	const waker = new eventEmitter() 
	const sp = new SerialPort(COMport.waker, {
	    baudrate: 9600
	})
	sp.on("open", () => {
		 console.log('Local waker mic port opened')
	})
	sp.on('data', data => {
		const hexstr = new Buffer(data).toString('hex')
		console.log('waker on Data '+hexstr, typeof(hexstr))
		if(hexstr=='09'){
			console.log('櫻木')
			waker.emit('wake')
		}
		if(hexstr=='0a'){
			console.log('創新哥')
		}
	})
	return waker
}

const spLight = () => {
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
	return light
}

module.exports = {
	waker: spWaker,
	tts: spTTS,
	light: spLight
}