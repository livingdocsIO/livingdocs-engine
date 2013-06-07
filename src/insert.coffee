class Insert

  constructor: (@insertFunc) ->


  attach: (snippet) ->
    @insertFunc(snippet)



# Static Methods
# --------------

Insert.append = (snippetContainer) ->
  new Insert($.proxy(snippetContainer, 'append'))


Insert.prepend = (snippetContainer) ->
  new Insert($.proxy(snippetContainer, 'prepend'))


Insert.after = (snippet) ->
  new Insert($.proxy(snippet, 'before'))


Insert.before = (snippet) ->
  new Insert($.proxy(snippet, 'after'))
