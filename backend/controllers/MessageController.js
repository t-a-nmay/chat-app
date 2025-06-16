import User from "../models/User.js";
import Message from '../models/Message.js'
import cloudinary from "../lib/cloudinary.js";
import { io,userSocketMap } from "../server.js";

//get all users except logged in user
export const getUsersForSidebar = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
//       "-password"
//     );
//     //count number of messages not seen
//     const unseenMessages = {};
//     const promises = filteredUsers.map(async (user) => {
//       const messages = await Message.find({
//         senderId: user._id,
//         receiverId: userId,
//         seen: false,
//       });
//       if (messages.length > 0) {
//         unseenMessages[user._id] = messages.length;
//       }
//       await Promise.all(promises);
//       res.status(200).json({ users: filteredUsers, unseenMessages });
//     });
//   } catch (error) {
//     res.status(500).json({ msg: error.message });
//   }
try {
    const userId = req.user._id;
  
    // Get all users except the current user
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select('-password');
  
    // Count unseen messages for each user in parallel
    const unseenMessages = {};
  
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
  
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });
  
    // Wait for all message queries to complete
    await Promise.all(promises);
  
    // Send the response after all async tasks are done
    res.status(200).json({ users: filteredUsers, unseenMessages });
  
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
  
};

//get all messages for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });
    await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});
    res.json({success:true,messages})
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};


// API to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
      const { id } = req.params;
  
      await Message.findByIdAndUpdate(id, { seen: true });
      res.status(200).json({success:true})
    } catch (error) {
      console.error(error.message);
      res.json({ success: false, message: error.message });
    }
  };

export const sendMessage=async(req,res)=>{
    try {
        const{text,image}=req.body;
        const receiverId=req.params.id;
        const senderId=req.user._id;
        let imageUrl;
        if(image){
            const uploadResponse=await cloudinary.uploader.upload(image);
            imageUrl=uploadResponse.secure_url;
        }
        const newMessage=await Message.create({text,image:imageUrl,receiverId,seen:false,senderId});

        //emit the new message to the receiver's socket
        const receiverSockedId=userSocketMap[receiverId];
        if(receiverSockedId){
            io.to(receiverSockedId).emit('newMessage',newMessage);
        }

        res.status(200).json({success:true,newMessage});
    } catch (error) {
      res.status(500).json({msg:error.message});
    }
}