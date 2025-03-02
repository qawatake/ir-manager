package main

import (
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"os"
)

func main() {
	if err := run(); err != nil {
		log.Println(err)
	}
}

func run() error {
	dc := base64.NewDecoder(base64.StdEncoding, os.Stdin)
	b, err := io.ReadAll(dc)
	if err != nil {
		return err
	}
	// decode to []uint64
	// here is encoding code
	// for (int i = 1; i < results.rawlen; i++) {
	// 	data[(i - 1) * 2] = (results.rawbuf[i] >> 8) & 0xFF;
	// 	data[(i - 1) * 2 + 1] = results.rawbuf[i] & 0xFF;
	// }

	// decode to []uint64
	uintdata := make([]uint16, len(b)/2)
	for i := 0; i < len(uintdata); i++ {
		uintdata[i] = uint16(b[i*2])<<8 | uint16(b[i*2+1])
	}
	fmt.Printf("%v\n", uintdata)

	return nil
}
