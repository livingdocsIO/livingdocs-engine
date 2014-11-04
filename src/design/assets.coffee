config = require('../configuration/config')

module.exports = class Assets

  constructor: ({ @design }) ->


  loadCss: (cssLoader, cb) ->
    return cb() unless @css?
    cssUrls = @convertToAbsolutePaths(@css)
    cssLoader.load(cssUrls, cb)


  getAssetPath: ->
    "#{ config.designPath }/#{ @design.name }"


  convertToAbsolutePaths: (urls) ->
    $.map urls, (path) =>
      # URLs are absolute when they contain two `//` or begin with a `/`
      return path if /\/\//.test(path) || /^\//.test(path)

      # Normalize paths that begin with a `./
      path = path.replace(/^[\.\/]*/, '')
      "#{ @getAssetPath() }/#{ path }"


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


  hasCss: ->
    @css?


  hasJs: ->
    @js?


