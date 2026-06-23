import tryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";

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