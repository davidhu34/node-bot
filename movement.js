var cp = require('child_process');
var fs = require('fs');
var events = require('events')
var SerialPort = require("serialport"); // localize object constructor
var sp = new SerialPort("COM3", {
    baudrate: 115200
});
var movement = new events()



var message_queue = [];
var arrdelay=0;

function write_next_message(data){
   var message = message_queue.pop();
   console.log('sp write'+message);
   var motodelay=100;
   
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
			
sp.on("error", function(err) {
	console.log(err);
});


sp.on('data', function (data) {
  console.log('Data: ' + data);	 
  if(data.toString().indexOf('OK')>-1 && mndata){
	  console.log('Send next command');	
	  write_next_message(data); 	 
  }
  
});


function getMNCode(mncode){
	var check = [];
	fs.readFileSync(mncode+'.txt', 'utf8', function (err,data) {
	  if (err) {
	    return console.log(err);
	  }
	  var splitData = data.split("\n");
	  
	  var count = 0;
	  for(var i = 0; i < splitData.length ; i ++){

			check[count] = splitData[i]+'\n';
			count++;
	  }
	  check=check.reverse();
	  console.log(check);
	});
	return check;
}


movement.on('move', action => {
	switch(action) {
		default:
			mndata = true
			message_queue = getMNCode('welcome');
			write_next_message();
	}
})


modele.exports = movement;