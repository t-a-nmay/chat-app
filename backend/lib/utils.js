import jwt from 'jsonwebtoken'

//function to generate token 

export const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"1h"});
}