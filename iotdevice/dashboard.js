var mqtt = require('mqtt')
var fs = require('fs')
const express        = require('express');
const bodyParser     = require('body-parser');
const app            = express();
const os             = require('os');

var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;

var connectionString = "HostName=RoboCrop.azure-devices.net;DeviceId=RoboCrop-Strawberry;SharedAccessKey=PRevIKDgRRWQYZl648cFQeAXiMPFb+G++Hvhnu2zM8c=";

var client_azure = clientFromConnectionString(connectionString);

function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
}

var stats = {}
stats['distance'] = 0
stats['moisture'] = 0
stats['luminosity'] = 0.000
stats['temperature'] = 0.000
stats['humidity'] = 0.000

var connectCallback = function (err) {
  if (err) {
    console.log('Could not connect: ' + err);
  } else {
    console.log('Client connected');

    // Create a message and send it to the IoT Hub every second
    setInterval(function(){
	var items = metricData['lastMessageRaw'].split(" | ");
        var message = new Message(JSON.stringify({distance:parseFloat(items[0]), moisture:parseInt(items[1]), luminosity:parseFloat(items[2]), temperature:parseFloat(items[3]), humidity:parseFloat(items[4])}));
        console.log("Sending message: " + message.getData());
        client_azure.sendEvent(message, printResultFor('send'));
    }, 3000);
  }
};

client_azure.open(connectCallback);

var port = process.env.PORT || 8000;
var request = require('request')


function cpuAverage() {
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();
  for(var i = 0, len = cpus.length; i < len; i++) {
    var cpu = cpus[i];
    for(type in cpu.times) {
      totalTick += cpu.times[type];
   }
    totalIdle += cpu.times.idle;
  }
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}

var startMeasure = cpuAverage();

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', function(req,res) {
  console.log(req.body)

  var endMeasure = cpuAverage();

  var idleDifference = endMeasure.idle - startMeasure.idle;
  var totalDifference = endMeasure.total - startMeasure.total;
  var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference)

  startMeasure = cpuAverage();

  metricData['CPU'] = percentageCPU;
  metricData['totalMem'] = os.totalmem()/1048576;
  metricData['freeMem'] = os.freemem()/1048576;
  res.send(JSON.stringify(metricData))
})

app.listen(port, () => {
  console.log('We are live on ' + port);
});

var options = {
	"username":"chirag",
	"password":"uptownfunk"
}

var client = mqtt.connect('mqtt://localhost:1883',options)

var metricTopics = ["$SYS/broker/uptime","$SYS/broker/load/bytes/sent/1min","$SYS/broker/load/bytes/received/1min",
"$SYS/broker/clients/connected","$SYS/broker/load/messages/received/1min",
"$SYS/broker/load/messages/sent/1min","#"]
// DATABASE MANAGEMENT
var metricData = {}
metricData['bytesSent'] = ""
metricData['bytesReceived'] = ""
metricData['messagesSent'] = ""
metricData['messagesReceived'] = ""
metricData['lastMessage'] = ""
metricData['lastMessageRaw'] = ""
metricData['upTime'] = ""
metricData['clientsConnected'] = ""
metricData['CPU'] = 0
metricData['totalMem'] = 0
metricData['freeMem'] = 0

//DATABASE MANAGEMENT

client.on('connect', mqtt_connect);
client.on('reconnect', mqtt_reconnect);
client.on('error', mqtt_error);
client.on('message', mqtt_messsageReceived);
client.on('close', mqtt_close);

function mqtt_connect() {
    console.log("Connecting MQTT");
    for (var i =0; i< metricTopics.length; i++){
      client.subscribe(metricTopics[i], mqtt_subscribe);
    }
};

function mqtt_subscribe(err, granted) {
    console.log("Subscribed");
    if (err) {console.log(err);}
};

function mqtt_reconnect(err) {
    console.log("Reconnect MQTT");
    if (err) {console.log(err);}
	client = mqtt.connect('mqtt://localhost:1883',options);
};

function mqtt_error(err) {
    console.log("Error!");
	if (err) {console.log(err);}
};

function after_publish() {
	//do nothing
};


function mqtt_messsageReceived(topic, message, packet) {
	var message_str = message.toString();
	message_str = message_str.replace(/\n$/, '');
  switch(topic) {
    case "$SYS/broker/uptime":
      metricData['upTime'] = message_str
      break;
    case "$SYS/broker/load/bytes/sent/1min":
      metricData['bytesSent'] = message_str
      break;
    case "$SYS/broker/load/bytes/received/1min":
      metricData['bytesReceived'] = message_str
      break;
    case "$SYS/broker/clients/connected":
      metricData['clientsConnected'] = message_str
      break;
    case "$SYS/broker/load/messages/received/1min":
      metricData['messagesReceived'] = message_str
      break;
    case "$SYS/broker/load/messages/sent/1min":
      metricData['messagesSent'] = message_str
      break;
    default:
      var d = new Date();
      metricData['lastMessage'] = message_str + " | " + d.toISOString();
      metricData['lastMessageRaw'] = message_str
  }
};

function mqtt_close() {
	//console.log("Close MQTT");
};

