Page = require('../../../src/rendering_container/page')
Design = require('../../../src/design/design')
SnippetTree = require('../../../src/snippet_tree/snippet_tree')
Renderer = require('../../../src/rendering/renderer')

module.exports = do ->

  pageWithTestDesign: ->
    design = new Design(test.testDesign)
    page = new Page(renderNode: $('<section>'), design: design)
    tree = new SnippetTree(design: design)

    new Renderer(snippetTree: tree, renderingContainer: page)
