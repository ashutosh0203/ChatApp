import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use("/api/v1", chatRoutes);
console.log("Chat routes loaded");

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})