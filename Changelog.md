# v0.12.1

- Add origins to image directive [#197](https://github.com/livingdocsIO/livingdocs-engine/pull/197)


# v0.12.0

- Transform components [#181](https://github.com/livingdocsIO/livingdocs-engine/pull/181)
- Simplify wrapper logic in livingdoc.createView() [#190](https://github.com/livingdocsIO/livingdocs-engine/pull/190)


# v0.11.1

- Update editable.js@0.5.2

# v0.11.0

- Require design version for doc#new. NOTE: THIS IS A BREAKING CHANGE. [#185](https://github.com/livingdocsIO/livingdocs-engine/pull/185)

# v0.10.6
- fix bug with order of empty components in field extractor [#184](https://github.com/livingdocsIO/livingdocs-engine/pull/184)

# v0.10.5
- add nth-component getter to component tree [#179](https://github.com/livingdocsIO/livingdocs-engine/pull/179)

# v0.10.4

- Add mimetype to ImageDirective [#182](https://github.com/livingdocsIO/livingdocs-engine/pull/182)
- Update to jsdom@3.1.2 [#183](https://github.com/livingdocsIO/livingdocs-engine/pull/183)

# v0.10.3

- Add design version to serialized document [#180](https://github.com/livingdocsIO/livingdocs-engine/pull/180)

# v0.10.2

- Fix image placeholders in Safari [#172](https://github.com/livingdocsIO/livingdocs-engine/pull/172)
- Fix Shrinkwrap file [#176](https://github.com/livingdocsIO/livingdocs-engine/pull/176)


# v0.10.1

- Fix underscore dependency [#db1de58](https://github.com/livingdocsIO/livingdocs-engine/commit/db1de58858a9889b11d92cbd7e4771b36f3c27ef)


# v0.10.0

- Basic layouts support [#173](https://github.com/livingdocsIO/livingdocs-engine/pull/173)


# v0.9.0

- Add link directive [#174](https://github.com/livingdocsIO/livingdocs-engine/pull/174)


# v0.8.1

- Unify createView() and appendTo() interfaces [#170](https://github.com/livingdocsIO/livingdocs-engine/pull/170)
- Add base path param to DesignCache  [#171](https://github.com/livingdocsIO/livingdocs-engine/pull/171)


# v0.8.0

- Split pasted content into blocks [#168](https://github.com/livingdocsIO/livingdocs-engine/pull/168)
- View initializing incorrectly in IE [#169](https://github.com/livingdocsIO/livingdocs-engine/pull/169)


# v0.7.0

#### Features:

- Restrict Drop Targets [#166](https://github.com/livingdocsIO/livingdocs-engine/pull/166)
- Basic support for editor plugins [#165](https://github.com/livingdocsIO/livingdocs-engine/pull/165)


# v0.6.0

#### Features:

- Adds field extractor [#164](https://github.com/livingdocsIO/livingdocs-engine/pull/164)


# v0.5.6

#### Features:

- Container focus event [#161](https://github.com/livingdocsIO/livingdocs-engine/pull/161)


# v0.5.5

#### Features:

- Expose image service to browser and node APIs [#160](https://github.com/livingdocsIO/livingdocs-engine/pull/160)


# v0.5.4

#### Features:

- Render view updates per directive [#153](https://github.com/livingdocsIO/livingdocs-engine/pull/153)

#### Bugfixes

- Scripts of doc-html are initialized in the main window not inside the document iframe [#144](https://github.com/livingdocsIO/livingdocs-engine/pull/144)


# v0.5.3

#### Bugfixes

- Fix bug when adding a dependency to the document [#157](https://github.com/livingdocsIO/livingdocs-engine/pull/157)


# v0.5.2

#### Bugfixes

- Fix bug in dependency reference counting [#155](https://github.com/livingdocsIO/livingdocs-engine/pull/155)
- Fix failing spec in FF [#156](https://github.com/livingdocsIO/livingdocs-engine/pull/156)


# v0.5.1

#### Features:

- Consolidate design config [#152](https://github.com/livingdocsIO/livingdocs-engine/pull/152)


# v0.5.0

#### Features:

- Manage document dependencies [#142](https://github.com/livingdocsIO/livingdocs-engine/issues/142)
- Use base64 image placeholder [#151](https://github.com/livingdocsIO/livingdocs-engine/pull/151)
- Adds ImageDirective getters and setters for dimension and crop [#150](https://github.com/livingdocsIO/livingdocs-engine/pull/150)


# v0.4.4

#### Improvements:

- Do not expose window as global variable in node [#145](https://github.com/livingdocsIO/livingdocs-engine/pull/145)
- Pass all directive configurations to the template directive [#143](https://github.com/livingdocsIO/livingdocs-engine/pull/143)


# v0.4.3

#### Improvements:

- Add getText() to editable directive [#141](https://github.com/livingdocsIO/livingdocs-engine/pull/141)


# v0.4.2

#### Improvements:

- Expose the configuration of the resrc.it image service [#139](https://github.com/livingdocsIO/livingdocs-engine/pull/1398)
- Shrinkwrap node modules [#138](https://github.com/livingdocsIO/livingdocs-engine/pull/138)


# v0.4.1

#### Features:

- Unify node and browser api [#135](https://github.com/livingdocsIO/livingdocs-engine/pull/135)
- Expose current version and revision [#134](https://github.com/livingdocsIO/livingdocs-engine/pull/134)


# v0.4.0

#### Features:

- Improved design configuration and structure [#119](https://github.com/livingdocsIO/livingdocs-engine/pull/119)
- Add image ratios to design configuration [#120](https://github.com/livingdocsIO/livingdocs-engine/pull/120)
- Add option to exclude components in Renderer [#128](https://github.com/livingdocsIO/livingdocs-engine/pull/128)
- Rename snippet to component everywhere [#129](https://github.com/livingdocsIO/livingdocs-engine/pull/129)
- Update design in index.html [#130](https://github.com/livingdocsIO/livingdocs-engine/pull/130)

#### Bugfixes:

- Accept absolute css paths [#125](https://github.com/livingdocsIO/livingdocs-engine/pull/125)

#### Improvements:

- Use jscheme through npm [#132](https://github.com/livingdocsIO/livingdocs-engine/pull/132)

# v0.3.0

#### Features:

- Store image object. Use componentModelDirective to provide an easier API to work with directives of different types. [#114](https://github.com/livingdocsIO/livingdocs-engine/pull/114)
- Add document.appendTo method [#117](https://github.com/livingdocsIO/livingdocs-engine/pull/117)


# v0.2.2

- Use improved editable API [#111](https://github.com/livingdocsIO/livingdocs-engine/pull/111)
- Remove Kickstart class & deprecated files [#108](https://github.com/livingdocsIO/livingdocs-engine/pull/108)


# v0.2.1

- Add file drag support to dragBase [#106](https://github.com/livingdocsIO/livingdocs-engine/pull/106)


# v0.2.0

#### Features:

- Support editable.js change event [#104](https://github.com/livingdocsIO/livingdocs-engine/pull/104)
- Improved Drag and Drop [#89](https://github.com/livingdocsIO/livingdocs-engine/pull/89)
- Add a css class on images that contain the placeholder, i.e., are empty [#91](https://github.com/livingdocsIO/livingdocs-engine/pull/91)
- Read the default paragraph component (gets repeated on pressing Enter) from the design's configuration [#90](https://github.com/livingdocsIO/livingdocs-engine/pull/90)
- Add a data property to the componentModel to persist structured JSON data (https://github.com/livingdocsIO/livingdocs-engine/commit/6524654aabacf05b04e7bbbecc40f205fa01cc86)
- Support resrc.it image service URL creation [#94](https://github.com/livingdocsIO/livingdocs-engine/pull/94)
- Support resetting of temporary values [#98](https://github.com/livingdocsIO/livingdocs-engine/pull/98)

#### Architecture Changes:

- Port to CommonJS [#87](https://github.com/livingdocsIO/livingdocs-engine/pull/87)

#### Bugfixes:

- editable.js Firefox Issues [#104](https://github.com/livingdocsIO/livingdocs-engine/pull/104)
- Unescaped background-url [#88](https://github.com/livingdocsIO/livingdocs-engine/pull/88)
  (The fix only works in the browser. See commit 34b4b078c021350 for details)
- Position caret according to text-align in editables [#96](https://github.com/livingdocsIO/livingdocs-engine/pull/96)
- Dragging into empty documents not possible [#100](https://github.com/livingdocsIO/livingdocs-engine/pull/100)
- DragBlocker is not removed after a drop in Safari [#105](https://github.com/livingdocsIO/livingdocs-engine/pull/105)


# v0.1.2 (2014-01-30)

- Clean up old dependencies [#82](https://github.com/livingdocsIO/livingdocs-engine/pull/82)


# v0.1.1 (2014-01-29)

- Setup Versioning
