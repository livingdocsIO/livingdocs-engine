# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
class Page extends RenderingContainer

  constructor: ({ renderNode, readOnly, hostWindow, @design }={}) ->
    @isReadOnly = readOnly if readOnly?
    @setWindow(hostWindow)

    super()

    renderNode = renderNode || $(".#{ docClass.section }", @$body)
    if renderNode.jquery
      @renderNode = renderNode[0]
    else
      @renderNode = renderNode


  beforeReady: ->
    @loader = new Loader()
    @loader.css(@design.css, @readySemaphore.wait()) if @design?.css


  setWindow: (hostWindow) ->
    @window = hostWindow || window
    @document = @window.document
    @$document = $(@document)
    @$body = $(@document.body)
