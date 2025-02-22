# Peer-To-Peer Chat Application

## Goal:
To implement a peer-to-peer chat program in a language of your choice that enables simultaneous sending and receiving messages simultaneously, supports multiple peers, and allows users to query and retrieve the list of peers from which it had received messages.

Members:
<br>
- [Param Saxena(230001060)](https://github.com/SAXENA-PARAM)
- [Saumya Vaidya(230008035)](https://github.com/samthedoctor)
- [Jagrit(230051005)](https://github.com/idJagrit)

# Our Solution Approach:
- Use Javascript with sockets and threading for handling multiple connections. 
- Implement a server-client hybrid model, where each peer can act as both a sender and a receiver. 
- Ensure messages are formatted correctly ("<IP:PORT> <team_name> <message_to_be_sent>").
- Maintain a peer list based on received messages and allow querying of active peers.
- Handle connection persistence, avoid duplicate entries, and implement a connect() function for additional networking.
- Implement multithreading to allow simultaneous communication.

### Prerequisities:
- Basics of Socket Programming.
- Basics of a Programming Language(here, Javascript).
- Javascript(or any preferrable language) Networking Basics, TCP/UDP Sockets (Node.js net module for TCP connections if using a server).

# Code Overview :

### Language Choice:
This implementation is in Node.js, using:
- **`net`** module – For TCP socket communication.
- **`readline`** module – For user input handling.
- Event-driven programming – To manage multiple peer connections efficiently.

##  1. Initializing the Server and User Details:
At the start, the program asks the user for a name and a port number, which is used to create a server for listening to messages.
```javascript
rl.question('Enter your name: ', name => {
    myName = name;
    rl.question('Enter your port number: ', port => {
        myPort = parseInt(port, 10);
        startServer(myPort);
    });
});
```
## 2. Functions in the Code:
The code contains several functions, each handling a specific feature:

| Function Name          | Purpose |
|------------------------|---------|
| `startServer(port)`    | Creates a server that listens for incoming messages and connection requests. |
| `sendMessage()`        | Sends a message to a specified peer (IP & port). |
| `connect(peerIP, peerPort)` | Sends a connection request to a peer. |
| `acceptConnection(peerIP, peerPort)` | Accepts a pending connection request from a peer. |
| `disconnect(peerIP, peerPort)` | Disconnects from a connected peer. |
| `queryPeers()`         | Displays a list of currently connected peers. |
| `queryPendingRequests()` | Displays all pending connection requests. |
| `getMyIP()`           | Retrieves the system’s local IP address. |
| `showMenu()`          | Displays a menu with options to interact with the peer-to-peer network. |


## 3. Setting Up a Server:
Each user starts a TCP server using Node.js' net module, listening for messages from other peers.
```javascript
function startServer(port) {
    const server = net.createServer(socket => {
        socket.on('error', err => {
            if (err.code === 'ECONNRESET') {
                console.log('A peer unexpectedly disconnected.');
            } else {
                console.error('Socket error:', err);
            }
        });
    });

    server.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        showMenu();
    });
}
```
### How it Works:
- The function creates a server that listens on the given port.
- When data is received, it parses the peer's address, name, and message.
- If a peer sends 'exit', it is removed from the active list.
- If a message is received, it is displayed on the terminal.

## 4. Sending a Message to Another Peer:
Users can send messages by providing the recipient’s IP address and port.
```javascript
function sendMessage() {
    rl.question('Enter recipient IP: ', ip => {
        rl.question('Enter recipient port: ', port => {
            rl.question('Enter your message: ', message => {
                const client = new net.Socket();
                client.connect(port, ip, () => {
                    const formattedMessage = `${getMyIP()}:${myPort} ${myName} ${message}`;
                    client.write(formattedMessage);
                    client.end();
                });
                showMenu();
            });
        });
    });
}
```

### How it Works:
- Prompts the user for the recipient's IP, port, and message.
- Creates a TCP client that connects to the specified recipient.
- Sends a formatted message containing: sender's IP & Port, sender’s Name, the message content.
- Closes the connection after sending.

## 5. Querying Active Peers:
Displays all peers currently connected.
```javascript
function queryPeers() {
    if (peers.size === 0) {
        console.log('No connected peers.');
    } else {
        console.log('Connected Peers:');
        peers.forEach((name, peer) => console.log(`${peer} (${name})`));
    }
    showMenu();
}
```

## 6. Connect(BONUS QUESTION):
Sends the connection request to the peer using option 3 in the Menu
```javascript
function connect(peerIP, peerPort) {
    const peerKey = `${peerIP}:${peerPort}`;
    if (connectionRequests.has(peerKey)) {
        console.log('Connection request already pending for this peer.');
        return;
    }
    const client = new net.Socket();
    client.connect(peerPort, peerIP, () => {
        const connectionMessage = `${getMyIP()}:${myPort} ${myName} CONNECT_REQUEST`;
        client.write(connectionMessage);
        console.log(`Sent connection request to ${peerIP}:${peerPort}`);
        client.end();
    });
}
```
The above code calls the below part of the code and store the peer in pending state tat the reciever's end
```javascript
(peerMessage === 'CONNECT_REQUEST') {
                if (!connectionRequests.has(peerInfo)) {
                    connectionRequests.set(peerInfo, peerName);
                    console.log(`Connection request received from ${peerInfo} (${peerName}).`);
                }
            }
```            
On the other end this request is in pending state which when accepted using option 4 both of them are included in there peers
```javascript
function acceptConnection(peerIP, peerPort) {
    const peerKey = `${peerIP}:${peerPort}`;
    if (connectionRequests.has(peerKey)) {
        const peerName = connectionRequests.get(peerKey);
        peers.set(peerKey, peerName);
        connectionRequests.delete(peerKey);

        const client = new net.Socket();
        client.connect(peerPort, peerIP, () => {
            const acceptanceMessage = `${getMyIP()}:${myPort} ${myName} CONNECT_ACCEPTED`;
            client.write(acceptanceMessage);
            console.log(`Accepted connection with ${peerIP}:${peerPort}`);
            client.end();
        });
    } else {
        console.log('No connection request from this peer.');
    }
}
```
Once the accepted formatted message is sent then the below part of the code is used which removed the pending state and adds to the peer list
```javascript
(peerMessage === 'CONNECT_ACCEPTED') {
                peers.set(peerInfo, peerName);
                connectionRequests.delete(peerInfo);
                console.log(`Connection accepted with ${peerInfo} (${peerName}).`);}
```                

## 7. Disconnect(BONUS QUESTION):
When anybody send disconnect using option 5 in the Menu both the peers are removed from each other's peers
```javascript
function disconnect(peerIP, peerPort) {
    const peerKey = `${peerIP}:${peerPort}`;
    if (peers.has(peerKey)) {
        const client = new net.Socket();
        client.connect(peerPort, peerIP, () => {
            const disconnectMessage = `${getMyIP()}:${myPort} ${myName} DISCONNECT`;
            client.write(disconnectMessage);
            console.log(`Sent disconnection request to ${peerIP}:${peerPort}`);
            client.end();
        });
        peers.delete(peerKey);
    } else {
        console.log('Peer not connected.');
    }
}
```
The above code then send the message under the formatted pattern which then call the below 
```javascript
 else if (peerMessage === 'DISCONNECT') {
                peers.delete(peerInfo);
                console.log(`Peer ${peerInfo} (${peerName}) disconnected.`);
                socket.write(`${getMyIP()}:${myPort} ${myName} DISCONNECT_ACK`);
            } else if (peerMessage === 'DISCONNECT_ACK') {
                console.log(`Peer ${peerInfo} acknowledged disconnection.`);
                peers.delete(peerInfo);
            } 
```

## 8. Getting the Local IP Address:
Retrieves the IPv4 address of the system.
```javascript
function getMyIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}
```

## 9. Displaying the User Menu:
A menu-driven interface allows users to interact with the application.
```javascript
function showMenu() {
    console.log('\n***** Menu *****');
    console.log('1. Send message');
    console.log('2. Query active peers');
    console.log('3. Connect to a peer');
    console.log('4. Accept a connection request');
    console.log('5. Disconnect from a peer');
    console.log('6. Query pending connection requests');
    console.log('0. Quit');
    rl.question('Enter choice: ', choice => {
        if (choice === '1') sendMessage();
        else if (choice === '2') queryPeers();
        else if (choice === '3') {
            rl.question('Enter peer IP: ', ip => {
                rl.question('Enter peer port: ', port => {
                    connect(ip, port);
                    showMenu();
                });
            });
        }
        else if (choice === '4') {
            rl.question('Enter peer IP: ', ip => {
                rl.question('Enter peer port: ', port => {
                    acceptConnection(ip, port);
                    showMenu();
                });
            });
        }
        else if (choice === '5') {
            rl.question('Enter peer IP: ', ip => {
                rl.question('Enter peer port: ', port => {
                    disconnect(ip, port);
                    showMenu();
                });
            });
        }
        else if (choice === '6') queryPendingRequests();
        else if (choice === '0') {
            console.log('Exiting...');
            rl.close();
            process.exit();
        } else {
            console.log('Invalid choice, try again.');
            showMenu();
        }
    });
}
```

# Implementation:
- Step 1: Start a peer by running:
  ```bash
  npm i
  node index.js
  ```
- Step 2: Enter the required details (name, port).
- Step 3: Use the menu to send messages or query peers.

Suppose we have four peers with the following port assignments:
- **`peer1`** → **`8080`**
- **`peer2`** → **`9090`**
- **`peer3`** → **`7070`**
- **`peer4`** → **`6060`**
### Message Flow Example:
- **`peer1`** sends a message to **`peer2`** at 127.0.0.1:9090 → "Hello!"
- When querying **`peer2`**, it shows **`peer1`** as a connected peer.
- **`peer3`** sends a message to **`peer4`**, **`peer2`** sends a message to **`peer4`**, etc.

### Example of Peer Discovery:
- Querying **`peer1`** before disconnection:
```bash
Connected Peers:
- peer4 (127.0.0.1:6060)
```
-If peer1 sends "exit" to peer3, the updated peer list is:
```bash
peer3: No connected peers
peer1: peer4
```
## User Interface Flow:
- When a peer starts:
```bash
Enter your name: Peer1
Enter your port number: 8080
Server listening on port 8080
```
- Menu Options:
```bash
***** Menu *****
1. Send message
2. Query active peers
3. Connect to active peers
4. Discover active peers
0. Quit
```
- Sending a Message Example:
```bash
Enter recipient IP address: 127.0.0.1
Enter recipient port number: 9090
Enter your message: Hello, Peer2!
```
- Querying Peers Example:
```bash
Connected Peers:
127.0.0.1:9090 (Peer2)
```
- When a peer disconnects:
```bash
Peer 1 disconnected.
```
- Exiting:
```bash
Exiting...
```

Kindly refer to the [assets folder](assets), for all implememted examples and their results.
P2P messaging done between **`Port 1`**,**`Port 2`**,`Port 3` and `Port 4` refer to these terminal snapshots.
- [Port 1 Terminal A](assets/Port1TerminalA.png)
- [Port 1 Terminal B](assets/Port1TerminalB.png)
- [Port 2 Terminal](assets/Port2Terminal.png)
- [Port 3 Terminal](assets/Port3Terminal.png)
- [Port 4 Terminal](assets/Port4Terminal.png) <br>
**For **`Port 1`** connecting done in the implementation of connect() function, refer to the [Port 1 Connect](assets/Port1Connect.png).<br>
For **`Port 2`** connecting done in the implementation of connect() function, refer to the [Port 2 Connect](assets/Port2Connect.png).<br>
For **`Port 1`** disconnecting done in the implementation of disconnect() function, refer to the [Port 1 Disconnect](assets/Port1Disconnect.png).<br>
For **`Port 2`** disconnecting done in the implementation of disconnect() function, refer to the [Port 1 Disconnect](assets/Port1Connect.png).<br>
And here is the message sent to this set : IP: 10.206.5.228 & PORT: 6555 (Also present in the assets folder).**
<img width="1231" alt="Screenshot 2025-02-20 at 11 00 18 PM" src="https://github.com/user-attachments/assets/02bad72c-6ddd-4715-944a-2695dee4af08" />

## Edge Cases Handled:
- If a peer disconnects, the system updates the peer list.
- If an invalid IP/port is entered, the system notifies the user.
- If the user enters "exit," the peer gracefully disconnects.

# Conclusion:
This program allows for peer-to-peer messaging using TCP sockets, making it a decentralized chat system. The key features include:
- Creating a local server to receive messages.
- Sending messages using a direct TCP connection.
- Maintaining a peer list for connections.
- Broadcasting messages to discover online peers.
