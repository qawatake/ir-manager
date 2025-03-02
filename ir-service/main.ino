#include <M5Core2.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <WebServer.h>  // HTTPサーバー用ライブラリ
#include <HTTPClient.h> // HTTPクライアント用ライブラリ
#include <IRrecv.h>
#include <IRsend.h>
#include <IRutils.h>
#include <Base64.h>         // Include Base64 library - Not used
#include <ArduinoJson.h>    // Include ArduinoJson library
#include <mbedtls/base64.h> // Include mbedtls base64 library

// WiFi credentials
const char *ssid = "wifi1";
const char *password = "12345678";

// HTTP endpoint
const char *httpEndpoint = "http://192.168.10.117:3001/irdata";

WiFiMulti wifiMulti;
WebServer server(80); // HTTPサーバーをポート80で起動

// IR Unit のピン設定 (Port B / GPIO26)
#define IR_RECV_PIN 33 // 受信用
#define IR_SEND_PIN 32 // 送信用

// 受信用オブジェクト
const uint16_t kMyCaptureBufferSize = 1024;
// 30ms以上必要なことが多い https://github.com/qawatake/m5core2-ir-manager/blob/723a695b1ef7785fcdb12571e125471e1eebde2e/main.ino#L29
// デフォルトは15msだった。
const uint8_t kMyTimeoutMs = 50;
IRrecv irrecv(IR_RECV_PIN, kMyCaptureBufferSize, kMyTimeoutMs, false);
decode_results results;

// 送信用オブジェクト
IRsend irsend(IR_SEND_PIN);

// Array to store the last 3 received IR data values
// 富士通エアコンのリモコンのデータは291コのデータがあったので、余裕を持たせて倍の600にしておく。
#define MAX_RAW_DATA_SIZE 600

// Function to handle HTTP POST requests
void handlePost()
{
  String body = server.arg("plain");
  Serial.print("body: " + body);
  Serial.println(" - end body"); // Add end marker

  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, body);
  if (error)
  {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.c_str());
    server.send(400, "text/plain", "Invalid JSON");
    return;
  }

  String encodedData = doc["data"];
  Serial.print("encodedData: " + encodedData);
  Serial.println(" - end encodedData"); // Add end marker

  // Decode base64 data
  size_t encodedLen = encodedData.length();
  uint8_t decoded[MAX_RAW_DATA_SIZE * 2]; // Adjust size as needed
  size_t decodedLen = 0;

  int ret = mbedtls_base64_decode(
      decoded,                                    // 出力バッファ
      sizeof(decoded),                            // バッファサイズ
      &decodedLen,                                // 出力データの長さが返る変数
      (const unsigned char *)encodedData.c_str(), // 入力Base64文字列
      encodedLen                                  // 入力文字列の長さ
  );

  if (ret != 0)
  {
    Serial.print("Base64 decode error: ");
    Serial.println(ret);
    server.send(400, "text/plain", "Base64 decode error");
    return;
  }

  Serial.print("Decoded data length: ");
  Serial.println(decodedLen);

  // Convert decoded data to uint16_t array
  uint16_t irData[decodedLen / 2];
  for (int i = 0; i < decodedLen / 2; i++)
  {
    irData[i] = (decoded[i * 2] << 8) | decoded[i * 2 + 1];
  }

  // Send IR signal
  irsend.sendRaw(irData, decodedLen / 2, 38); // Send raw data
  delay(500);                                 // Delay after sending
  irrecv.resume();                            // Clear receiver buffer

  server.send(200, "text/plain", "IR signal sent");
}

void handleRoot()
{
  server.send(200, "text/plain", "Hello from M5Stack Core2!");
}

void setup()
{
  M5.begin();
  Serial.begin(115200);

  M5.Lcd.setTextSize(2);
  M5.Lcd.println("Connecting to WiFi...");

  // 2.4GHzのAPを選択しないとだめだよ。
  wifiMulti.addAP(ssid, password);

  // WiFi接続を試みる
  while (wifiMulti.run() != WL_CONNECTED)
  {
    M5.Lcd.print(".");
    delay(1000);
  }

  // 接続成功した場合、情報を表示
  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setCursor(0, 20);
  M5.Lcd.println("WiFi connected!");
  M5.Lcd.print("IP Address: ");
  M5.Lcd..println(WiFi.localIP());

  // HTTPルートハンドラー設定
  server.on("/", handleRoot);
  server.on("/ir", HTTP_POST, handlePost);

  // HTTPサーバー開始
  server.begin();
  M5.Lcd.println("HTTP Server started.");

  M5.Lcd.println("IR Unit Ready!");

  // IR 受信開始
  irrecv.enableIRIn();

  // 送信用 GPIO の初期化
  irsend.begin();
}

void loop()
{
  M5.update();
  server.handleClient(); // クライアントリクエストを処理

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

    // Encode and send data
    if (results.rawlen <= MAX_RAW_DATA_SIZE)
    {
      uint16_t dataLength = getCorrectedRawLength(&results);
      Serial.println("results.rawlen: " + String(results.rawlen));
      Serial.println("Corrected data length: " + String(dataLength));
      uint16_t *rawData = resultToRawArray(&results);
      byte data[dataLength * 2]; // Each uint16_t is 2 bytes
      for (int i = 0; i < dataLength; i++)
      {
        uint16_t value = rawData[i];
        data[i * 2] = (value >> 8) & 0xFF;
        data[i * 2 + 1] = value & 0xFF;
      }

      String encoded = base64::encode(data, dataLength * 2);
      Serial.print("Received IR Signal (Base64): ");
      Serial.println(encoded);

      // Send data to HTTP endpoint
      WiFiClient client;
      HTTPClient http;

      http.begin(client, httpEndpoint);
      http.addHeader("Content-Type", "application/json");

      String httpRequestData = "{\"data\":\"" + encoded + "\"}";
      int httpResponseCode = http.POST(httpRequestData);

      if (httpResponseCode > 0)
      {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
      }
      else
      {
        Serial.print("Error code: ");
        Serial.println(httpResponseCode);
      }

      http.end();

      Serial.print(resultToHumanReadableBasic(&results));
      Serial.println(resultToSourceCode(&results));
    }

    delay(100);
  }
