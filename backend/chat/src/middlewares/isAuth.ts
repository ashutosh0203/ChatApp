import type { NextFunction, Request, Response } from "express"
import jwt, { type JwtPayload } from "jsonwebtoken";

interface Iuser extends Document {
    _id: string;
    name: string;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user?: Iuser | null;
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({ message: "Please Login - No Authorization Header " });
            return;
        }
        const token = authHeader.split(" ")[1];

        const decodedValue =  jwt.verify(token!, process.env.JWT_SECRET as string) as JwtPayload;
        
        if(!decodedValue || !decodedValue.user){
            res.status(401).json({message: "Invalid token"});
            return;
        }

        req.user = decodedValue.user;
        next();
    }catch(err){
        res.status(401).json({message: "Please Login - JWT  Error"});
        
    }
}

export default isAuth;