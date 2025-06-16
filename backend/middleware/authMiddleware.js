// import jwt from 'jsonwebtoken'
// import User  from '../models/User.js'

// //middleware to protect routes
// export const protectRoute = async(req,res,next)=>{
//     try {
//         const token=req.headers.token;
//         const decoded=jwt.verify(token,process.env.JWT_SECRET);
//         const user=await User.findById(decoded.id).select("-password")
//         if(!user){
//             return res.status(401).json({message:"User not found"})
//         }
//         req.user=user;
//         next();
//     } catch (error) {
//         return res.status(401).json({message:"Unauthorized,Invalid token"})
//     }
// }

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectRoute = async (req, res, next) => {
    let token;

    // Check for token in the Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user and exclude password
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Unauthorized, invalid or expired token' });
        }
    } else {
        return res.status(401).json({ message: 'No token provided' });
    }
};
