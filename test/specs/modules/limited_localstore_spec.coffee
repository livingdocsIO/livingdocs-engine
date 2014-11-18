localstore = require('../../../src/modules/localstore')
LimitedLocalstore = require('../../../src/modules/limited_localstore')

if localstore.isSupported()

  describe '(modules) limited_localstore:', ->

    describe 'Reset LimitedLocalstore', ->

      beforeEach ->
        @store = new LimitedLocalstore('test-store')
        @store.clear()


      it 'is empty at the beginning', ->
        index = @store.getIndex()
        expect(index.length).to.equal(0)


      it 'has a defautl limit of 10', ->
        expect(@store.limit).to.equal(10)


    describe 'LimitedLocalstore', ->

      beforeEach ->
        @store = new LimitedLocalstore('test-store', 3)


      it 'saves one item', ->
        @store.push('first')
        expect(@store.getIndex().length).to.equal(1)
        expect(@store.get()).to.equal('first')


      it 'saves a second item', ->
        @store.push('second')
        expect(@store.getIndex().length).to.equal(2)
        expect(@store.get()).to.equal('second')


      it 'removes the second item', ->
        expect(@store.pop()).to.equal('second')
        expect(@store.getIndex().length).to.equal(1)
        expect(@store.get()).to.equal('first')


      it 'removes the first item', ->
        expect(@store.pop()).to.equal('first')
        expect(@store.getIndex().length).to.equal(0)
        expect(@store.get()).to.be.undefined


      it 'removes no item because the store is empty', ->
        expect(@store.getIndex().length).to.equal(0)
        expect(@store.pop()).to.be.undefined


      it 'has a limit of 3', ->
        expect(@store.limit).to.equal(3)


      it 'does not add items above its limit', ->
        expect(@store.getIndex().length).to.equal(0)

        @store.push('first')
        @store.push('second')
        @store.push('third')
        @store.push('fourth') # 'first' should be removed at this point

        expect(@store.getIndex().length).to.equal(3)

        expect(@store.pop()).to.equal('fourth')
        expect(@store.pop()).to.equal('third')
        expect(@store.pop()).to.equal('second')

        expect(@store.getIndex().length).to.equal(0)
        expect(@store.pop()).to.be.undefined


