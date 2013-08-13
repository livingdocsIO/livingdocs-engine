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
    snippet = dom.parentSnippet(element)
    @page.focus.editableFocused(element, snippet)


  blur: (element) ->
    snippet = dom.parentSnippet(element)
    @page.focus.editableBlurred(element, snippet)
    editableName = element.getAttribute(docAttr.editable)
    snippet.set(editableName, element.innerHTML)


  insert: (element, direction, cursor) ->
    snippetElem = dom.parentSnippetElem(element)
    template = snippetElem.template
    if template.editableCount == 1
      copy = template.createSnippet()
      snippetElem.snippet.after(copy)
      if copiedElem = snippetElem.next()
        copiedElem.focus()

    false # disable editableJS default behaviour


  split: (element, before, after, cursor) ->
    log('engine: split')
    false # disable editableJS default behaviour


  selectionChanged: (element, selection) ->
    snippet = dom.parentSnippet(element)
    @selection.fire(snippet, element, selection)

