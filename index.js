const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let peers = new Map(); 
let connectionRequests = new Map(); 
let myName, myPort;

function startServer(port) {
    const server = net.createServer(socket => {
        socket.on('data', data => {
            const message = data.toString().trim();
            const [peerInfo, peerName, ...msgParts] = message.split(' ');
            const peerMessage = msgParts.join(' ');

            if (peerMessage === 'exit') {
                peers.delete(peerInfo);
                console.log(`Peer ${peerInfo} disconnected.`);
                socket.end();
            } else if (peerMessage === 'CONNECT_REQUEST') {
                if (!connectionRequests.has(peerInfo)) {
                    connectionRequests.set(peerInfo, peerName);
                    console.log(`Connection request received from ${peerInfo} (${peerName}).`);
                }
            } else if (peerMessage === 'CONNECT_ACCEPTED') {
                peers.set(peerInfo, peerName);
                connectionRequests.delete(peerInfo);
                console.log(`Connection accepted with ${peerInfo} (${peerName}).`);
            } else if (peerMessage === 'DISCONNECT') {
                peers.delete(peerInfo);
                console.log(`Peer ${peerInfo} (${peerName}) disconnected.`);
                socket.write(`${getMyIP()}:${myPort} ${myName} DISCONNECT_ACK`);
            } else if (peerMessage === 'DISCONNECT_ACK') {
                console.log(`Peer ${peerInfo} acknowledged disconnection.`);
                peers.delete(peerInfo);
            } else {
                peers.set(peerInfo, peerName);
                console.log(`\nReceived from ${peerInfo} (${peerName}): ${peerMessage}`);
            }
            showMenu();
        });
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

function queryPeers() {
    if (peers.size === 0) {
        console.log('No connected peers.');
    } else {
        console.log('Connected Peers:');
        peers.forEach((name, peer) => console.log(`${peer} (${name})`));
    }
    showMenu();
}

function queryPendingRequests() {
    if (connectionRequests.size === 0) {
        console.log('No pending connection requests.');
    } else {
        console.log('Pending Connection Requests:');
        connectionRequests.forEach((name, peer) => console.log(`${peer} (${name})`));
    }
    showMenu();
}

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

rl.question('Enter your name: ', name => {
    myName = name;
    rl.question('Enter your port number: ', port => {
        myPort = parseInt(port, 10);
        startServer(myPort);
    });
});