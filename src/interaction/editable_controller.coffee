dom = require('./dom')
config = require('../configuration/defaults')

# EditableJS Controller
# ---------------------
# Integrate EditableJS into Livingdocs
module.exports = class EditableController

  constructor: (@page) ->
    # Initialize EditableJS
    @editable = new Editable(window: @page.window);

    @editableAttr = config.directives.editable.renderedAttr
    @selection = $.Callbacks()

    @editable
      .focus(@withContext(@focus))
      .blur(@withContext(@blur))
      .insert(@withContext(@insert))
      .merge(@withContext(@merge))
      .split(@withContext(@split))
      .selection(@withContext(@selectionChanged))
      .newline(@withContext(@newline))
      .change(@withContext(@change))


  # Register DOM nodes with EditableJS.
  # After that Editable will fire events for that node.
  add: (nodes) ->
    @editable.add(nodes)


  disableAll: ->
    @editable.suspend()


  reenableAll: ->
    @editable.continue()


  # Get view and editableName from the DOM element passed by EditableJS
  #
  # All listeners params get transformed so they get view and editableName
  # instead of element:
  #
  # Example: listener(view, editableName, otherParams...)
  withContext: (func) ->
    (element, args...) =>
      view = dom.findSnippetView(element)
      editableName = element.getAttribute(@editableAttr)
      args.unshift(view, editableName)
      func.apply(this, args)


  updateModel: (view, editableName, element) ->
    value = @editable.getContent(element)
    if config.singleLineBreak.test(value) || value == ''
      value = undefined

    view.model.set(editableName, value)


  focus: (view, editableName) ->
    view.focusEditable(editableName)

    element = view.getDirectiveElement(editableName)
    @page.focus.editableFocused(element, view)
    true # enable editableJS default behaviour


  blur: (view, editableName) ->
    @clearChangeTimeout()

    element = view.getDirectiveElement(editableName)
    @updateModel(view, editableName, element)

    view.blurEditable(editableName)
    @page.focus.editableBlurred(element, view)

    true # enable editableJS default behaviour


  insert: (view, editableName, direction, cursor) ->
    if @hasSingleEditable(view)

      snippetName = @page.design.paragraphSnippet
      template = @page.design.get(snippetName)
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

      if mergedView && mergedView.template == view.template

        # create document fragment
        contents = view.directives.$getElem(editableName).contents()
        frag = @page.document.createDocumentFragment()
        for el in contents
          frag.appendChild(el)

        mergedView.focus()
        elem = mergedView.getDirectiveElement(editableName)
        cursor = @editable.createCursor(elem, if direction == 'before' then 'end' else 'beginning')
        cursor[ if direction == 'before' then 'insertAfter' else 'insertBefore' ](frag)

        # Make sure the model of the mergedView is up to date
        # otherwise bugs like in issue #56 can occur.
        cursor.save()
        cursor.restore()
        @updateModel(mergedView, editableName, elem)

        view.model.remove()
        cursor.setSelection()

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
    element = view.getDirectiveElement(editableName)
    @selection.fire(view, element, selection)


  newline: (view, editable, cursor) ->
    false # disable editableJS default behaviour


  hasSingleEditable: (view) ->
    view.directives.length == 1 && view.directives[0].type == 'editable'


  change: (view, editableName) ->
    @clearChangeTimeout()
    return if config.editable.changeTimeout == false

    @changeTimeout = setTimeout =>
      elem = view.getDirectiveElement(editableName)
      @updateModel(view, editableName, elem)
      @changeTimeout = undefined
    , config.editable.changeTimeout


  clearChangeTimeout: ->
    if @changeTimeout?
      clearTimeout(@changeTimeout)
      @changeTimeout = undefined

