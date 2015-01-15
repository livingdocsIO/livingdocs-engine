Dependencies = require('../../../src/rendering/dependencies')
dependenciesToHtml = require('../../../src/rendering/dependencies_to_html')

describe 'dependencies_to_html:', ->

  beforeEach ->
    { @componentTree } = test.get('componentTree')
    @dependencies = new Dependencies({ @componentTree })


  describe 'printJs()', ->

    it 'prints a js dependency', ->
      @dependencies.addJs(src: 'http://resrc.it')
      expect dependenciesToHtml.printJs(@dependencies)
      .to.equal('<script src="http://resrc.it"></script>')


    it 'prints an inline js dependency', ->
      @dependencies.addJs(code: 'alert("testing");')
      expect dependenciesToHtml.printJs(@dependencies)
      .to.equal('<script> alert("testing"); </script>')


    it 'prints an inline js dependency with <script> tags', ->
      @dependencies.addJs(code: '<script>alert("testing");</script>')
      expect dependenciesToHtml.printJs(@dependencies)
      .to.equal('<script> alert("testing"); </script>')


  describe 'printCss()', ->

    it 'prints a css dependency', ->
      @dependencies.addCss(src: 'http://my.styles.css')
      expect dependenciesToHtml.printCss(@dependencies)
      .to.equal('<link rel="stylesheet" type="text/css" href="http://my.styles.css">')


    it 'prints an inline css dependency', ->
      @dependencies.addCss(code: '.style { color: blue; }')
      expect dependenciesToHtml.printCss(@dependencies)
      .to.equal('<style> .style { color: blue; } </style>')


    it 'prints an inline css dependency with <style> tags', ->
      @dependencies.addCss(code: '<style>.style { color: blue; }</style>')
      expect dependenciesToHtml.printCss(@dependencies)
      .to.equal('<style> .style { color: blue; } </style>')

