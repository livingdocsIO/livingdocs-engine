module.exports = class JsLoader

  constructor: (@window) ->
    @loadedUrls = []


  disable: ->
    @isDisabled = true


  loadInlineScript: (codeBlock, callback = ->) ->
    # todo
    callback()


  # Core method extracted from $script (https://github.com/ded/script.js).
  # Loads individual scripts asynchronously.
  #
  # @param {window.document} The document you want the script to load in
  # @param {String} Path to the js file
  # @param {Function} Callback when the script is loaded or an error occured.
  loadSingleUrl: (path, callback = ->) ->
    return callback() if @isDisabled || @isUrlLoaded(url)

    doc = @window.document
    readyState = 'readyState'
    onreadystatechange = 'onreadystatechange'
    head = doc.getElementsByTagName('head')[0]

    el = doc.createElement('script')
    loaded = undefined

    el.onload = el.onerror = el[onreadystatechange] = ->
      return if ((el[readyState] && !(/^c|loade/.test(el[readyState]))) || loaded)
      el.onload = el[onreadystatechange] = null
      loaded = true
      callback()

    el.async = true
    el.src = path
    head.insertBefore(el, head.lastChild)


  isUrlLoaded: (url) ->
    @loadedUrls.indexOf(url) >= 0


  # @private
  markUrlAsLoaded: (url) ->
    @loadedUrls.push(url)


