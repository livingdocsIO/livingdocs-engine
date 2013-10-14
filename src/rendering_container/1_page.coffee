# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
class Page extends RenderingContainer

  constructor: ({ renderNode, readOnly, hostWindow }={}) ->
    super()

    @isReadOnly = readOnly if readOnly?
    @setWindow(hostWindow)

    renderNode = renderNode || $(".#{ docClass.section }", @$body)
    @renderNode = renderNode[0] if renderNode.jquery

    @loader = new Loader()


  setWindow: (hostWindow) ->
    @window = hostWindow || window
    @document = @window.document
    @$document = $(@document)
    @$body = $(@document.body)
