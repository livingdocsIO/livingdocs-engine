# Livingdocs Engine


The engine is the central piece of livingdocs and defines the APIs for manipulating, displaying and storing the document.


## Useage

Load the necessary scripts into your browser.
The engine then sets the global variable `doc`.

```html
<!-- dependencies of livingdocs-engine -->
<script src="/jquery/jquery.js"></script>
<script src="/EditableJS/editable.js"></script>

<!-- design -->
<script src="/designs/bootstrap/design.js"></script>

<!-- livingdocs-engine. yeah! -->
<script src="/livingdocs-engine.js"></script>
```

Load a design into the engine:
```javascript
doc.design.load(design.bootstrap);
```

Create a new document:
```javascript
var document = doc.new({
  design: 'bootstrap'
});
```

Create views:
```javascript
var interactiveView = document.createView('.editor-section', { interactive: true });
var preview = document.createView('.editor-preview');
```

Add content programmatically:
```javascript
document.model.append('title');
document.model.append('text');
```

## Build (and Release)

#### Build

```bash
# Build into the dist/ folder
grunt build
```

#### Release

For a detailed description see: [guides/repositories/versioning](https://github.com/upfrontIO/guides/blob/master/repositories/versioning.md)

1. **Build and Update Changelog**

  List changes and link to merged pull-requests

2. **Update Readme**
  
  (if something changed)

3. **Create a release tag and push everything**

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

# run tests in node environment
grunt node-test
```
