Dependency = require('../../../src/rendering/dependency')

describe 'dependency:', ->

  describe 'constructor', ->

    it 'throws an error for missing type param', ->
      test = ->
        dep = new Dependency
          src: 'http://www.jquery.com'

      expect(test).to.throw('type must be specified')


    it 'creates a js dependency with a src', ->
      dep = new Dependency
        src: 'http://www.jquery.com'
        type: 'js'

      expect(dep).to.be.an.instanceof(Dependency)


    it 'creates a js dependency with inline code', ->
      dep = new Dependency
        code: 'alert("testing");'
        type: 'js'

      expect(dep).to.be.an.instanceof(Dependency)


    it 'creates a css dependency with inline code', ->
      dep = new Dependency
        code: '.superstyle { color: red; }'
        type: 'css'

      expect(dep).to.be.an.instanceof(Dependency)


  describe 'isSameAs()', ->

    it 'compares to equal inline js dependencies', ->
      dep1 = new Dependency(code: 'alert("testing");', type: 'js')
      dep2 = new Dependency(code: 'alert("testing");', type: 'js')
      expect( dep1.isSameAs(dep2) ).to.equal(true)


    it 'spots a difference in inline js code', ->
      dep1 = new Dependency(code: 'alert("testing");', type: 'js')
      dep2 = new Dependency(code: 'alert("so testing");', type: 'js')
      expect( dep1.isSameAs(dep2) ).to.equal(false)


    it 'compares to equal inline css dependencies', ->
      dep1 = new Dependency(code: '.superstyle { color: red; }', type: 'css')
      dep2 = new Dependency(code: '.superstyle { color: red; }', type: 'css')
      expect( dep1.isSameAs(dep2) ).to.equal(true)


    it 'spots a difference in inline css code', ->
      dep1 = new Dependency(code: '.superstyle { color: red; }', type: 'css')
      dep2 = new Dependency(code: '.superstyle { color: blue; }', type: 'css')
      expect( dep1.isSameAs(dep2) ).to.equal(false)

