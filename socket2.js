var https = require('https');
var fs = require('fs');
var https_options = {
  key: fs.readFileSync("cert.key"),
  cert: fs.readFileSync("cert.crt")
};

var server = https.createServer(https_options, function (req, res) {
    res.writeHead(200);
    res.end("Welcome to Node.js HTTPS Servern");
}).listen(8443)

var WebSocketServer = require('ws'); 
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

//creating a websocket server at port 9090 
var wss = new WebSocketServer.Server({ server });

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

            case "who_are_online":
                var dokter = "dokter_" + data.id_dokter + "_" + data.id_konsultasi;
                var pasien = "pasien_" + data.id_pasien + "_" + data.id_konsultasi;

                var dokter_online = (users[dokter]) ? 1 : 0;
                var pasien_online = (users[pasien]) ? 1 : 0;
                sendTo(connection, {
                    type: "who_are_online",
                    dokter_online: dokter_online,
                    pasien_online: pasien_online
                });
            break;

            case "offer": 
                //for ex. UserA wants to call UserB 
                console.log("Sending offer to: ", data.name); 

                //if UserB exists then send him offer details 
                var conn = users[data.name];

                if(conn != null) { 
                    //setting that UserA connected with UserB 
                    connection.otherName = data.name; 

                    sendTo(conn, { 
                        type: "offer", 
                        offer: data.offer, 
                        name: connection.name 
                    }); 
                } 

            break;  

            case "answer": 
                console.log("Sending answer to: ", data.name); 
                //for ex. UserB answers UserA 
                var conn = users[data.name]; 

                if(conn != null) { 
                    connection.otherName = data.name; 
                    sendTo(conn, { 
                        type: "answer", 
                        answer: data.answer 
                    }); 
                } 

            break; 

            case "candidate": 
                console.log("Sending candidate to:",data.name); 
                var conn = users[data.name];  

                if(conn != null) { 
                    sendTo(conn, { 
                        type: "candidate", 
                        candidate: data.candidate 
                    });
                } 

            break;  

            case "leave": 
                console.log("Disconnecting from", data.name); 
                var conn = users[data.name]; 
                conn.otherName = null; 

                //notify the other user so he can disconnect his peer connection 
                if(conn != null) { 
                    sendTo(conn, { 
                        type: "leave" 
                    }); 
                }  

            break;  

            default: 
                sendTo(connection, { 
                    type: "error", 
                    message: "Command not found: " + data.type 
                }); 

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
        
        console.log(users);
    });
}); 

function sendTo(connection, message) { 
    connection.send(JSON.stringify(message)); 
}
