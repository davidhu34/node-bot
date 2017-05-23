var watson = require('watson-developer-cloud');
var cp = require('child_process');
var fs = require('fs');
var request = require('request');
var path = require('path');
var mqtt = require('mqtt');
var mqttClient = mqtt.createClient(1883, 'iot.eclipse.org');
 var Say = require('./say.js');
 var mic = require('mic');
 var player = require('play-sound')(opts = {})
// var JFile = require("jfile");
//var myFile=new JFile("finger.txt");
 
 var SerialPort = require("serialport"); // localize object constructor
var sp = new SerialPort("COM3", {
    baudrate: 115200//,
    //parser: SerialPort.parsers.readline("\r\n")
});

var  message_queue;
var arrdelay=0;

function write_next_message(data){
   var message = message_queue.pop();
   console.log('sp write'+message);
   var motodelay=100;
   
   //arrdelay=0;
   if(message){
	   if(message.indexOf('DW')> -1 || message.indexOf('AW')> -1 ){
	   motodelay=10;
   }
   var arr = message.split(" ");
	var timeoutvalue=motodelay;
	console.log(arr[arr.length-1]);
	if(arr[arr.length-1] > 10000 ){
		if(arrdelay==0){
			arrdelay=arr[arr.length-1];
			timeoutvalue=motodelay;
		} else {
			
			timeoutvalue = arr[arr.length-1]-arrdelay;
			arrdelay=arr[arr.length-1];
		}
		
		
	} else {
		//console.log(arr[arr.length-1]);
		timeoutvalue = motodelay;
		//arrdelay = timeoutvalue;
		
	}
	if(timeoutvalue<500) timeoutvalue = motodelay;
	else if(timeoutvalue <1000 && timeoutvalue >500){
			timeoutvalue = 600;
	} else if(timeoutvalue >3000){
			timeoutvalue = 600;
	} else {
		console.log('timeoutvalue :'+timeoutvalue);
	}
	console.log("timeout time:"+timeoutvalue);
	console.log("delay:"+arrdelay);
	if(arr[arr.length-1] > 10000 )
	delete arr[arr.length-1];
	//message = arr.toString().replace(/,/g,' ').trim();
   }
   console.log('final send:'+message);
   // if(message=='undefined'){
	   // message = 'A 1';
   // }
   setTimeout(function(){
	   sp.write(message + '\n' , function(err, results){
			   //I'm actually doing something in here with err/results
			   //console.log("Err:"+err);
	   });
	},timeoutvalue);
}
var mndata = false;
sp.on("open", function() {
    console.log('serial port opened');
	setTimeout(function(){		
			mndata=true;			
			console.log("Set Echo")
			console.log('serial port opened, initilize Inmoov Devices');
			//message_queue = ["DPM 11 O","DPM 10 O","DPM 9 O","DPM 6 O","DPM 5 O","DPM 4 O","MNI 7","MNI 3","MNI 2","A 1"]; //long list of messages
			//write_next_message("");
			//sp.write('#1P1500#2P1500#3P1500#4P1500#5P1500#6P1500#7P1500#8P2000#9P1500#10P1755#11P1500#12P1556#13P1600#14P1400#15P1400#16P1500#20P1500#21P1500#22P1500#23P1500#24P1500#25P1500#32P1500T500\r\n#8P1558#10P1555T500\r\n');
			//sp.write('#15P1147T500D500\r\n');
	},2000)	
	//sp.write('A 1\n');
	 // sp.write('#13P1500#14P1300#15P1500#16P1400T1000');
	
});
			
sp.on("error", function() {
});


sp.on('data', function (data) {
  console.log('Data: ' + data);	 
  if(data.toString().indexOf('OK')>-1 && mndata){
	  console.log('Send next command');	
	  write_next_message(data);	 
  }
  
});


