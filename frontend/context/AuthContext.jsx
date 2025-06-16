// import { createContext, useEffect, useState } from "react";
// import axios from 'axios'
// import toast from "react-hot-toast";
// import { io } from 'socket.io-client'

// const backendUrl=import.meta.env.VITE_BACKEND_URL
// axios.defaults.baseURL=backendUrl

// export const AuthContext=createContext();


// export const AuthProvider = ({children})=>{
//     const [token,setToken]=useState(localStorage.getItem("token"));
//     const [authUser,setAuthUser]=useState(null);
//     const [onlineUsers,setOnlineUsers]=useState([]);
//     const [socket,setSocket]=useState(null);
 
//     //check if user is authenticated and if so, set the user data and connect the socket
//     const checkAuth=async ()=>{
//         try {
//             const response=await axios.get('/api/auth/check');
//             if(response.data){
//                 console.log(response);
//                 setAuthUser(response.data.user)
//                 connectSocket(response.data.user);
//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     }

//     // login function to handle user authentication and socket connection
//     const login = async(state,credentials)=>{
//         try {
//             const response=await axios.post(`/api/auth/${state}`,credentials)
//             if(response.data){
//                 setAuthUser(response.data.userData);
//                 connectSocket(response.data.userData);
//                 axios.defaults.headers.common["token"]=response.data.token;
//                 setToken(response.data.token);
//                 localStorage.setItem("token",response.data.token);
//                 toast.success(response.data.message);
//             }
//             else{
//                 toast.error(response.data.message);
//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     }

//     //logout function to handle user logout and socket disconnection
//     const logout = async ()=>{
//         localStorage.removeItem("token");
//         setToken(null);
//         setAuthUser(null);
//         setOnlineUsers([]);
//         axios.defaults.headers.common["token"]=null;
//         toast.success("logged out successfully");
//         socket.disconnect();
//     }

//     //update profile function to handle user profile updates
//     const updateProfile=async(body)=>{
//         try {
//             const response=await axios.put("/api/auth/update-profile",body);
//             if(response.data){
//                 setAuthUser(response.data.user);
//                 toast.success("profile updated successfully");
//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     }

//     //connect socket function to handle socket connection and online users updates
//     const connectSocket=(userData)=>{
//         if(!userData || socket?.connected) return ;
//         const newSocket=new io(backendUrl,{
//             query:{
//                 userId:userData._id,
//             }
//         });
//         newSocket.connect();
//         setSocket(newSocket);
//         newSocket.on('getOnlineUsers',(userIds)=>{
//             setOnlineUsers(userIds)
//         })
//     }


//     useEffect(()=>{
//         if(token){
//             axios.defaults.headers.common["token"]=token;
//         }
//         checkAuth();
//     },[])


//     const value={
//         //add your auth state here
//         axios,
//         authUser,
//         onlineUsers,
//         socket,
//         login,
//         logout,
//         updateProfile
//     }
//     return (
//         <AuthContext.Provider value={value}>
//             {children}
//         </AuthContext.Provider>
//     )
// }

import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const {data} = await axios.get("/api/auth/check");
      // console.log("auth from checkauth:",data);
      if (data.user) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      toast.error("Session expired. Please log in again.");
      logout();
    }
  };

  // Login
  const login = async (state, credentials) => {
    try {
      const res = await axios.post(`/api/auth/${state==='login'?state:'register'}`, credentials);
      const data = res.data;

      if (data?.token) {
        // console.log("login successful",data);
        setAuthUser(data.user);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        connectSocket(data.user);
        toast.success(data.message);
      } else {
        toast.error("Login failed.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Logout
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully");

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Update profile
  const updateProfile = async (body) => {
    try {
      const {data} = await axios.put("/api/auth/update-profile", body);

      // console.log("from profile",data);
      if (data?.updatedUser) {
        setAuthUser(data.updatedUser);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Update failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Connect socket
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = new io(backendUrl, {
      query: { userId: userData._id },
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  // On mount: set token and check auth
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
