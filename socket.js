//require our websocket library 
var WebSocketServer = require('ws').Server; 

//creating a websocket server at port 9090 
var wss = new WebSocketServer({port: 9090}); 

//all connected to the server users
var users = {};

//when a user connects to our sever 
wss.on('connection', function(connection) { 
    console.log("user connected");

    //when server gets a message from a connected user 
    connection.on('message', function(message){ 
        var data;

        //accepting only JSON messages 
        try { 
            data = JSON.parse(message); 
        } catch (e) { 
            console.log("Invalid JSON"); 
            data = {}; 
        } 

        //switching type of the user message 
        switch (data.type) {
            case "login": 
            console.log("User logged", data.name); 

            //if anyone is logged in with this username then refuse 
            if(users[data.name]) { 
                sendTo(connection, { 
                    type: "login", 
                    success: false 
                }); 
            } else { 
                //save user connection on the server 
                users[data.name] = connection; 
                connection.name = data.name; 

                sendTo(connection, { 
                    type: "login", 
                    success: true 
                }); 
            } 

            break;
        }

        console.log(users);
    }); 

    //when user exits, for example closes a browser window 
    //this may help if we are still in "offer","answer" or "candidate" state 
    connection.on("close", function() { 

        if(connection.name) { 
            delete users[connection.name]; 

            if(connection.otherName) { 
                console.log("Disconnecting from ", connection.otherName);
                var conn = users[connection.otherName]; 
                conn.otherName = null;  

                if(conn != null) { 
                    sendTo(conn, { 
                        type: "leave" 
                    });
                }  
            } 
        } 
    });
}); 

function sendTo(connection, message) { 
    connection.send(JSON.stringify(message)); 
}