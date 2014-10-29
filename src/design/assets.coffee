module.exports = class Assets


  hasCss: ->
    @css?


  hasJs: ->
    @js?


  # @param { String or Array of Strings }
  addCss: (cssUrls) ->
    @add('css', cssUrls)


  # @param { String or Array of Strings }
  addJs: (jsUrls) ->
    @add('js', jsUrls)


  # @param { String } asset type: 'js' or 'css'
  # @param { String or Array of Strings }
  add: (type, urls) ->
    return unless urls?

    this[type] ?= []
    if $.type(urls) == 'string'
      this[type].push(urls)
    else
      for url in urls
        this[type].push(url)
