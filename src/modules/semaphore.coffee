assert = require('../modules/logging/assert')

# This class can be used to wait for tasks to finish before firing a series of
# callbacks. Once start() is called, the callbacks fire as soon as the count
# reaches 0. Thus, you should increment the count before starting it. When
# adding a callback after having fired causes the callback to be called right
# away. Incrementing the count after it fired results in an error.
#
# @example
#
#   semaphore = new Semaphore()
#
#   semaphore.increment()
#   doSomething().then(semaphore.decrement())
#
#   doAnotherThingThatTakesACallback(semaphore.wait())
#
#   semaphore.start()
#
#   semaphore.addCallback(-> print('hello'))
#
#   # Once count reaches 0 callback is executed:
#   # => 'hello'
#
#   # Assuming that semaphore was already fired:
#   semaphore.addCallback(-> print('this will print immediately'))
#   # => 'this will print immediately'
module.exports = class Semaphore

  constructor: ->
    @count = 0
    @started = false
    @wasFired = false
    @callbacks = []


  addCallback: (callback) ->
    if @wasFired
      callback()
    else
      @callbacks.push(callback)


  isReady: ->
    @wasFired


  start: ->
    assert not @started,
      "Unable to start Semaphore once started."
    @started = true
    @fireIfReady()


  increment: ->
    assert not @wasFired,
      "Unable to increment count once Semaphore is fired."
    @count += 1


  decrement: ->
    assert @count > 0,
      "Unable to decrement count resulting in negative count."
    @count -= 1
    @fireIfReady()


  wait: ->
    @increment()
    => @decrement()


  # @private
  fireIfReady: ->
    if @count == 0 && @started == true
      @wasFired = true
      callback() for callback in @callbacks
