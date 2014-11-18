Semaphore = require('../../../src/modules/semaphore')

describe '(modules) semaphore:', ->

  beforeEach ->
    @waiter = new Semaphore()


  describe 'increment()', ->

    it 'increments the count', ->
      @waiter.count = 4
      @waiter.increment()
      expect(@waiter.count).to.equal(5)


    describe 'when waiter was already fired', ->

      beforeEach ->
        @waiter.start()


      it 'throws an error', ->
        expect(=> @waiter.increment()).to.throw()


  describe 'decrement()', ->

    it 'decrements the count', ->
      @waiter.count = 4
      @waiter.decrement()
      expect(@waiter.count).to.equal(3)


    describe 'when count is at 0', ->

      it 'throws an error', ->
        expect(=> @waiter.decrement()).to.throw()


  describe 'wait()', ->

    it 'increments the counter', ->
      @waiter.wait()
      expect(@waiter.count).to.equal(1)


    it 'returns a function that decrements the counter', ->
      fn = @waiter.wait()
      fn()
      expect(@waiter.count).to.equal(0)


  describe 'start()', ->

    describe 'when count is at 0', ->

      it 'fires', ->
        @waiter.start()
        expect(@waiter.wasFired).to.be.ok


    describe 'when count is not at 0', ->

      beforeEach ->
        @waiter.count = 1


      it 'does not fire', ->
        @waiter.start()
        expect(@waiter.wasFired).not.to.be.ok


    describe 'when already started', ->

      beforeEach ->
        @waiter.start()


      it 'throws an error', ->
        expect(=> @waiter.start()).to.throw()


  describe 'addCallback()', ->

    beforeEach ->
      @callbacksCalled = 0
      @addCallbacks = =>
        @waiter.addCallback(=> @callbacksCalled += 1)
        @waiter.addCallback(=> @callbacksCalled += 1)


    describe 'when not yet fired', ->

      beforeEach ->
        @addCallbacks()


      it 'does not call the callbacks', ->
        expect(@callbacksCalled).to.equal(0)


      describe 'and fired after adding the callbacks', ->

        beforeEach ->
          @waiter.start()


        it 'calls the callbacks', ->
          expect(@callbacksCalled).to.equal(2)


    describe 'when already fired', ->

      beforeEach ->
        @waiter.start()


      it 'calls the callback immediately', ->
        @addCallbacks()
        expect(@callbacksCalled).to.equal(2)
