jQuery = require('../../components/jquery/jquery')

# Fetch the outerHTML of an Element
# ---------------------------------
# @version 1.0.0
# @date February 01, 2011
# @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
# @author Benjamin Arthur Lupton {@link http://balupton.com}
# @copyright 2011 Benjamin Arthur Lupton {@link http://balupton.com}
# @license MIT License {@link http://creativecommons.org/licenses/MIT/}
# @return {String} outerHtml
jQuery.fn.outerHtml = jQuery.fn.outerHtml || ->
  el = this[0]
  if el
    if (typeof el.outerHTML != 'undefined')
      return el.outerHTML

    try
      # Gecko-based browsers, Safari, Opera.
      (new XMLSerializer()).serializeToString(el)
    catch error
      try
        # Internet Explorer.
        el.xml
      catch error2
        # do nothing


# Include the current node in find
#
# `$("div").findIn(".willBeIncluded")` will include the div as well as the p tag
# in the results:
# ```html
# <div class="willBeIncluded">
#   <p class="willBeIncluded"></p>
# </div>
# ```
jQuery.fn.findIn = (selector) ->
  this.find(selector).add( this.filter(selector) )
