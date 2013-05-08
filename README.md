Livingdocs Engine
=================


Development
-----------

Organization:  
All code is wrapped in one function. All coffee files share the same closure.  

Optional prerequisites:  
- [PhantomJS](http://phantomjs.org/)

Setup:
```bash
# install PhantomJS with homebrew
brew install phantomjs

# install node dependencies
npm install
```

Grunt tasks:  
```bash
# watch and update coffee files
# (required for grunt server and running tests)
grunt dev

# hands-on browser testing with livereload
grunt server

# run tests with PhantomJS
grunt test

# run tests in Chrome, Firefox and Safari
grunt karma:browsers

# run tests build livingdocs_engine.js
grunt build
```

