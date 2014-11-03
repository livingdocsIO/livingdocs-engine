dom = require('./dom')
config = require('../configuration/config')

# editable.js Controller
# ---------------------
# Integrate editable.js into Livingdocs
module.exports = class EditableController

  constructor: (@page) ->

    # Initialize editable.js
    @editable = new Editable
      window: @page.window
      browserSpellcheck: config.editable.browserSpellcheck
      mouseMoveSelectionChanges: config.editable.mouseMoveSelectionChanges

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


  # Register DOM nodes with editable.js.
  # After that Editable will fire events for that node.
  add: (nodes) ->
    @editable.add(nodes)


  disableAll: ->
    @editable.suspend()


  reenableAll: ->
    @editable.continue()


  # Get view and editableName from the DOM element passed by editable.js
  #
  # All listeners params get transformed so they get view and editableName
  # instead of element:
  #
  # Example: listener(view, editableName, otherParams...)
  withContext: (func) ->
    (element, args...) =>
      view = dom.findComponentView(element)
      editableName = element.getAttribute(@editableAttr)
      args.unshift(view, editableName)
      func.apply(this, args)


  extractContent: (element) ->
    value = @editable.getContent(element)
    if config.singleLineBreak.test(value) || value == ''
      undefined
    else
      value


  updateModel: (view, editableName, element) ->
    value = @extractContent(element)
    view.model.set(editableName, value)


  focus: (view, editableName) ->
    view.focusEditable(editableName)

    element = view.getDirectiveElement(editableName)
    @page.focus.editableFocused(element, view)
    true # enable editable.js default behaviour


  blur: (view, editableName) ->
    @clearChangeTimeout()

    element = view.getDirectiveElement(editableName)
    @updateModel(view, editableName, element)

    view.blurEditable(editableName)
    @page.focus.editableBlurred(element, view)

    true # enable editable.js default behaviour


  # Insert a new block.
  # Usually triggered by pressing enter at the end of a block
  # or by pressing delete at the beginning of a block.
  insert: (view, editableName, direction, cursor) ->
    defaultParagraph = @page.design.defaultParagraph
    if @hasSingleEditable(view) && defaultParagraph?
      copy = defaultParagraph.createModel()

      newView = if direction == 'before'
        view.model.before(copy)
        view.prev()
      else
        view.model.after(copy)
        view.next()

      newView.focus() if newView && direction == 'after'


    false # disable editable.js default behaviour


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

        cursor = if direction == 'before'
          @editable.appendTo(mergedViewElem, contentToMerge)
        else
          @editable.prependTo(mergedViewElem, contentToMerge)

        view.model.remove()
        cursor.setVisibleSelection()

        # After everything is done and the focus is set update the model to
        # make sure the model is up to date and changes are notified.
        @updateModel(mergedView, editableName, mergedViewElem)

    false # disable editable.js default behaviour


  # Split a block in two.
  # Usually triggered by pressing enter in the middle of a block.
  split: (view, editableName, before, after, cursor) ->
    if @hasSingleEditable(view)

      # append and focus copy of snippet
      copy = view.template.createModel()
      copy.set(editableName, @extractContent(after))
      view.model.after(copy)
      view.next()?.focus()

      # set content of the before element (after focus is set to the after element)
      view.model.set(editableName, @extractContent(before))

    false # disable editable.js default behaviour


  # Occurs whenever the user selects one or more characters or whenever the
  # selection is changed.
  selectionChanged: (view, editableName, selection) ->
    element = view.getDirectiveElement(editableName)
    @selection.fire(view, element, selection)


  # Insert a newline (Shift + Enter)
  newline: (view, editable, cursor) ->
    if config.editable.allowNewline
      return true # enable editable.js default behaviour
    else
     return false # disable editable.js default behaviour


  # Triggered whenever the user changes the content of a block.
  # The change event does not automatically fire if the content has
  # been changed via javascript.
  change: (view, editableName) ->
    @clearChangeTimeout()
    return if config.editable.changeDelay == false

    @changeTimeout = setTimeout =>
      elem = view.getDirectiveElement(editableName)
      @updateModel(view, editableName, elem)
      @changeTimeout = undefined
    , config.editable.changeDelay


  clearChangeTimeout: ->
    if @changeTimeout?
      clearTimeout(@changeTimeout)
      @changeTimeout = undefined


  hasSingleEditable: (view) ->
    view.directives.length == 1 && view.directives[0].type == 'editable'

