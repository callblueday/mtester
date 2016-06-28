
private final int START_SYSEX            = 0xF0; // start a MIDI SysEx message
private final int END_SYSEX              = 0xF7; // end a MIDI SysEx message
private final int ASSIGN_ID              = 0x10; // command assign id
private final int START_ID               = 0x00;  // master control ,start ID = 0,fist servo =1 ect...
private final int PROCESS_SUC            = 0x0F;
private final int PROCESS_BUSY           = 0x10;
private final int PROCESS_ERROR          = 0x11;
private final int WRONG_TYPE_OF_SERVICE  = 0x12;
private final int CTL_SET_BAUD_RATE      = 0x13;
private final int SERVO_TYPE             = 0x70;
private final int GET_SPEED              = 0x23;
private final int GET_POSITION           = 0x22;
private final int GET_TEMPRATURE         = 0x25;
private final int GET_VOLTAGE            = 0x27;
private final int GET_CURRENT            = 0x26;//************************************
private final int CTL_ERROR_CODE         = 0x1F;//************************************
private final int NUMAMOSTRAS            = 5;   // Number of samples
private final int TEMPERATURENOMINAL     = 25; ///Nominl temperature depicted on the datasheet
private final int SERIESRESISTOR         = 10000; // Value of the series resistor
private final int BCOEFFICIENT           = 3377; //// Beta value for our thermistor(3350-3399)
private final int TERMISTORNOMINAL       = 10000;// Nominal temperature value for the thermistor
private final int SET_SERVO_ABSOLUTE_POS = 0x11;
private final int SELFDETECT_MODE        = 0x01;
private final int ASK_MODE               = 0x00;
private final int AUTO_MODE              = 0x02;
private final int SET_SERVO_BREAK        = 0x16;
private final int BAUD_SWITCH_921600     = 0x01;
private final int BAUD_SWITCH_115200     = 0x00;


// test data:::::::::

   long send_wrong_type = 0,send_process_wrong = 0,send_busy = 0,send_success = 0;


