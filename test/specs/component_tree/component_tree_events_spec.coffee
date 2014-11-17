ComponentTree = require('../../../src/component_tree/component_tree')
base64Image = require('../../support/test_base64_image')

# ComponentTree Events
# ------------------
# Check that ComponentTree fires events properly

describe 'ComponentTree (Layout Events) ->', ->


  beforeEach ->
    { @componentTree } = test.get('componentTree')
    monitor = test.createCallbackMonitor
    @expectComponentAdded = monitor(@componentTree.componentAdded)
    @expectComponentRemoved = monitor(@componentTree.componentRemoved)
    @expectComponentMoved = monitor(@componentTree.componentMoved)
    @expectChanged = monitor(@componentTree.changed)


  describe 'appending a component', ->


    beforeEach ->
      @appendComponent = =>
        component = test.getComponent('title')
        @componentTree.append(component)


    it 'fires componentAdded event', ->
      @expectComponentRemoved 0, =>
        @expectComponentMoved 0, =>
          @expectComponentAdded 1, =>
            @appendComponent()


    it 'fires changed event', ->
      @expectChanged 1, => @appendComponent()


  describe 'with two components (Events) ->', ->


    beforeEach ->
      @componentA = test.getComponent('title')
      @componentB = test.getComponent('title')
      @componentTree.append(@componentA).append(@componentB)


    describe 'removing a component', ->
      beforeEach ->
        @removeComponent = =>
          @componentB.remove()


      it 'fires componentRemoved event', ->
        @expectComponentAdded 0, =>
          @expectComponentMoved 0, =>
            @expectComponentRemoved 1, =>
              @removeComponent()


      it 'fires changed event', ->
        @expectChanged 1, => @removeComponent()


    describe 'moving a component', ->


      beforeEach ->
        @moveComponents = =>
          @componentB.up()
          @componentA.up()


      it 'fires componentMoved event', ->
        @expectComponentMoved 2, => @moveComponents()


      it 'fires changed event', ->
        @expectChanged 2, => @moveComponents()


      describe "that can't be moved", ->


        beforeEach ->
          @unsuccessfullyMoveComponent = => @componentA.up()


        it 'does not fire componentMoved event', ->
          @expectComponentMoved 0, => @unsuccessfullyMoveComponent()


        it 'does not fire changed event', ->
          @expectChanged 0, => @unsuccessfullyMoveComponent()


describe 'ComponentTree (Content Events)', ->

  beforeEach ->
    { @componentTree } = test.get('componentTree')
    monitor = test.createCallbackMonitor
    @expectContentChanged = monitor(@componentTree.componentContentChanged)
    @expectChanged = monitor(@componentTree.changed)

    @componentA = test.getComponent('title')
    @imageComponent = test.getComponent('image')
    @coverComponent = test.getComponent('cover')
    @componentTree.append(@componentA)
    @componentTree.append(@imageComponent)
    @componentTree.append(@coverComponent)


  describe 'changing the title content', ->

    beforeEach ->
      @changeComponentContent = =>
        @componentA.set('title', 'Talk to the hand')


    it 'fires componentContentChanged event', ->
      @expectContentChanged 1, => @changeComponentContent()


    it 'fires changed event', ->
      @expectChanged 1, => @changeComponentContent()


  describe 'changing the image src', ->

    beforeEach ->
      @changeComponentContent = =>
        @imageComponent.set('image', 'http://www.lolcats.com/images/1.jpg')


    it 'fires componentContentChanged event', ->
      @expectContentChanged 1, => @changeComponentContent()


  describe 'changing the background image', ->

    beforeEach ->
      @changeComponentContent = =>
        @coverComponent.set('image', 'http://www.lolcats.com/images/u/11/39/lolcatsdotcomaptplf8mvc1o2ldb.jpg')


    it 'fires componentContentChanged event', ->
      @expectContentChanged 1, => @changeComponentContent()


  describe 'changing the img src to a volatile base64 string', ->

    beforeEach ->
      @changeComponentContent = =>
        @imageComponent.directives.get('image').setBase64Image(base64Image)


    it 'fires componentContentChanged event', ->
      @expectContentChanged 1, => @changeComponentContent()


describe 'ComponentTree (Html Events)', ->

  beforeEach ->
    { @componentTree } = test.get('componentTree')
    monitor = test.createCallbackMonitor
    @expectHtlmChanged = monitor(@componentTree.componentHtmlChanged)
    @expectChanged = monitor(@componentTree.changed)

    @hero = test.getComponent('hero')
    @componentTree.append(@hero)


  describe 'adding a style', ->

    beforeEach ->
      @changeStyle = => @hero.setStyle('extra-space', 'extra-space')

    it 'fires htmlChanged event', ->
      @expectHtlmChanged 1, => @changeStyle()


    it 'fires changed event', ->
      @expectChanged 1, => @changeStyle()


    it '...twice fires htmlChanged event only once', ->
      @expectHtlmChanged 1, =>
        @changeStyle()
        @changeStyle()


  describe 'adding an invalid style', ->

    it 'does not fire the htmlChanged event', ->
      @expectHtlmChanged 0, =>
        @hero.setStyle('extra-space', 'gazillion-pixel-whitespace')


  describe 'ComponentTree (Data Events)', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      monitor = test.createCallbackMonitor
      @expectDataChanged = monitor(@componentTree.componentDataChanged)
      @expectChanged = monitor(@componentTree.changed)

      @hero = test.getComponent('hero')
      @componentTree.append(@hero)


    describe 'adding data', ->

      beforeEach ->
        @changeData = => @hero.data(
          'geojson':
            'features': []
        )


      it 'fires dataChanged event', ->
        @expectDataChanged 1, => @changeData()


      it 'fires changed event', ->
        @expectChanged 1, => @changeData()


      it '...twice fires dataChanged event only once', ->
        @expectDataChanged 1, =>
          @changeData()
          @changeData()
