describe 'localstore', ->
  beforeEach ->
    localstore.clear()


  describe 'get() and set()', ->

    it 'sets and gets a string', ->
      localstore.set('a', 'one')
      expect(localstore.get('a')).toEqual('one')


    it 'sets and gets an object', ->
      localstore.set('b', { two: 2 })
      expect(localstore.get('b')).toEqual({ two: 2 })


    it 'sets an entry to undefined', ->
      localstore.set('b', { two: 2 })
      localstore.set('b')
      expect(localstore.get('b')).toEqual(undefined)


  describe 'remove()', ->

    it 'removes an entry', ->
      localstore.set('c', 'three')
      localstore.remove('c')
      expect(localstore.get('c')).toEqual(undefined)


  describe 'clear()', ->

    it 'clears all entries', ->
      localstore.set('d', 'four')
      localstore.clear()
      expect(localstore.get('d')).toEqual(undefined)


  describe 'isSupported()', ->

    it 'returns true', ->
      expect(localstore.isSupported()).toEqual(true)
