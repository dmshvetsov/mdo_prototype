var express       = require('express'),
    app           = express();

app.use(express.logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/lib'));
app.use(express.static(__dirname + '/public/foundation/css'));
app.use(express.static(__dirname + '/public/foundation/js'));
app.use(express.static(__dirname + '/public/assets/css'));
app.use(express.static(__dirname + '/public/assets/js'));

app.get('/mdo', function (req, res) {
  res.sendfile(__dirname + '/public/mdo.html');
});

app.get('/duels', function (req, res) {
  res.json(core.setOfDuels);
});

app.get('/*', function (req, res) {
  res.sendfile(__dirname + '/public/404.html');
});



var httpServer    = require('http').createServer(app),
    io            = require('socket.io').listen(httpServer),
    core          = require('./lib/core.js');



httpServer.listen(8080, function () {
  console.log('\t :: MDO server :: Start and listening on port 8080');
})



io.set('log level', 2);

io.sockets.on('connection', function (client) {
  core.handleNewPlayer(client.id, function (duel) {
    if (duel.state === 'wait') {
      core.init(io.sockets, client, duel.id);
    } else if (duel.state === 'countdown') {
      core.addPlayer(io.sockets, client, duel.id);
    } else {
      new Error('Error when trying handle new player');
    }
  });
  
  // console.log(client);
});