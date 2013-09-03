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
      .merge($.proxy(@merge, @))
      .split($.proxy(@split, @))
      .selection($.proxy(@selectionChanged, @))


  add: (nodes) ->
    Editable.add(nodes)


  focus: (element) ->
    snippetView = dom.findSnippetView(element)
    @page.focus.editableFocused(element, snippetView)


  blur: (element) ->
    snippetView = dom.findSnippetView(element)
    @page.focus.editableBlurred(element, snippetView)
    editableName = element.getAttribute(docAttr.editable)
    snippetView.model.set(editableName, element.innerHTML)


  insert: (element, direction, cursor) ->
    view = dom.findSnippetView(element)
    if view.model.editableCount == 1

      # todo: make this configurable
      template = document.design.get('text')
      copy = template.createModel()

      newView = if direction == 'before'
        view.model.before(copy)
        view.prev()
      else
        view.model.after(copy)
        view.next()

      newView.focus() if newView

    false # disable editableJS default behaviour


  merge: (element, direction, cursor) ->
    view = dom.findSnippetView(element)
    if view.model.editableCount == 1
      mergedView = if direction == 'before' then view.prev() else view.next()
      mergedView.focus() if mergedView

      # todo: check if mergedView is of same type or of type text
      if mergedView.template == view.template
        view.model.remove()


    log('engine: merge')
    false # disable editableJS default behaviour


  split: (element, before, after, cursor) ->
    log('engine: split')
    view = dom.findSnippetView(element)
    if view.model.editableCount == 1
      # create copy of current snippet to populate with splitted content
      template = document.design.get(view.template.identifier)
      copy = template.createModel()

      # convert DocumentFragment of "before" to dom element, get innerHTML
      firstFragment = window.document.createElement('div')
      firstFragment.appendChild(before)
      firstFragment = firstFragment.firstChild.innerHTML

      # convert DocumentFragment of "after" to dom element, get innerHTML
      secondFragment = window.document.createElement('div')
      secondFragment.appendChild(after)
      secondFragment = secondFragment.firstChild.innerHTML

      # set editable of snippets to innerHTML of fragments
      editable = Object.keys(template.editables)[0]
      view.set(editable, firstFragment)
      copy.set(editable, secondFragment)

      # append and focus copy of snippet
      view.model.after(copy)
      view.next().focus()

    false # disable editableJS default behaviour


  selectionChanged: (element, selection) ->
    snippetView = dom.findSnippetView(element)
    @selection.fire(snippetView, element, selection)
