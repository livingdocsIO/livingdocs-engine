test =

  # wrapper for `'prop' in object`
  # since this does not exist in coffeescript.
  # You can use this function to check for properties in the prototype chain.
  hasProperty: (obj, expectedProperty) ->
    `expectedProperty in obj`


  getH1Template: ->
    new SnippetTemplate
      name: "h1"
      namespace: "test"
      html: """<h1 #{ docAttr.editable }="title"></h1>"""


  getH1Snippet: ->
    @getH1Template().create()


  getRowTemplate: ->
    new SnippetTemplate
      name: "row"
      html:
        """
        <div class="row-fluid">
          <div class="span8" #{ docAttr.container }="main"></div>
          <div class="span4" #{ docAttr.container }="sidebar"></div>
        </div>
        """

  getRowSnippet: ->
    @getRowTemplate().create()


  # monitor a jQuery.Callbacks object
  # @return function(expectedEvents, callback)
  #
  # If the first argument of the returned function is omitted
  # the monitor will expect the event to fire exactly one time.
  #
  # Usage:
  # func = createCallbackMonitor($.Callbacks())
  # func 2, ->
  #   doSomethingThatTriggersTheCallbackTwoTimes()
  createCallbackMonitor: (callbacksObj) ->
    timesFired = 0
    callbacksObj.add ->
      timesFired += 1

    return (expectedEvents, callback) ->

      # set timesFired to 1 if only one argument is passed
      if $.isFunction(expectedEvents)
        callback = expectedEvents
        expectedEvents = 1

      before = timesFired
      callback()
      expect(before + expectedEvents).toEqual(timesFired)

