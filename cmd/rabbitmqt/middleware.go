package main

import (
	"log"
	"net"
	"net/http"
	"time"
)

// responseLogger captures the status code and response size.
type responseLogger struct {
	http.ResponseWriter
	statusCode int
	bytes      int
}

// WriteHeader captures the status code.
func (rl *responseLogger) WriteHeader(code int) {
	rl.statusCode = code
	rl.ResponseWriter.WriteHeader(code)
}

// Write captures the response size.
func (rl *responseLogger) Write(b []byte) (int, error) {
	if rl.statusCode == 0 {
		rl.statusCode = http.StatusOK
	}
	n, err := rl.ResponseWriter.Write(b)
	rl.bytes += n
	return n, err
}

// loggingMiddleware logs HTTP requests after they are handled.
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rl := &responseLogger{ResponseWriter: w}
		next.ServeHTTP(rl, r)
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			host = r.RemoteAddr
		}
		timestamp := time.Now().Format("02/Jan/2006:15:04:05 -0700")
		referer := r.Referer()
		ua := r.UserAgent()
		log.Printf("%s - - [%s] \"%s %s %s\" %d %d \"%s\" \"%s\"",
			host, timestamp, r.Method, r.RequestURI, r.Proto, rl.statusCode, rl.bytes, referer, ua)
	})
}

// corsMiddleware adds CORS headers and handles preflight requests.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Expose-Headers", "*")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
