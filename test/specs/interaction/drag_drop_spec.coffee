DragDrop = require('../../../src/interaction/drag_drop')

describe 'DragDrop', ->

  beforeEach ->
    @drag = new DragDrop()
    @$dragged = $('<div>')
    @event =
      pageX: 200
      pageY: 50
      preventDefault: ->
      stopPropagation: ->
      target: @$dragged[0]


  it 'mousedown does not start drag with longpress', ->
    @drag.mousedown @$dragged, @event,
      longpressDelay: 10
      longpressDistanceLimit: 10

    expect(@drag.drag.started).not.to.be.ok


  describe 'longpress timeout', ->

    it 'starts after delay', (done) ->
      @drag.mousedown @$dragged, @event,
        longpressDelay: 10
        longpressDistanceLimit: 10
        onDragStart: =>
          expect(@drag.drag.started).to.be.true
          done()


  it 'mousedown does not start drag with minDistance', ->
    @drag.mousedown @$dragged, @event,
      minDistance: 10

    expect(@drag.drag.started).not.to.be.ok
