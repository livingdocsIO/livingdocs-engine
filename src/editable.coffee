
# Setup EditableJS events
# -----------------------

setupEditable = ->

  Editable
  .focus (el) ->
    snippet = dom.parentSnippet(el)

    # todo: foucs the parent snippet of the editable
    log('Focus event handler was triggered on', snippet)
  .blur (el) ->
    snippet = dom.parentSnippet(el)

    # todo check if there were any changes to the editable.
    # if so trigger content changed on snippet

    log('Blur event handler was triggered on', snippet)

