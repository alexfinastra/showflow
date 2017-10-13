var sio = require('socket.io');
var io = null;
const socketsConnected = [];

exports.io = function () {
  return io;
};

exports.socketsConnected = socketsConnected;

exports.initialize = function(server) {
  io = sio(server);

  io.on('connection', (socket) => {
    let index = socketsConnected.push(socket)
    console.log("We have connections : " + socketsConnected.length )
    socket.on('disconnect', () => {
      socketsConnected.splice(index - 1, 1)      
    })

    socket.on('identification', (name) => {
      console.log('connected client: ' + name)
    }) 
  })
}; 

