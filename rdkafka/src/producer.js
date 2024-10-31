import process from 'node:process'
import Kafka from 'node-rdkafka'


const topic = 'test-topic'

const producer = new Kafka.Producer({
  'metadata.broker.list': 'kafka:9092',
  'retry.backoff.ms': 200,
  'message.send.max.retries': 5,
  'socket.keepalive.enable': true,
  'queue.buffering.max.messages': 1000,
  'queue.buffering.max.ms': 1000,
  'batch.num.messages': 5000,
}, {
  "compression.type": 'none'
});

const stats = [0, 0, Date.now()]

function sendItem() {
  try {
    producer.produce(
      // Topic to send the message to
      topic,
      // optionally we can manually specify a partition for the message
      // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
      null,
      // Message to send. Must be a buffer
      Buffer.from((new Date()).toISOString()),
      // for keyed messages, we also specify the key - note that this field is optional
      null,
      // you can send a timestamp here. If your broker version supports it,
      // it will get added. Otherwise, we default to 0
      Date.now(),
      // you can send an opaque token here, which gets passed along
      // to your delivery reports
    );
    stats[0] = stats[0] + 1
  } catch (err) {
    console.log('A problem occurred when sending our message', err);
    stats[1] = stats[1] + 1
  }
  producer.flush()
  const time = (Date.now() - stats[2]) / 1000
  if ( time < 10 ) {
    return
  }
  console.log('stats', (stats[0] / time).toFixed(2), (stats[1] / time).toFixed(2))
  stats[0] = 0
  stats[1] = 0
  stats[2] = Date.now()
}
let produceInterval
let produceIntervalMs = 0
// Wait for the ready event before proceeding
producer.on('ready', function() {
  produceInterval = setInterval(sendItem, produceIntervalMs)
});

// Any errors we encounter, including connection errors
producer.on('event.error', function(err) {
  console.error('Error from producer');
  console.error(err);
})
producer.connect();
producer.setPollInterval(1000);

producer.on('delivery-report', function(err, report) {
  console.log(report);
});

function handleSpeed(signal) {
  console.log(`Received ${signal}`);
  const isUp = signal === 'SIGHUP' || signal === 'SIGUSR1'
  if (isUp) {
    produceIntervalMs++
  } else {
    produceIntervalMs--
  }
  console.log('new produce interval: ', produceIntervalMs)
  clearInterval(produceInterval)
  produceInterval = setInterval(sendItem, produceIntervalMs)
}
function handleQuit(signal) {
  console.log(`Received ${signal}`);
  clearInterval(produceInterval)
  produceInterval = false
  producer.disconnect(9999, (err, data) => {
    if (err) {
      console.error(`disconnect error: `, err);
      process.exit(1)
    } else {
      console.log(`disconnected`, data);
    }
  })
}

process.on('SIGINT', handleQuit);
process.on('SIGTERM', handleQuit);
process.on('SIGHUP', handleSpeed);
process.on('SIGUSR1', handleSpeed);
process.on('SIGUSR2', handleSpeed);
