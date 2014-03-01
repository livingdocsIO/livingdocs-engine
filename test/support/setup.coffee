config = require('../../src/configuration/defaults')
log = require('../../src/modules/logging/log')
assert = require('../../src/modules/logging/assert')
testHelpers = require('./test_helpers')
testDesign = require('./test_design')
_ = require('underscore')


# Load chai extensions
require('./chai_helpers')
require('../../src/modules/html_compare/chai_extensions')


# Supress logs
log.debugDisabled = true
log.warningsDisabled = true


# Export Globals
# --------------
#
# Export globals in a browser environment
exportGlobals = (global) ->
  global.test = testHelpers
  global.$ = testHelpers.$
  global._ = _
  global.log = log
  global.assert = assert
  global.config = config
  global.docClass = config.docClass


# Exports for node are done in test/node/test_globals
if window?
  exportGlobals(window)


# if window?
#   window.test = test
#   window.docClass = config.docClass


# Old Jasmine Helpers
# -------------------

# toThrowLivingdocsError: (expected) ->
#   notText = if @isNot then ' not' else ''

#   try
#     @actual.call()
#   catch error
#     hasThrown = true
#     livingdocsError = error.thrownByLivingdocs

#   @message = ->
#     "Expected#{ notText } to throw a LivingdocsError"

#   hasThrown && livingdocsError


# Old Code
# --------

# module.exports = test = do ->

#   # Test Helpers
#   # ------------

#   emptyPlaceholderAttr: "#{ docAttr.placeholder }='#{ config.zeroWidthCharacter }'"

#   # wrapper for `'prop' in object`
#   # since this does not exist in coffeescript.
#   # You can use this function to check for properties in the prototype chain.
#   hasProperty: (obj, expectedProperty) ->
#     `expectedProperty in obj`


#   getSnippet: (id) ->
#     @getTemplate(id).createModel()


#   # helper to create snippets with one directive easier
#   createSnippet: (id, value) ->
#     snippet = @getSnippet(id)
#     firstDirective = snippet.template.directives[0]
#     snippet.set(firstDirective.name, value)
#     snippet


#   # use this to test serialization and deserialization
#   # through localstorage
#   localstore: (obj) ->
#     localstore.set('test', obj)
#     localstore.get('test')


#   # @return proxy function that always returns this
#   chainable: (func) ->
#     ->
#       func.apply(this, arguments)
#       this


#   # create a property on the obj that represents
#   # $.Callbacks.add. The callback can be fired with obj.property.fire(...)
#   chainableListener: (obj, funcName) ->
#     callbacks = $.Callbacks()
#     obj[funcName] = @chainable(callbacks.add)
#     obj[funcName].fire = callbacks.fire


#   # monitor a jQuery.Callbacks object
#   # @return function(expectedEvents, callback)
#   #
#   # If the first argument of the returned function is omitted
#   # the monitor will expect the event to fire exactly one time.
#   #
#   # Usage:
#   # func = createCallbackMonitor($.Callbacks())
#   # func 2, ->
#   #   doSomethingThatTriggersTheCallbackTwoTimes()
#   createCallbackMonitor: (callbacksObj) ->
#     timesFired = 0
#     callbacksObj.add ->
#       timesFired += 1

#     return (expectedEvents, callback) ->

#       # set timesFired to 1 if only one argument is passed
#       if $.isFunction(expectedEvents)
#         callback = expectedEvents
#         expectedEvents = 1

#       before = timesFired
#       callback()
#       expect(expectedEvents).toEqual(timesFired - before)

