# Livingdocs Engine

The engine is the central piece of livingdocs and defines the APIs for manipulating, displaying and storing the document.

For a more detailed documentation see our [livingdocs documentation](https://github.com/upfrontIO/livingdocs). For a quick overview stay right here.


## Usage

Load the necessary scripts into your browser.

```html
<!-- dependencies of livingdocs-engine -->
<script src="/jquery/jquery.js"></script>
<script src="/editable/editable.js"></script>

<!-- design -->
<script src="/designs/bootstrap/design.js"></script>

<!-- livingdocs-engine. yeah! -->
<script src="/livingdocs-engine.js"></script>
```

#### Global variable:

The engine then sets the global variable `doc`. Here you'll find the API of the `engine`.

#### Load a design into the engine:

```javascript
doc.design.load(design.bootstrap);
```
If you want to create your own design get started with the [livingdocs-design-boilerplate](https://github.com/upfrontIO/livingdocs-design-boilerplate) project.

#### Create a new livingdoc:

```javascript
var livingdoc = doc.new({
  design: 'bootstrap'
});
```

#### Create views:

Simply render a livingdoc into your current page:

```javascript
livingdoc.appendTo('.article-container', { interactive: false });
```

Create multiple views in iframes:

```javascript
var interactiveView = livingdoc.createView('.editor-section', { interactive: true });
var preview = livingdoc.createView('.editor-preview');
```

With the iframe technique you can isolate CSS or Javascript that is needed in your documents and also generate views that will work properly with responsive designs. There can only be one interactive view where the user can edit, but you can have as many readOnly views as you want to preview the content at different screen sizes at the same time.


#### Add content programmatically:

```javascript
// Create a component
var titleComponent = livingdoc.createComponent('title');
titleComponent.set('title', "My Title");

// Appned the component to the livingdoc
livingdoc.componentTree.append(titleComponent);
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

## Licence

Copyright (c) 2012-2014 upfront GmbH

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License (LGPL) as
published by the Free Software Foundation, either version 3 of the License, 
or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License (LGPL) for more details.

You should have received a copy of the GNU Lesser General Public License
(LGPL) along with this program.  If not, see <http://www.gnu.org/licenses/>.

