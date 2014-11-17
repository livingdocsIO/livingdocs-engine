$ = require('jquery')
config = require('../../src/configuration/config')
Design = require('../../src/design/design')
designJson = require('./test_design_json')
localstore = require('../../src/modules/localstore')

# Local variables
cachedDesign = undefined


# Export testHelpers
module.exports = testHelpers =

  $: $
  jQuery: $

  createElem: (str) ->
    $(str)[0]


  designJson: designJson


  getDesign: () ->
    cachedDesign ||= Design.parser.parse(designJson)


  getTemplate: (id) ->
    @getDesign().get(id)


  getComponent: (id) ->
    @getTemplate(id).createModel()


  createComponentTree: (contentArray) ->
    { @componentTree } = getInstances('componentTree')

    if not $.isArray(contentArray)
      contentArray = [contentArray]

    for entry in contentArray
      for key, content of entry
        model = @getComponent(key)
        for field, value of content
          model.set(field, value)
        @componentTree.append(model)

    @componentTree


  # helper to create components with one directive easier
  createComponent: (id, value) ->
    component = @getComponent(id)
    firstDirective = component.template.directives[0]
    component.set(firstDirective.name, value)
    component


  # use this to test serialization and deserialization
  # through localstorage
  localstore: (obj) ->
    if localstore.isSupported()
      localstore.set('test', obj)
      localstore.get('test')
    else
      obj


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
