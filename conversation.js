const ConversationV1 = require('watson-developer-cloud/conversation/v1')
const mqtt = require('mqtt')

const configs = require('./configs.js')

const conversation = new ConversationV1(configs.conversation)

const m = configs.mqtt
console.log(m)
const clientId = [m.type, m.organizationId, m.deviceType, m.deviceId].join(':')
const iot_client = mqtt.connect('mqtt://'+m.organizationId+'.messaging.internetofthings.ibmcloud.com:1883', {
	"clientId" : clientId,
	"keepalive" : 30,
	"username" : m.username,
	"password" : m.password
})

iot_client.on('connect', () => {
	console.log('Client connected to IBM IoT Cloud.')
	iot_client.subscribe('iot-2/cmd/fb_out/fmt/+', (err, granted) => {
		console.log('subscribed command, granted: '+ JSON.stringify(granted))
	})
})

module.exports = iot_client