DragBase = require('../../../src/interaction/drag_base')
Page = require('../../../src/rendering_container/page')

describe 'DragBase', ->
  beforeEach ->
    @page = new Page(renderNode: $('div'))
    @$dragged = $('<div>')
    @event =
      pageX: 200
      pageY: 50
      clientX: 200
      clientY: 50
      preventDefault: ->
      stopPropagation: ->
      target: @$dragged[0]

    @dragHandler =
      start: ->
      move: ->
      drop: ->
      reset: ->


  describe 'init() with longpress mode', ->
    beforeEach ->
      @drag = new DragBase(@page)
      @config =
        longpress:
          showIndicator: true
          delay: 1
          tolerance: 3


    it 'init does not start drag with longpress', ->
      @drag.init(@dragHandler, @event, @config)
      expect(@drag.started).not.to.be.ok


    it 'resets the drag when the cursor moves too much', (done) ->
      @drag.init(@dragHandler, @event, @config)
      stub = sinon.stub @dragHandler, 'reset', (args) ->
        done()

      @drag.move({ pageX: 204, pageY: 50 })


    it 'starts after delay', (done) ->
      @drag.init(@dragHandler, @event, @config)
      stub = sinon.stub @dragHandler, 'start', (args) ->
        expect(args.pageX).to.equal(200)
        expect(args.pageY).to.equal(50)
        done()


  describe 'init() with direct mode', ->
    beforeEach ->
      @drag = new DragBase(@page)
      @config =
        direct: true


    it 'does start the drag immediately', ->
      @drag.init(@dragHandler, @event, @config)
      expect(@drag.started).to.be.ok