void InitSerial(int baud_rate)
{
  myPort.clear();
  myPort.stop();
  myPort = new Serial(this, "COM2", baud_rate);
}
class smart_Servo {
  public int  pos_from_servo,
  speed_from_servo,
  ID;
  public float voltage_from_servo, temp_from_servo, current_from_servo;
  smart_Servo(int id, int limit_min, int limit_max)
  {
    ID = id;
    pos_from_servo = (limit_min + limit_max)/2;
    temp_from_servo = 30;
    speed_from_servo = 0;
    voltage_from_servo = 0;
    current_from_servo = 0;
  }
  smart_Servo()
  {
  }
  void servo_test_command(int id)
  {
    myPort.write(START_SYSEX);
    myPort.write(id);
    myPort.write(0x14);
    myPort.write(0x01);
    myPort.write(0x02);
    myPort.write(0x03);
    myPort.write(0x04);
    myPort.write(0x05);
    myPort.write(0xf7);
   }
   void print_n()
   {
     print("Success:"+send_success+"  Wrong:"+(send_wrong_type+send_process_wrong+send_busy)+ " ");
     println(" send_wrong_type:"+send_wrong_type+" send_process_wrong:"+send_process_wrong+" send_busy:"+send_busy);
   }
  void switch_to_1M()
  {
    //f0 ff 13 01 f7
    myPort.write(START_SYSEX);
    myPort.write(0xff);
    myPort.write(CTL_SET_BAUD_RATE);
    myPort.write(BAUD_SWITCH_921600);
    myPort.write(0xf7);
    InitSerial(921600);
    println("1M");
  }
  void  switch_to_10K()
  {
    //f0 ff 13 00 f7
    myPort.write(START_SYSEX);
    myPort.write(0xff);
    myPort.write(CTL_SET_BAUD_RATE);
    myPort.write(BAUD_SWITCH_115200);
    myPort.write(0xf7);
    InitSerial(115200);
        println("10K");

  }
  int receive_Short(byte []data, int id)
  {
    int[] temp1 = new int [6], temp2 = new int [6], temp = new int [6];
    temp1[id] = data[4]&0x7F;
    temp[id] = (data[5]<<7) & 0x80;
    temp1[id] |= temp[id];
    temp2[id] = (data[5]>>1)&0x7F;
    temp[id] = data[6] << 6;
    temp2[id] |= temp[id];
    //println(temp2+"  "+temp1);
    return (((temp2[id]&0xff)<<8)  + temp1[id]);
  }
  int receive_Short(byte []data)
  {
    int temp1, temp2, temp;
    temp1 = data[4]&0x7F;//4
    temp= (data[5]<<7) & 0x80;//5
    temp1 |= temp;
    temp2= (data[5]>>1)&0x7F;//5
    temp = data[6] << 6;//6
    temp2 |= temp;
    //println(temp2+"  "+temp1);
    //print("Receive short "+data[0]+":"+ data[1]+":"+data[2]+" ");
    return (((temp2&0xff)<<8)  + temp1);
  }
  int receive_Short_test(byte []data)
  {
    int temp1, temp2, temp;
    temp1 = data[0]&0x7F;//4
    temp= (data[1]<<7) & 0x80;//5
    temp1 |= temp;
    temp2= (data[1]>>1)&0x7F;//5
    temp = data[2] << 6;//6
    temp2 |= temp;
    //println(temp2+"  "+temp1);
    //print("Receive short "+data[0]+":"+ data[1]+":"+data[2]+" ");
    return (((temp2&0xff)<<8)  + temp1);
  }
  void send_Short(int val)
  {
    byte [] val_7bit = new byte [3];
    //val_7bit[2] = {0,0,0};
    byte temp0, temp1;
    temp0 =  (byte)(val & 0xfF);//low byte
    temp1 =  (byte)((val >> 8) & 0xFF);// high byte
    val_7bit[0] = (byte)((temp0&0xff) & 0x7f);
    myPort.write(val_7bit[0]);
    val_7bit[1] = (byte)((((temp1&0xff) << 1) | ((temp0&0xff) >> 7)) & 0x7f);
    myPort.write(val_7bit[1]);
    val_7bit[2] = (byte)((temp1 >> 6) & 0x7f);
    myPort.write(val_7bit[2]);
    // println("Send short "+hex(val_7bit[0]) + ","+hex(val_7bit[1])+","+hex(val_7bit[2])+"  ");
    // println( temp0 + "," +  temp1 );
    //print("  "+ val+"  ");
    //println(this.receive_Short_test(val_7bit));
  }
  void assignID()
  {
    myPort.write(START_SYSEX);//assign f0 ff 10 00 7f f7
    myPort.write(0xff);
    myPort.write(ASSIGN_ID);
    myPort.write(START_ID);
    myPort.write(0x7f);
    myPort.write(END_SYSEX);
    byte[] assign_id_back = new byte[5]; // back f0 01 10 70 f7
    while (myPort.available () > 0) {
      assign_id_back = myPort.readBytes();
      myPort.readBytes(assign_id_back);
      if (assign_id_back != null) {
        //String myString = new String(inBuffer);
        // println(hex(inBuffer[4]));
        //println(assign_id_back[0]);
        switch (assign_id_back[0])
        {
          case (byte)PROCESS_SUC :
          println("Assigned ID success!");
          break;
          case (byte)PROCESS_BUSY:
          println("Servos are busy!");
          break;
          case (byte)PROCESS_ERROR:
          println("Something Wrong While Assigns!");
          break;
          case (byte)WRONG_TYPE_OF_SERVICE:
          println("Wrong Type of Service!");
          break;
        }
        //        if (assign_id_back[3] == (byte)SERVO_TYPE )
        //        {
        //          println("Yes!");
        //         // println((assign_id_back[1]&0x7f) + " Servos on the UART Bus");
        //        }
      }
    }
  }
  void go_To(int pos, int speed)
  {
    myPort.write(START_SYSEX);
    myPort.write(this.ID & 0xFF);
    myPort.write(SERVO_TYPE);
    myPort.write(SET_SERVO_ABSOLUTE_POS );
    send_Short(pos);
    send_Short(speed);
    myPort.write(END_SYSEX);
  }
  void get_Pos()
  {
    myPort.write(START_SYSEX);
    myPort.write(this.ID & 0xFF);
    myPort.write(SERVO_TYPE);
    myPort.write(GET_POSITION);
    myPort.write(END_SYSEX);
  }
  void get_Speed()
  {
    myPort.write(START_SYSEX);
    myPort.write(this.ID & 0xFF);
    myPort.write(SERVO_TYPE);
    myPort.write(GET_SPEED);
    myPort.write(END_SYSEX);
  }

