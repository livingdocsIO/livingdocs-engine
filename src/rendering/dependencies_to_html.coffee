JsLoader = require('../rendering_container/js_loader')
CssLoader = require('../rendering_container/css_loader')

module.exports =

  printJs: (dependencies) ->
    html = ''
    for dependency in dependencies.js
      if dependency.inline
        html += @printInlineScript(codeBlock: dependency.code)
      else
        html += @printScriptTag(src: dependency.src)

    html


  printCss: (dependencies) ->
    html = ''
    for dependency in dependencies.css
      if dependency.inline
        html += @printInlineCss(styles: dependency.code)
      else
        html += @printCssLink(src: dependency.src)

    html


  printScriptTag: ({ src } ) ->
    "<script src=\"#{ src }\"></script>"


  printInlineScript: ({ codeBlock }) ->
    codeBlock = JsLoader.prototype.prepareInlineCode(codeBlock)

    "
    <script>
      #{ codeBlock }
    </script>
    "

  printCssLink: ({ src, head }) ->
    head ?= true
    if head
      "<link rel=\"stylesheet\" type=\"text/css\" href=\"#{ src }\">"
    else
      # Link tags work in body but this is not recommended.
      # They should only appear in the <head>
      "<link rel=\"stylesheet\" type=\"text/css\" href=\"#{ src }\">"


  printInlineCss: ({ styles }) ->
    styles = CssLoader.prototype.prepareInlineStyles(styles)

    "
    <style>
      #{ styles }
    </style>
    "


  printComment: (text) ->
    "<!-- #{ text } -->"

