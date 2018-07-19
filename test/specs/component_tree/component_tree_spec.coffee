ComponentTree = require('../../../src/component_tree/component_tree')
ComponentModel = require('../../../src/component_tree/component_model')
ComponentContainer = require('../../../src/component_tree/component_container')
config = test.config

describe 'component_tree:', ->

  describe 'an empty tree', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')


    it 'has a ComponentContainer as root', ->
      expect(@componentTree.root).to.be.an.instanceof(ComponentContainer)


    describe 'append()', ->

      it 'sets componentTree property of the appended component', ->
        component = test.getComponent('title')
        @componentTree.append(component)
        expect(component.componentTree).to.equal(@componentTree)


      it 'appends a component to root', ->
        component = test.getComponent('title')
        @componentTree.append(component)
        expect(@componentTree.first()).to.equal(component)
        expect(@componentTree.root.last).to.equal(component)


  describe 'with two title components', ->

    beforeEach ->
      @componentTree = test.createComponentTree [
        title: undefined
      ,
        title: undefined
      ]
      @componentA = @componentTree.first()
      @componentB = @componentA.next


    it 'has previous and next properties of component set', ->
      expect(@componentA.previous).to.be.undefined
      expect(@componentA.next).to.equal(@componentB)


    it 'has first and last pointer of root set', ->
      expect(@componentTree.first()).to.equal(@componentA)
      expect(@componentTree.root.last).to.equal(@componentB)


    it 'has linked components correctly', ->
      expect(@componentTree.first().previous).to.be.undefined
      expect(@componentTree.first().next).to.equal(@componentB)
      expect(@componentTree.root.last.previous).to.equal(@componentA)
      expect(@componentTree.root.last.next).to.be.undefined


    describe 'eq()', ->

      it 'can find the second component', ->
        secondComponent = @componentTree.eq(1)
        expect(@componentTree.first().next).to.equal(secondComponent)


      it 'can\'t find the third component', ->
        thirdComponent = @componentTree.eq(2)
        expect(undefined).to.equal(thirdComponent)


    describe 'up()', ->

      it 'moves the second component up', ->
        @componentB.up()

        expect(@componentB.previous).to.be.undefined
        expect(@componentB.next).to.equal(@componentA)

        expect(@componentA.previous).to.equal(@componentB)
        expect(@componentA.next).to.be.undefined


      it 'updates the first and last pointers of the container', ->
        @componentB.up()

        expect(@componentTree.first()).to.equal(@componentB)
        expect(@componentTree.root.last).to.equal(@componentA)


    describe 'remove()', ->

      it 'removes the second component', ->
        @componentB.remove()

        expect(@componentA.previous).to.be.undefined
        expect(@componentA.next).to.be.undefined

        expect(@componentTree.first()).to.equal(@componentA)
        expect(@componentTree.root.last).to.equal(@componentA)

        expect(@componentB.parentContainer).to.be.undefined
        expect(@componentB.componentTree).to.be.undefined
        expect(@componentB.previous).to.be.undefined
        expect(@componentB.next).to.be.undefined


    describe 'inserting the second component after the first', ->

      it 'is ignored', ->
        @componentA.after(@componentB)
        expect(@componentA.previous).to.be.undefined
        expect(@componentA.next).to.equal(@componentB)
        expect(@componentB.previous).to.equal(@componentA)
        expect(@componentB.next).to.be.undefined


    describe 'inserting the first component before the second', ->

      it 'is ignored', ->
        @componentB.before(@componentA)
        expect(@componentA.previous).to.be.undefined
        expect(@componentA.next).to.equal(@componentB)
        expect(@componentB.previous).to.equal(@componentA)
        expect(@componentB.next).to.be.undefined


  describe 'with a single-column row component', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      @container = test.getComponent('container')
      @componentTree.append(@container)


    describe 'append()', ->

      it 'adds a component to the single column via the componentContainer', ->
        titleComponent = test.getComponent('title')
        mainContainer = @container.containers['children']
        mainContainer.append(titleComponent)
        expect(mainContainer.first).to.equal(titleComponent)


      it 'adds a component to the main column via component', ->
        titleComponent = test.getComponent('title')
        @container.append('children', titleComponent)
        mainContainer = @container.containers['children']
        expect(mainContainer.first).to.equal(titleComponent)


      it 'the appended component has a parent component', ->
        titleComponent = test.getComponent('title')
        @container.append('children', titleComponent)
        expect( titleComponent.getParent() ).to.equal(@container)


  describe 'with a multi-column row component', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      @rowComponent = test.getComponent('row')
      @componentTree.append(@rowComponent)


    describe 'append()', ->

      it 'adds a component to the main column via the componentContainer', ->
        titleComponent = test.getComponent('title')
        mainContainer = @rowComponent.containers['main']
        mainContainer.append(titleComponent)
        expect(mainContainer.first).to.equal(titleComponent)


      it 'adds a component to the main column via component', ->
        titleComponent = test.getComponent('title')
        @rowComponent.append('main', titleComponent)

        mainContainer = @rowComponent.containers['main']
        expect(mainContainer.first).to.equal(titleComponent)


      it 'the appended component has a parent component', ->
        titleComponent = test.getComponent('title')
        @rowComponent.append('main', titleComponent)
        expect( titleComponent.getParent() ).to.equal(@rowComponent)


      it 'fails to add a listItem component', ->
        listItem = test.getComponent('listItem')
        func = => @rowComponent.append('main', listItem)
        expect(func).to.throw('is not allowed as a child')


    describe 'each()', ->

      it 'visits the row component', ->
        visits = 0
        @componentTree.each ->
          visits += 1
        expect(visits).to.equal(1)


      it 'visits the row component and its children', ->
        # add 2 components to main container
        for num in [0..2]
          @rowComponent.append('main', test.getComponent('title'))

        # add 3 components to sidebar container
        for num in [0..1]
          @rowComponent.append('sidebar', test.getComponent('title'))

        visits = 0
        @componentTree.each ->
          visits += 1

        # check that all 6 components where visited by each
        expect(visits).to.equal(6)


    describe 'eachContainer()', ->

      it 'visits all containers', ->
        visits = 0
        @componentTree.eachContainer ->
          visits += 1

        expect(visits).to.equal(3)


    describe 'all()', ->

      it 'visits all components and containers', ->
        visitedComponents = 0
        visitedContainers = 0
        @componentTree.all (componentOrContainer) ->
          if componentOrContainer instanceof ComponentModel
            visitedComponents += 1
          else if componentOrContainer instanceof ComponentContainer
            visitedContainers += 1

        expect(visitedComponents).to.equal(1)
        expect(visitedContainers).to.equal(3)


  describe 'with a list component', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      @list = test.getComponent('list')
      @children = @list.containers['children']
      @componentTree.append(@list)


    describe 'append()', ->

      it 'fails to add a restricted title component', ->
        titleComponent = test.getComponent('title')

        func = => @children.append(titleComponent)
        expect(func).to.throw("Component 'title' is not allowed as a child")


      it 'succeeds to add an allowed listItem component', ->
        listItem = test.getComponent('listItem')
        @list.append('children', listItem)
        expect(@children.first).to.equal(listItem)


      it 'succeeds to add an allowed text component', ->
        text = test.getComponent('text')
        @list.append('children', text)
        expect(@children.first).to.equal(text)


  describe 'with three levels', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      @row = test.getComponent('row')
      @rowInMain = test.getComponent('row')
      @title = test.getComponent('title')
      @text = test.getComponent('text')

      @componentTree.append(@row)
      @row.append('main', @rowInMain)
      @row.append('main', @title)
      @rowInMain.append('sidebar', @text)

      # Thats how the componentTree looks now:
      # -row
      #   main:
      #     -rowInMain
      #       sidebar:
      #         -text
      #     -title


    describe 'each()', ->

      it 'visits all containers in the right order', ->
        visitedComponents = []
        @componentTree.each (component) ->
          visitedComponents.push(component)

        # components should be traversed in order of appearance
        expect(visitedComponents.length).to.equal(4)
        expect(visitedComponents[0]).to.equal(@row)
        expect(visitedComponents[1]).to.equal(@rowInMain)
        expect(visitedComponents[2]).to.equal(@text)
        expect(visitedComponents[3]).to.equal(@title)


    describe 'isDropAllowed()', ->

      it 'does allow to insert itself to the root container', ->
        target =
          target: 'root'
        isAllowed = @componentTree.isDropAllowed(@row, target)
        expect(isAllowed).to.equal(true)


      it 'does not allow to insert itself next to a child', ->
        target =
          target: 'component'
          componentView: { model: @text }
        isAllowed = @componentTree.isDropAllowed(@row, target)
        expect(isAllowed).to.equal(false)


      it 'does not allow to insert to a container of itself', ->
        target =
          target: 'container'
          componentView: { model: @row }
          containerName: 'main'
        isAllowed = @componentTree.isDropAllowed(@row, target)
        expect(isAllowed).to.equal(false)


      it 'does not allow to insert itself to a container of a child', ->
        target =
          target: 'container'
          componentView: { model: @rowInMain }
          containerName: 'sidebar'
        isAllowed = @componentTree.isDropAllowed(@row, target)
        expect(isAllowed).to.equal(false)


  describe 'with three components', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      @components = []
      for index in [0..2]
        @components[index] = test.getComponent('text')
        @componentTree.append(@components[index])


    # regression test for https://github.com/livingdocsIO/livingdocs-engine/issues/13
    it 'moving the last component one up does not currupt the componentTree', ->
      @components[2].up()
      visitedComponents = []
      @componentTree.each (component) ->
        visitedComponents.push(component)

      expect(visitedComponents.length).to.equal(3)
      expect(visitedComponents[0]).to.equal(@components[0])
      expect(visitedComponents[1]).to.equal(@components[2])
      expect(visitedComponents[2]).to.equal(@components[1])
