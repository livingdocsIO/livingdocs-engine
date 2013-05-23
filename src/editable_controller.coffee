
# EditableJS Controller
# ---------------------
# Integrate EditableJS into Livingdocs

editableController = ->

  Editable
  .focus (el) ->
    focus.editableFocused(el)
  .blur (el) ->
    focus.editableBlurred(el)

