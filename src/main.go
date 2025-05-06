package main

import (
	"embed"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

//go:embed ui
var embeddedUI embed.FS

// addCORS sets CORS headers to allow cross-origin access
func addCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Expose-Headers", "*")
}

// loggingResponseWriter wraps http.ResponseWriter to capture status code and bytes written
type loggingResponseWriter struct {
	writer     http.ResponseWriter
	statusCode int
	bytes      int
}

func (lrw *loggingResponseWriter) Header() http.Header {
	return lrw.writer.Header()
}

func (lrw *loggingResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.writer.WriteHeader(code)
}

func (lrw *loggingResponseWriter) Write(b []byte) (int, error) {
	if lrw.statusCode == 0 {
		lrw.statusCode = http.StatusOK
	}
	n, err := lrw.writer.Write(b)
	lrw.bytes += n
	return n, err
}

// logAccess logs HTTP requests in a combined log format, similar to NGINX access logs
func logAccess(r *http.Request, status, size int, start time.Time) {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	timestamp := time.Now().Format("02/Jan/2006:15:04:05 -0700")
	referer := r.Referer()
	ua := r.UserAgent()
	log.Printf("%s - - [%s] \"%s %s %s\" %d %d \"%s\" \"%s\"",
		host, timestamp, r.Method, r.RequestURI, r.Proto, status, size, referer, ua)
}

// proxyRawHandler handles path-based proxying: forwards any method, headers, body, and query to the target URL.
func proxyRawHandler(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	lrw := &loggingResponseWriter{writer: w}
	w = lrw
	addCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		logAccess(r, lrw.statusCode, lrw.bytes, start)
		return
	}
	// Determine target URL from raw request URI to preserve encoded characters (e.g., %2F).
	raw := r.RequestURI
	// Trim the /proxy/ prefix, then fix any double-encoded slashes (%252F -> %2F)
	rawTarget := strings.TrimPrefix(raw, "/proxy/")
	rawTarget = strings.ReplaceAll(rawTarget, "%252F", "%2F")
	var targetURL string
	if strings.HasPrefix(rawTarget, "http:/") {
		targetURL = "http://" + strings.TrimPrefix(rawTarget, "http:/")
	} else if strings.HasPrefix(rawTarget, "https:/") {
		targetURL = "https://" + strings.TrimPrefix(rawTarget, "https:/")
	} else {
		targetURL = "https://" + rawTarget
	}
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		http.Error(w, "Invalid proxy URL: "+err.Error(), http.StatusBadRequest)
		logAccess(r, lrw.statusCode, lrw.bytes, start)
		return
	}
	// Create proxied request with same method and body
	proxReq, err := http.NewRequest(r.Method, parsedURL.String(), r.Body)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		logAccess(r, lrw.statusCode, lrw.bytes, start)
		return
	}
	// Copy incoming headers, except Host
	for name, values := range r.Header {
		if strings.ToLower(name) == "host" {
			continue
		}
		for _, v := range values {
			proxReq.Header.Add(name, v)
		}
	}
	proxReq.Host = parsedURL.Host
	// Determine proxy timeout: default to 5 minutes, override via PROXY_TIMEOUT env var (e.g., "2m", "120s")
	proxyTimeout := 5 * time.Minute
	if env := os.Getenv("PROXY_TIMEOUT"); env != "" {
		if d, err := time.ParseDuration(env); err == nil {
			proxyTimeout = d
		} else {
			log.Printf("Invalid PROXY_TIMEOUT '%s', using default %v: %v", env, proxyTimeout, err)
		}
	}
	client := &http.Client{Timeout: proxyTimeout}
	resp, err := client.Do(proxReq)
	if err != nil {
		http.Error(w, "Upstream error: "+err.Error(), http.StatusBadGateway)
		logAccess(r, lrw.statusCode, lrw.bytes, start)
		return
	}
	defer resp.Body.Close()
	// Copy response headers and status
	for key, values := range resp.Header {
		for _, v := range values {
			w.Header().Add(key, v)
		}
	}
	// Ensure CORS headers are present
	addCORS(w)
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
	logAccess(r, lrw.statusCode, lrw.bytes, start)
}

func main() {
	// serve static files: from local ./ui if available, else from embedded assets
	var fileSystem http.FileSystem
	if stat, err := os.Stat("./ui"); err == nil && stat.IsDir() {
		fileSystem = http.Dir("./ui")
		log.Println("Serving UI from local ./ui directory")
	} else {
		// serve embedded UI assets
		subFS, err := fs.Sub(embeddedUI, "ui")
		if err != nil {
			log.Fatalf("failed to access embedded UI assets: %v", err)
		}
		fileSystem = http.FS(subFS)
		log.Println("Serving embedded UI assets")
	}
	http.Handle("/", http.FileServer(fileSystem))
	// handle path-based proxying for any upstream URL under /proxy/
	http.HandleFunc("/proxy/", proxyRawHandler)
	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
