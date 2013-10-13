# A Page is a subclass of RenderingContainer which is intended to be shown to
# the user. It has a Loader which allows you to inject CSS and JS files into the
# page.
class Page extends RenderingContainer

  constructor: (renderNode) ->
    super()

    @document = window.document
    @$document = $(@document)
    @$body = $(@document.body)
    @renderNode = renderNode || $(".#{ docClass.section }")[0]

    @loader = new Loader()
