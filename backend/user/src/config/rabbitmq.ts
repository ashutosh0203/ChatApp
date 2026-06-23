import ampq from 'amqplib';

let channel: ampq.Channel;

export const connectRabbitMQ = async () => {
    try{
        const connection = await ampq.connect({
            protocol: 'amqp',
            hostname: process.env.Rabbitmq_HOST!,
            port: 5672,
            username: process.env.Rabbitmq_Username!,
            password: process.env.Rabbitmq_Password!,
        });
        channel = await connection.createChannel();
        console.log("✅ Connected to RabbitMQ");
    }catch(err){
        console.error("Error connecting to RabbitMQ:", err);
    }

}

export const publishToQueue = async (queueName: string, message: any) => {
    if(!channel){
        console.error(" RabbitMQ Channel is not initialized. Cannot publish message.");
        return;
    }

    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
}