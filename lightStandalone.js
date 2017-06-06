const SerialPort = require('serialport')
const mqtt = require('mqtt')

const events = require('events')
class eventEmitter extends events {}
const lightControl = new eventEmitter() 

const configs = require('./configs')

const m = configs.mqtt
console.log(m)
const clientId = [m.type, m.organizationId, m.deviceType, 'inmoov_light'].join(':')
const iot = mqtt.connect('mqtt://'+m.organizationId+'.messaging.internetofthings.ibmcloud.com:1883', {
	"clientId" : clientId,
	"keepalive" : 30,
	"username" : m.username,
	"password" : m.password
})

iot.on('connect', () => {
	console.log('Client connected to IBM IoT Cloud.')
	iot.subscribe('iot-2/cmd/light/fmt/+', (err, granted) => {
		console.log('subscribed command, granted: '+ JSON.stringify(granted))
	})
})

const { light } = configs.COM
const sp = new SerialPort(light, {
    baudrate: 115200,
	parser: SerialPort.parsers.readline("\n")
})
sp.on("open", () => {
	 console.log('Light port opened')
	 setTimeout( () => {sp.write('A') }, 5000)
})

iot.on('message', (t, p) => {
	const payload = JSON.parse(p)
	console.log(payload)
	sp.write(payload.signal)
})
