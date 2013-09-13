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
      .focus(@withContext(@focus))
      .blur(@withContext(@blur))
      .insert(@withContext(@insert))
      .merge(@withContext(@merge))
      .split(@withContext(@split))
      .selection(@withContext(@selectionChanged))


  # Register DOM nodes with EditableJS.
  # After that Editable will fire events for that node.
  add: (nodes) ->
    Editable.add(nodes)


  disableAll: ->
    $('[contenteditable]').attr('contenteditable', 'false')


  reenableAll: ->
    $('[contenteditable]').attr('contenteditable', 'true')


  # Get view and editableName from the DOM element passed by EditableJS
  #
  # All listeners params get transformed so they get view and editableName
  # instead of element:
  #
  # Example: listener(view, editableName, otherParams...)
  withContext: (func) ->
    (element, args...) =>
      view = dom.findSnippetView(element)
      editableName = element.getAttribute(docAttr.editable)
      args.unshift(view, editableName)
      func.apply(this, args)


  updateModel: (view, editableName) ->
    view.model.set(editableName, view.get(editableName))


  focus: (view, editableName) ->
    element = view.directives.get(editableName).elem
    @page.focus.editableFocused(element, view)
    true # enable editableJS default behaviour


  blur: (view, editableName) ->
    @page.focus.editableBlurred(element, view)
    @updateModel(view, editableName)
    true # enable editableJS default behaviour


  insert: (view, editableName, direction, cursor) ->
    if @hasSingleEditable(view)

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


  merge: (view, editableName, direction, cursor) ->
    if @hasSingleEditable(view)
      mergedView = if direction == 'before' then view.prev() else view.next()
      mergedView.focus() if mergedView

      # todo: check if mergedView is of same type or of type text
      if mergedView.template == view.template
        view.model.remove()


    log('engine: merge')
    false # disable editableJS default behaviour


  split: (view, editableName, before, after, cursor) ->
    if @hasSingleEditable(view)
      copy = view.template.createModel()

      # get content out of 'before' and 'after'
      beforeContent = before.querySelector('*').innerHTML
      afterContent = after.querySelector('*').innerHTML

      # set editable of snippets to innerHTML of fragments
      view.model.set(editableName, beforeContent)
      copy.set(editableName, afterContent)

      # append and focus copy of snippet
      view.model.after(copy)
      view.next().focus()

    false # disable editableJS default behaviour


  selectionChanged: (view, editableName, selection) ->
    element = view.directives.get(editableName).elem
    @selection.fire(view, element, selection)


  hasSingleEditable: (view) ->
    view.directives.length == 1 && view.directives[0].type == 'editable'
