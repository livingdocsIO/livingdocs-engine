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
      .insert($.proxy(@insert, @))
      .split($.proxy(@split, @))
      .selection($.proxy(@selectionChanged, @))


  add: (nodes) ->
    Editable.add(nodes)


  focus: (element) ->
    snippetView = dom.parentSnippetView(element)
    @page.focus.editableFocused(element, snippetView)


  blur: (element) ->
    snippetView = dom.parentSnippetView(element)
    @page.focus.editableBlurred(element, snippetView)
    editableName = element.getAttribute(docAttr.editable)
    snippetView.model.set(editableName, element.innerHTML)


  insert: (element, direction, cursor) ->
    snippetView = dom.parentSnippetView(element)
    template = snippetView.template
    if template.editableCount == 1
      copy = template.createModel()
      snippetView.model.after(copy)
      if copiedElem = snippetView.next()
        copiedElem.focus()

    false # disable editableJS default behaviour


  split: (element, before, after, cursor) ->
    log('engine: split')
    false # disable editableJS default behaviour


  selectionChanged: (element, selection) ->
    snippetView = dom.parentSnippetView(element)
    @selection.fire(snippetView, element, selection)

