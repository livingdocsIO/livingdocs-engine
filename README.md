# Livingdocs Engine

## Development

Follow the style guidelines defined in [STYLE.md](STYLE.md).

### Organization

All code is wrapped in one function. All coffee files share the same closure.

### Optional Prerequisites

- [PhantomJS](http://phantomjs.org/)

### Setup

```bash
# install PhantomJS with homebrew
brew install phantomjs

# install node dependencies
npm install
```

### Grunt Tasks

```bash
# watch and update coffee files
# livereload on localhost:9000
# (required for running tests)
grunt dev

# run tests with PhantomJS
grunt test

# run tests in Chrome, Firefox and Safari
grunt karma:browsers

# run tests build livingdocs_engine.js
grunt build
```

## Documentation

- [Docco](http://jashkenas.github.io/docco/)

```bash
# install Pygments (required by docco)
sudo easy_install Pygments

# globally install docco
sudo npm install -g docco

# build documentation
grunt docco
```

