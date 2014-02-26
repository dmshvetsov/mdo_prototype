app.controller('mdoController', ['$scope', '$timeout', 'socket', function ($scope, $timeout, socket) {
  $scope.thisPlayerId       = 'waiting for';
  $scope.opponentPlayerId   = 'waiting for';
  $scope.castSpell          = null;
  $scope.duelId             = '';
  $scope.nRound             = null;
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
  
  
  
  /**
   * Duel countdown to start
   */
  socket.on('countdown', function (duel) {
    $scope.logs.push('get ready, COUNTDOWN');
    $scope.counter = duel.refreshIn;
    $timeout($scope.countdown, 1000);
  });
  
  
  
  /**
   * Handle each round Duel data
   */
  socket.on('round', function (duel) {
    var round = _.last(duel.rounds);
    
    $scope.pushToLog(round);
    $scope.duelState = 'Round';
    $scope.nRound = duel.nRound;
    
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
  
  $scope.countdown = function () {
    $scope.counter--;
    if ($scope.counter > 0) {
      $timeout($scope.countdown, 1000);
    } else {
      $scope.counter = null;
      $scope.castSpell = 'select your spell';
      $scope.$digest();
    }
  }
}]);