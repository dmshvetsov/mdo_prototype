# 
#  duel_test.coffee
#  mdo_prototype
#  
#  Created by Dmitry Shvetsov.
#  Copyright 2014 Dmitry Shvetsov. All rights reserved.
# 



chai    = require 'chai'
should  = chai.should()
expect  = chai.expect

_       = require 'underscore'
UUId    = require('node-uuid')

libCore = require '../lib/core.js'
libDuel = require '../lib/duel.js'
libPlayer = require '../lib/player.js'



describe 'Duel class', ->
  core      = _.extend {}, libCore
  playerId  = UUId()
  player    = new libPlayer playerId, 30
  newDuel   = new libDuel { playerId: player }

  it 'should have an id', ->
    newDuel.id.should.be.a('string')

  it 'should have refreshIn', ->
    newDuel.refreshIn.should.be.a('number')

  it 'should have the state', ->
    newDuel.state.should.be.a('string')

  it 'should have number of rounds', ->
    newDuel.nRound.should.be.a('number')

  it 'should have players', ->
    newDuel.players.should.be.a('object')

  it 'should have array rounds', ->
    newDuel.rounds.should.be.an('array')