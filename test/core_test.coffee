# 
#  Tests for core library
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


describe 'Core class', ->
  describe 'handleNewPlayer function', ->
    core            = _.extend {}, libCore
    playerId        = UUId()
    player          = new libPlayer playerId, 30
    testSetOfDuels  = []

    it 'should initialize new duel with current player if no waitingFor duel', ->
  

    it 'should initialize new duel with current player if no duels at all', ->
  

    it 'should add current player to waitingFor duel if its exist', ->
  



  describe 'createNewDuel function', ->
    core      = _.extend {}, libCore
    playerId  = UUId()
    player    = new libPlayer playerId, 30
    duel      = core.createNewDuel player

    it 'should create duel with the inital wait status', ->
      duel.state.should.be.equal('wait')

    it 'shoult create duel with only initial player', ->
      playersObject = {}
      playersObject[playerId] = player
      _.size(duel.players).should.be.equal(1)
      duel.players.should.deep.equal(playersObject)

    it 'should add the duel to set of duels', ->
      core.setOfDuels.should.include.keys(duel.id)

    it 'should set the created duel as waiting for opponent', ->
      core.setOfDuels.waitingFor.id.should.be.equal(duel.id)



  describe 'joinToWaitingFor function', ->
    core              = _.extend {}, libCore
    core.abracadabra  = 1
  
    firstPlayerId     = UUId()
    secondPlayerId    = UUId()
    firstPlayer       = new libPlayer firstPlayerId, 30
    secondPlayer      = new libPlayer secondPlayerId, 30
    waitingForDuelId  = UUId()
    waitingForDuel    = new libDuel waitingForDuelId, { firstPlayerId: firstPlayer }, 'wait'
  
    core.setOfDuels.waitingFor = waitingForDuel
    core.setOfDuels[waitingForDuelId] = waitingForDuel
  
    it 'should add second player to waiting for duel', ->
      _.size(core.setOfDuels.waitingFor.players).should.be.equal(1)
      core.joinToWaitingFor(secondPlayer)
      _.size(core.setOfDuels.waitingFor.players).should.be.equal(2)
      waitingForDuel.players.should.contain(firstPlayerId)
      waitingForDuel.players.should.contain(secondPlayerId)