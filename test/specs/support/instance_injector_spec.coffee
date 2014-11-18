Page = require('../../../src/rendering_container/page')
RenderingContainer = require('../../../src/rendering_container/rendering_container')
Design = require('../../../src/design/design')
ComponentTree = require('../../../src/component_tree/component_tree')
Renderer = require('../../../src/rendering/renderer')


describe '(spec support) instance_injector:', ->

  it 'gets a componentTree', ->
    instances = test.get('componentTree')
    expect(instances.design).to.be.an.instanceof(Design)
    expect(instances.componentTree).to.be.an.instanceof(ComponentTree)


  it 'gets a renderer with a page', ->
    instances = test.get('page', 'renderer')
    expect(instances.design).to.be.an.instanceof(Design)
    expect(instances.componentTree).to.be.an.instanceof(ComponentTree)
    expect(instances.page).to.be.an.instanceof(Page)
    expect(instances.renderer).to.be.an.instanceof(Renderer)


  it 'gets a renderer with a renderingContainer', ->
    instances = test.get('renderingContainer', 'renderer')
    expect(instances.design).to.be.an.instanceof(Design)
    expect(instances.componentTree).to.be.an.instanceof(ComponentTree)
    expect(instances.renderingContainer).to.be.an.instanceof(RenderingContainer)
    expect(instances.renderer).to.be.an.instanceof(Renderer)
