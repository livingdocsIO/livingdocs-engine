$ = require('jquery')

module.exports = class CssLoader

  constructor: (@window) ->
    @loadedUrls = []
    @loadedInlineStyles = []


  loadSingleUrl: (url, callback = ->) ->
    return callback() if @isUrlLoaded(url)

    link = $('<link rel="stylesheet" type="text/css" />')[0]
    link.onload = callback

    # Do not prevent the page from loading because of css errors
    # onerror is not supported by every browser.
    # https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
    link.onerror = ->
      console.warn "Stylesheet could not be loaded: #{ url }"
      callback()

    link.href = url
    @window.document.head.appendChild(link)
    @loadedUrls.push(url)


  isUrlLoaded: (url) ->
    @loadedUrls.indexOf(url) >= 0


  # Inline Styles
  # -------------

  loadInlineStyles: (inlineStyles, callback = ->) ->
    inlineStyles = @prepareInlineStyles(inlineStyles)
    return callback() if @areInlineStylesLoaded(inlineStyles)

    # Inject an inline script element to the document
    doc = @window.document
    styles = doc.createElement('style');
    styles.innerHTML = inlineStyles;
    doc.body.appendChild(styles);
    @loadedInlineStyles.push(inlineStyles)

    callback()


  prepareInlineStyles: (inlineStyles) ->
    # Remove <style> tags around the inline styles
    inlineStyles.replace(/<style[^>]*>|<\/style>/gi, '')


  areInlineStylesLoaded: (inlineStyles) ->
    @loadedInlineStyles.indexOf(inlineStyles) >= 0


