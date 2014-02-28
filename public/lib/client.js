app.controller('mdoController', ['$scope', '$timeout', 'socket', function ($scope, $timeout, socket) {
  $scope.thisPlayerId       = 'waiting for player';
  $scope.opponentPlayerId   = 'waiting for player';
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
  
  
  
  /**
   * Wait for opponent
   */
  socket.on('wait', function (duel) {
    $scope.thisPlayer         = duel.players[$scope.thisPlayerId];
    $scope.duelState          = duel.state;
  });
  
  
  
  /**
   * Duel countdown to start
   */
  socket.on('countdown', function (duel) {
    $scope.logs.push('get ready, COUNTDOWN');
    $scope.counter = duel.refreshIn;
    $scope.countdown();
  });
  
  
  
  /**
   * Handle each round Duel data
   */
  socket.on('round', function (duel) {
    var round = _.last(duel.rounds);
    
    $scope.duelState          = 'Round';
    $scope.nRound             = duel.nRound;
    $scope.castSpell          = 'select your spell';
    
    $scope.thisPlayer         = round[$scope.thisPlayerId];
    $scope.opponentPlayer     = round[$scope.opponentPlayerId];
    
    $scope.countdown();
  });
  
  
  
  /**
   * Handle round calculation
   */
  socket.on('calculate', function (duel) {
    var round = _.last(duel.rounds);
    
    $scope.pushToLog(round);
    $scope.duelState = 'Round calculation';
    $scope.nRound = duel.nRound;
    $scope.castSpell = null;
    
    $scope.thisPlayer         = round[$scope.thisPlayerId];
    $scope.opponentPlayer     = round[$scope.opponentPlayerId];
  });
  
  
  
  socket.on('result', function (duel) {
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
    var thisCountdown;
    if ($scope.counter > 0) {
      $scope.counter -= 0.10;
      thisCountdown = $timeout($scope.countdown, 100);
    } else {
      $scope.counter = 5;
      $scope.$digest();
      $timeout.cancel(thisCountdown);
    }
  };
}]);