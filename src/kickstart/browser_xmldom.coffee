# Can replace xmldom in the browser.
# More about xmldom: https://github.com/jindw/xmldom
#
# On node xmldom is required. In the browser
# DOMParser and XMLSerializer are already native objects.

# DOMParser
exports.DOMParser = class DOMParserShim

  parseFromString: (xmlTemplate) ->
    # new DOMParser().parseFromString(xmlTemplate) does not work the same
    # in the browser as with xmldom. So we use jQuery to make things work.
    $.parseXML(xmlTemplate)


# XMLSerializer
exports.XMLSerializer = XMLSerializer
