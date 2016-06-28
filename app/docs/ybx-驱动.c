//#defi
#include <Makeblock.h>
#include <Arduino.h>
#include <SoftwareSerial.h>
#include <Wire.h>
MePotentiometer myPotentiometer(PORT_7);

Me4Button btn(PORT_8);
 uint8_t head0 = 0xFA;
 uint8_t head1 = 0XAF;
 uint8_t id;
 uint8_t command;
 uint8_t parameter1H = 0;
 uint8_t parameter1L = 0;
 uint8_t parameter2H = 0;
 uint8_t parameter2L = 0;
 uint8_t verify;
 uint8_t endprotocol = 0XED;
 //uint8_t pack[10] = {head0,head1,id,command,parameter1H,parameter1L,parameter2H,parameter2L,verify,endprotocol};
void setup()
{
  Serial.begin(115200);
  ledon(0);
}
void loop()
{
  switch(btn.pressed()){
    case KEY1: parameter1H =240;protocol();break;
    case KEY2: parameter1H =180;protocol();break;
    case KEY3: parameter1H =90;protocol();break;
    case KEY4: parameter1H =0;protocol();break;
  }
  delay(10);
  parameter1L = myPotentiometer.read()/10;  // (0-1024)/10
}

void protocol()
{
  id = 1;
  command = 0X01;
//  parameter1L = 12;
  parameter2H = 0;
  parameter2L =0;
 // parameter2H
  verify = id+command+parameter1H+parameter1L+parameter2H+parameter2L;
  uint8_t pack[10] = {head0,head1,id,command,parameter1H,parameter1L,parameter2H,parameter2L,verify,endprotocol};
  Serial.write(pack,10);
}
void ledon(uint8_t i)
{
  id = 1;
  command = 0X04;
  parameter1L = i;
  parameter2H = 0;
  parameter2L =0;
 // parameter2H
  verify = id+command+parameter1H+parameter1L+parameter2H+parameter2L;
  uint8_t pack[10] = {head0,head1,id,command,parameter1H,parameter1L,parameter2H,parameter2L,verify,endprotocol};
  Serial.write(pack,10);
}