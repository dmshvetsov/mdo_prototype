// 
//  duel.js
//  mdo_prototype
//  
//  Created by Dmitry Shvetsov.
//  Copyright 2014 Dmitry Shvetsov. All rights reserved.
// 



var UUId = require('node-uuid');



/**
 *  Duel - a constructor instances of the game between two players.
 */
var Duel = function (initialPlayer) {
  this.id = UUId();
  this.refreshIn = 5;
  this.state = 'wait';
  this.players = initialPlayer;
  this.nRound = 0;
  this.rounds = [];
  this.result = null;
}



exports = module.exports = Duel;