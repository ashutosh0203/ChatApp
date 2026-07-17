import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { createNewChat, getAllChats, sendMessage,getMessagesByChat } from "../controllers/chat.js";
import {upload} from "../middlewares/mutler.js";


const router = express.Router();

router.post("/chat/new", isAuth, createNewChat);
router.get("/chat/all", isAuth, getAllChats);
router.post("/message", isAuth, upload.single("image"), sendMessage);
router.get("/message/:chatId", isAuth, getMessagesByChat);

// console.log("POST /chat/new registered");

export default router;