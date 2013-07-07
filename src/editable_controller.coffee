# EditableJS Controller
# ---------------------
# Integrate EditableJS into Livingdocs
class EditableController


  constructor: (@page) ->

    # configure editableJS
    Editable.init
      log: false

    @selection = $.Callbacks()

    Editable
      .focus($.proxy(@focus, @))
      .blur($.proxy(@blur, @))
      .selection($.proxy(@selectionChanged, @))


  add: (nodes) ->
    Editable.add(nodes)


  focus: (element) ->
    snippet = dom.parentSnippet(element)
    @page.focus.editableFocused(element, snippet)


  blur: (element) ->
    snippet = dom.parentSnippet(element)
    @page.focus.editableBlurred(element, snippet)
    editableName = element.getAttribute(docAttr.editable)
    snippet.set(editableName, element.innerHTML)


  selectionChanged: (element, selection) ->
    snippet = dom.parentSnippet(element)
    @selection.fire(snippet, element, selection)

