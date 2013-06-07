# EditableJS Controller
# ---------------------
# Integrate EditableJS into Livingdocs
editableController = do ->

  # Private Closure
  # ---------------

  initialized = false


  # Return Object
  # -------------

  selection: $.Callbacks()

  setup: ->
    return if initialized
    intialized = true

    # configure editable
    Editable.init
      log: false


    Editable
      .focus (element) ->
        snippet = dom.parentSnippet(element)
        focus.editableFocused(element, snippet)


      .blur (element) ->
        snippet = dom.parentSnippet(element)
        focus.editableBlurred(element, snippet)


      .selection (element, selection) =>
        snippet = dom.parentSnippet(element)
        @selection.fire(snippet, element, selection)



