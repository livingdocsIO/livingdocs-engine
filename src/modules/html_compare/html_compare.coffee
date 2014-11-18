$ = require('jquery')
log = require('../logging/log')

module.exports = do ->

  empty: /^\s*$/
  whitespace: /\s+/g
  normalizeWhitespace: true
  ignoreStyleUrlQuotes: true

  compare: (a, b) ->

    # prepare parameters
    a = $(a) if typeof a == 'string'
    b = $(b) if typeof b == 'string'

    a = a[0] if a.jquery
    b = b[0] if b.jquery

    # start comparing
    nextInA = @iterateComparables(a)
    nextInB = @iterateComparables(b)

    equivalent = true
    while equivalent
      equivalent = @compareNode( a = nextInA(), b = nextInB() )

    if not a? and not b? then true else false


  # compare two nodes
  # Returns true if they are equivalent.
  # It returns false if either a or b is undefined.
  compareNode: (a, b) ->
    if @bothExist(a, b)
      if @bothAreOfSameNodeType(a, b)
        switch a.nodeType
          when 1 then @compareElement(a, b)
          when 3 then @compareText(a, b)
          else log.error "HtmlCompare: nodeType #{ a.nodeType } not supported"


  bothExist: (a, b) ->
    a? and b?


  bothAreOfSameNodeType: (a, b) ->
    a.nodeType == b.nodeType


  compareElement: (a, b) ->
    if @compareTag(a, b)
      if @compareAttributes(a, b)
        true


  compareText: (a, b) ->
    if @normalizeWhitespace
      valA = $.trim(a.textContent).replace(@whitespace, ' ')
      valB = $.trim(b.textContent).replace(@whitespace, ' ')
      valA == valB
    else
      a.nodeValue == b.nodeValue


  compareTag: (a, b) ->
    @getTag(a) == @getTag(b)


  getTag: (node) ->
    node.namespaceURI + ':' + node.nodeName


  compareAttributes: (a, b) ->
    @compareAttributesWithOther(a, b) &&
    @compareAttributesWithOther(b, a)


  compareAttributesWithOther: (a, b) ->
    for aAttr in a.attributes
      bValue = b.getAttribute(aAttr.name)
      return false if not @compareAttributeValue(aAttr.name, aAttr.value, bValue)

      if  @isEmptyAttributeValue(aAttr.value) &&
          @emptyAttributeCounts(aAttr.name)
        return false if not b.hasAttribute(aAttr.name)

    return true


  emptyAttributeCounts: (attrName) ->
    switch attrName
      when 'class', 'style'
        return false
      else
        return true


  compareAttributeValue: (attrName, aValue, bValue) ->
    return true if  @isEmptyAttributeValue(aValue) &&
                    @isEmptyAttributeValue(bValue)

    return false if @isEmptyAttributeValue(aValue) ||
                    @isEmptyAttributeValue(bValue)

    switch attrName
      when 'class'
        aSorted = aValue.split(' ').sort()
        bSorted = bValue.split(' ').sort()
        aSorted.join(' ') == bSorted.join(' ')
      when 'style'
        aCleaned = @prepareStyleValue(aValue)
        bCleaned = @prepareStyleValue(bValue)
        aCleaned == bCleaned
      else
        aValue == bValue


  # consider undefined, null and '' as empty
  isEmptyAttributeValue: (val) ->
    not val? || val == ''


  prepareStyleValue: (val) ->
    val = $.trim(val)
      .replace(/\s*:\s*/g, ':') # ignore whitespaces around colons
      .replace(/\s*;\s*/g, ';') # ignore whitespaces around semi-colons
      .replace(/;$/g, '') # remove the last semicolon

    val = @unifiyUrlStyles(val)
    val.split(';').sort().join(';')


  # Treat all these url() variations as the same:
  # url(http://asset.com/1)
  # url('http://asset.com/1')
  # url("http://asset.com/1")
  # url(&quot;http://asset.com/1&quot;)
  unifiyUrlStyles: (style) ->
    return style unless @ignoreStyleUrlQuotes

    styleUrl = new RegExp(/url\((['"]|&quot;)?(.*?)(['"]|&quot;)?\)/)
    style.replace(styleUrl, "url($2)")


  isEmptyTextNode: (textNode) ->
    @empty.test(textNode.nodeValue) # consider: would .textContent be better?


  # true if element node or non-empty text node
  isComparable: (node) ->
    nodeType = node.nodeType
    true if nodeType == 1 ||
      ( nodeType == 3 && not @isEmptyTextNode(node) )


  # only iterate over element nodes and non-empty text nodes
  iterateComparables: (root) ->
    iterate = @iterate(root)
    return =>
      while next = iterate()
        return next if @isComparable(next)


  # iterate html nodes
  iterate: (root) ->
    current = next = root

    return ->
      n = current = next
      child = next = undefined
      if current
        if child = n.firstChild
          next = child
        else
          while (n != root) && !(next = n.nextSibling)
            n = n.parentNode

      current
