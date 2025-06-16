import mongoose from "mongoose";

//function to connect to mongodb database

export const connectDB=(url)=>{
    return mongoose.connect(url,{});
}