var check = new Array();
function getMNCode(mncode){
fs.readFile(mncode+'.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  // console.log(data);
  var splitData = data.split("\n");
  // console.log(splitData[1]);
  
  var count = 0;
  for(var i = 0; i < splitData.length ; i ++){
       /* if(!splitData[i].search("M") || !splitData[i].search("A") || !splitData[i].search("D") ){
		   if(!isNaN(splitData[i+1])){
				check[count] = splitData[i]+" " +splitData[i+1];
				count++;
			}
			else{
				check[count] = splitData[i];
				count++;
			}
		} */
		check[count] = splitData[i]+'\n';
		count++;
  }
  check=check.reverse();
  console.log(check);

});
}
/* 
// the open event will always be emitted 
sp.on("open", function() {
    console.log('serial port opened');
//sp.write("A 0DPM 4 ODPM 5 ODPM 6 ODPM 9 ODPM 10 ODPM 11 ODW 5 1DW 6 0DW 4 1DW 10 1DW 11 0AW 9 255 0DW 4 0AW 9 0 0BDW 4 0DW 9 0BDW 4 0DW 5 0DW 6 0DW 9 0DW 10 0DW 11 0");

sp.write("A 0\n");
sp.write("DPM 4 O\n");
sp.write("DPM 5 O\n");
sp.write("DPM 6 O\n");
sp.write("DPM 9 O\n");
sp.write("DPM 10 O\n");
sp.write("DPM 11 O\n");
sp.write("DW 5 1\n");
sp.write("DW 6 0\n");
sp.write("DW 4 1\n");
sp.write("DW 10 1\n");
sp.write("DW 11 1\n");
sp.write("AW 9 255 0\n");
sp.write("DW 4 0\n");
sp.write("AW 9 0 0\n");
sp.write("B\n");
sp.write("DW 4 0\n");
sp.write("DW 9 0\n");
sp.write("B\n");
sp.write("DW 4 0\n");
sp.write("DW 5 0\n");
sp.write("DW 6 0\n");
sp.write("DW 9 0\n");
sp.write("DW 10 0\n");
sp.write("DW 11 0\n");
sp.write("B\n");
sp.write("DW 4 0\n");
sp.write("DW 5 0\n");
sp.write("DW 6 0\n");
sp.write("DW 9 0\n");
sp.write("DW 10 0\n");
sp.write("DW 11 0\n");	
});

sp.on('error', function(err) {
  console.log(err);
});
sp.on('data', function (data) {
  console.log('Data: ' + data);
});

//DW 5 1
//DW 6 0
//DW 4 1
//DW 10 1
//DW 11 0
/* sp.write("DW 5 1");
sp.write("DW 6 0");
sp.write("DW 4 1");
sp.write("DW 10 1");
sp.write("DW 11 1");
sp.write("AW 9 255 0");
sp.write("DW 4 0");
sp.write("AW 9 0 0");
sp.write("B");
sp.write("DW 4 0");
sp.write("DW 9 0"); */
//sp.write("#")
var micInstance = mic();
//var micInstance = mic({ 'rate': '22100', 'channels': '2', 'debug': false, 'exitOnSilence': 4 });

	



var clientId = ['d', "j6w08m", "robot", "phone02"].join(':');
    
    
    iot_client = mqtt.connect("mqtt://j6w08m.messaging.internetofthings.ibmcloud.com:1883",
                          {
                              "clientId" : clientId,
                              "keepalive" : 30,
                              "username" : "use-token-auth",
                              "password" : "852852852"
                          });
						  
						  
