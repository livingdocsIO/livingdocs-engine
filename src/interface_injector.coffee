class InterfaceInjector

  constructor: ({ @snippet, @snippetContainer, @renderer }) ->
    if @snippet
      assert @snippet.snippetView?.attachedToDom,
        'snippet is not attached to the DOM'

    if @snippetContainer
      if not @snippetContainer.isRoot && not @snippetContainer.parentSnippet?.snippetView?.attachedToDom
        log.error('snippetContainer is not attached to the DOM')


  before: ($elem) ->
    assert @snippet, 'cannot use before on a snippetContainer'
    @beforeInjecting($elem)
    @snippet.snippetView.$html.before($elem)


  after: ($elem) ->
    assert @snippet, 'cannot use after on a snippetContainer'
    @beforeInjecting($elem)
    @snippet.snippetView.$html.after($elem)


  append: ($elem) ->
    assert @snippetContainer, 'cannot use append on a snippet'
    @beforeInjecting($elem)
    @renderer.appendToContainer(@snippetContainer, $elem)


  remove: () ->
    for $elem in @injected
      $elem.remove()

    @injected = undefined


  beforeInjecting: ($elem) ->
    @injected ||= []
    @injected.push($elem)
    $elem.addClass(docClass.interface)
