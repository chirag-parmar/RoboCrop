#include <Servo.h> 
#include <DHT.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

const char* ssid = "PARMAR";
const char* password = "";
const char* mqtt_server = "chiragparmar.me";

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];
int value = 0;

#define DHTPIN  13
#define TRIGGER 5
#define ECHO    4
#define LDR     A0
#define PLAMO   12
#define DHTTYPE DHT11

float temperature, humidity;
int distance;
long duration;
float luminosity;
int moisture;

Servo myservo, myservo2;
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  //Serial Setup at 9600
  Serial.begin(115200);

  //mqtt stuff
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  //ultrasonic sensor setup
  pinMode(TRIGGER, OUTPUT);
  pinMode(ECHO, INPUT);

  //LDR setup
  pinMode(A0, INPUT);

  //Motor setup
  myservo.attach(16);
  myservo2.attach(14);

  //DHT sensor
  dht.begin();
}

void setup_wifi() {

  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // Switch on the LED if an 1 was received as first character
  if ((char)payload[0] == '1') {
    gobonkers();
  } else {
    Serial.println("Not doing bonker sequence");
  }

}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP8266Client")) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("OutRobocrop", "hello world");
      // ... and resubscribe
      client.subscribe("InRobocrop");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  else {
  }
  client.loop();
  getDistance();
  getMoisture();
  getLuminosity();
  getHumidity();

  char outbuffer[200];
  sprintf(outbuffer, "%d | %d | %f | %f | %f", distance, moisture, luminosity, temperature, humidity);
  Serial.println(outbuffer);
  client.publish("OutRobocrop", outbuffer);
  delay(2000);
}

void getDistance() {
  digitalWrite(TRIGGER, LOW);  
  delayMicroseconds(3); 
  
  digitalWrite(TRIGGER, HIGH);
  delayMicroseconds(12); 
  
  digitalWrite(TRIGGER, LOW);
  duration = pulseIn(ECHO, LOW);
  Serial.println(duration);
  distance= (duration/2)/29.1;

  Serial.print("Distance: ");
  Serial.println(distance);
}

void getLuminosity() {
  double RLDR, Vout;
  int ADC;
  ADC = analogRead (LDR);
  Vout = ((double)ADC * 0.00322265625);
  RLDR = (10000.0 * (3.3 - Vout))/Vout;
  luminosity = 500000.0/RLDR;
  Serial.print("Luminosity: ");
  Serial.println(luminosity);
}

void getMoisture() {
  moisture = digitalRead(PLAMO);
  Serial.print("Moisture: ");
  Serial.println(moisture);
}

void moveForward(){
  myservo.write(0);
  myservo2.write(180);
}

void moveBackward(){                               
    myservo.write(180);              // tell servo to go to position in variable 'pos' 
    myservo2.write(0); 
}

void moveRight(){                                  // in steps of 1 degree 
    myservo.write(0);              // tell servo to go to position in variable 'pos'
    myservo2.write(0); 
}

void moveLeft(){                              
    myservo.write(180);              // tell servo to go to position in variable 'pos' 
    myservo2.write(180);
}

void moveStop(){
  myservo.write(98);
  myservo2.write(90);
}

void getHumidity(){
  tempstart:
  temperature = dht.readTemperature(true);
  delay(10);
  if(isnan(temperature)){
    delay(100);
    goto tempstart;
  }
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" *F");

  humidstart:
  humidity = dht.readHumidity();
  delay(10);
  if (isnan(humidity)){
    delay(100);
    goto humidstart;
  }
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

}

void gobonkers(){
  moveRight();
  delay(600);
  moveStop();
  moveLeft();
  delay(1200);
  moveStop();
  moveRight();
  delay(600);
  moveStop();
  moveForward();
  delay(500);
  moveStop();
  moveBackward();
  delay(500);
  moveStop();
}

