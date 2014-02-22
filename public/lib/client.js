app.controller('mdoController', ['$scope', '$timeout', 'socket', function ($scope, $timeout, socket) {
  $scope.thisPlayerId       = 'waiting for';
  $scope.opponentPlayerId   = 'waiting for';
  $scope.castSpell          = null;
  $scope.duelId             = '';
  $scope.counter            = null;
  $scope.logs               = ['join to DUEL'];
  $scope.result             = null;
  
  socket.on('connect', function () {
    $scope.thisPlayerId = this.socket.sessionid;
  });
  
  
  
  socket.on('connected', function (duel) {
    var thisPlayer = duel.players[$scope.thisPlayerId],
        opponentPlayer = _.find(duel.players, function (player) {
           if (player.id != $scope.thisPlayerId) {
             return duel.players[player.id];
           }
        });
    
    if (opponentPlayer && opponentPlayer.id) {
      $scope.opponentPlayerId = opponentPlayer.id;
      $scope.thisPlayer       = duel.players[$scope.thisPlayerId];
      $scope.opponentPlayer   = duel.players[$scope.opponentPlayerId];
    }
    
    $scope.duelState = duel.state;
    $scope.duelId = duel.id;
  });
  
  
  
  socket.on('wait', function (duel) {
    /**
     * Wait for opponent
     */
    
    $scope.thisPlayer         = duel.players[$scope.thisPlayerId];
    $scope.duelState          = duel.state;
  });
  
  
  
  socket.on('countdown', function (duel) {
    /**
     * Duel countdown to start
     */
    
    $scope.counter = duel.refreshIn;
    $scope.logs.push('get ready, COUNTDOWN');
    $scope.countdown = function () {
      $scope.counter--;
      if ($scope.counter > 0) {
        $timeout($scope.countdown, 1000);
      } else {
        $scope.counter = null;
      }
    }
    $timeout($scope.countdown, 1000);
  });
  
  
  
  socket.on('round', function (round) {
    /**
     * Handle each round Duel data
     */
    
    $scope.pushToLog(round);
    $scope.duelState = 'Round';
    
    $scope.thisPlayer         = round[$scope.thisPlayerId];
    $scope.opponentPlayer     = round[$scope.opponentPlayerId];
    $scope.castSpell          = 'select your spell';
  });
  
  
  
  socket.on('result', function (duel) {
    $scope.pushToLog(_.last(duel.rounds));
    $scope.result = ((duel.result.winner) ? duel.result.winner : 'No one') + ' won the Duel for ' + duel.nRound + ' Round(s)';
  });
  
  
  
  socket.on('disconnect', function () {
    $scope.thisPlayerId       = 'disconnected';
    $scope.opponentPlayerId   = 'disconnected';
  });
  
  $scope.nextSpell = function (spell) {
    $scope.castSpell = spell;
    socket.emit('castSpell', {
      duelId: $scope.duelId,
      playerId: $scope.thisPlayerId,
      spell: spell
    });
  };
  
  $scope.pushToLog = function (round) {
    var thisPlayerLog       = round[$scope.thisPlayerId].log,
        opponentLog         = round[$scope.opponentPlayerId].log;
    
    _.each(thisPlayerLog, function (entry) {
      $scope.logs.push('YOU ' + entry); 
    });
    
    _.each(opponentLog, function (entry) {
      $scope.logs.push('OPPONENT ' + entry); 
    });
  };
}]);