iot_client.on('connect', function() {
        
      console.log('Temp client connected to IBM IoT Cloud.');
      iot_client.publish('iot-2/evt/temp/fmt/json', '{"d":{"temp": ""connectd"" }}');
	  
		/* 9/1 cloud event opening
		cp.exec('cmdmp3win.exe opening01.mp3',function(error,stdout,stderr){ 
			console.log(stdout);
			cp.exec('nircmd.exe mutesysvolume 0 microphone');
		});
		cp.execFile('first.bat',function(error,stdout,stderr){ console.log(stdout);});
		cp.exec('nircmd.exe mutesysvolume 1 microphone'); //Mute until finishing speaking
		*/
    }
    );
	
		
	
	 iot_client.subscribe('iot-2/cmd/+/fmt/+', function(err, granted){

        console.log('subscribed command, granted: '+ JSON.stringify(granted));
        
    });

		
	iot_client.on("message", function(topic,payload){
	console.log('received topic:'+topic+', payload:'+payload);
	
	if(payload.toString()=='mncode'){
		mndata=true;
		arrdelay=0;
		getMNCode('w1');
		//message_queue = ["MNDSM 2 3","MNDSM 2 2","MNDSM 2 1","MNDSM 2 0","B","MNSSMP 2 3 36 0", "MNSSMP 2 3 151 0","MNSSMP 2 3 36 400","MNSSMP 2 3 151 300","MNSSMP 2 0 82 200","MNSSMP 2 1 52 300", "MNSSMP 2 2 36 300","MNI 2"]; //long list of messages
		//message_queue = myFile.lines // get content of file in array of lines 
		message_queue=check;
		write_next_message("");
		
	}
	else if(payload.toString()=='Up'){
		console.log('Walk Forward');
		cp.execFile('forward.bat',function(error,stdout,stderr){ console.log(stdout);});
	} 
	else if(payload.toString()=='Down'){
		console.log('Walk Back');
		cp.execFile('reverse.bat',function(error,stdout,stderr){ console.log(stdout);});
	}
	else if(payload.toString()=='Grab'){
		console.log('Raise Hands');
		cp.execFile('raisehand.bat',function(error,stdout,stderr){ console.log(stdout);});
	} 	
	else if(payload.toString()=='trigger' || payload.toString() =='takepicture'){
		//imageRecognition();
		console.log('Walk Forward');
		cp.execFile('forward.bat',function(error,stdout,stderr){ console.log(stdout);});
	} 
	else if(payload.toString().indexOf("opening")>-1){
		
		 if(payload.toString().indexOf("opening09")>-1){
			cp.exec('cmdmp3win.exe byebyenew.mp3',function(error,stdout,stderr){ 
			//cp.execFile(payload.toString()+'.bat',function(error,stdout,stderr){ console.log(stdout);});
			console.log(stdout);
		});
		} 
		
		cp.exec('cmdmp3win.exe '+payload+".mp3",function(error,stdout,stderr){ 
			console.log(stdout);
			cp.exec('nircmd.exe mutesysvolume 0 microphone');
		});
		cp.execFile(payload.toString()+'.bat',function(error,stdout,stderr){ console.log(stdout);});
		cp.exec('nircmd.exe mutesysvolume 1 microphone'); //Mute until finishing speaking
		
	}
	else if(payload=='forward'){
		console.log('Walk Forward');
		mndata=true;
		arrdelay=0;
		setTimeout(function(){
			message_queue=check;
			write_next_message("");
			
		},500);
		getMNCode(payload);
		//cp.execFile('forward.bat',function(error,stdout,stderr){ console.log(stdout);});
	}
	else if(payload == 'reverse'){
		console.log('Walk Reverse');
		mndata=true;
		arrdelay=0;
		setTimeout(function(){
			message_queue=check;
			write_next_message("");
			
		},500);
		getMNCode(payload);
		//cp.execFile('reverse.bat',function(error,stdout,stderr){ console.log(stdout);});
	}
	else if(payload == 'rightturn'){
		console.log('Walk Right FW');
		mndata=true;
		arrdelay=0;
		setTimeout(function(){
			message_queue=check;
			write_next_message("");
			
		},500);
		getMNCode(payload);
		//cp.execFile('rightturn.bat',function(error,stdout,stderr){ console.log(stdout);});
	}
	else if(payload == 'leftturn'){
		console.log('Walk Left FW');
		mndata=true;
		arrdelay=0;
		setTimeout(function(){
			message_queue=check;
			write_next_message("");
			
		},500);
		getMNCode(payload);
		//cp.execFile('leftturn.bat',function(error,stdout,stderr){ console.log(stdout);});
	}
	else {
		console.log('Talking...');
			if(payload.toString().indexOf('Bad Gateway')>-1){
				console.log('Bad Gateway Filter');
			} else if(payload.toString().indexOf('bootup')>-1){
				console.log('Start Mic');
			}						//sp.write("#");
			else {	new Say('').google(payload.toString());
			
		/* setTimeout(function(){
						
						
					},1000);
		 */
		mndata=true;
		setTimeout(function(){
			message_queue=check;
			write_next_message("");
			
		},500);
		getMNCode('welcome');
		//cp.execFile('talking.bat',function(error,stdout,stderr){ console.log(stdout);});
			}
		
	//console.log('playing....');
	//var player = require('play-sound')(opts = {})
	//player.play('tts.mp3', function(err){}) // $ mplayer foo.mp3  
	}
	
	if(topic.includes("unmute_mic"))
	{
	cp.exec('nircmd.exe mutesysvolume 0 Microphone ');
	}
		
	
	});


