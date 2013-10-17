htmlCompare = do ->

  empty: /^\s*$/
  whitespace: /\s+/g
  normalizeWhitespace: true


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
    if a? and b?
      if a.nodeType == b.nodeType
        switch a.nodeType
          when 1 then @compareElement(a, b)
          when 3 then @compareText(a, b)
          else log.error "HtmlCompare: nodeType #{ a.nodeType } not supported"


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
    node.namespaceURI + ':' + node.localName


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
    val.split(';').sort().join(';')


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
    current = undefined
    terminated = false
    processed = []

    ->
      return if terminated

      if !current
        current = root
      else if current == root
        current = current.firstChild
      else
        current =
          current.firstChild ||
          current.nextSibling ||
          current.parentNode
        while processed.indexOf(current) >= 0
          current = current.nextSibling || current.parentNode
          if current == root
            terminated = true
            return

      processed.push(current)
      current
