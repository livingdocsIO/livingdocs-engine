class InterfaceInjector

  constructor: ({ @snippet, @snippetContainer, @renderer }) ->

    if @snippet && not @snippet.snippetHtml?.attachedToDom
      log.error('snippet is not attached to the DOM')

    if @snippetContainer
      if not @snippetContainer.isRoot && not @snippetContainer.parentSnippet?.snippetHtml?.attachedToDom
        log.error('snippetContainer is not attached to the DOM')


  before: ($elem) ->
    if @snippet
      @beforeInjecting($elem)
      @snippet.snippetHtml.$html.before($elem)
    else
      log.error('cannot use before on a snippetContainer')


  after: ($elem) ->
    if @snippet
      @beforeInjecting($elem)
      @snippet.snippetHtml.$html.after($elem)
    else
      log.error('cannot use after on a snippetContainer')


  append: ($elem) ->
    if @snippetContainer
      @beforeInjecting($elem)
      @renderer.appendToContainer(@snippetContainer, $elem)
    else
      log.error('cannot use append on a snippet')


  remove: () ->
    for $elem in @injected
      $elem.remove()

    @injected = undefined


  beforeInjecting: ($elem) ->
    @injected ||= []
    @injected.push($elem)
    $elem.addClass(docClass.interface)
