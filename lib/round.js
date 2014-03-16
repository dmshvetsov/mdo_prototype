// 
//  round.js
//  mdo_prototype
//  
//  Created by Dmitry Shvetsov.
//  Copyright 2014 Dmitry Shvetsov. All rights reserved.
// 



/**
 *  Round - a constructor for round object
 */
var Round = function (src) { 
  for (player in src) {
    this[player] = {
      hp: src[player].hp,
      skills: src[player].skills,
      actions: null,
      totalSpellCost: 0,
      totalDamageRecive: 0,
      log: []
    };
  }
}



exports = module.exports = Round;