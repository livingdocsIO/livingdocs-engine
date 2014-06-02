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


  # Insert a new block.
  # Usually triggered by pressing enter at the end of a block
  # or by pressing delete at the beginning of a block.
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

      newView.focus() if newView && direction == 'after'


    false # disable editableJS default behaviour


  # Merge two blocks. Works in two directions.
  # Either the current block is being merged into the preceeding ('before')
  # or the following ('after') block.
  # After the merge the current block is removed and the focus set to the
  # other block that was merged into.
  merge: (view, editableName, direction, cursor) ->
    if @hasSingleEditable(view)
      mergedView = if direction == 'before' then view.prev() else view.next()

      if mergedView && mergedView.template == view.template
        viewElem = view.getDirectiveElement(editableName)
        mergedViewElem = mergedView.getDirectiveElement(editableName)

        # Gather the content that is going to be merged
        contentToMerge = @editable.getContent(viewElem)
        frag = @page.document.createDocumentFragment()
        contents = $('<div>').html(contentToMerge).contents()
        for el in contents
          frag.appendChild(el)

        cursor = @editable.createCursor(mergedViewElem, if direction == 'before' then 'end' else 'beginning')
        cursor[ if direction == 'before' then 'insertAfter' else 'insertBefore' ](frag)

        view.model.remove()
        cursor.setVisibleSelection()

        # After everything is done and the focus is set update the model to
        # make sure the model is up to date and changes are notified.
        @updateModel(mergedView, editableName, mergedViewElem)

    false # disable editableJS default behaviour


  # Split a block in two.
  # Usually triggered by pressing enter in the middle of a block.
  split: (view, editableName, before, after, cursor) ->
    if @hasSingleEditable(view)
      copy = view.template.createModel()

      # get content out of 'before' and 'after'
      beforeContent = before.querySelector('*').innerHTML
      afterContent = after.querySelector('*').innerHTML

      # append and focus copy of snippet
      copy.set(editableName, afterContent)
      view.model.after(copy)
      view.next().focus()

      # set content of the before element (after focus is set to the after element)
      view.model.set(editableName, beforeContent)

    false # disable editableJS default behaviour


  # Occurs whenever the user selects one or more characters or whenever the
  # selection is changed.
  selectionChanged: (view, editableName, selection) ->
    element = view.getDirectiveElement(editableName)
    @selection.fire(view, element, selection)


  # Insert a newline (Shift + Enter)
  newline: (view, editable, cursor) ->
    if config.editable.allowNewline
      return true # enable editableJS default behaviour
    else
     return false # disable editableJS default behaviour


  # Triggered whenever the user changes the content of a block.
  # The change event does not automatically fire if the content has
  # been changed via javascript.
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


  hasSingleEditable: (view) ->
    view.directives.length == 1 && view.directives[0].type == 'editable'

