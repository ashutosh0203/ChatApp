import { getReceiverSocketId, io } from "../config/socket.js";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Message } from "../models/Messages.js";
import axios from "axios";

export const createNewChat = TryCatch(async(req:AuthenticatedRequest, res) => {
    const  userId = req.user?._id;
    const {otherUserId} = req.body;

    if(!otherUserId){
        res.status(400).json({message: "Other User Id are required"});
        return;
    }

    const existingChat = await Chat.findOne({
        users: { $all: [userId, otherUserId],$size: 2 }, 
    }) 

    if(existingChat){
        res.status(200).json({message: "Chat already exists", chatId:  existingChat._id});
        return;
    }

    const newChat = await Chat.create({
        users: [userId, otherUserId]
    });

    res.status(201).json({message: "New Chat created successfully", chatId:  newChat._id});
});

export const getAllChats = TryCatch(async(req:AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    if(!userId) {
        res.status(400).json({message: "User Id is required"});
        return;
    }
    
    const chats = await Chat.find({
        users: userId
    }).sort({ updatedAt: -1 });

    const chatWithUserData = await Promise.all(chats.map(async(chat) => {
        const otherUserId = chat.users.find(id => id !== userId);

        const unseenCount = await  Message.countDocuments({
            chatId: chat._id,
            seen: false,
            sender: { $ne: userId }
        });

        try{
            const {data} = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

            return{
                user: data,
                chat:{
                    ...chat.toObject(),
                    latestMessage: chat.latestMessage || null,
                    unseenCount,
                },
            }
        }catch(err){
            console.error("Error fetching user data:", err);

            return{
                user:{_id: otherUserId, name: "Unknown User"},
                chat:{
                    ...chat.toObject(),
                    latestMessage: chat.latestMessage || null,
                    unseenCount,
                },
            }
        }
    }))

    res.status(200).json({ chats: chatWithUserData });
});

export const sendMessage = TryCatch(async(req:AuthenticatedRequest, res) => {
    const senderId = req.user?._id;
    const {chatId, text} = req.body;
    const imageFile = req.file;

    if(!senderId){
        res.status(401).json({message: "Unauthorized"});
        return;
    }
    if(!chatId){
        res.status(400).json({message: "Chat Id is required"});
        return;
    }
    if(!text && !imageFile){
        res.status(400).json({message: "Message text or image is required"});
        return;
    }

    const chat = await Chat.findById(chatId);
    if(!chat){
        res.status(404).json({message: "Chat not found"});
        return;
    }

    const isUserInChat = chat.users.some(
        (userId) => userId.toString() === senderId.toString()
    )

    if(!isUserInChat){
        res.status(403).json({message: "You are not a participant of this chat"});
        return;
    }

    const otherUserId = chat.users.find(
        (userId) => userId.toString() !== senderId.toString()
    );

    if(!otherUserId){
        res.status(401).json({message: "No other user found in this chat"});
        return;
    }

    // socket setup
    const receiverSocketId = getReceiverSocketId(otherUserId.toString());
    let isReceiverInChatRoom = false;
    if(receiverSocketId){
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        if(receiverSocket && receiverSocket.rooms.has(chatId)){
            isReceiverInChatRoom = true;
        }
        
    }

    let messageData: any = {
        chatId: chatId,
        sender: senderId,
        seen: isReceiverInChatRoom,
        seenAt: isReceiverInChatRoom? new Date(): undefined,
    }
    if(imageFile){
        messageData.image = {
            url: imageFile.path,
            publicId: imageFile.filename, 
        };
        messageData.text = text || "";
        messageData.messageType = "image";
    }else{
        messageData.text = text;
        messageData.messageType = "text";
    }

    const message = new Message(messageData); //Messages

    const savedMessage = await message.save();

    const latestMessageText = imageFile? "📷 Image": text

    await Chat.findByIdAndUpdate(chatId, {
        latestMessage: {
            text: latestMessageText,
            sender: senderId,
        },
        updatedAt: new Date(),
     },
     {new: true}
    );

    //emit to socket server
    io.to(chatId).emit("newMessage", savedMessage);

    if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage", savedMessage);
    }

    const senderSocketId = getReceiverSocketId(senderId.toString());
    if(senderSocketId){
        io.to(senderSocketId).emit("newMessage", savedMessage);
    }

    if(isReceiverInChatRoom && senderSocketId){
        io.to(senderSocketId).emit("messagesSeen",{
            chatId: chatId,
            seenBy: otherUserId,
            messageIds: [savedMessage._id],
        })
    }

    res.status(201).json({
        message: savedMessage,
        sender: senderId,
    })
});

export const getMessagesByChat = TryCatch(async(req:AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const {chatId} = req.params;

    if(!userId){
        res.status(401).json({message: "User Id is required"});
        return;
    }
    if(!chatId){
        res.status(400).json({message: "Chat Id is required"});
        return;
    }

    const chat = await Chat.findById(chatId);
    if(!chat){
        res.status(404).json({message: "Chat not found"});
        return;
    }

    const isUserInChat = chat.users.some(
        (userId) => userId.toString() === userId.toString()
    )

    if(!isUserInChat){
        res.status(403).json({message: "You are not a participant of this chat"});
        return;
    }

    const messagesToMarkSeen = await Message.find({
        chatId: chatId,
        seen: false,
        sender: { $ne: userId }
    });

    await Message.updateMany({
        chatId: chatId,
        seen: false,
        sender: { $ne: userId }
    }, {
        seen: true,
        seenAt: new Date()
    });
    const messages = await Message.find({chatId: chatId}).sort({createdAt: 1});
    const otherUserId = chat.users.find((id) => id !== userId);

    try{

        const {data} = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

        if(!otherUserId){
            res.status(400).json({message: "Other user not found"});
            return;
        }


        //socket work
        if(messagesToMarkSeen.length > 0){
            const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
            if(otherUserSocketId){
                io.to(otherUserSocketId).emit("messagesSeen",{
                    chatId: chatId,
                    seenBy: userId,
                    messageIds: messagesToMarkSeen.map((msg) => msg._id),
                })
            }
        }

        res.status(200).json({
            messages,
            user: data,
        })

    }catch(err){
        console.error("Error fetching user data:", err);
        res.json({
            messages,
            user: {_id: otherUserId, name: "Unknown User"},
        })
    }


})