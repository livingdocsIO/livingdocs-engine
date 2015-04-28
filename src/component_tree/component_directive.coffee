# Properties that need to be available:
# @name
# @type
module.exports = class ComponentDirective

  #
  constructor: ({ @component, @templateDirective }) ->
    @name = @templateDirective.name
    @type = @templateDirective.type


  getContent: ->
    @component.content[@name]


  setContent: (value) ->
    @component.setContent(@name, value)


  # Copy the contents of this directive to another directive
  # (possibly of a different component).
  copyTo: (otherDirective) ->
    otherDirective.setContent( @getContent() )


  isEmpty: ->
    !@getContent()


  # Set data that will be persisted along
  # with the componentModel
  setData: (key, value) ->
    dataStore = "_#{ @name }Directive"
    directiveData = @component.getData(dataStore)
    directiveData ?= {}
    directiveData[key] = value
    @component.setData(dataStore, directiveData)


  getData: (key) ->
    if key
      @component.dataValues["_#{ @name }Directive"]?[key]
    else
      @component.dataValues["_#{ @name }Directive"]


  # Set a temporary value that will not be persisted
  setTmp: (key, value) ->
    @tmp = {}
    @tmp[key] = value


  getTmp: (key) ->
    @tmp?[key]
