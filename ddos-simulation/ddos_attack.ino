/*
 * IoT Smart Irrigation - DDoS Sensor Flooding Simulation
 * For Educational Demonstration & Viva Presentation
 * 
 * Description: Simulates a resource exhaustion / sensor flooding attack 
 * by injecting rapid, randomized, fake sensor data to overload the system.
 */

const int relayPin = 3;  // Adjust if your pump relay is on a different pin
unsigned long attackCount = 0;

void setup() {
  Serial.begin(9600);
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);
  
  // Brief startup delay for presentation purposes
  Serial.println("System starting normally...");
  delay(2000); 
  
  Serial.println("⚠️ WARNING: Malicious Traffic Detected...");
  Serial.println("🚨 Initiating Sensor Flooding Attack in 3 seconds...");
  delay(3000);
}

void loop() {
  // 1. Generate fake, malicious soil moisture readings (0 = Wet, 1 = Dry)
  // We use random() to cause maximum instability and erratic switching
  int fakeMoisture = random(0, 2); 
  int fakePumpState = fakeMoisture; 
  
  // 2. Flood the Serial connection to overwhelm the Node.js backend
  // Formatting matches your server.js expected format: "moisture,pump"
  Serial.print(fakeMoisture);
  Serial.print(",");
  Serial.println(fakePumpState);
  
  // 3. Cause unstable hardware behavior (Rapid relay switching)
  // This will make a very loud and obvious clicking noise on your physical relay module
  if (fakeMoisture == 1) {
    digitalWrite(relayPin, HIGH); // Trigger Pump ON
  } else {
    digitalWrite(relayPin, LOW);  // Trigger Pump OFF
  }
  
  attackCount++;
  
  // 4. Print attack logs to the Serial Monitor every 50 loops
  if (attackCount % 50 == 0) {
    Serial.println("CRITICAL: Flooding request detected!");
    Serial.println("CRITICAL: Fake sensor spike injected!");
    Serial.println("CRITICAL: System overloaded!");
  }
  
  // 5. High-frequency loop with no delay to simulate a massive traffic flood
  // 10ms = 100 requests per second. This will choke the serial buffer.
  delay(10); 
}
