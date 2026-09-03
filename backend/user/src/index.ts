import  Express  from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import {createClient} from 'redis';
import userRoutes from './routes/user.js';
import { connectRabbitMQ } from "./config/rabbitmq.js";
import cors from "cors";

dotenv.config();

connectDb();

connectRabbitMQ();

export const redisClient = createClient({
    url: process.env.REDIS_URL!,
});

redisClient
  .connect()
  .then(() => console.log("connected to redis"))
  .catch(console.error);

const app = Express();

app.use(Express.json());
app.use(cors());




app.use('/api/v1', userRoutes);


const port = process.env.PORT || 5000;

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});
