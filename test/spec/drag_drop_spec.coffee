describe 'DragDrop', ->

  beforeEach ->
    @drag = new DragDrop()
    @$dragged = $("<div>")
    @event =
      pageX: 200
      pageY: 50
      preventDefault: ->
      stopPropagation: ->
      target: @$dragged[0]


  it 'mousedown does not start drag with longpress', ->
    @drag.mousedown(@$dragged, @event, {
      longpressDelay: 10
      longpressDistanceLimit: 10
    })
    expect(@drag.drag.started).toBeFalsy()


  describe 'longpress timeout', ->

    it 'starts after delay', ->
      runs ->
        @drag.mousedown(@$dragged, @event, {
          longpressDelay: 10
          longpressDistanceLimit: 10
        })

      waitsFor( ->
        @drag.drag.started
      , 'longpress did not initialize', 50)

      runs ->
        expect(@drag.drag.started).toBeTruthy()


  it 'mousedown does not start drag with minDistance', ->
    @drag.mousedown(@$dragged, @event, {
      minDistance: 10
    })
    expect(@drag.drag.started).toBeFalsy()
