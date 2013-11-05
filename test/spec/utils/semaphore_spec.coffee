describe 'Semaphore', ->

  beforeEach ->
    @waiter = new Semaphore()


  describe 'increment()', ->

    it 'increments the count', ->
      @waiter.count = 4
      @waiter.increment()
      expect(@waiter.count).toBe(5)


    describe 'when waiter was already fired', ->

      beforeEach ->
        @waiter.start()


      it 'throws an error', ->
        expect(=> @waiter.increment()).toThrow()


  describe 'decrement()', ->

    it 'decrements the count', ->
      @waiter.count = 4
      @waiter.decrement()
      expect(@waiter.count).toBe(3)


    describe 'when count is at 0', ->

      it 'throws an error', ->
        expect(=> @waiter.decrement()).toThrow()


  describe 'wait()', ->

    it 'increments the counter', ->
      @waiter.wait()
      expect(@waiter.count).toBe(1)


    it 'returns a function that decrements the counter', ->
      fn = @waiter.wait()
      fn()
      expect(@waiter.count).toBe(0)


  describe 'start()', ->

    describe 'when count is at 0', ->

      it 'fires', ->
        @waiter.start()
        expect(@waiter.wasFired).toBeTruthy()


    describe 'when count is not at 0', ->

      beforeEach ->
        @waiter.count = 1


      it 'does not fire', ->
        @waiter.start()
        expect(@waiter.wasFired).toBeFalsy()


    describe 'when already started', ->

      beforeEach ->
        @waiter.start()


      it 'throws an error', ->
        expect(=> @waiter.start()).toThrow()


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
        expect(@callbacksCalled).toBe(0)


      describe 'and fired after adding the callbacks', ->

        beforeEach ->
          @waiter.start()


        it 'calls the callbacks', ->
          expect(@callbacksCalled).toBe(2)


    describe 'when already fired', ->

      beforeEach ->
        @waiter.start()


      it 'calls the callback immediately', ->
        @addCallbacks()
        expect(@callbacksCalled).toBe(2)
