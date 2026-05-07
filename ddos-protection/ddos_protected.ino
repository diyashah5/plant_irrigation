/*
 * IoT Smart Irrigation - DDoS Sensor Flooding Protection
 * For Educational Demonstration & Viva Presentation
 * 
 * Description: Demonstrates how to mitigate a resource exhaustion / sensor flooding attack
 * using Rate Limiting, Debouncing, and Input Validation on the edge device.
 */

const int relayPin = 3;  // Adjust if your pump relay is on a different pin

// Protection Variables
unsigned long lastReadingTime = 0;
const unsigned long rateLimitMs = 1000; // Only allow 1 reading per second (Rate Limiting)

int lastValidMoisture = -1;
int moistureStabilityCounter = 0;
const int stableReadingThreshold = 3; // Require 3 consistent readings before changing state (Debouncing)

unsigned long blockedRequests = 0;

void setup() {
  Serial.begin(9600);
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);
  
  Serial.println("System starting securely with DDoS Protection Enabled...");
  delay(2000); 
}

void loop() {
  unsigned long currentTime = millis();
  
  // 1. Simulate the attacker sending rapid, malicious data
  int incomingMoisture = random(0, 2); 
  
  // 2. RATE LIMITING PROTECTION (Mitigates Flooding)
  // Check if enough time has passed since the last processed reading
  if (currentTime - lastReadingTime >= rateLimitMs) {
    lastReadingTime = currentTime;
    
    // 3. DEBOUNCING / VALIDATION (Mitigates Erratic Hardware Behavior)
    // Only accept the reading if it has stabilized (prevents rapid relay toggling)
    if (incomingMoisture == lastValidMoisture) {
      moistureStabilityCounter++;
    } else {
      lastValidMoisture = incomingMoisture;
      moistureStabilityCounter = 1; // Reset counter for new state
    }
    
    // 4. Actuate Hardware ONLY if data is valid and stable
    if (moistureStabilityCounter >= stableReadingThreshold) {
      int safePumpState = lastValidMoisture;
      
      // Formatting matches your server.js expected format: "moisture,pump"
      Serial.print(lastValidMoisture);
      Serial.print(",");
      Serial.println(safePumpState);
      
      if (lastValidMoisture == 1) {
        digitalWrite(relayPin, HIGH); // Trigger Pump ON
      } else {
        digitalWrite(relayPin, LOW);  // Trigger Pump OFF
      }
      
      // Reset counter to prevent continuous triggering on the same state
      moistureStabilityCounter = 0; 
    } else {
      // Data is rate-limited but not yet stable enough to actuate hardware
      Serial.println("STATUS: Evaluating sensor stability...");
    }
    
  } else {
    // Attack detected! The request came in too fast.
    blockedRequests++;
    
    // Periodically log blocked attacks to avoid overloading the serial monitor
    if (blockedRequests % 500 == 0) {
      Serial.print("🛡️ PROTECTION ACTIVE: Blocked ");
      Serial.print(blockedRequests);
      Serial.println(" flooding requests.");
    }
  }
  
  // High-frequency loop simulating the constant bombardment of data
  delay(10); 
}
