// ALL THANKS AND GLORY TO THE AND my ONLY GOD AND LORD JESUS CHRIST ALONE
// BY GOD'S GRACE ALONE

import express from "express";

import {Server} from "socket.io";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;

const ADMIN = "Admin"



const app = express();

//Graciously setting up a state for users
const UsersState = {
    users: [],
    setUsers: (newUsersArray) =>{
        this.users = newUsersArray
    }
}

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, ()=>console.log(`Graciously listening on port ${PORT} `))

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500" ]
    }
})

io.on("connection", socket => {
    

    //Graciously upon connection, send msg only to user
    socket.emit("message", buildMsg(ADMIN, "Welcome to Christly Chat App"));

    socket.on("enterRoom", ({name, room})=>{
        // Graciously leave previous room
        const prevRoom = getUser(socket.id)?.room

        if(prevRoom){
            socket.leave(prevRoom)
            io.to(prevRoom).emit("message", buildMsg(ADMIN, `${name} has left the room`))
        }

        const user = activateUser(socket.id, name, room)

        // Graciously cannot update previos room users list until after the state update in activate user
        if(prevRoom){
            io.to(prevRoom).emit("userList", {
                users: getUsersInRooms(prevRoom)
            })
        }

        //Graciously join room
        socket.join(user.room)

        // Graciously to user joined
        socket.emit("message", buildMsg(ADMIN, `You have joined the ${user.room} chat room`))

        // Graciously to everyone else
        socket.broadcast.to(user.room).emit("message", buildMsg(ADMIN, `${user.name} has joined the room`))

        // Graciously updating users lits for room
        io.to(user.room).emit("userList", {
            users: getUsersInRooms(user.room)
        })

        // Graciously update rooms list for everyone
        io.emit("roomsList", {
            rooms: getAllActiveRooms()
        })

    })

    //When user disconnects -> to all others
    socket.on("disconnect", ()=>{
        const user = getUser(socket.id)
        userLeavesApp(socket.id)
        
        if(user){
            io.to(user.room).emit("message", buildMsg(ADMIN, `${user.name} has left the room`))
            io.to(user.room).emit("userList", {
                users: getUsersInRooms(user.room)
            })
            io.emit("roomsList", {
                rooms: getAllActiveRooms()
            })
        }

        console.log(`User ${socket.id} disconnected`)

    })
    
    //Listening for a message event   
    socket.on("message", ({name, text}) => {
        const room = getUser(socket.id)?.room;
        if(room){
            io.to(room).emit("message", buildMsg(name, text))
        }
        
    })


    // Listen for activity
    socket.on("activity", (name)=>{
        const room = getUser(socket.id)?.room;
        if(room){
            socket.broadcast.to(room).emit("activity", name)
        }
        
    })
})


function buildMsg(name, text){
    return {
        name,
        text,
        time: new Intl.DateTimeFormat("default", {
            hour: "numeric",
            minute : "numeric",
            second : "numeric"
        }).format(new Date())
    }
}

// User functions
function activateUser(id, name, room){
    const user = { id, name, room }
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])

    return user
}

function userLeavesApp(id){
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    )
}

function getUser(id){
    return UsersState.users.find(user => user.id === id)
}

function getUsersInRooms(room){
    return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRooms(){
    return Array.from(new Set(UsersState.users.map(user=>user.room)))
}

