import { generateToken } from "../lib/utils.js";
import User from "../models/User.js"
import cloudinary from '../lib/cloudinary.js'
import bcrypt from 'bcryptjs'

//Signup a new user
export const registerUser=async(req,res)=>{
    const{fullName,email,password,profilePic,bio}=req.body;
    if(!fullName || !email || !password ){
        return res.status(400).json({message:"Please fill in all fields"});
    }
    try{
        //Check if user already exists
        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"Email already exists"})
        }

        //Hash password
        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)


        //create new user
        const newUser=await User.create({
            fullName,
            email,
            password:hashedPassword,
            profilePic,
            bio
        })

        const token=generateToken(newUser);
        res.status(201).json({message:"User created successfully",newUser,token})
        
    } catch(err){
        res.status(500).json({message:"Error creating user",error:err.message})
    }
}


//login an existing user
export const loginUser=async(req,res)=>{
    try {
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({message:"All Fields are required"});
        }
        const user=await User.findOne({email});
        const isPasswordCorrect=await bcrypt.compare(password,user.password)
        if(!user || !(isPasswordCorrect)){
            return res.status(400).json({message:"Invalid Credentials"})
        }

        res.status(200).json({
            user,
            token:generateToken(user._id),
        })
    } catch (error) {
        res.status(500).json({message:"Error logging in user",error:error.message})
    }
}

//controller to check if user is authenticated
export const checkAuth=(req,res)=>{
    return res.status(200).json({message:"User is authenticated",user:req.user})
}


//controller to update user profile details
export const updateProfile=async(req,res)=>{
    try {
        const{profilePic,bio,fullName}=req.body;
        const id=req.user._id;
        let updatedUser;
        if(!profilePic){
            updatedUser=await User.findByIdAndUpdate(id,{bio,fullName},{new:true})
        }
        else{
            const upload=await cloudinary.uploader.upload(profilePic);
            updatedUser=await User.findByIdAndUpdate(id,{profilePic:upload.secure_url,bio,fullName},{new:true})
        }
        res.status(200).json({message:"Profile updated successfully",updatedUser})
    } catch (error) {
        res.status(500).json({message:"Error updating profile",error:error.message})
    }
}