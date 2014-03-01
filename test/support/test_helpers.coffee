config = require('../../src/configuration/defaults')
$ = require('../../components/jquery/jquery')
Design = require('../../src/design/design')
testDesign = require('./test_design')

# Local variables
cachedDesign = undefined


# Export testHelpers
module.exports = testHelpers =

  $: $
  jQuery: $

  emptyPlaceholderAttr: "#{ config.html.attr.placeholder }='#{ config.zeroWidthCharacter }'"

  createElem: (str) ->
    $(str)[0]


  getDesign: () ->
    cachedDesign ||= new Design(testDesign)


  getTemplate: (id) ->
    @getDesign().get(id)


  getSnippet: (id) ->
    @getTemplate(id).createModel()


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
      expect(expectedEvents).to.equal(timesFired - before)


# Add properties to testHelpers
#
# add a Attr property for every directive
# e.g. testHelpers.containerAttr = 'doc-container'
for directiveName, obj of config.directives
  testHelpers["#{ directiveName }Attr"] = obj.renderedAttr
