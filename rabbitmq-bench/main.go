 package main

 import (
     "flag"
     "fmt"
     "log"
     "sync"
     "sync/atomic"
     "time"

     "github.com/streadway/amqp"
 )

 func main() {
     url := flag.String("url", "amqp://guest:guest@localhost:5672/", "AMQP connection URL")
     rate := flag.Int("rate", 100, "Messages per second for producers")
    duration := flag.Duration("duration", 0, "Duration of the test (0 for indefinite)")
     producers := flag.Int("producers", 1, "Number of concurrent producers")
     consumers := flag.Int("consumers", 1, "Number of concurrent consumers")
     size := flag.Int("size", 256, "Size of each message in bytes")
     exchangeName := flag.String("exchange", "bench-exchange", "Exchange name")
     queueName := flag.String("queue", "bench-queue", "Queue name")
     routingKey := flag.String("key", "bench-key", "Routing key")
     flag.Parse()

     conn, err := amqp.Dial(*url)
     if err != nil {
         log.Fatalf("Failed to connect to RabbitMQ: %v", err)
     }

     // Declare exchange and queue, and bind them
     ch, err := conn.Channel()
     if err != nil {
         log.Fatalf("Failed to open channel: %v", err)
     }
     if err := ch.ExchangeDeclare(*exchangeName, "direct", false, false, false, false, nil); err != nil {
         log.Fatalf("Exchange declare error: %v", err)
     }
     q, err := ch.QueueDeclare(*queueName, false, true, false, false, nil)
     if err != nil {
         log.Fatalf("Queue declare error: %v", err)
     }
     if err := ch.QueueBind(q.Name, *routingKey, *exchangeName, false, nil); err != nil {
         log.Fatalf("Queue bind error: %v", err)
     }

     // Counters
     var published int64
     var consumed int64

     // Start consumers
     var wgC sync.WaitGroup
     for i := 0; i < *consumers; i++ {
         wgC.Add(1)
         go func() {
             defer wgC.Done()
             cch, err := conn.Channel()
             if err != nil {
                 log.Printf("Consumer channel error: %v", err)
                 return
             }
             defer cch.Close()
             msgs, err := cch.Consume(q.Name, "", false, false, false, false, nil)
             if err != nil {
                 log.Printf("Consume error: %v", err)
                 return
             }
             for msg := range msgs {
                 atomic.AddInt64(&consumed, 1)
                 msg.Ack(false)
             }
         }()
     }

     // Start producers
     var wgP sync.WaitGroup
     interval := time.Second / time.Duration(*rate)
     body := make([]byte, *size)
     for i := range body {
         body[i] = 'x'
     }
    // done channel triggers when duration expires; nil for indefinite
    var done <-chan time.Time
    if *duration > 0 {
        done = time.After(*duration)
    }
     for i := 0; i < *producers; i++ {
         wgP.Add(1)
         go func() {
             defer wgP.Done()
             pch, err := conn.Channel()
             if err != nil {
                 log.Printf("Producer channel error: %v", err)
                 return
             }
             defer pch.Close()
             ticker := time.NewTicker(interval)
             defer ticker.Stop()
             for {
                 select {
                 case <-done:
                     return
                 case <-ticker.C:
                     if err := pch.Publish(*exchangeName, *routingKey, false, false, amqp.Publishing{
                         ContentType: "text/plain",
                         Body:        body,
                     }); err != nil {
                         log.Printf("Publish error: %v", err)
                     } else {
                         atomic.AddInt64(&published, 1)
                     }
                 }
             }
         }()
     }

     // Wait for producers to finish
     wgP.Wait()

     // Close connection to stop consumers
     conn.Close()

     // Wait for consumers to finish
     wgC.Wait()

     // Cleanup: delete queue and exchange
     cleanupConn, err := amqp.Dial(*url)
     if err != nil {
         log.Fatalf("Cleanup connection error: %v", err)
     }
     cleanupCh, err := cleanupConn.Channel()
     if err != nil {
         log.Fatalf("Cleanup channel error: %v", err)
     }
     _, _ = cleanupCh.QueueDelete(*queueName, false, false, false)
     _ = cleanupCh.ExchangeDelete(*exchangeName, false, false)
     cleanupConn.Close()

     fmt.Printf("Published: %d messages\n", published)
     fmt.Printf("Consumed: %d messages\n", consumed)
}