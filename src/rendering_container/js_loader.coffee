module.exports = class JsLoader

  constructor: (@window) ->
    @loadedUrls = []
    @loadedScripts = []


  # Core method extracted from $script (https://github.com/ded/script.js).
  # Loads individual scripts asynchronously.
  #
  # @param {window.document} The document you want the script to load in
  # @param {String} Path to the js file
  # @param {Function} Callback when the script is loaded or an error occured.
  loadSingleUrl: (path, callback = ->) ->
    return callback() if @isUrlLoaded(path)

    doc = @window.document
    readyState = 'readyState'
    onreadystatechange = 'onreadystatechange'
    head = doc.getElementsByTagName('head')[0]

    el = doc.createElement('script')
    loaded = undefined

    el.onload = el.onerror = el[onreadystatechange] = =>
      return if ((el[readyState] && !(/^c|loade/.test(el[readyState]))) || loaded)
      el.onload = el[onreadystatechange] = null
      loaded = true
      @loadedUrls.push(path)
      callback()

    el.async = true
    el.src = path
    head.insertBefore(el, head.lastChild)


  isUrlLoaded: (url) ->
    @loadedUrls.indexOf(url) >= 0


  # Inline Script
  # -------------

  loadInlineScript: (codeBlock, callback = ->) ->
    codeBlock = @prepareInlineCode(codeBlock)
    return callback() if @isInlineBlockLoaded(codeBlock)

    # Inject an inline script element to the document
    doc = @window.document
    script = doc.createElement('script');
    script.innerHTML = codeBlock;
    doc.body.appendChild(script);
    @loadedScripts.push(codeBlock)

    callback()


  prepareInlineCode: (codeBlock) ->
    # Remove <script> tags around the script
    codeBlock.replace(/<script[^>]*>|<\/script>/gi, '')


  isInlineBlockLoaded: (codeBlock) ->
    @loadedScripts.indexOf(codeBlock) >= 0


