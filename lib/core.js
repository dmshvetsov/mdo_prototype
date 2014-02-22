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
    this.id = id,
    this.refreshIn = 5,
    this.state = state,
    this.players = initialPlayer,
    this.nRound = 0,
    this.rounds = [],
    this.result = null
  },
  
  Player: function (id, hp) {
    this.id = id,
    this.hp = hp,
    this.skills = ['magicArrow', 'reflect']
  },
  
  // TODO create Round constructor
  // Round: function (players) {
  //   players.forEach(function (player) {
  //     this.player = {
  //       hp: player.hp,
  //       skills: player.skill,
  //       actions: null,
  //       throwSpell: null,
  //       log: null
  //     }
  //   })
  // },
  
  
  
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
          thisRound[playerId].throwSpell = {
            school: 'abjuration',
            cost: playerSpell.cost,
            power: core.randMinMax(playerSpell.minDefence, playerSpell.maxDefence),
            effect: playerSpell.effect,
            critical: false
          };
          break;
        case 'enchantment':
          console.log('no handle for enchantment');
          break;
        case 'evocation':
          thisRound[playerId].throwSpell = {
            school: 'evocation',
            cost: playerSpell.cost,
            power: core.randMinMax(playerSpell.minDamage, playerSpell.maxDamage),
            effect: playerSpell.effect,
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
        core.addToLog(thisRound[playerId], thisRound[playerId].actions, thisRound[playerId].throwSpell.power);
      }
    });
  },
  
  calcRound: function (duel) {
    var playersKey          = _.keys(duel.players),
        thisRound           = _.last(duel.rounds),
        firstPlayerRound    = thisRound[playersKey[0]],
        secondPlayerRound   = thisRound[playersKey[1]];
    
    console.log(thisRound);
    
    if (firstPlayerRound.throwSpell) core.applySpell(firstPlayerRound, secondPlayerRound);
    if (secondPlayerRound.throwSpell) core.applySpell(secondPlayerRound, firstPlayerRound);
  }, // TODO may be combine with throwSpell function or applySpell
  
  
  
  /** 
   *  Apply spell effects
   *  subject how apply spell on object
   */
  applySpell: function (subject, object) {
    // if oject produce critical damage
    if (subject.throwSpell && subject.throwSpell.critical) {
      object.hp = 0;
    }
    // if object try reflect subject spell else deal damage on object
    if (object.throwSpell && object.throwSpell.special == 'reflect') {
        subject.hp -= (object.throwSpell.power > subject.throwSpell.power) ? subject.throwSpell.power : object.throwSpell.power;
        object.hp -= core.nlto(subject.throwSpell.power - object.throwSpell.power);
    } else {
      object.hp -= subject.throwSpell.power;
    }
    // subtract the cost of the spell from the caster
    subject.hp -= subject.throwSpell.cost;
  },
  
  
  
  // makeLogEntry: function (duel) {
  //   var playersKey          = _.keys(duel.players),
  //       roundLastIndex      = duel.rounds.length - 1,
  //       thisRound           = duel.rounds[roundLastIndex],
  //       previousRound       = duel.rounds[(roundLastIndex - 1)];
  //   
  //   thisRound.log = [];
  //   
  //   thisRound.log.push(
  //     'ROUND ' + duel.nRound + ':'
  //   );
  //   
  //   if (thisRound[playersKey[0]].throwSpell) {
  //     thisRound.log.push(
  //       playersKey[0] + ' throw ' + thisRound[playersKey[0]].actions + ' spell with power ' + (thisRound[playersKey[0]].throwSpell.power)
  //     );
  //   }
  //   
  //   if (previousRound === undefined) {
  //     thisRound.log.push(
  //       playersKey[1] + ' recieve total damage ' + (duel.players[playersKey[1]].hp - thisRound[playersKey[1]].hp)
  //     );
  //   } else {
  //     thisRound.log.push(
  //       playersKey[1] + ' recieve total damage ' + (previousRound[playersKey[1]].hp - thisRound[playersKey[1]].hp)
  //     );
  //   }
  //   
  //   if (thisRound[playersKey[1]].throwSpell) {
  //     thisRound.log.push(
  //       playersKey[1] + ' throw ' + thisRound[playersKey[1]].actions + ' spell with power ' + (thisRound[playersKey[1]].throwSpell.power)
  //     );
  //   }
  //   
  //   if (previousRound === undefined) {
  //     thisRound.log.push(
  //       playersKey[0] + ' recieve total damage ' + (duel.players[playersKey[0]].hp - thisRound[playersKey[0]].hp)
  //     );
  //   } else {
  //     thisRound.log.push(
  //       playersKey[0] + ' recieve total damage ' + (previousRound[playersKey[0]].hp - thisRound[playersKey[0]].hp)
  //     );
  //   }
  // },
  
  
  
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
        previousRound       = _.last(duel.rounds),
        newRound            = {};
    
    if (previousRound) {
      newRound[playersKey[0]] = {
        hp: previousRound[playersKey[0]].hp,
        skills: previousRound[playersKey[0]].skills,
        actions: null,
        throwSpell: null,
        log: []
      }
      newRound[playersKey[1]] = {
        hp: previousRound[playersKey[1]].hp,
        skills: previousRound[playersKey[1]].skills,
        actions: null,
        throwSpell: null,
        log: []
      }
    } else {
      newRound[playersKey[0]] = {
        hp: duel.players[playersKey[0]].hp,
        skills: duel.players[playersKey[0]].skills,
        actions: null,
        throwSpell: null,
        log: []
      };
      newRound[playersKey[1]] = {
        hp: duel.players[playersKey[1]].hp,
        skills: duel.players[playersKey[1]].skills,
        actions: null,
        throwSpell: null,
        log: []
      };
    }
    
    duel.nRound = duel.rounds.push(newRound);
  }, // TODO tooooo complex or/and complicated
  
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
    if (playerRound.throwSpell.critical) {
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