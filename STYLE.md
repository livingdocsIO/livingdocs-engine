# Upfront CoffeeScript Style Guide

-   Don't write parentheses for function definitions that don't take arguments.

    ```coffeescript
    # bad:
    someMethod: () -> # method body

    # good:
    someMethod: -> # method body
    ```

-   Always use single quotes, unless interpolating.

    ```coffeescript
    # bad:
    name = "John Doe"

    # good:
    name = 'John Doe'
    name = "#{prename} #{surname}"
    ```

-   Limit lines to 80 chars.

-   No trailing whitespace.

-   End files with a newline. This prevents noise in the SCM and is the right
    way to write text files in UNIX (see [this
    post](http://slashdot.org/comments.pl?sid=165492&cid=13808398) for an
    explanation). In most GUI editors this is shown as an empty line at the end
    of the file.

-   Use 2 new lines before a new method definition. Otherwise it can be hard to
    see where a method starts since the methods itself may contain empty lines
    in their bodies.

    ```coffeescript
    # bad:
    class Foo
      constructor: ->
        # method body

      bar: ->
        # method body

    # good:
    class Foo


      constructor: ->
        # method body


      bar: ->
        # method body
    ```

-   Denote boolean variables by prepending them with `is`, `has`, etc.

    ```coffeescript
    # bad:
    open = yes
    if open
      # something

    # good:
    isOpen = yes
    if isOpen
      # something
    ```

-   Documentation should not be separated by empty lines from what they
    document.

    ```coffeescript
    # bad:

    # Returns foo after doing bar.

    fooBar: ->
      # method body

    # good:

    # Returns foo after doing bar.
    fooBar: ->
      # method body
    ```

-   Use `unless` for simple checks instead of `if !`.

    ```coffeescript
    # bad:
    open() if !isLocked

    # good:
    open() unless isLocked
    ```

-   Always use `&&` instead of `and`, `||` instead of `or`.

    ```coffeescript
    # bad:
    if isOpen or (isClosed and isEmpty)
      # something

    # good:
    if isOpen || (isClosed && isEmpty)
      # something
    ```

-   Use `on/off`, `yes/no` at will.

-   Use parentheses for function invocations unless you only pass a single
    argument which happens to be a function or an object.

    ```coffeescript
    # bad:
    alert 'foobar'

    # good:
    alert('foobar')
    perform -> something()
    create
      name: 'John'
      age: 34
    ```

-   Don't use the unary `++` and `--`, use `+= 1` and `-= 1`.

    ```coffeescript
    # bad:
    anArray[counter++] = 'foo'

    # good:
    anArray[counter] = 'foo'
    counter += 1
    ```

-   When splitting a method chain across lines, indent them by one.

    ```coffeescript
    # bad:
    $('body')
    .addClass('foo')
    .addClass('bar')

    # good:
    $('body')
      .addClass('foo')
      .addClass('bar')
    ```

-   Separate `describe` and `it` blocks with two new lines.

    ```coffeescript
    # bad:

    describe 'TheClassUnderTest', ->
      describe 'theMethodUnderTest', ->
        it 'does something', ->
          # test code

        it 'does another thing', ->
          # test code

    # good:

    describe 'TheClassUnderTest', ->


      describe 'theMethodUnderTest', ->


        it 'does something', ->
          # test code


        it 'does another thing', ->
          # test code
    ```

-   In unit tests, `describe` the class under test and `describe` the method
    under test.

    ```coffeescript
    # bad:

    describe 'TheClassUnderTest', ->


      it 'perform() does something specific', ->
        # test code

    # good:

    describe 'TheClassUnderTest', ->


      describe 'perform', ->


        it 'does something specific', ->
          # test code
    ```

-   Don't write out `should` in tests.

    ```coffeescript
    # bad:
    it 'should return foo', ->
      # test code

    # good:
    it 'returns foo', ->
      # test code
    ```
