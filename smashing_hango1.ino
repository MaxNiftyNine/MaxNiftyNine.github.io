//sagar saini : hackster saini_sagar_7294 follow us on instagram, hackaday profile link:
//
//Universal IR Remote Controller

#include <IRremote.h>


IRsend irsend;






void setup() {

}

void loop() {
delay(1000);
      irsend.sendNEC(0x5583, 32); 
}