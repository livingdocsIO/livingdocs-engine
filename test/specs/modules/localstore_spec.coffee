localstore = require('../../../src/modules/localstore')

if localstore.isSupported()
  describe 'localstore', ->
    beforeEach ->
      localstore.clear()


    describe 'get() and set()', ->

      it 'sets and gets a string', ->
        localstore.set('a', 'one')
        expect(localstore.get('a')).to.equal('one')


      it 'sets and gets an object', ->
        localstore.set('b', { two: 2 })
        expect(localstore.get('b')).to.deep.equal( two: 2 )


      it 'sets an entry to undefined', ->
        localstore.set('b', { two: 2 })
        localstore.set('b')
        expect(localstore.get('b')).to.be.undefined


    describe 'remove()', ->

      it 'removes an entry', ->
        localstore.set('c', 'three')
        localstore.remove('c')
        expect(localstore.get('c')).to.be.undefined


    describe 'clear()', ->

      it 'clears all entries', ->
        localstore.set('d', 'four')
        localstore.clear()
        expect(localstore.get('d')).to.be.undefined


    describe 'isSupported()', ->

      it 'returns true', ->
        expect(localstore.isSupported()).to.be.true
