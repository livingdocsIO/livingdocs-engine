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


    it 'only adds the same dependency once', ->
      @dependencies.addJs(src: 'https://platform.twitter.com/widgets.js')
      @dependencies.addJs(src: 'https://platform.twitter.com/widgets.js')
      expect(@dependencies.serialize().js).to.deep.equal [
        { src: 'https://platform.twitter.com/widgets.js' }
      ]


    it 'adds a dependency with all options', ->
      component = @componentTree.createComponent('text')
      @componentTree.append(component)

      @dependencies.addJs
        name: 'twitter'
        namespace: 'embeds.twitter'
        src: 'https://platform.twitter.com/widgets.js'
        component: component

      expect(@dependencies.serialize().js).to.deep.equal [
        {
          src: 'https://platform.twitter.com/widgets.js'
          name: 'twitter'
          namespace: 'embeds.twitter'
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
          { src: 'https://platform.twitter.com/widgets.js', name: 'twitter' }
          { code: 'alert("hey")', name: 'custom101', inline: true, namespace: 'embed.test' }
        ]
        css: [
          { src: 'http://restyle.it', name: 'restyle', namespace: 'embed.test' }
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
      @dependencies = new Dependencies()
      @checkConversion = (a, b) =>
        @dependencies.addCss
          src: a
          assetsBasePath: '/designs/test'

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




  describe 'namespaces', ->

    beforeEach ->
      { @componentTree } = test.get('componentTree')
      @dependencies = new Dependencies({ @componentTree })


    it 'adds the same dependency twice if it has different namespaces', ->
      @dependencies.addJs(namespace: 'twitter', src: '//js.com/yeah.js')
      @dependencies.addJs(src: '//js.com/yeah.js')
      expect(@dependencies.js[0].src).to.equal('//js.com/yeah.js')
      expect(@dependencies.js[1].src).to.equal('//js.com/yeah.js')


    it 'lists all namespaces of dependencies', ->
      @dependencies.addJs(namespace: 'embeds.twitter', src: '//a.js')
      @dependencies.addJs(namespace: 'embeds.youtube', src: '//b.js')
      expect(@dependencies.getNamespaces()).to.have.members ['embeds.twitter', 'embeds.youtube']


    it 'adds two dependencies with the same namespace', ->
      @dependencies.addJs(namespace: 'embeds.twitter', src: '//a.js')
      @dependencies.addCss(namespace: 'embeds.twitter', src: '//b.css')
      expect(@dependencies.js[0].namespace).to.equal('embeds.twitter')
      expect(@dependencies.css[0].namespace).to.equal('embeds.twitter')


    it 'gets all dependencies of a namespace', ->
      @dependencies.addJs(namespace: 'embeds.twitter', src: '//a.js')
      @dependencies.addCss(namespace: 'embeds.twitter', src: '//b.css')
      namespace = @dependencies.getNamespace('embeds.twitter')
      expect(namespace[0].src).to.equal('//a.js')
      expect(namespace[1].src).to.equal('//b.css')


    it 'only adds the same dependency once within a namespace', ->
      @dependencies.addJs(namespace: 'embeds.livingdocs', src: '//a.js')
      @dependencies.addJs(namespace: 'embeds.livingdocs', src: '//a.js')
      expect(@dependencies.serialize().js).to.deep.equal [
        { src: '//a.js', namespace: 'embeds.livingdocs', }
      ]




