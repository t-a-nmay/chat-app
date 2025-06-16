import express from 'express'
import "dotenv/config"
import cors from "cors"
import http from "http"
import { connectDB } from './db/connect.js'
import userRouter from './routes/authRoutes.js'
import messageRouter from './routes/MessageRoutes.js'
import { Server } from 'socket.io'

//create express app and http server
const app=express()
const server=http.createServer(app);

//initialize socket.io server
export const io=new Server(server,{
    cors: {
        origin: "*",
    }
})

//store online users
export const userSocketMap={}; //{userId:sockedId}

//socket.io connection handler
io.on('connection', (socket) =>{
    const userId=socket.handshake.query.userId;
    console.log("User connected",userId);
    if(userId){
        userSocketMap[userId]=socket.id;
    }
    //emit online users to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap));
    socket.on("disconnect",()=>{
        console.log("User disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    })
})



//middleware setup
app.use(express.json({limit:"4mb"}));
app.use(cors())

//routes setup
app.use("/api/status",(req,res)=>res.send('server is live'));
app.use("/api/auth",userRouter)
app.use("/api/messages",messageRouter);


const port = process.env.PORT || 5000;

const start = async () => {
    try { 
      await connectDB(process.env.MONGO_URI); 
      console.log('MongoDb connected successfully')
      server.listen(port,()=>console.log(`Server is listening on port ${port}...`)
      );
    } catch (error) {
      console.log(error);
    }
  };
  
  start();


