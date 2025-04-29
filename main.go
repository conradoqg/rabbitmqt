package main

import (
   "bytes"
   "encoding/base64"
   "encoding/json"
   "io"
   "log"
   "net/http"
   "net/url"
   "time"
)

// ProxyRequest defines the payload for proxy requests
type ProxyRequest struct {
   URL      string            `json:"url"`
   Method   string            `json:"method"`
   User     string            `json:"user"`
   Password string            `json:"password"`
   Headers  map[string]string `json:"headers,omitempty"`
   Body     string            `json:"body,omitempty"`
}

// proxyHandler handles proxying HTTP requests with basic auth and CORS
func proxyHandler(w http.ResponseWriter, r *http.Request) {
   addCORS(w)
   if r.Method == http.MethodOptions {
       w.WriteHeader(http.StatusOK)
       return
   }
   if r.Method != http.MethodPost {
       http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
       return
   }
   var req ProxyRequest
   if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
       http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
       return
   }
   parsedURL, err := url.Parse(req.URL)
   if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
       http.Error(w, "Invalid URL", http.StatusBadRequest)
       return
   }
   method := req.Method
   if method == "" {
       method = http.MethodGet
   }
   var bodyReader io.Reader
   if req.Body != "" {
       bodyReader = bytes.NewBufferString(req.Body)
   }
   proxReq, err := http.NewRequest(method, req.URL, bodyReader)
   if err != nil {
       http.Error(w, err.Error(), http.StatusInternalServerError)
       return
   }
   if req.User != "" {
       proxReq.Header.Set("Authorization", "Basic "+basicAuth(req.User, req.Password))
   }
   for key, value := range req.Headers {
       proxReq.Header.Set(key, value)
   }
   client := &http.Client{Timeout: 30 * time.Second}
   resp, err := client.Do(proxReq)
   if err != nil {
       http.Error(w, "Upstream error: "+err.Error(), http.StatusBadGateway)
       return
   }
   defer resp.Body.Close()
   for key, values := range resp.Header {
       for _, v := range values {
           w.Header().Add(key, v)
       }
   }
   w.WriteHeader(resp.StatusCode)
   io.Copy(w, resp.Body)
}

// addCORS sets CORS headers to allow cross-origin access
func addCORS(w http.ResponseWriter) {
   w.Header().Set("Access-Control-Allow-Origin", "*")
   w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
   w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
   w.Header().Set("Access-Control-Expose-Headers", "*")
}

// basicAuth returns base64 encoded credentials for HTTP Basic Auth
func basicAuth(user, pass string) string {
   creds := user + ":" + pass
   return base64.StdEncoding.EncodeToString([]byte(creds))
}

func main() {
   // serve static files from current directory
   http.Handle("/", http.FileServer(http.Dir(".")))
   // handle proxy requests
   http.HandleFunc("/proxy", proxyHandler)
   log.Println("Starting server on :8080")
   if err := http.ListenAndServe(":8080", nil); err != nil {
       log.Fatal(err)
   }
}