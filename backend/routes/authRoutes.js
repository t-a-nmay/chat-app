import express from "express";
import { checkAuth, loginUser,registerUser, updateProfile } from "../controllers/authController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const userRouter=express.Router();

userRouter.post("/register",registerUser);
userRouter.post("/login",loginUser);
userRouter.put("/update-profile",protectRoute,updateProfile);
userRouter.get("/check",protectRoute,checkAuth);

export default userRouter;