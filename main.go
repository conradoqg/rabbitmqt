package main

import (
   "io"
   "log"
   "net/http"
   "net/url"
   "strings"
   "time"
)



// addCORS sets CORS headers to allow cross-origin access
func addCORS(w http.ResponseWriter) {
   w.Header().Set("Access-Control-Allow-Origin", "*")
   w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
   w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
   w.Header().Set("Access-Control-Expose-Headers", "*")
}


// proxyRawHandler handles path-based proxying: forwards any method, headers, body, and query to the target URL.
func proxyRawHandler(w http.ResponseWriter, r *http.Request) {
   addCORS(w)
   if r.Method == http.MethodOptions {
       w.WriteHeader(http.StatusOK)
       return
   }
   // Determine target URL from path: strip "/proxy/"
   targetPath := strings.TrimPrefix(r.URL.Path, "/proxy/")
   var targetURL string
   if strings.HasPrefix(targetPath, "http://") || strings.HasPrefix(targetPath, "https://") {
       targetURL = targetPath
   } else {
       targetURL = "https://" + targetPath
   }
   if r.URL.RawQuery != "" {
       targetURL += "?" + r.URL.RawQuery
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
   client := &http.Client{Timeout: 30 * time.Second}
   resp, err := client.Do(proxReq)
   if err != nil {
       http.Error(w, "Upstream error: "+err.Error(), http.StatusBadGateway)
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
}

func main() {
   // serve static files from current directory
   http.Handle("/", http.FileServer(http.Dir(".")))
   // handle path-based proxying for any upstream URL under /proxy/
   http.HandleFunc("/proxy/", proxyRawHandler)
   log.Println("Starting server on :8080")
   if err := http.ListenAndServe(":8080", nil); err != nil {
       log.Fatal(err)
   }
}