// 
//  player.js
//  mdo_prototype
//  
//  Created by Dmitry Shvetsov.
//  Copyright 2014 Dmitry Shvetsov. All rights reserved.
// 



var UUId = require('node-uuid');



/**
 *  Player - an instance constructor of the player of the game.
 */
var Player = function (id, hp) {
  this.id = id;
  this.hp = hp;
  this.skills = ['magicArrow', 'reflect'];
}



exports = module.exports = Player;