 
var SerialPort = require("serialport"); // localize object constructor
var iconv = require('iconv-lite');
var sp = new SerialPort("COM6", {
    baudrate: 9600
});

		var bufstr='[m51][h0]我是櫻木';//'[m55]ibm中文,包含數字13%和3:20分';	
		var b = bufstr.match(/[^\x00-\xff]/g);
       	var buflen = (bufstr.length + (!b ? 0: b.length))+2;
				
		var buf1 = new Buffer(5);
		buf1[0] = 0xFD;   
		buf1[1] = 0x00;  
		buf1[2] = buflen;//Number(14).toString(16);  
		buf1[3] = 0x01;   
		buf1[4] = 0x02;
			
	
		var big5buf = iconv.encode(bufstr, 'BIG5');
		//console.log('big5hex:'+big5buf.toString('hex'));
		var bufferConcat = require('buffer-concat');

		var b3 = bufferConcat([buf1, big5buf]);
		console.log(b3.toString('hex'));
	
sp.on("open", function() {
	 console.log('Local TTS port opened');
	 sp.write(b3);
	 //sp2.write('#F');
	 //exec('nircmd.exe mutesysvolume 1 microphone');	
});
var hexstr;		
sp.on('data', function (data) {
	 console.log('on Data '+data);
	 console.log('Open Speech port: ', new Buffer(data).toString('hex'));
	hexstr = new Buffer(data).toString('hex');
  if(hexstr=='41'){
	console.log('Starting Playing');
  }
  if(hexstr=='4f'){
	console.log('Finish Playing');
  }
});