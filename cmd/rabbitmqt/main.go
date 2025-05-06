package main

import (
	"embed"
	"io"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

//go:embed ui
var embeddedUI embed.FS

// Application version
const Version = "1.0"

// proxyRawHandler handles path-based proxying: forwards any method, headers, body, and query to the target URL.
func proxyRawHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
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
		return
	}
	// Create proxied request with same method and body
	proxReq, err := http.NewRequest(r.Method, parsedURL.String(), r.Body)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
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
		return
	}
	defer resp.Body.Close()
	// Copy response headers
	for key, values := range resp.Header {
		for _, v := range values {
			w.Header().Add(key, v)
		}
	}
	// Add CORS headers for proxied response
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Expose-Headers", "*")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func main() {
	log.Printf("rabbitmqt version %s", Version)
	// serve static files: from local ./ui if available, else from embedded assets
	var fileSystem http.FileSystem
	if stat, err := os.Stat("./ui"); err == nil && stat.IsDir() {
		fileSystem = http.Dir("./ui")
		log.Println("Serving UI from local ./ui directory")
	} else {
		subFS, err := fs.Sub(embeddedUI, "ui")
		if err != nil {
			log.Fatalf("failed to access embedded UI assets: %v", err)
		}
		fileSystem = http.FS(subFS)
		log.Println("Serving embedded UI assets")
	}

	// Create router and attach handlers
	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(fileSystem))
	// Proxy endpoint with CORS and logging middleware
	mux.Handle("/proxy/", loggingMiddleware(corsMiddleware(http.HandlerFunc(proxyRawHandler))))

	addr := ":8080"
	log.Printf("Starting server on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
