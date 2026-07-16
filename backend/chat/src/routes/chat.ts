import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { createNewChat } from "../controllers/chat.js";


const router = express.Router();

router.post("/chat/new", isAuth, createNewChat);

console.log("POST /chat/new registered");

export default router;