var micInputStream = micInstance.getAudioStream();
micInstance.start();
 micInputStream.on('data', function(data) {
    //console.log("Recieved Input Stream: " + data.length);
});

micInputStream.on('silence', function() {
        console.log("Got SIGNAL silence");
  cp.exec('nircmd.exe mutesysvolume 1 Microphone ');
   iot_client.publish('iot-2/evt/mute_mic/fmt/string', '1');
    });



 //Comment Out for 9/1 Demo
 openCMDS_ch();

function imageRecognition () {
	// body...

console.log('Take Picture');
cp.execSync('commandcam.exe /devnum 2 /preview /delay 5000',function(error,stdout,stderr){ console.log(stdout);});
cp.execSync('bmp2jpgcmd -i image.bmp',function(error,stdout,stderr){ console.log(stdout);});

fs.readFile('image.jpg', function read(err, data) {

	if (err) {
                log.error("error reading cam image. abort.")
                        throw err;
    }


	  var image = new Buffer(data, 'base64');
      var base64Image = new Buffer(data, 'binary').toString('base64');
      mqttClient.publish('tommywuiotf/rapiro/pic', 'data:image/png;base64,'+base64Image); //iot-2/evt/color/fmt/json
      //mqttClient.publish('tommywuiotf/rapiro/pic', base64Image);
      console.log("... picture sent!");

 //Visual Recognition cURL : https://gateway-a.watsonplatform.net/visual-recognition/api/v3/classify?api_key={api-key}&url=https://github.com/watson-developer-cloud/doc-tutorial-downloads/raw/master/visual-recognition/fruitbowl.jpg&version=2016-05-19
      request.post({
            //url: 'http://gateway-a.watsonplatform.net/calls/image/ImageGetRankedImageKeywords?apikey=d43c2219a37e702baa8ef70b2f16b2aae0d8fd9e&outputMode=json&imagePostMode=raw',
            url: 'https://gateway-a.watsonplatform.net/visual-recognition/api/v3/classify?api_key=175b0d1851de47f2f2eb66c6b957ef44517b71e2&version=2016-05-20',
            body: image,
            headers: {
                'Content-Length': image.length
            }

        }, function (error, response, body) {
           console.log('Post response :'+response.statusCode);
            if (!error && response.statusCode === 200) {
                console.log(body);
                iot_client.publish('iot-2/evt/imagekeyword/fmt/json', body);
                console.log('Picutre Taged');

            }
            else {

                console.log("error: " + error)
                console.log("response.statusCode: " + response.statusCode)
                console.log("response.statusText: " + response.statusText)

            }
          photo=false;
        })


//Watson face detection
        request.post({
            //url: 'http://gateway-a.watsonplatform.net/calls/image/ImageGetRankedImageKeywords?apikey=d43c2219a37e702baa8ef70b2f16b2aae0d8fd9e&outputMode=json&imagePostMode=raw',
            url: 'https://gateway-a.watsonplatform.net/visual-recognition/api/v3/detect_faces?api_key=175b0d1851de47f2f2eb66c6b957ef44517b71e2&version=2016-05-20',
            body: image,
            headers: {
                'Content-Length': image.length
            }

        }, function (error, response, body) {
           console.log('Post response :'+response.statusCode);
            if (!error && response.statusCode === 200) {
                console.log(body);
                iot_client.publish('iot-2/evt/faces/fmt/json', body);
                console.log('Faces Taged');

            }
            else {

                console.log("error: " + error)
                console.log("response.statusCode: " + response.statusCode)
                console.log("response.statusText: " + response.statusText)

            }
          photo=false;
        })

})

} // end imageRecognition

 function openCMDS_ch() {
	console.log("openCMDS");
	var speech_to_text = watson.speech_to_text({
	username: 'c8090707-bcda-49e0-98f9-172c40420c1a',
	password: 'cZGWayUpvsSJ', 
	version: 'v1'
	});


	var params = {
	content_type: 'audio/wav',
//	ws: '',
	//model: 'WatsonModel',
	model:'zh-CN_BroadbandModel' ,
	continuous: true,
	inactivity_timeout: -1
	};

	 this.mic;
//	mic = cp.spawn('arecord', [ '--device=plughw:2,0','--format=S16_LE', '--rate=44100', '--channels=1']); //, '--duration=10'
//	mic.stderr.pipe(process.stderr);
	
	// create the stream
	
	recognizeStream = speech_to_text.createRecognizeStream(params);
	micInputStream.pipe(recognizeStream);
	// start the recording
  //  mic = cp.spawn('arecord', ['--device=plughw:0,0', '--format=S16_LE', '--rate=44100', '--channels=1']); //, '--duration=10'
    //mic.stderr.pipe(process.stderr);

    // save a local copy of your audio (in addition to streaming it) by uncommenting this
    //mic.stdout.pipe(require('fs').createWriteStream('test.wav'));

    // optionally compress, and then pipe the audio to the STT service
        

		//new Sound('/home/pi/voice/interlude/pleasesay.wav').play();

    // end the recording
   
	
	// listen for 'data' events for just the final text
	// listen for 'results' events to get the raw JSON with interim results, timings, etc.
	var sayflag=0
	recognizeStream.setEncoding('utf8'); // to get strings instead of Buffers from `data` events
	// listen for 'data' events for just the final text
	console.log("start record");
	recognizeStream.on('results',  function(data){


	//console.log('xxxxxxxxx state: '+data.state);	
	if(data.results[0] && data.results[0].final && data.results[0].alternatives){	
	
		ch_r=data.results[0].alternatives[0].transcript;
		ch_c=data.results[0].alternatives[0].confidence;
		ch_d=data;
		//bomb.emit('send');
	console.log('Results event data: '+data.results[0].alternatives[0].transcript);	
	iot_client.publish('iot-2/evt/sttword/fmt/json', '{"d":{"sttcht": "'+data.results[0].alternatives[0].transcript+'" }}');
		if(ch_r.indexOf('握手')>-1){
		console.log('Walk Left FW');
		new Say('').google('好呀，讓我們握握手.把手伸出來！');
		mndata=true;
		arrdelay=0;
		setTimeout(function(){
			message_queue=check;
			write_next_message("");
			
		},500);
		getMNCode('shakehand');
		}
		if(ch_r.indexOf('玩')>-1 && ch_r.indexOf('球')>-1){
		console.log('Plan Ball');
		new Say('').google('好呀，把球拿給我一下哦，謝謝啦！');
		mndata=true;
		arrdelay=0;
		setTimeout(function(){
			message_queue=check;
			write_next_message("");
			
		},500);
		getMNCode('ball');
		}
		if(ch_r.indexOf('男')>-1 || ch_r.indexOf('女')>-1){
		console.log('boy or girl');
		new Say('').google('我才不要告訴你呢！！');
		mndata=true;
		arrdelay=0;
		setTimeout(function(){
			message_queue=check;
			write_next_message("");
			
		},500);
		getMNCode('SayNo');
		}
		if(ch_r.indexOf('听')>-1 && ch_r.indexOf('到')>-1){
		console.log('boy or girl');
		new Say('').google('有誰有跟我講話嗎？！');
		mndata=true;
		arrdelay=0;
		setTimeout(function(){
			message_queue=check;
			write_next_message("");
			
		},500);
		getMNCode('HeadLooking');
		}
	//var tts=data.results[0].alternatives[0].transcript;
	  //  new Sound('/home/pi/voice/cmd/Mx.wav').play();
    // exec("python  /home/pi/Adafruit_Python_LED_Backpack/examples/matrix8x8_scroll.py "+tts,openEmotion);
	// iot_client.publish('iot-2/evt/voicecmd_ch/fmt/json', JSON.stringify(data, null, 2));
	
	//iot-2/evt/color/fmt/json
  //  } else {
  //     new Sound('/home/pi/voice/interlude/what.wav').play();
    }
 });
 
  
 
  
  
  recognizeStream.on('error',  function() {
     console.log.bind(console, 'error event: ');
     //var transcription = converter.toBuffer();
    // console.log(transcription);
 });
 
   recognizeStream.on('connection-close',  function() {
     console.log.bind(console, '==============connection-close event: ===========================');
     //var transcription = converter.toBuffer();
    // console.log(transcription);
 });
	
	
}
