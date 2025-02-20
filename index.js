const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let peers = new Map(); 
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


function queryPeers() {
    if (peers.size === 0) {
        console.log('No connected peers.');
    } else {
        console.log('Connected Peers:');
        peers.forEach((name, peer) => console.log(`${peer} (${name})`));
    }
    showMenu();
}

function connectToPeers() {
    if (peers.size === 0) {
        console.log('No known peers to connect to.');
        showMenu();
        return;
    }
    
    peers.forEach((name, peer) => {
        const [ip, port] = peer.split(':');
        const client = new net.Socket();
        client.connect(port, ip, () => {
            const connectionMessage = `${getMyIP()}:${myPort} ${myName} CONNECTION_ESTABLISHED`;
            client.write(connectionMessage);
            client.end();
        });
    });
    console.log('Connected to known peers.');
    showMenu();
}

function discoverPeers() {
    peers.forEach((name, peer) => {
        const [ip, port] = peer.split(':');
        const client = new net.Socket();
        client.connect(port, ip, () => {
            const discoveryMessage = `${getMyIP()}:${myPort} ${myName} WHO_IS_ONLINE`;
            client.write(discoveryMessage);
            client.end();
        });
    });
    console.log('Broadcasting "Who is online?" message.');
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
    console.log('3. Connect to active peers');
    console.log('4. Discover active peers');
    console.log('0. Quit');
    rl.question('Enter choice: ', choice => {
        if (choice === '1') sendMessage();
        else if (choice === '2') queryPeers();
        else if (choice === '3') connectToPeers();
        else if (choice === '4') discoverPeers();
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
