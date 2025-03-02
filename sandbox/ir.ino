#include <M5Core2.h>
#include <IRrecv.h>
#include <IRsend.h>
#include <IRutils.h>
#include <Base64.h> // Include Base64 library

// IR Unit のピン設定 (Port B / GPIO26)
#define IR_RECV_PIN 33 // 受信用
#define IR_SEND_PIN 32 // 送信用

// 受信用オブジェクト
IRrecv irrecv(IR_RECV_PIN);
decode_results results;

// 送信用オブジェクト
IRsend irsend(IR_SEND_PIN);

// Array to store the last 3 received IR data values
#define MAX_RAW_DATA_SIZE 128
#define IR_DATA_HISTORY_SIZE 3
uint16_t irDataHistory[IR_DATA_HISTORY_SIZE][MAX_RAW_DATA_SIZE];
uint8_t irDataLengthHistory[IR_DATA_HISTORY_SIZE];
int historyIndex = 0;

void setup()
{
  M5.begin();
  Serial.begin(115200);

  M5.Lcd.setTextSize(2);
  M5.Lcd.println("IR Unit Ready!");

  // IR 受信開始
  irrecv.enableIRIn();

  // 送信用 GPIO の初期化
  irsend.begin();
}

void loop()
{
  M5.update();

  delay(50); // Add a short delay before decoding

  // 赤外線信号を受信
  if (irrecv.decode(&results))
  {
    M5.Lcd.clear();
    M5.Lcd.setCursor(0, 20);
    M5.Lcd.println("Received IR Signal!");

    // 受信データを LCD & シリアルに表示
    M5.Lcd.printf("Raw Data: 0x%X\n", results.value);
    Serial.print("Received IR Signal: 0x");
    Serial.println(results.value, HEX);

    // Convert to base64
    unsigned long rawData = results.value;
    byte data[4];
    data[0] = (rawData >> 24) & 0xFF;
    data[1] = (rawData >> 16) & 0xFF;
    data[2] = (rawData >> 8) & 0xFF;
    data[3] = rawData & 0xFF;

    String encoded = base64::encode(data, 4);
    Serial.print("Received IR Signal (Base64): ");
    Serial.println(encoded);

    Serial.print(resultToHumanReadableBasic(&results));

// String description = IRAcUtils::resultAcToString(&results);
// if (description.length())
//{
//     Serial.println(D_STR_MESGDESC ": " + description);
// }
#define D_STR_MESGDESC "Description"

    Serial.println(resultToSourceCode(&results));

    // Add debugging code to print raw data
    Serial.print("results.rawlen: ");
    Serial.println(results.rawlen);
    Serial.print("results.rawbuf: ");
    for (int i = 0; i < results.rawlen; i++)
    {
      Serial.print(results.rawbuf[i] * 2);
      Serial.print(", ");
    }
    Serial.println();

    // Store the received data in the history
    if (results.rawlen <= MAX_RAW_DATA_SIZE)
    {
      irDataLengthHistory[historyIndex] = results.rawlen - 1;
      for (int i = 1; i < results.rawlen; i++)
      {
        irDataHistory[historyIndex][i - 1] = results.rawbuf[i] * 2;
      }
      historyIndex = (historyIndex + 1) % IR_DATA_HISTORY_SIZE;
    }

    irrecv.resume(); // 次のデータを受信できるようにする

    // Add debugging code to print history data
    Serial.println("irDataHistory:");
    for (int j = 0; j < IR_DATA_HISTORY_SIZE; j++)
    {
      Serial.print("  History ");
      Serial.print(j);
      Serial.print(" (length ");
      Serial.print(irDataLengthHistory[j]);
      Serial.print("): ");
      Serial.print(": ");
      for (int i = 0; i < irDataLengthHistory[j]; i++)
      {
        Serial.print(irDataHistory[j][i]);
        Serial.print(", ");
      }
      Serial.println();
    }
    Serial.print("historyIndex: ");
    Serial.println(historyIndex);
  }

  if (M5.BtnA.wasPressed())
  {
    Serial.println("Button A pressed, sending IR signal (Recent)!");
    uint8_t dataLength = irDataLengthHistory[(historyIndex - 1 + IR_DATA_HISTORY_SIZE) % IR_DATA_HISTORY_SIZE];
    uint16_t *data = irDataHistory[(historyIndex - 1 + IR_DATA_HISTORY_SIZE) % IR_DATA_HISTORY_SIZE];

    Serial.print("Raw data: ");
    for (int i = 0; i < dataLength; i++)
    {
      Serial.print(data[i]);
      Serial.print(", ");
    }
    Serial.println();
    irsend.sendRaw(data, dataLength, 38); // Send raw data
    delay(500);                           // Delay after sending
    irrecv.resume();                      // Clear receiver buffer
  }

  if (M5.BtnB.wasPressed())
  {
    Serial.println("Button B pressed, sending IR signal (2nd Recent)!");
    uint8_t dataLength = irDataLengthHistory[(historyIndex - 2 + IR_DATA_HISTORY_SIZE) % IR_DATA_HISTORY_SIZE];
    uint16_t *data = irDataHistory[(historyIndex - 2 + IR_DATA_HISTORY_SIZE) % IR_DATA_HISTORY_SIZE];

    Serial.print("Raw data: ");
    for (int i = 0; i < dataLength; i++)
    {
      Serial.print(data[i]);
      Serial.print(", ");
    }
    Serial.println();
    irsend.sendRaw((uint16_t *)data, dataLength, 38); // Send raw data
    delay(500);                                       // Delay after sending
    irrecv.resume();                                  // Clear receiver buffer
  }

  if (M5.BtnC.wasPressed())
  {
    Serial.println("Button C pressed, sending IR signal (3rd Recent)!");
    uint8_t dataLength = irDataLengthHistory[(historyIndex - 3 + IR_DATA_HISTORY_SIZE) % IR_DATA_HISTORY_SIZE];
    uint16_t *data = irDataHistory[(historyIndex - 3 + IR_DATA_HISTORY_SIZE) % IR_DATA_HISTORY_SIZE];

    Serial.print("Raw data: ");
    for (int i = 0; i < dataLength; i++)
    {
      Serial.print(data[i]);
      Serial.print(", ");
    }
    Serial.println();
    irsend.sendRaw((uint16_t *)data, dataLength, 38); // Send raw data
    delay(500);                                       // Delay after sending
    irrecv.resume();                                  // Clear receiver buffer
  }

  delay(100);
}
