var spell         = require('./spell.js'),
    UUId          = require('node-uuid'),
    _             = require('underscore');



// gameState: 
//   wait,
//   countdown,
//   round,
//   result,
//   endDuel



var core = {
  /** Game objects.
   *  setOfDuels - a storage for all Duel objects.
   *  Duel - a constructor instances of the game between two players.
   *  Player - an instance constructor of the player of the game.
   */
  setOfDuels: {
    waitingFor: null
  },
  
  Duel: function (id, initialPlayer, state) {
    this.id = id;
    this.refreshIn = 5;
    this.state = state;
    this.players = initialPlayer;
    this.nRound = 0;
    this.rounds = [];
    this.result = null;
  },
  
  Player: function (id, hp) {
    this.id = id;
    this.hp = hp;
    this.skills = ['magicArrow', 'reflect'];
  },
  
  Round: function (src, players) {
    this[players[0]] = {
      hp: src[players[0]].hp,
      skills: src[players[0]].skills,
      actions: null,
      log: []
    };
    this[players[1]] = {
      hp: src[players[1]].hp,
      skills: src[players[1]].skills,
      actions: null,
      log: []
    };
  },
  
  // TODO store it diferent, clever
  // schools: ['abjuration', 'enchantment', 'evocation', 'illusion', 'transmutation'],
  
  
  
  /** init - initializes game and joins the initial player.
      run  - start gameplay
      join - join client it to the io room & emit to player
      listen - refactor?
  */
  init: function (ioSockets, client, duelId) {
    core.addPlayer(ioSockets, client, duelId);
    this.listen(client);
    
    var thisDuel = core.setOfDuels[duelId];
    stateMachine();
    
    function stateMachine () {
      if (thisDuel.state === 'wait') {
        /**
         * WAIT
         * Initial player waiting for opponent
         */
        
        // do nothing?
        ioSockets.in(duelId).emit('wait', thisDuel);
      } else if (thisDuel.state === 'countdown') {
        /**
         * COUNTDOWN
         * and change state to 'round'
         */
        
        console.log('\t :: MDO server :: COUNTDOWN #' + thisDuel.nRound);
        thisDuel.state = 'initialRound';
        ioSockets.in(duelId).emit('countdown', thisDuel);
      } else if (thisDuel.state === 'initialRound') {
        core.addNewRound(thisDuel);
        thisDuel.state = 'round';
      } else if (thisDuel.state === 'endDuel') {
        /**
         * END DUEL
         * If one of the player disconnected disconect other
         * remove game from memory
         * and quit from stateMachine loop
         */
        
        core.endDuel(ioSockets ,_.keys(thisDuel.players));
        
        delete core.setOfDuels[duelId];
        if (core.setOfDuels.waitingFor && core.setOfDuels.waitingFor.id === duelId) {
          core.setOfDuels.waitingFor = null;
        }
        console.log('\t :: MDO server :: END DUEL #' + thisDuel.id + ' is deleted');
        return;
      } else if (thisDuel.state === 'result') {
        /**
         * RESULT
         * duel now have some result
         * make appropriate actions and set the duel status ended
         */
        
        thisDuel.state = 'endDuel';
      } else {
        /**
         * ROUND
         * game round
         */
        
        console.log('\n\t :: MDO server :: ROUND #' + thisDuel.rounds.length);
        
        core.throwSpell(thisDuel);
        core.calcRound(thisDuel);
        // core.makeLogEntry(thisDuel);
        
        /**
         * ARE PLAYERS ALIVE?
         * check it
         */
      
        var playersKey          = _.keys(thisDuel.players),
            thisRound           = _.last(thisDuel.rounds);
        
        if (thisRound[playersKey[0]].hp <= 0 && thisRound[playersKey[1]].hp <= 0) {
          console.log('\t :: MDO server :: RESULT #' + thisDuel.nRound + ' (' + thisDuel.rounds.length + ')');
          thisRound[playersKey[0]].hp = 0;
          thisRound[playersKey[1]].hp = 0;
          core.setStateResult(thisDuel.id, null);
          ioSockets.in(duelId).emit('result', thisDuel);
        } else {
          for (var i = 0; i < 2; i++) {
            if (thisRound[playersKey[i]].hp <= 0) {
              console.log('\t :: MDO server :: RESULT #' + thisDuel.nRound + ' (' + thisDuel.rounds.length + ')');
              thisRound[playersKey[i]].hp = 0;
              var winnerIndex = (i == 0) ? 1 : 0;
              core.setStateResult(thisDuel.id, playersKey[winnerIndex]);
              ioSockets.in(duelId).emit('result', thisDuel);
            }
          }
        }
        
        ioSockets.in(duelId).emit('round', thisRound);
        
        /**
         * PLAYERS ALIVE!
         * keep going, next round
         */
        
        if (thisDuel.state == 'round') {
          core.addNewRound(thisDuel);
        }
      }
      
      setTimeout(stateMachine, thisDuel.refreshIn * 1000);
    }
  },
  
  addPlayer: function (ioSockets, client, duelId) {
    client.join(duelId);
    ioSockets.in(duelId).emit('connected', core.setOfDuels[duelId]);
    core.listen(client);
    console.log('\t :: MDO server :: PLAYER connected ' + client.id + ' to ' + duelId + ' duel');
  },
  
  listen: function (client) {
    client.on('disconnect', function () {
      var rooms = _.keys(client.manager.rooms);
      _.each(rooms, function (room, index, list) {
        core.setStateEndDuel(room.substring(1)); // here we got at least two room, first one is '' and second that we need
      });
      console.log('\t :: MDO server :: PLAYER disconnected ' + client.id);
    });
    
    client.on('castSpell', function (data) {
      if (core.setOfDuels[data.duelId].rounds.length == 0) return null;
      var thisRound = _.last(core.setOfDuels[data.duelId].rounds);
      thisRound[data.playerId].actions = data.spell;
    });
  },
  
  
  
  throwSpell: function (duel) {
    var thisRound         = _.last(duel.rounds);
    
    Object.getOwnPropertyNames(thisRound).forEach(function (playerId, index, players) {
      if (thisRound[playerId].actions) {
        var playerSpell  = spell[thisRound[playerId].actions];
        
        switch (playerSpell.school) {
        case 'abjuration':
          thisRound[playerId][playerSpell.effect] = {
            cost: playerSpell.cost,
            power: core.randMinMax(playerSpell.minDefence, playerSpell.maxDefence),
            critical: false
          };
          break;
        case 'enchantment':
          console.log('no handle for enchantment');
          break;
        case 'evocation':
          thisRound[playerId][playerSpell.effect] = {
            cost: playerSpell.cost,
            power: core.randMinMax(playerSpell.minDamage, playerSpell.maxDamage),
            critical: core.isCritical(playerSpell.criticalChance)
          };
          break
        case 'illusion':
          console.log('no handle for illusion');
          break;
        case 'transmutation':
          console.log('no handle for transmutation');
          break;
        }
        
        core.addToLog(thisRound[playerId], thisRound[playerId].actions, thisRound[playerId][playerSpell.effect].power);
      }
    });
  },
  
  calcRound: function (duel) {
    var playersKey          = _.keys(duel.players),
        thisRound           = _.last(duel.rounds),
        firstPlayerRound    = thisRound[playersKey[0]],
        secondPlayerRound   = thisRound[playersKey[1]];
    
    console.log(thisRound); // TODO replace debugin by tests
    
    core.applySpell(firstPlayerRound, secondPlayerRound);
    core.applySpell(secondPlayerRound, firstPlayerRound);
  },
  
  
  
  /** 
   *  Apply spell effects
   *  subject how apply spell on object
   */
  applySpell: function (subject, object) {
    if (subject.damage) {
      // if oject produce critical damage
      if (subject.damage.critical) {
        object.hp = 0;
      }
      // if object try reflect subject spell else just deal damage on object
      if (object.reflect) {
          subject.hp -= (object.reflect.power > subject.damage.power) ? subject.damage.power : object.reflect.power;
          object.hp -= core.nlto(subject.damage.power - object.reflect.power);
      } else {
        object.hp -= subject.damage.power;
      }
    }
    
    if (subject.reflect) {
      // do nothing?
    }
    
    // subtract the cost of the spell from the caster
    subject.hp -= spell[subject.actions].cost;
  },
  
  
  
  /** 
   *  App low level helper functions
   */
  handleNewPlayer: function (clientId, callback) {
    var player = new this.Player(clientId, 24);
    
    if (_.size(this.setOfDuels) === 0 || !this.setOfDuels.waitingFor) {
      callback(this.createNewDuel(player));
    } else {
      callback(this.joinToWaitingFor(player));
    }
  },
  
  createNewDuel: function (player) {
    var thisPlayer = {};
    thisPlayer[player.id] = player;
    
    var newDuel = new core.Duel(UUId(), thisPlayer, 'wait');
    
    this.setOfDuels[newDuel.id] = newDuel;
    this.setOfDuels.waitingFor = newDuel;
    
    return newDuel;
  },
  
  joinToWaitingFor: function (player) {
    var thisDuel = this.setOfDuels.waitingFor;
    
    thisDuel.players[player.id] = player;
    thisDuel.state = 'countdown';
    this.setOfDuels.waitingFor = null;
    
    return thisDuel;
  },
  
  addNewRound: function (duel) {
    var playersKey          = _.keys(duel.players),
        previousRound       = _.last(duel.rounds);
    
    if (previousRound) {
      var newRound = new core.Round(previousRound, playersKey);
    } else {
      var newRound = new core.Round(duel.players, playersKey);
    }
    
    duel.nRound = duel.rounds.push(newRound);
  },
  
  randMinMax: function (min, max) {
    return (Math.random() * (max - min + 1) + min) | 0;
  },
  
  isCritical: function (criticalChance) {
    return Math.random() >= (1.0 - criticalChance);
  },
  
  nlto: function (num) {
    if (num < 0) {
      return 0;
    } else {
      return num;
    }
  },
  
  addToLog: function (playerRound, action, power) {
    if (playerRound.damage && playerRound.damage.critical) {
      playerRound.log.push('throw spell ' + action + ' and KILL OPPONENT with critical ' + spell[action].effect);
    } else {
      playerRound.log.push('throw spell ' + action + ' with effect ' + spell[action].effect + ' and power ' + power);
    }
  },
  
  setStateResult: function (duelId, winnerPlayerId) {
    core.setOfDuels[duelId].result = {
      winner: winnerPlayerId,
      nRound: core.setOfDuels[duelId].nRound
    };
    core.setOfDuels[duelId].state = 'result';
  },
  
  setStateEndDuel: function (duelId) {
    if (!duelId || duelId === '') return;
    core.setOfDuels[duelId].state = 'endDuel';
  },
  
  endDuel: function (ioSockets, players) {
    players.forEach(function (player) {
      console.log('\t :: MDO server :: PLAYER ' + player + ' make sure that is disconnected');
      ioSockets.socket(player).disconnect();
    });
  }
}



exports = module.exports = core;