  void get_Voltage()
  {
    myPort.write(START_SYSEX);
    myPort.write(this.ID & 0xFF);
    myPort.write(SERVO_TYPE);
    myPort.write(GET_VOLTAGE);
    myPort.write(END_SYSEX);
  }
  void get_Current()
  {
    // byte[] current_back = new byte[8]; // back f0 01 10 70 f7
    myPort.write(START_SYSEX);
    myPort.write(this.ID & 0xFF);
    myPort.write(SERVO_TYPE);
    myPort.write(GET_CURRENT);
    myPort.write(END_SYSEX);
  }
  void get_Tempreture()
  {
    myPort.write(START_SYSEX);
    myPort.write(this.ID & 0xFF);
    myPort.write(SERVO_TYPE);
    myPort.write(GET_TEMPRATURE);
    myPort.write(END_SYSEX);
  }
  void set_Report_Mode( int mode, int report_type)
  {
    myPort.write(START_SYSEX);
    myPort.write(this.ID);
    myPort.write(SERVO_TYPE);
    myPort.write(report_type);
    myPort.write(mode);                // self_detect // ask  // auto // ask default
    myPort.write(END_SYSEX);
  }
  void set_Servo_Coast(  int isCoast )
  {
    myPort.write(START_SYSEX);
    myPort.write(this.ID);
    myPort.write(SERVO_TYPE);
    myPort.write(SET_SERVO_BREAK);
    myPort.write(isCoast&0xff);            //
    myPort.write(END_SYSEX);
  }
  float calculate_temp(int In_temp)
  {
    float media;
    media = In_temp;
    // Convert the thermal stress value to resistance
    media = 4095 / media - 1;
    media = SERIESRESISTOR / media;
    //Calculate temperature using the Beta Factor equation
    float temperatura;
    temperatura = media / TERMISTORNOMINAL;       // (R/Ro)
    temperatura = log(temperatura);               // ln(R/Ro)
    temperatura /= BCOEFFICIENT;                   // 1/B * ln(R/Ro)
    temperatura += 1.0 / (TEMPERATURENOMINAL + 273.15); // + (1/To)
    temperatura = 1.0 / temperatura;                 // Invert the value
    temperatura -= 273.15;                         // Convert it to Celsius

    //    print("The sensor temperature is: ");
    //    print(temperatura);
    //    println(" *C");
    return temperatura;
  }
  //void handle_receive()
  //  {
  //    int inf_from_servo=0;
  //    byte[] inf_back = new byte[8]; // back f0 01 10 70 f7
  //    while (myPort.available () > 0) {
  //      inf_back = myPort.readBytes();
  //      myPort.readBytes(inf_back);
  //      if (inf_back != null) {
  //        try {
  //          if ((inf_back[0] == (byte)START_SYSEX) && (inf_back[1] == (byte)this.ID) && (inf_back[2] == (byte)CTL_ERROR_CODE))
  //          {            send_sucess = 0;
  //
  //            switch(inf_back[3])//switch error code!
  //            {
  //              case (byte)PROCESS_SUC :
  //              iqw = iqw+1;
  //
  //              //println("Servo report Success!"+ iqw);
  //              send_sucess = 1;
  //              break;
  //              case (byte)PROCESS_BUSY:
  //              println("Servos are busy!");
  //              break;
  //              case (byte)PROCESS_ERROR:
  //              println("Something Wrong While Assigns!");
  //              break;
  //              case (byte)WRONG_TYPE_OF_SERVICE:
  //              println("Wrong Type of Service!");
  //              break;
  //            }
  //          }
  //          if ((inf_back[0] == (byte)START_SYSEX) && (inf_back[1] == (byte)this.ID) && (inf_back[2] == (byte)SERVO_TYPE))
  //          {
  //            switch(inf_back[3]) //process get command
  //            {
  //              case (byte)GET_POSITION:
  //              this.pos_from_servo = this.receive_Short(inf_back );
  //              break;
  //              case (byte)GET_SPEED:
  //              this.speed_from_servo = this.receive_Short(inf_back );
  //              break;
  //              case (byte)GET_TEMPRATURE:
  //              this.temp_from_servo = calculate_temp(this.receive_Short(inf_back ));
  //              break;
  //              case (byte)GET_CURRENT:
  //              this.current_from_servo = this.receive_Short(inf_back );
  //              break;
  //              case (byte)GET_VOLTAGE:
  //              this.voltage_from_servo = this.receive_Short(inf_back )*TO_VOLTAGE;
  //              break;
  //            }
  //          }
  //        }
  //        catch (Exception e)
  //        {
  //          //*********************************************************
  //        }
  //      }
  //    }
  //    //return inf_from_servo;
  //  }
}

