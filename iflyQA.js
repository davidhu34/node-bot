const request = require('request')
const events = require('events')
class eventEmitter extends events {}

module.exports = iot => {
	const ifly = new eventEmitter()

	const logic = (data, RES) => {
		const sender = 'inmoov'
		const mid = 'inmoovid'
		console.log('RC code==>'+data.toString());
	if(data.toString().indexOf("ifly")>-1){
			 var iflydata = data.split("#");
		if(iflydata[1]=='weather'){
			var weatherData = JSON.parse(iflydata[2]);
			if(weatherData.city=='香港') {
			   if(buf.toString().indexOf('香港') >-1)
				RES.send({text:opencc.convertSync(weatherData.city+":"+weatherData.weather+weatherData.tempRange+'\n'+weatherData.wind+",濕度:"+weatherData.humidity).replace(/ /g,'')});
			} else RES.send({text: opencc.convertSync(weatherData.city+":"+weatherData.weather+weatherData.tempRange+'\n'+weatherData.wind+",濕度:"+weatherData.humidity).replace(/ /g,'')});
		} else if(iflydata[1]=='cookbook'){
			 var cookbook = JSON.parse(iflydata[2]);
			 var cookinfo = cookbook.ingredient +" : "+ cookbook.accessory;
			  RES.send({text: opencc.convertSync(cookinfo.toString()).replace(/ /g,'')});
		} else {
			  if(data.split("#")[2].indexOf('translation')>-1) {
				   var iflyObj = JSON.parse(data.split("#")[2]);
				   var transtr ;
				   var searchKey = iflyObj.semantic.slots.content;
				   var strbuf = iconv.encode(iflyObj.semantic.slots.content, 'utf8');
				   var requests = http.get("http://fanyi.youdao.com/openapi.do?keyfrom=robotTranslate&key=398934524&type=data&doctype=json&version=1.1&q="+urlencode(strbuf.toString('utf8')), function(response){
					console.log(response.statusCode);
						response.on('data', function (chunk) {
							console.log('zh'+chunk);
							if(chunk) {
								transtr=JSON.parse(chunk).translation;
							}
							if(transtr)
								RES.send({text:opencc.convertSync(transtr)});
						});
					});
			  } else if(data.split("#")[2].indexOf('schedule')>-1){
				 //var scheduleData = JSON.parse(iflydata[2]);
				 var iflyObj = JSON.parse(data.split("#")[2]);
				 
					var mydate = moment(iflyObj.semantic.slots.datetime.date+" "+iflyObj.semantic.slots.datetime.time);
					var endtime = moment(mydate).add(2, 'hours'); 
					console.log(mydate.toISOString());
					var payload ={
						starttime:mydate.toISOString(),
						endtime:endtime.toISOString(),
						title:iflyObj.semantic.slots.content				
					}
					if(iflyObj.semantic.slots.name=='reminder'){				
						console.log('Create Calendar entry at Google Calendar');
					} else {
						var j = schedule.scheduleJob(mydate.toDate(), function(){
							console.log('Time is UP.');
							RES.send({text:opencc.convertSync(iflyObj.semantic.slots.content).replace(/ /g,'')});
						});	
						console.log('Create scheduler on'+mydate.toDate());
					}
					RES.send({text:iflyObj.semantic.slots.datetime.date+":"+iflyObj.semantic.slots.datetime.time+":"+iflyObj.semantic.slots.name+":"+opencc.convertSync(iflyObj.semantic.slots.content).replace(/ /g,'')});
				} else if(data.split("#")[2].indexOf('websearch')>-1){
					console.log('Web Search =============== :');
					 var iflyObj = JSON.parse(data.split("#")[2]);
					 var searchKey = 'IBM';
					if(iflyObj.semantic.slots.keywords)
						 searchKey = iflyObj.semantic.slots.keywords;			 
					else searchKey = iflyObj.text;				  
					console.log('SearchKey :'+searchKey);
					var payload ={
						data: opencc.convertSync(searchKey).replace(/ /g,''),
						sender: sender,
						mid: mid
					}									
					RES.send({
						text:'我幫你找找，請稍等... : \n'+opencc.convertSync(searchKey).replace(/ /g,''),
						topic: 'iot-2/evt/websearch/fmt/json',
						payload:JSON.stringify(payload)
					});
				} else if(data.split("#")[2].indexOf('restaurant')>-1){
					 console.log('restaurantSearchK=============== :');
					 //var scheduleData = JSON.parse(iflydata[2]);
					 var iflyObj = JSON.parse(data.split("#")[2]);
					 var searchKey = '台北美食';
					 if(iflyObj.semantic.slots.keywords)
						 searchKey = iflyObj.semantic.slots.keywords;
					 else if(iflyObj.semantic.slots.name)
						 searchKey = ((iflyObj.semantic.slots.location.poi=='CURRENT_POI')?'台北':(iflyObj.semantic.slots.location.poi))+' '+iflyObj.semantic.slots.name;
					 else if(iflyObj.semantic.slots.category)
						 searchKey = ((iflyObj.semantic.slots.location.poi=='CURRENT_POI')?'台北':(iflyObj.semantic.slots.location.poi))+' '+iflyObj.semantic.slots.category;
					 else if(iflyObj.semantic.slots.special)
						 searchKey = ((iflyObj.semantic.slots.location.poi=='CURRENT_POI')?'台北':(iflyObj.semantic.slots.location.poi))+' '+iflyObj.semantic.slots.special;
					 else 
						 searchKey = iflyObj.text;
					  
					console.log('SearchKey :'+searchKey);
					var payload ={
						sender: sender,
			            mid: mid,
			            type: 'text',
			            data: searchKey,
					}						
					RES.send({
						text:'為你找尋............... : \n'+opencc.convertSync(searchKey).replace(/ /g,''),
						topic: 'iot-2/evt/restaurant/fmt/json',
						payload: JSON.stringify(payload)
					});
				 
				} else if(data.split("#")[2].indexOf('map')>-1){
					 console.log('=======Map Search=============== :');
					 //var scheduleData = JSON.parse(iflydata[2]);
					 var iflyObj = JSON.parse(data.split("#")[2]);
					 if(iflyObj.operation=='POSITION'){
					 var searchKey = '台北';
					 if(iflyObj.semantic.slots.location.poi)
						 searchKey = iflyObj.semantic.slots.location.poi;
					 else 
						 searchKey = iflyObj.text;
					  
						console.log('SearchKey :'+searchKey);
						var payload ={
							sender: sender,
				            mid: mid,
				            type: 'text',
				            data: searchKey,
						}						
						RES.send({
							text:'為你找尋............... : \n'+opencc.convertSync(searchKey).replace(/ /g,''),
							topic: 'iot-2/evt/restaurant/fmt/json',
							payload: JSON.stringify(payload)
						});
					 }		
				} else if(data.split("#")[2].indexOf('train')>-1) {
					console.log('THSRC 時刻表 Search=============== :');
					var iflyObj = JSON.parse(data.split("#")[2]);
					var now=moment();
					//預設值
					var StartStation ='台北';  //起站
					var EndStation ='左營';  	//終站
					var SearchDate =now.format("YYYY/MM/DD");		//出發日期
					var SearchTime =now.format("HH:mm"); 			//出發時間
					var traindate;// =moment("2017-01-14 09:00:00", "YYYY-MM-DD hh:mm:ss");
					
					 if(iflyObj.semantic.slots.startLoc){
						 if(iflyObj.semantic.slots.startLoc.areaAddr)
							  StartStation=iflyObj.semantic.slots.startLoc.areaAddr;
						 if(iflyObj.semantic.slots.startLoc.cityAddr)
							  StartStation=iflyObj.semantic.slots.startLoc.cityAddr;
					 }
					  if(iflyObj.semantic.slots.endLoc){
						   if(iflyObj.semantic.slots.endLoc.areaAddr)
							  EndStation = iflyObj.semantic.slots.endLoc.areaAddr;
						  if(iflyObj.semantic.slots.endLoc.cityAddr)
							  EndStation = iflyObj.semantic.slots.endLoc.cityAddr;
					  }
					 
					   if(iflyObj.semantic.slots.startDate){
						   if(iflyObj.semantic.slots.startDate.date){
							   traindate =moment(iflyObj.semantic.slots.startDate.date+' 09:00:00', "YYYY-MM-DD HH:mm:ss");
							   SearchDate =traindate.format("YYYY/MM/DD");
							  // SearchTime =traindate.format("hh:mm"); 
						   } 
						   if(iflyObj.semantic.slots.startDate.time){
							   traindate =moment(SearchDate+' '+iflyObj.semantic.slots.startDate.time, "YYYY-MM-DD HH:mm:ss");
							   SearchTime =traindate.format("HH:mm"); 
						   }
					   }
					console.log('SearchKey :'+StartStation+' to '+EndStation +'date:'+SearchDate+'time:'+SearchTime);
					var payload ={
						data: {
							StartStation:opencc.convertSync(StartStation).replace(/ /g,''),
							EndStation:opencc.convertSync(EndStation).replace(/ /g,''),
							SearchDate:SearchDate,
							SearchTime:SearchTime
						},
						//type: '',
						sender: sender,
						mid: mid,
					}						
					RES.send({
						text:'查詢中...................... : \n'+opencc.convertSync('行程 :'+StartStation+'站 到 '+EndStation +'站\n日期:'+SearchDate+' 時間:'+SearchTime),
						topic: 'iot-2/evt/hsr/fmt/json',
						payload: JSON.stringify(payload)
					});
				} /*else if(data.split("#")[2].indexOf('music')>-1) {
					 console.log('restaurantSearchK=============== :'+data);
					 //var scheduleData = JSON.parse(iflydata[2]);
					 var iflyStr = data.replace(/\r\n/g,'').substr(12); //in case # symbol in the result.
					 var iflyObj = JSON.parse(iflyStr);
					 var downloadURL = '';
					 var searchKey ='';
					 if(iflyObj.semantic.slots && iflyObj.semantic.slots.artist)
						 searchKey = iflyObj.semantic.slots.artist;
					 if(iflyObj.semantic.slots && iflyObj.semantic.slots.song)
						 searchKey = searchKey+" : "+iflyObj.semantic.slots.song;//((iflyObj.semantic.slots.location.poi=='CURRENT_POI')?'台北':(iflyObj.semantic.slots.location.poi))+' '+iflyObj.semantic.slots.name;
					 else 
						 searchKey = iflyObj.text;
				  
					console.log('SearchKey :'+searchKey);
					
					if(iflyObj.data.result && iflyObj.data.result.length >0 ){	
						console.log('Music Download URL :'+iflyObj.data.result[0].downloadUrl)
						RES.send({text:'你也可以輸入歌手及歌名哦!正在為你準備 :'+opencc.convertSync(searchKey).replace(/ /g,''))
						setTimeout(function(){
							console.log('Wait for Search.....');
							botly.sendAttachment({
								id: sender,
								type: Botly.CONST.ATTACHMENT_TYPE.AUDIO,
								payload: {url: iflyObj.data.result[0].downloadUrl.replace(/ /g,'')}
							}, function (err, data) {
								console.log('ERR:'+err);
								console.log('Data'+JSON.stringify(data));
								if(data.error){
									botly.send({id: sender, message: {
									text: `${users[sender].first_name},:`+'Facebook系統忙碌，請多試幾次哦！\n'+data.error.message
									}}, function (err, data) {
										console.log("regular send cb:", err, data);
									});
								}
									//log it 
							});
						},2000);	
					}
				} */else {			
					RES.send({text:opencc.convertSync(data.split("#")[2]).replace(/ /g,'')});
				}
		 	}
		} 
		if(data.toString().indexOf('"rc":4')>-1){
			console.log('en input string==>'+buf.toString());

			var payload = {
				workspace_id: workspace,							
				input: {text:buf.toString()} || {}
			};
			conversation.message(payload, function(err, data) {
				if (err) {
				  console.log('Conversation Error:'+err);
				} else {
					 if(data.output.text[0]){
						console.log(data.output.text[0]);
						RES.send({text:(data.output.text[0] || '')});
					 }
				}
			 });
		} else if (data.indexOf('IflyTek Understanding QA') > -1) {
			console.log('weird ifly');
		} else if (data.replace(/\s/g,'').length === 0)
			console.log('empty weird ifly');

	}


	ifly.on('q', text => {
		request.post({
		  headers: {'content-type' : 'application/x-www-form-urlencoded'},
		  url:     'http://119.81.236.205:3998/ifly',
		  body:    "text="+text.replace('+', '加')
		}, function(err, response, body){
			if (err) { console.log(err)
			} else {
				console.log('ifly response:',body)
				/*logic( body, {
					send: (text) => {
						ifly.emit('a', text)
					}
				})*/
				const result = JSON.parse(body)
				ifly.emit('a', result.text)
				if(result.topic) {
					//console.log('has topic ifly',iot)
					ifly.emit('iot', result)
				}
			}
		})
	})
	return ifly	
}