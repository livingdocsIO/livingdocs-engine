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

    # yepnope calls the callback for each file to load
    # but we want to execute the callback only once all files are loaded
    filesToLoad = cssUrl.length

    yepnope
      load: cssUrl
      callback: () ->
        filesToLoad -= 1
        callback() if callback && filesToLoad <= 0 # < is for the case where the array is empty


  # @param cssUrl: string or array. if not passed all loaded css files
  # will be unloaded
  removeCss: (cssUrl) ->
    cssUrl = [cssUrl] if cssUrl? && !$.isArray(cssUrl)
    cssUrl =  cssUrl || loadedCssFiles

    for url in cssUrl
      $("link[rel=stylesheet][href~='#{ url }']").remove()

    loadedCssFiles = []
