import  Express  from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import {createClient} from 'redis';

const app = Express();

dotenv.config();
connectDb();

export const redisClient = createClient({
    url: process.env.REDIS_URL!,
});

redisClient.connect().then(()=>{
    console.log("Connected to Redis");
}).catch((err)=>{
    console.error("Error connecting to Redis:", err);
    process.exit(1);
});

const port = process.env.PORT || 5000;

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});
