#include <M5Core2.h>
#include <mbedtls/base64.h>

void setup() {
  // M5Core2の初期化
  M5.begin();
  Serial.begin(115200);
  delay(1000);

  // Base64エンコードされた文字列（例："Hello, world!\n"）
  const char *encodedStr = "SGVsbG8sIHdvcmxkIQo=";
  size_t encodedLen = strlen(encodedStr);

  // デコード結果を格納するバッファ（適宜サイズを調整）
  uint8_t decoded[64];
  size_t decodedLen = 0;

  // Base64デコードの実行
  int ret = mbedtls_base64_decode(
    decoded,         // 出力バッファ
    sizeof(decoded), // バッファサイズ
    &decodedLen,     // 出力データの長さが返る変数
    (const unsigned char*)encodedStr, // 入力Base64文字列
    encodedLen       // 入力文字列の長さ
  );

  if (ret != 0) {
    Serial.print("Base64 decode error: ");
    Serial.println(ret);
    M5.Lcd.println("Base64 decode error");
  } else {
    // 文字列として扱うためにヌル終端を追加（バッファサイズ内の場合）
    if (decodedLen < sizeof(decoded)) {
      decoded[decodedLen] = '\0';
    } else {
      decoded[sizeof(decoded)-1] = '\0';
    }
    Serial.println("Decoded string:");
    Serial.println((char*)decoded);
    M5.Lcd.println("Decoded string:");
    M5.Lcd.println((char*)decoded);
  }
}

void loop() {
  // ループ処理は不要
}
