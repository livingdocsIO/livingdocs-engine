# v.0.5.5

#### Features:

- Expose image service to browser and node APIs [#160](https://github.com/upfrontIO/livingdocs-engine/pull/160)


# v.0.5.4

#### Features:

- Render view updates per directive [#153](https://github.com/upfrontIO/livingdocs-engine/pull/153)

#### Bugfixes

- Scripts of doc-html are initialized in the main window not inside the document iframe [#144](https://github.com/upfrontIO/livingdocs-engine/pull/144)


# v.0.5.3

#### Bugfixes

- Fix bug when adding a dependency to the document [#157](https://github.com/upfrontIO/livingdocs-engine/pull/157)


# v.0.5.2

#### Bugfixes

- Fix bug in dependency reference counting [#155](https://github.com/upfrontIO/livingdocs-engine/pull/155)
- Fix failing spec in FF [#156](https://github.com/upfrontIO/livingdocs-engine/pull/156)


# v.0.5.1

#### Features:

- Consolidate design config [#152](https://github.com/upfrontIO/livingdocs-engine/pull/152)


# v.0.5.0

#### Features:

- Manage document dependencies [#142](https://github.com/upfrontIO/livingdocs-engine/issues/142)
- Use base64 image placeholder [#151](https://github.com/upfrontIO/livingdocs-engine/pull/151)
- Adds ImageDirective getters and setters for dimension and crop [#150](https://github.com/upfrontIO/livingdocs-engine/pull/150)


# v0.4.4

#### Improvements:

- Do not expose window as global variable in node [#145](https://github.com/upfrontIO/livingdocs-engine/pull/145)
- Pass all directive configurations to the template directive [#143](https://github.com/upfrontIO/livingdocs-engine/pull/143)


# v0.4.3

#### Improvements:

- Add getText() to editable directive [#141](https://github.com/upfrontIO/livingdocs-engine/pull/141)


# v0.4.2

#### Improvements:

- Expose the configuration of the resrc.it image service [#139](https://github.com/upfrontIO/livingdocs-engine/pull/1398)
- Shrinkwrap node modules [#138](https://github.com/upfrontIO/livingdocs-engine/pull/138)


# v0.4.1

#### Features:

- Unify node and browser api [#135](https://github.com/upfrontIO/livingdocs-engine/pull/135)
- Expose current version and revision [#134](https://github.com/upfrontIO/livingdocs-engine/pull/134)


# v0.4.0

#### Features:

- Improved design configuration and structure [#119](https://github.com/upfrontIO/livingdocs-engine/pull/119)
- Add image ratios to design configuration [#120](https://github.com/upfrontIO/livingdocs-engine/pull/120)
- Add option to exclude components in Renderer [#128](https://github.com/upfrontIO/livingdocs-engine/pull/128)
- Rename snippet to component everywhere [#129](https://github.com/upfrontIO/livingdocs-engine/pull/129)
- Update design in index.html [#130](https://github.com/upfrontIO/livingdocs-engine/pull/130)

#### Bugfixes:

- Accept absolute css paths [#125](https://github.com/upfrontIO/livingdocs-engine/pull/125)

#### Improvements:

- Use jscheme through npm [#132](https://github.com/upfrontIO/livingdocs-engine/pull/132)

# v0.3.0

#### Features:

- Store image object. Use componentModelDirective to provide an easier API to work with directives of different types. [#114](https://github.com/upfrontIO/livingdocs-engine/pull/114)
- Add document.appendTo method [#117](https://github.com/upfrontIO/livingdocs-engine/pull/117)


# v0.2.2

- Use improved editable API [#111](https://github.com/upfrontIO/livingdocs-engine/pull/111)
- Remove Kickstart class & deprecated files [#108](https://github.com/upfrontIO/livingdocs-engine/pull/108)


# v0.2.1

- Add file drag support to dragBase [#106](https://github.com/upfrontIO/livingdocs-engine/pull/106)


# v0.2.0

#### Features:

- Support editable.js change event [#104](https://github.com/upfrontIO/livingdocs-engine/pull/104)
- Improved Drag and Drop [#89](https://github.com/upfrontIO/livingdocs-engine/pull/89)
- Add a css class on images that contain the placeholder, i.e., are empty [#91](https://github.com/upfrontIO/livingdocs-engine/pull/91)
- Read the default paragraph component (gets repeated on pressing Enter) from the design's configuration [#90](https://github.com/upfrontIO/livingdocs-engine/pull/90)
- Add a data property to the componentModel to persist structured JSON data (https://github.com/upfrontIO/livingdocs-engine/commit/6524654aabacf05b04e7bbbecc40f205fa01cc86)
- Support resrc.it image service URL creation [#94](https://github.com/upfrontIO/livingdocs-engine/pull/94)
- Support resetting of temporary values [#98](https://github.com/upfrontIO/livingdocs-engine/pull/98)

#### Architecture Changes:

- Port to CommonJS [#87](https://github.com/upfrontIO/livingdocs-engine/pull/87)

#### Bugfixes:

- editable.js Firefox Issues [#104](https://github.com/upfrontIO/livingdocs-engine/pull/104)
- Unescaped background-url [#88](https://github.com/upfrontIO/livingdocs-engine/pull/88)
  (The fix only works in the browser. See commit 34b4b078c021350 for details)
- Position caret according to text-align in editables [#96](https://github.com/upfrontIO/livingdocs-engine/pull/96)
- Dragging into empty documents not possible [#100](https://github.com/upfrontIO/livingdocs-engine/pull/100)
- DragBlocker is not removed after a drop in Safari [#105](https://github.com/upfrontIO/livingdocs-engine/pull/105)


# v0.1.2 (2014-01-30)

- Clean up old dependencies [#82](https://github.com/upfrontIO/livingdocs-engine/pull/82)


# v0.1.1 (2014-01-29)

- Setup Versioning
