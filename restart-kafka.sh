#!/usr/bin/env bash
set -e

# Остановка и удаление существующих контейнеров Kafka и Zookeeper
docker compose down -v --remove-orphans || echo "Нет запущенных контейнеров Kafka"

# Запуск контейнеров Kafka и Zookeeper в фоновом режиме
docker compose up -d kafka zookeeper

# Ограничение ресурсов для контейнера Kafka
docker update --cpus=2 --memory=350m --memory-swap=500m kafka-test-kafka-1
docker update --cpus=0.5 --memory=200m --memory-swap=200m kafka-test-zookeeper-1

sleep 3
kafka_setup="docker compose run --rm kafka-setup "
$kafka_setup kafka-topics.sh --create --topic test-topic --bootstrap-server kafka:9092 --partitions 12 --replication-factor 1 --config retention.bytes=8000000

function add_producer() {
    kafka_producer_cid=$(docker compose run --rm --detach kafka-producer)
    docker update --cpus=2 --memory=150m --memory-swap=250m $kafka_producer_cid
}
for i in {1..2}
do
  add_producer
  echo "+ producer: $i - $kafka_producer_cid"
done


function add_consumer() {
#    kafka_consumer_cid=$(docker compose run --rm --detach kafka-consumer)
    kafka_consumer_cid=$(docker compose run --rm --detach kafka-node-consumer)
    docker update --cpus=1 --memory=150m --memory-swap=250m $kafka_consumer_cid
}
consumer_ids=()
for i in {1..8}
do
  if [ $i -ne 1 ]; then
    $kafka_setup kafka-topics.sh --alter --topic test-topic --partitions $i --bootstrap-server kafka:9092
  fi
  add_consumer
  consumer_ids+=("$kafka_consumer_cid")
  echo "+ consumer: $i - $kafka_consumer_cid"
  if [ $i -ne 1 ]; then
    sleep 5
    docker logs --tail 2 $kafka_consumer_cid
  fi
done

echo "---- Consumer Logs ----"
for i in {1..1000}
do
  for consumer_id in "${consumer_ids[@]}"
  do
    echo -n "Container ID: $consumer_id "
    docker logs --tail 1 "$consumer_id"
  done
  sleep 1
done

exit 0


echo -e "Rebalance\n"
consumer_size=${#consumer_ids[@]}
new_consumer_ids=()
for i in "${!consumer_ids[@]}"
do
    add_consumer
    new_consumer_ids+=("$kafka_consumer_cid")
    echo "+ consumer: $((i+consumer_size+1)) - $kafka_consumer_cid"
    sleep 5

    for consumer_id in "${consumer_ids[@]}"
    do
      echo -n "~Container ID: $consumer_id "
      docker logs --tail 1 "$consumer_id"
    done
    for consumer_id in "${new_consumer_ids[@]}"
    do
      echo -n "+Container ID: $consumer_id "
      docker logs --tail 1 "$consumer_id"
    done

    docker stop "${consumer_ids[i]}"
    echo "- consumer: $((i+1)) - ${consumer_ids[i]}"
    unset 'consumer_ids[i]'
done
consumer_ids=("${new_consumer_ids[@]}")

$kafka_setup kafka-topics.sh --describe --topic test-topic --bootstrap-server kafka:9092
$kafka_setup kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group test-consumer-group

echo "---- Consumer Logs ----"
for i in {1..300}
do
  for consumer_id in "${consumer_ids[@]}"
  do
    echo -n "Container ID: $consumer_id "
    docker logs --tail 1 "$consumer_id"
  done
  sleep 1
done
