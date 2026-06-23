import tryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import {User} from "../model/User.js";
import { generateToken } from "../config/generateToken.js";

import { publishToQueue } from "../config/rabbitmq.js";

export const loginUser = tryCatch(async (req, res) => {
    const { email } = req.body;

    const rateLimitKey = `otp:rateLimit:${email}`;
    const rateLimit = await redisClient.get(rateLimitKey);
    if(rateLimit){
        res.status(429).json({message: "Too many requests. Please try again later."});
        return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpKey = `otp:${email}`;
    await redisClient.set(otpKey, otp, { EX: 300 }); // Set OTP with 5-minute expiration
    await redisClient.set(rateLimitKey, "1", { EX: 60 }); // Set rate limit key with 1-minute expiration

    const message = {
        to: email,
        subject: "Your OTP Code",
        body: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    };
    await publishToQueue("send-otp", message);

    res.status(200).json({ message: "OTP sent successfully."})
})

export const verifyUser= tryCatch(async (req, res) => {
    // console.log("verifyUser called with body:", req.body);
    const { email, otp:enteredOtp } = req.body;

    if(!email || !enteredOtp){
        res.status(400).json({message: "Email and OTP are required."});
        return;
    }

    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);


    if(!storedOtp || storedOtp !== enteredOtp){
        res.status(400).json({message: "OTP has expired or is invalid."});
        return;
    }

    await redisClient.del(otpKey); // Delete the OTP after successful verification

    let user = await User.findOne({ email });

    if(!user){
        const name = email.slice(0,8); // Extract the first 8 characters of the email as the name
        user = await User.create({ name,email });
    }
    const token = generateToken(user);

    res.json({
        message: "User verified successfully.",
        token,
        user
    })
})