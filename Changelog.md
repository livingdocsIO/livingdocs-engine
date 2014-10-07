
# v0.3.0

#### Features:

- Store image object. Use snippetModelDirective to provide an easier API to work with directives of different types. [#114](https://github.com/upfrontIO/livingdocs-engine/pull/114)


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
- Read the default paragraph snippet (gets repeated on pressing Enter) from the design's configuration [#90](https://github.com/upfrontIO/livingdocs-engine/pull/90)
- Add a data property to the snippetModel to persist structured JSON data (https://github.com/upfrontIO/livingdocs-engine/commit/6524654aabacf05b04e7bbbecc40f205fa01cc86)
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
