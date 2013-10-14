# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
class Page extends RenderingContainer

  constructor: ({ renderNode, readOnly, hostWindow }={}) ->
    super()

    @isReadOnly = readOnly if readOnly?
    @setWindow(hostWindow)

    renderNode = renderNode || $(".#{ docClass.section }", @$body)
    if renderNode.jquery
      @renderNode = renderNode[0]
    else
      @renderNode = renderNode

    @loader = new Loader()


  setWindow: (hostWindow) ->
    @window = hostWindow || window
    @document = @window.document
    @$document = $(@document)
    @$body = $(@document.body)
