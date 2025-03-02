#include <M5Core2.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <WebServer.h>  // HTTPサーバー用ライブラリ

WiFiMulti wifiMulti;
WebServer server(80);  // HTTPサーバーをポート80で起動

void handleRoot() {
    server.send(200, "text/plain", "Hello from M5Stack Core2!");
}

void setup() {
    M5.begin();
    M5.lcd.println("Connecting to WiFi...");

    // 2.4GHzのAPを選択しないとだめだよ。
    wifiMulti.addAP("wifi1", "12345678");

    // WiFi接続を試みる
    while (wifiMulti.run() != WL_CONNECTED) {
        M5.lcd.print(".");
        delay(1000);
    }

    // 接続成功した場合、情報を表示
    M5.lcd.fillScreen(BLACK);
    M5.lcd.setCursor(0, 20);
    M5.lcd.println("WiFi connected!");
    M5.lcd.print("IP Address: ");
    M5.lcd.println(WiFi.localIP());

    // HTTPルートハンドラー設定
    server.on("/", handleRoot);

    // HTTPサーバー開始
    server.begin();
    M5.lcd.println("HTTP Server started.");
}

void loop() {
    server.handleClient();  // クライアントリクエストを処理
}
