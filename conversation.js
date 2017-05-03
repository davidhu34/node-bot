const ConversationV1 = require('watson-developer-cloud/conversation/v1')
const mqtt = require('mqtt')
const configs = require('./configs.js')

const conversation = new ConversationV1(configs.conversation)

const clientId = [type, organizationId, deviceType, deviceId].join(':')

const iot_client = mqtt.connect('mqtt://'+organizationId+'.messaging.internetofthings.ibmcloud.com:1883', {
	"clientId" : clientId,
	"keepalive" : 30,
	"username" : configs.mqtt.username,
	"password" : configs.mqtt.password
})
iot_client.on('connect', () => {
	console.log('Client connected to IBM IoT Cloud.')
	iot_client.subscribe('iot-2/command/fb_out/fmt/+', (err, granted) => {
		console.log('subscribed command, granted: '+ JSON.stringify(granted));
	})
})

return iot_client