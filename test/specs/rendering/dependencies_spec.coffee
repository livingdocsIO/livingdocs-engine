Dependencies = require('../../../src/rendering/dependencies')

describe 'dependencies:', ->

  describe 'new instance', ->

    it 'instantiates', ->
      { componentTree } = test.get('componentTree')
      dependencies = new Dependencies({ componentTree })
      expect(dependencies).to.be.an.instanceof(Dependencies)


  describe 'add()', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      @dependencies = new Dependencies({ @componentTree })


    it 'adds a js dependency', ->
      @dependencies.addJs(src: 'http://resrc.it')
      expect(@dependencies.serialize().js).to.deep.equal [
        { src: 'http://resrc.it' }
      ]


    it 'only adds a named dependency once', ->
      @dependencies.addJs(name: 'twitter', src: 'https://platform.twitter.com/widgets.js')
      @dependencies.addJs(name: 'twitter', src: 'https://platform.twitter.com/widgets.js')
      expect(@dependencies.serialize().js).to.deep.equal [
        { src: 'https://platform.twitter.com/widgets.js', name: 'twitter' }
      ]


    it 'adds a dependency with all options', ->
      component = @componentTree.createComponent('text')
      @componentTree.append(component)

      @dependencies.addJs
        name: 'twitter'
        src: 'https://platform.twitter.com/widgets.js'
        async: true
        component: component

      expect(@dependencies.serialize().js).to.deep.equal [
        {
          src: 'https://platform.twitter.com/widgets.js'
          name: 'twitter'
          async: true
          componentIds: [ component.id ]
        }
      ]


    it 'adds a css dependency', ->
      @dependencies.addCss(src: 'http://restyle.it')
      expect(@dependencies.serialize().css).to.deep.equal [
        { src: 'http://restyle.it' }
      ]


  describe 'remove dependencies', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      @dependencies = new Dependencies({ @componentTree })

      @component = @componentTree.createComponent('text')
      @componentTree.append(@component)


    it 'removes a dependency when the component is removed', ->
      @dependencies.addJs
        src: 'https://platform.twitter.com/widgets.js'
        component: @component

      expect( @dependencies.hasJs() ).to.equal(true)
      @component.remove()
      expect( @dependencies.hasJs() ).to.equal(false)


  describe 'deserialize()', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      @dependencies = new Dependencies({ @componentTree })


    it 'deserializes the dependencies', ->
      data =
        js: [
          { src: 'https://platform.twitter.com/widgets.js', name: 'twitter', async: true }
          { code: 'alert("hey")', name: 'custom101', inline: true }
        ]
        css: [
          { src: 'http://restyle.it', name: 'restyle' }
          { code: '* { background: red !important; }', name: 'important styles', inline: true }
        ]
      @dependencies.deserialize(data)
      expect(@dependencies.serialize()).to.deep.equal(data)


    it 're-adds components of dependencies', ->
      @component = @componentTree.createComponent('text')
      @componentTree.append(@component)

      data =
        js: [
          { code: 'alert("hey")', name: 'custom101', inline: true, componentIds: [ @component.id ] }
        ]

      @dependencies.deserialize(data)
      expect(@dependencies.serialize()).to.deep.equal(data)


    it 'discards dependencies with non-existing components', ->
      data =
        js: [
          { code: 'alert("hey")', name: 'custom101', inline: true, componentIds: ['xxx'] }
        ]
      @dependencies.deserialize(data)
      expect(@dependencies.serialize()).to.deep.equal({})


  describe 'prefix relative urls', ->

    beforeEach ->
      @dependencies = new Dependencies(prefix: '/designs/test')
      @checkConversion = (a, b) =>
        @dependencies.addCss(src: a)
        dependency = @dependencies.css[0]
        expect(dependency.src).to.equal(b)


    it 'converts an url that starts with "./"', ->
      @checkConversion('./design.css', '/designs/test/design.css')


    it 'converts a relative url', ->
      @checkConversion('design.css', '/designs/test/design.css')


    it 'does not touch a url that starts with "http://"', ->
      @checkConversion('http://design.css', 'http://design.css')


    it 'does not touch a url that starts with "https://"', ->
      @checkConversion('https://design.css', 'https://design.css')


    it 'does not touch a url that starts with "/"', ->
      @checkConversion(
        '/my/custom/path/to/the/design.css',
        '/my/custom/path/to/the/design.css'
      )

