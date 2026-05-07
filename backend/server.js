const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Change path to COM7 and verify baudRate matches Arduino (9600)
const port = new SerialPort({ path: 'COM7', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', () => console.log('Successfully connected to COM7!'));
port.on('error', (err) => console.log('Error opening COM7:', err.message));

parser.on('data', (data) => {
    console.log("Raw Data:", data);
    const [moisture, pump] = data.split(',');
    
    // Map Arduino values to Percentages/Booleans
    io.emit('sensorData', {
        moisture: moisture === '1' ? 20 : 85, // 1 = Dry, 0 = Wet
        pump: pump === '1'                   // 1 = ON, 0 = OFF
    });
});

io.on('connection', (socket) => {
    console.log("UI Connected");
});

server.listen(3001, () => console.log('Backend Bridge running on http://localhost:3001'));