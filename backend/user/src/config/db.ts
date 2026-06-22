import mongoose from "mongoose";

const connectDb = async () => {
    const url = process.env.MONGO_URI;

    if(!url){
        throw new Error("MONGO_URI is not defined in environment variables");
    }
    try{
        await mongoose.connect(url,{
            dbName:"chatAppmicroserviceapp",
        });
        console.log("Connected to MongoDB");
    }
    catch(err){
        console.error("Error connecting to MongoDB:", err);
        throw err;
        process.exit(1);
    }
};