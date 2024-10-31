import process from 'node:process'
import Kafka from 'node-rdkafka'


const topic = 'test-topic'

const consumer = new Kafka.KafkaConsumer({
  // --consumer-property rebalance.timeout.ms=4200
  // 'client.id': 'node-kafka',
  /**
   * Available strategies: range, roundrobin, cooperative-sticky.
   *   // --consumer-property partition.assignment.strategy=org.apache.kafka.clients.consumer.RangeAssignor
   * @default range,roundrobin
   */
  'partition.assignment.strategy': 'cooperative-sticky',
  'session.timeout.ms': 3500,
  'heartbeat.interval.ms': 3000,
  'max.poll.interval.ms': 3800,
  'group.id': 'test-consumer-group',
  'metadata.broker.list': 'kafka:9092',
  // 'rebalance_cb': true,
  // 'rebalance_cb': function (err, assignment) {
  //   console.log('\nrebalance_cb: ', err, assignment)
  //   try {
  //     if (err.code === Kafka.CODES.ERRORS.ERR__ASSIGN_PARTITIONS /* -175 */) {
  //       console.log('Assigning partitions:', assignment);
  //       this.assign(assignment);
  //     } else if (err.code === Kafka.CODES.ERRORS.ERR__REVOKE_PARTITIONS /* -174 */) {
  //       console.log('Revoking partitions:', assignment);
  //       this.unassign();
  //     } else {
  //       // We had a real error
  //       console.error(err);
  //     }
  //   } catch (e) {
  //     console.warn('rebalance.error', e)
  //     // Ignore exceptions if we are not connected
  //     if (this.isConnected()) {
  //       this.emit('rebalance.error', e);
  //     }
  //   }
  // }
}, {
  "auto.offset.reset": 'earliest'
});

let loggedAny = false
function logData(data) {
  if (loggedAny === false || Math.random() < 0.0001) {
    loggedAny = true
    console.log(data.partition.toString(), data.value.toString());
  }
}
consumer
  .on('ready', function() {
    consumer.subscribe([topic]);

    // Consume from the librdtesting-01 topic. This is what determines
    // the mode we are running in. By not specifying a callback (or specifying
    // only a callback) we get messages as soon as they are available.
    consumer.consume();
    console.log(`ready`);
  })
  .on('data', logData);
consumer.connect();

function handleQuit(signal) {
  console.log(`Received ${signal}`);
  loggedAny = false
  setTimeout(() => {
    // whoa! dev only!
    console.log(`dev exit 2`);
    process.exit(2)
  }, 10000)
  // consumer.pause([topic])
  consumer.unsubscribe()
  consumer.disconnect((err, data) => {
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
