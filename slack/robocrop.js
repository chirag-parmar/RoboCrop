var mqtt = require('mqtt')
var fs = require('fs')
const express        = require('express');
const bodyParser     = require('body-parser');
const app            = express();
const os             = require('os');
const http       = require('http');

var port = process.env.PORT || 6969;
var request = require('request')
var score = -1
app.use(bodyParser.urlencoded({ extended: true }));

key = '6e2c349338ee49e7b8d3bb6a2ded23b1'
var https = require ('https');

var uri = 'westcentralus.api.cognitive.microsoft.com';
var path = '/text/analytics/v2.0/sentiment';

var getSenti = function (inText, respi, clientele) {
  var documents = { 'documents': [
    { 'id': '1', 'language': 'en', 'text': inText.toString() }
  ]};
  var body = JSON.stringify (documents);

  var request_params = {
      method : 'POST',
      hostname : uri,
      path : path,
      headers : {
        'Ocp-Apim-Subscription-Key' : key,
      }
  };

    var req = https.request (request_params, function (response) {
      var body = '';
      response.on ('data', function (d) {
          body += d;
      });
      response.on ('end', function () {
          var body_ = JSON.parse (body);
          var body__ = JSON.stringify (body_, null, '  ');
          score = parseFloat(body_["documents"][0]["score"]);
    if(score > 0.9) {
      console.log("responsiveness");
            respi.send("**BONKERS**")
            clientele.publish("InRobocrop","1")
    }
    else {
            respi.send("GO GREEN!")
          }
      });
      response.on ('error', function (e) {
          console.log ('Error: ' + e.message);
      });
    }
  );
  req.write (body);
  req.end ();
}

howarray = ["What you up to?","What you up to","how you doing?", "how you doin'?", "how you doin'", "how are you feeling?", "How are you feeling", "Are you okay?", "Are you okay", "Wassup?", "Wassup!","Waddup"]
greetarray = ["hello", "Hi!", "Hi!!", "Hello!", "Hey!", "hey", "Hi"]

app.post('/slackintegrate', function(req,res) {
  console.log(req.body)
  if (req.body.team_domain = "hacktech2018") {
    if (isStringin(req.body.text, howarray)) {
      if((data["temperature"] > 75) && (data["moisture"] == 1 )) {
        res.send("These conditions are terrible. It is to hot and I am totally dry too")
      }
      else if((data["temperature"] < 75) && (data["moisture"] == 1)) {
        res.send("It is nice and cozy in here but I am running out of water. Could you please water me. I am at Chandler")
      }
      else if((data["temperature"] < 75) && (data["moisture"] == 0)) {
        res.send("Imma feeling good! Wanna come over my place for \"netflix and chill\". @chandler")
      }
      else {
  res.send("Imma sunbathing peeps")
      }
      if(data["luminosity"] < 50) {
        res.send("It is getting dark in here. I'm scared and alone.")
      }
    }
    else if(isStringin(req.body.text, greetarray)){
      res.send("Hello " + req.body.user_name + "!")
    }
    else {
      getSenti(req.body.text, res, client)
    }
  }
})

app.listen(port, () => {
  console.log('We are live on ' + port);
});

var options = {
  "username":"chirag",
  "password":"uptownfunk"
}

var client = mqtt.connect('mqtt://localhost:1883',options)

var metricTopics = ["OutRobocrop"]
// DATABASE MANAGEMENT
var data = {}

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
        var items = message_str.split(" | ");
  data["distance"]=parseFloat(items[0])
  data["moisture"] = parseInt(items[1])
  data["luminosity"] = parseFloat(items[2])
  data["temperature"] = parseFloat(items[3])
  data["humidity"] = parseFloat(items[4])
};

function mqtt_close() {
  //console.log("Close MQTT");
};

function isStringin(str, array){
  var flag = 0
  for (var i in array){
    if (array[i].toUpperCase() == str.toUpperCase()) {
      flag = 1
      return true
    }
  }
  if (flag == 0) {
    return false
  }
}