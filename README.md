# Livingdocs Engine


## Organization

All code is wrapped in one function. All coffee files share the same closure.

## Build (and Release)

#### Build

```bash
# Build into the dist/ folder
grunt build
```

#### Release
1. **Update Changelog**

  List changes and link to merged pull-requests

2. **Update Readme**
  
  (if something changed)

3. **Create a release tag and push everything**
  
  (Build is done automatically before creating the tag)

  ```bash
  # Example for a patch release:
  grunt release:patch
  ```

## Development

Grunt Tasks:
```bash
# For manual testing of the engine in the browser
grunt dev

# run browser tests
grunt test

# run tests in Chrome, Firefox and Safari
grunt karma:browsers

# run node tests
# todo
```
