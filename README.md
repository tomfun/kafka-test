# Kafka Docker Setup with Dynamic Rebalancing

This project sets up a minimal **Apache Kafka** environment using **Docker Compose** for testing consumer and producer scaling with automatic rebalancing. The setup includes **Kafka**, **Zookeeper**, multiple **producers** and **consumers**, and customized configurations to observe Kafka’s behavior under constrained resources.

## Purpose

1. **Deploy Kafka in a lightweight, resource-limited environment**: Testing Kafka's performance on minimal resources to observe CPU and memory usage under load.
2. **Dynamically scale consumers and producers**: Adding and removing consumers/producers to trigger rebalances, allowing us to evaluate Kafka’s group coordination and rebalancing.
3. **Monitor consumer group rebalancing**: Understanding the impact of partition configurations and consumer group properties on rebalancing behavior.

## How It Works

- **Kafka and Zookeeper**: Zookeeper coordinates broker metadata and partition assignments. Kafka brokers manage topics, partitions, and handle producer/consumer data flow.
- **Consumers and Producers in Groups**: Consumers are assigned to a group (`test-consumer-group`) to enable load balancing. We add and remove consumers dynamically to simulate scaling.
- **Forced Rebalancing**: To ensure even distribution of partitions, consumers are restarted periodically or stopped and replaced, triggering rebalancing through Kafka's Group Coordinator.
- **Partition Adjustments**: Partition counts are adjusted dynamically to match the number of consumers, enabling each consumer to handle separate data streams.

## Key Commands

- **Start Consumers/Producers**: Run `add_consumer` or `add_producer` to add more consumers or producers.
- **Manual Rebalance**: Stop all consumers and restart them to force a rebalance, or alter the partition count to trigger redistribution.

This setup provides a controlled environment to analyze Kafka’s rebalancing and performance under resource constraints.
