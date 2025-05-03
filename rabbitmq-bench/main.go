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
// Rate of messages per second for producers (0 for no throttling/unlimited)
rate := flag.Int("rate", 0, "Messages per second for producers (0 for no limit)")
	duration := flag.Duration("duration", 0, "Duration of the test (0 for indefinite)")
	producers := flag.Int("producers", 1, "Number of concurrent producers")
	consumers := flag.Int("consumers", 1, "Number of concurrent consumers")
	// Message size (bytes) – larger sizes increase RabbitMQ CPU usage
	size := flag.Int("size", 4096, "Size of each message in bytes")
	// Exchange settings – use topic or fanout for heavier routing CPU load
	exchangeType := flag.String("exchange-type", "direct", "AMQP exchange type (direct, topic, fanout)")
	exchangeName := flag.String("exchange", "bench-exchange", "Base exchange name")
	queueName := flag.String("queue", "bench-queue", "Base queue name")
   routingKey := flag.String("key", "bench-key", "Base routing key")
   // Publisher confirms: wait for broker ack/nack for each published message
   publisherConfirm := flag.Bool("publisher-confirm", false, "Enable publisher confirms")
   // Consumer confirms: manual acknowledgments for consumed messages
   consumerConfirm := flag.Bool("consumer-confirm", false, "Enable manual consumer acknowledgments (consumer confirms)")
	flag.Parse()

	// Wait for RabbitMQ to become available
	var conn *amqp.Connection
	for {
		c, err := amqp.Dial(*url)
		if err != nil {
			log.Printf("Waiting for RabbitMQ at %s: %v", *url, err)
			time.Sleep(time.Second)
			continue
		}
		conn = c
		break
	}

   // Declare exchanges and queues for each producer/consumer pair
   ch, err := conn.Channel()
   if err != nil {
       log.Fatalf("Failed to open channel: %v", err)
   }
   // Determine number of pairs based on producers and consumers
   numPairs := *producers
   if *consumers > numPairs {
       numPairs = *consumers
   }
   for i := 0; i < numPairs; i++ {
       ex := fmt.Sprintf("%s-%d", *exchangeName, i)
       qu := fmt.Sprintf("%s-%d", *queueName, i)
       key := fmt.Sprintf("%s-%d", *routingKey, i)
       // Declare exchange with configured type (direct/topic/fanout)
       if err := ch.ExchangeDeclare(ex, *exchangeType, false, false, false, false, nil); err != nil {
           log.Fatalf("Exchange declare error for %s (type %s): %v", ex, *exchangeType, err)
       }
       if _, err := ch.QueueDeclare(qu, false, true, false, false, nil); err != nil {
           log.Fatalf("Queue declare error for %s: %v", qu, err)
       }
       if err := ch.QueueBind(qu, key, ex, false, nil); err != nil {
           log.Fatalf("Queue bind error for %s: %v", qu, err)
       }
   }

	// Counters
   var published int64
   var consumed int64

  // done channel triggers when duration expires; nil for indefinite
  var done <-chan time.Time
  if *duration > 0 {
      done = time.After(*duration)
  }

   // Start consumers: one dedicated connection per consumer
   var wgC sync.WaitGroup
   consumerConns := make([]*amqp.Connection, *consumers)
   for i := 0; i < *consumers; i++ {
       idx := i
       // Dial a separate connection for this consumer
       cconn, err := amqp.Dial(*url)
       if err != nil {
           log.Printf("Consumer %d dial error: %v", idx, err)
           continue
       }
       consumerConns[idx] = cconn
       cch, err := cconn.Channel()
       if err != nil {
           log.Printf("Consumer %d channel error: %v", idx, err)
           cconn.Close()
           continue
       }
       queue := fmt.Sprintf("%s-%d", *queueName, idx)
       autoAck := !*consumerConfirm
       msgs, err := cch.Consume(queue, "", autoAck, false, false, false, nil)
       if err != nil {
           log.Printf("Consumer %d consume error: %v", idx, err)
           cch.Close()
           cconn.Close()
           continue
       }
       wgC.Add(1)
       go func(idx int, msgs <-chan amqp.Delivery) {
           defer wgC.Done()
           for {
               select {
               case <-done:
                   return
               case msg, ok := <-msgs:
                   if !ok {
                       return
                   }
                   if *consumerConfirm {
                       if err := msg.Ack(false); err != nil {
                           log.Printf("Consumer %d ack error: %v", idx, err)
                       }
                   }
                   atomic.AddInt64(&consumed, 1)
               }
           }
       }(idx, msgs)
   }

	// Start producers
	var wgP sync.WaitGroup
	// Calculate interval if rate > 0 (rate == 0 => unthrottled)
	var interval time.Duration
	if *rate > 0 {
		interval = time.Second / time.Duration(*rate)
	}
	body := make([]byte, *size)
	for i := range body {
		body[i] = 'x'
	}
   for i := 0; i < *producers; i++ {
       idx := i
       wgP.Add(1)
       go func() {
           defer wgP.Done()
           // Each producer gets its own connection to allow parallel publishing
           pconn, err := amqp.Dial(*url)
           if err != nil {
               log.Printf("Producer dial error: %v", err)
               return
           }
           defer pconn.Close()
           pch, err := pconn.Channel()
           if err != nil {
               log.Printf("Producer channel error: %v", err)
               return
           }
           defer pch.Close()
           // Determine exchange and routing key for this producer
           ex := fmt.Sprintf("%s-%d", *exchangeName, idx)
           key := fmt.Sprintf("%s-%d", *routingKey, idx)
           // Enable publisher confirms if requested
           var confirmChan <-chan amqp.Confirmation
           if *publisherConfirm {
               if err := pch.Confirm(false); err != nil {
                   log.Printf("Producer %d: confirmation mode setup error: %v", idx, err)
                   return
               }
               confirmChan = pch.NotifyPublish(make(chan amqp.Confirmation, 1))
           }

           // Publishing loop: throttled if rate > 0, else as fast as possible
           if *rate > 0 {
               ticker := time.NewTicker(interval)
               defer ticker.Stop()
               for {
                   select {
                   case <-done:
                       return
                   case <-ticker.C:
                       if err := pch.Publish(ex, key, false, false, amqp.Publishing{
                           ContentType: "text/plain",
                           Body:        body,
                       }); err != nil {
                           log.Printf("Publish error: %v", err)
                       } else if *publisherConfirm {
                           // wait for broker confirm
                           conf := <-confirmChan
                           if conf.Ack {
                               atomic.AddInt64(&published, 1)
                           } else {
                               log.Printf("Publish nack for exchange=%s key=%s", ex, key)
                           }
                       } else {
                           atomic.AddInt64(&published, 1)
                       }
                   }
               }
           } else {
               for {
                   if done != nil {
                       select {
                       case <-done:
                           return
                       default:
                       }
                   }
                   if err := pch.Publish(ex, key, false, false, amqp.Publishing{
                       ContentType: "text/plain",
                       Body:        body,
                   }); err != nil {
                       log.Printf("Publish error: %v", err)
                   } else if *publisherConfirm {
                       conf := <-confirmChan
                       if conf.Ack {
                           atomic.AddInt64(&published, 1)
                       } else {
                           log.Printf("Publish nack for exchange=%s key=%s", ex, key)
                       }
                   } else {
                       atomic.AddInt64(&published, 1)
                   }
               }
           }
       }()
   }
	// Report progress of producers and consumers every second
	go func() {
		ticker := time.NewTicker(time.Second)
		defer ticker.Stop()
		for range ticker.C {
			pub := atomic.LoadInt64(&published)
			cons := atomic.LoadInt64(&consumed)
			log.Printf("Progress: published=%d, consumed=%d", pub, cons)
		}
	}()

	// Wait for producers to finish
	wgP.Wait()

   // Close consumer connections to stop consumers
   for _, cconn := range consumerConns {
       if cconn != nil {
           cconn.Close()
       }
   }

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
   // Cleanup queues and exchanges for each pair
   for i := 0; i < numPairs; i++ {
       qu := fmt.Sprintf("%s-%d", *queueName, i)
       _, _ = cleanupCh.QueueDelete(qu, false, false, false)
       ex := fmt.Sprintf("%s-%d", *exchangeName, i)
       _ = cleanupCh.ExchangeDelete(ex, false, false)
   }
	cleanupConn.Close()

	fmt.Printf("Published: %d messages\n", published)
	fmt.Printf("Consumed: %d messages\n", consumed)
}
