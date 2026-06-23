import amqp from 'amqplib';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const startSendOtpConsumer = async () => {
    try{
        const connection = await amqp.connect({
            protocol: 'amqp',
            hostname: process.env.Rabbitmq_HOST!,
            port: 5672,
            username: process.env.Rabbitmq_Username!,
            password: process.env.Rabbitmq_Password!,
        });
        const channel = await connection.createChannel();
        const queueName = 'send-otp';

        await channel.assertQueue(queueName, { durable: true });

        console.log(`✅ Mail service consumer started, Listening for messages otp`);

        channel.consume(queueName, async (msg) => {
            if(msg){
                try{
                    const {to, subject, body} = JSON.parse(msg.content.toString());
                    // Create a transporter using your email service credentials
                    const transporter = nodemailer.createTransport({
                        host: 'smtp.gmail.com', // Replace with your email service host
                        port: 465,
                        auth: {
                            user: process.env.USER,
                            pass: process.env.PASSWORD,
                        },
                    });

                    await transporter.sendMail({
                        from: 'ChatApp',
                        to,
                        subject,
                        text: body,
                    });

                    console.log(`✅ Email sent to ${to} with subject: ${subject}`);
                    channel.ack(msg);
                }catch(err){
                    console.error("Failed to send otp", err);
                }
            }
        })
    }catch(err){
        console.error("Failed to start rabbitmq consumer:", err);
    }
}