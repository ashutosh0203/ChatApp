import  Express  from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";

const app = Express();

dotenv.config();
connectDb();


const port = process.env.PORT || 5000;

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});
