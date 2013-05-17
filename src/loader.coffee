# Script Loader
# -------------
# Loading of Javascript and CSS files using yepnope

loader = do ->

  loadedCssFiles = []

  replaceCss: (cssUrl, callback) ->
    @removeCss()
    @css(cssUrl, callback)


  # laod css files
  # @param cssUrl: can be either a string or an array
  # @param callback: callback when all scripts are loaded
  css: (cssUrl, callback) ->
    cssUrl = [cssUrl] if !$.isArray(cssUrl)

    # add `css!` prefix to urls so yepnope always treats them as css files
    cssUrl = for url in cssUrl
      loadedCssFiles.push(url)
      S.prefix("css!", url)

    yepnope
      load: cssUrl
      callback: () ->
        callback() if callback


  # @param cssUrl: string or array. if not passed all loaded css files
  # will be unloaded
  removeCss: (cssUrl) ->
    cssUrl = [cssUrl] if cssUrl? && !$.isArray(cssUrl)
    cssUrl =  cssUrl || loadedCssFiles

    for url in cssUrl
      $("link[rel=stylesheet][href~='#{ url }']").remove()
