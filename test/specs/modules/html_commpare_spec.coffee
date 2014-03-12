htmlCompare = require('../../../src/modules/html_compare/html_compare')

describe 'htmlCompare', ->
  compare = $.proxy(htmlCompare, 'compare')

  describe 'iterateComparables()', ->

    it 'gets the root first', ->
      div = $("<div></div>")[0]
      next = htmlCompare.iterateComparables(div)
      expect(next()).to.equal(div)
      expect(next()).to.equal(undefined)


  describe 'single elment', ->

    it 'works with HTML elements', ->
      a = $("<div></div>")[0]
      b = $("<div></div>")[0]
      expect( compare(a, b) ).to.be.true


    it 'works with jQuery objects', ->
      a = $("<div></div>")
      b = $("<div></div>")
      expect( compare(a, b) ).to.be.true


    it 'works with strings objects', ->
      a = "<div></div>"
      b = "<div></div>"
      expect( compare(a, b) ).to.be.true


    it 'spots differences with strings objects', ->
      a = "<div>a</div>"
      b = "<div>b</div>"
      expect( compare(a, b) ).to.be.false


    it 'spots the difference between a div and a span', ->
      a = $("<div></div>")
      b = $("<span></span>")
      expect( compare(a, b) ).to.be.false


  describe 'attributes', ->

    it 'considers the same attributes equivalent', ->
      a = $("<div id='a'></div>")
      b = $("<div id='a'></div>")
      expect( compare(a, b) ).to.be.true


    it 'ignores attribute order', ->
      a = $("<div id='a' class='hero'></div>")
      b = $("<div class='hero' id='a'></div>")
      expect( compare(a, b) ).to.be.true


    it 'spots different attribute values', ->
      a = $("<div id='a'></div>")
      b = $("<div id='b'></div>")
      expect( compare(a, b) ).to.be.false


    it 'spots a missing attribute in the first comparee', ->
      a = $("<div></div>")
      b = $("<div id='b'></div>")
      expect( compare(a, b) ).to.be.false


    it 'spots a missing attribute in the second comparee', ->
      a = $("<div id='a'></div>")
      b = $("<div></div>")
      expect( compare(a, b) ).to.be.false


    it 'spots a missing attribute with no value', ->
      a = $("<div></div>")
      b = $("<div contenteditable></div>")
      expect( compare(a, b) ).to.be.false


    it 'spots different attribute names', ->
      a = $("<div -x-a='one'></div>")
      b = $("<div -x-b='one'></div>")
      expect( compare(a, b) ).to.be.false


    it 'spots a missing attribute among two', ->
      a = $("<div id='a' class='hero'></div>")
      b = $("<div class='hero'></div>")
      expect( compare(a, b) ).to.be.false


    it 'considers the same empty attributes equivalent', ->
      a = $("<div contenteditable></div>")
      b = $("<div contenteditable></div>")
      expect( compare(a, b) ).to.be.true


    it 'considers an empty attribute equal to one with no value', ->
      a = $("<div contenteditable=''></div>")
      b = $("<div contenteditable></div>")
      expect( compare(a, b) ).to.be.true


  describe 'class attribute', ->

    it 'considers the same classes in the same order equivalent', ->
      a = $("<div class='a b c'></div>")
      b = $("<div class='a b c'></div>")
      expect( compare(a, b) ).to.be.true


    it 'ignores ordering of classes', ->
      a = $("<div class='a b c'></div>")
      b = $("<div class='c a b'></div>")
      expect( compare(a, b) ).to.be.true


    it 'considers no classes equivalent', ->
      a = $("<div class=''></div>")
      b = $("<div class=''></div>")
      expect( compare(a, b) ).to.be.true


    it 'spots different classes', ->
      a = $("<div class='a b c'></div>")
      b = $("<div class='a c'></div>")
      expect( compare(a, b) ).to.be.false


    it 'treats empty class attribute as not existent', ->
      a = $("<div></div>")
      b = $("<div class=''></div>")
      expect( compare(a, b) ).to.be.true


  describe 'style attribute', ->

    it 'considers the same styles equivalent', ->
      a = $("<div style='display:none'></div>")
      b = $("<div style='display:none'></div>")
      expect( compare(a, b) ).to.be.true


    it 'ignores different formatting', ->
      a = $("<div style='display:none'></div>")
      b = $("<div style='display:none;'></div>")
      expect( compare(a, b) ).to.be.true

      b = $("<div style='display: none'></div>")
      expect( compare(a, b) ).to.be.true

      b = $("<div style=' display :none;'></div>")
      expect( compare(a, b) ).to.be.true


    it 'ignores ordering and formatting', ->
      a = $("<div style='border-radius:5px;position:absolute'></div>")
      b = $("<div style=' position : absolute; border-radius : 5px; '></div>")
      expect( compare(a, b) ).to.be.true


    it 'spots a tiny difference in border', ->
      a = $("<div style='display:none; border: 1px solid #000'></div>")
      b = $("<div style='display:none; border: 2px solid #000'></div>")
      expect( compare(a, b) ).to.be.false


    it 'spots a surplus colon', ->
      a = $("<div style='display:none; border: 1px solid #000'></div>")
      b = $("<div style='display::none; border: 1px solid #000'></div>")
      expect( compare(a, b) ).to.be.false


    it 'treats empty style attribute as not existent', ->
      a = $("<div></div>")
      b = $("<div style=''></div>")
      expect( compare(a, b) ).to.be.true


  describe 'text', ->

    it 'normalizes whitespace by default', ->
      expect(htmlCompare.normalizeWhitespace).to.be.true


    it 'considers the same text equivalent', ->
      a = $("<div>text</div>")
      b = $("<div>text</div>")
      expect( compare(a, b) ).to.be.true


    it 'collapses whitespace inside of text', ->
      a = $("<div>mind the gap</div>")
      b = $("<div>mind  the gap</div>")
      expect( compare(a, b) ).to.be.true


    it 'ignores whitespace at the end', ->
      a = $("<div>text</div>")
      b = $("<div>text </div>")
      expect( compare(a, b) ).to.be.true


    it 'considers newline and whitespace the same', ->
      a = $("<div>text on a new line</div>")
      b = $("<div>text\non\na\nnew\nline</div>")
      expect( compare(a, b) ).to.be.true


    it 'spots different text', ->
      a = $("<div>text</div>")
      b = $("<div>tex</div>")
      expect( compare(a, b) ).to.be.false


  describe 'text with a link', ->

    it 'considers the same equivalent', ->
      a = $("<div><a href='/'></a></div>")
      b = $("<div><a href='/'></a></div>")
      expect( compare(a, b) ).to.be.true


  describe 'non comparable nodes', ->

    it 'ignores empty text nodes', ->
      a = $("<div><span></span></div>")
      b = $("<div> <span>\n</span>    </div>")
      expect( compare(a, b) ).to.be.true


    it 'ignores comment nodes', ->
      a = $("<div><span></span></div>")
      b = $("<div><span><!-- comment --></span></div>")
      expect( compare(a, b) ).to.be.true


  describe 'single nested element', ->

    it 'considers the same equivalent', ->
      a = $("<div><span></span></div>")
      b = $("<div><span></span></div>")
      expect( compare(a, b) ).to.be.true


    it 'spots a different nested element', ->
      a = $("<div><span></span></div>")
      b = $("<div><a></a></div>")
      expect( compare(a, b) ).to.be.false


  describe 'ordered nested elements', ->

    it 'considers the same equivalent', ->
      a = $("<div><span></span><strong></strong></div>")
      b = $("<div><span></span><strong></strong></div>")
      expect( compare(a, b) ).to.be.true


    it 'spots different element ordering', ->
      a = $("<div><span></span><strong></strong></div>")
      b = $("<div><strong></strong><span></span></div>")
      expect( compare(a, b) ).to.be.false


  describe 'real world example', ->

    it 'compares as equivalent', ->
      a =
        """
        <div id='test'>
          Here it comes:
          <div class="hero tablet-full" data-doc="true">
            <!-- why not add a comment? -->
            <a href="link">click here!</a>
          </div>
        </div>
        """

      b = "<div id='test'>Here it comes:<div data-doc='true'  class='tablet-full hero'><a href='link'>click here!</a></div></div>"
      expect( compare($(a), $(b)) ).to.be.true


  describe 'url() in styles', ->
    afterEach ->
      htmlCompare.ignoreStyleUrlQuotes = true

    it 'compares two identical urls in single quotes', ->
      a = $("<div style='background-image:url(\'http://asset.com/1\')'></div>")
      b = $("<div style='background-image:url(\'http://asset.com/1\')'></div>")
      expect( compare(a, b) ).to.be.true


    it 'compares to an url with double quotes', ->
      a = $("<div style='background-image:url(http://asset.com/1)'></div>")
      b = $("<div style='background-image:url(\"http://asset.com/1\")'></div>")
      expect( compare(a, b) ).to.be.true


    it 'compares to an url with single quotes', ->
      a = $("<div style='background-image:url(http://asset.com/1)'></div>")
      b = $("<div style=\"background-image:url('http://asset.com/1')\"></div>")
      expect( compare(a, b) ).to.be.true


    it 'compares to an url with escaped quotes', ->
      a = $("<div style='background-image:url(http://asset.com/1)'></div>")
      b = $("<div style='background-image:url(&quot;http://asset.com/1&quot;)'></div>")
      expect( compare(a, b) ).to.be.true


    it 'does not compares to an url with double quotes when #ignoreStyleUrlQuotes is off', ->
      htmlCompare.ignoreStyleUrlQuotes = false
      a = $("<div style='background-image:url(http://asset.com/1)'></div>")
      b = $("<div style='background-image:url(\"http://asset.com/1\")'></div>")
      expect( compare(a, b) ).to.be.false

