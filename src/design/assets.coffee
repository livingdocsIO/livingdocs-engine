$ = require('jquery')

module.exports = class Assets

  constructor: ({ @prefix }) ->
    @prefix ?= ''


  loadCss: (cssLoader, cb) ->
    return cb() unless @css?
    cssUrls = @convertToAbsolutePaths(@css)
    cssLoader.load(cssUrls, cb)


  # Absolute paths:
  # //
  # /
  # http://google.com
  # https://google.com
  #
  # Everything else is prefixed if a prefix is provided.
  convertToAbsolutePaths: (urls) ->
    $.map urls, (path) =>

      # URLs are absolute when they contain two `//` or begin with a `/`
      if /(^\/\/|[a-z]*:\/\/)/.test(path) || /^\//.test(path)
        path
      else # Normalize paths that begin with a `./
        path = path.replace(/^[\.\/]*/, '')
        "#{ @prefix }/#{ path }"


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


