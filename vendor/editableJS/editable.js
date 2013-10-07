/**
 * @license Rangy, a cross-browser JavaScript range and selection library
 * http://code.google.com/p/rangy/
 *
 * Copyright 2012, Tim Down
 * Licensed under the MIT license.
 * Version: 1.2.3
 * Build date: 26 February 2012
 */
window['rangy'] = (function() {


    var OBJECT = "object", FUNCTION = "function", UNDEFINED = "undefined";

    var domRangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
        "commonAncestorContainer", "START_TO_START", "START_TO_END", "END_TO_START", "END_TO_END"];

    var domRangeMethods = ["setStart", "setStartBefore", "setStartAfter", "setEnd", "setEndBefore",
        "setEndAfter", "collapse", "selectNode", "selectNodeContents", "compareBoundaryPoints", "deleteContents",
        "extractContents", "cloneContents", "insertNode", "surroundContents", "cloneRange", "toString", "detach"];

    var textRangeProperties = ["boundingHeight", "boundingLeft", "boundingTop", "boundingWidth", "htmlText", "text"];

    // Subset of TextRange's full set of methods that we're interested in
    var textRangeMethods = ["collapse", "compareEndPoints", "duplicate", "getBookmark", "moveToBookmark",
        "moveToElementText", "parentElement", "pasteHTML", "select", "setEndPoint", "getBoundingClientRect"];

    /*----------------------------------------------------------------------------------------------------------------*/

    // Trio of functions taken from Peter Michaux's article:
    // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
    function isHostMethod(o, p) {
        var t = typeof o[p];
        return t == FUNCTION || (!!(t == OBJECT && o[p])) || t == "unknown";
    }

    function isHostObject(o, p) {
        return !!(typeof o[p] == OBJECT && o[p]);
    }

    function isHostProperty(o, p) {
        return typeof o[p] != UNDEFINED;
    }

    // Creates a convenience function to save verbose repeated calls to tests functions
    function createMultiplePropertyTest(testFunc) {
        return function(o, props) {
            var i = props.length;
            while (i--) {
                if (!testFunc(o, props[i])) {
                    return false;
                }
            }
            return true;
        };
    }

    // Next trio of functions are a convenience to save verbose repeated calls to previous two functions
    var areHostMethods = createMultiplePropertyTest(isHostMethod);
    var areHostObjects = createMultiplePropertyTest(isHostObject);
    var areHostProperties = createMultiplePropertyTest(isHostProperty);

    function isTextRange(range) {
        return range && areHostMethods(range, textRangeMethods) && areHostProperties(range, textRangeProperties);
    }

    var api = {
        version: "1.2.3",
        initialized: false,
        supported: true,

        util: {
            isHostMethod: isHostMethod,
            isHostObject: isHostObject,
            isHostProperty: isHostProperty,
            areHostMethods: areHostMethods,
            areHostObjects: areHostObjects,
            areHostProperties: areHostProperties,
            isTextRange: isTextRange
        },

        features: {},

        modules: {},
        config: {
            alertOnWarn: false,
            preferTextRange: false
        }
    };

    function fail(reason) {
        window.alert("Rangy not supported in your browser. Reason: " + reason);
        api.initialized = true;
        api.supported = false;
    }

    api.fail = fail;

    function warn(msg) {
        var warningMessage = "Rangy warning: " + msg;
        if (api.config.alertOnWarn) {
            window.alert(warningMessage);
        } else if (typeof window.console != UNDEFINED && typeof window.console.log != UNDEFINED) {
            window.console.log(warningMessage);
        }
    }

    api.warn = warn;

    if ({}.hasOwnProperty) {
        api.util.extend = function(o, props) {
            for (var i in props) {
                if (props.hasOwnProperty(i)) {
                    o[i] = props[i];
                }
            }
        };
    } else {
        fail("hasOwnProperty not supported");
    }

    var initListeners = [];
    var moduleInitializers = [];

    // Initialization
    function init() {
        if (api.initialized) {
            return;
        }
        var testRange;
        var implementsDomRange = false, implementsTextRange = false;

        // First, perform basic feature tests

        if (isHostMethod(document, "createRange")) {
            testRange = document.createRange();
            if (areHostMethods(testRange, domRangeMethods) && areHostProperties(testRange, domRangeProperties)) {
                implementsDomRange = true;
            }
            testRange.detach();
        }

        var body = isHostObject(document, "body") ? document.body : document.getElementsByTagName("body")[0];

        if (body && isHostMethod(body, "createTextRange")) {
            testRange = body.createTextRange();
            if (isTextRange(testRange)) {
                implementsTextRange = true;
            }
        }

        if (!implementsDomRange && !implementsTextRange) {
            fail("Neither Range nor TextRange are implemented");
        }

        api.initialized = true;
        api.features = {
            implementsDomRange: implementsDomRange,
            implementsTextRange: implementsTextRange
        };

        // Initialize modules and call init listeners
        var allListeners = moduleInitializers.concat(initListeners);
        for (var i = 0, len = allListeners.length; i < len; ++i) {
            try {
                allListeners[i](api);
            } catch (ex) {
                if (isHostObject(window, "console") && isHostMethod(window.console, "log")) {
                    window.console.log("Init listener threw an exception. Continuing.", ex);
                }

            }
        }
    }

    // Allow external scripts to initialize this library in case it's loaded after the document has loaded
    api.init = init;

    // Execute listener immediately if already initialized
    api.addInitListener = function(listener) {
        if (api.initialized) {
            listener(api);
        } else {
            initListeners.push(listener);
        }
    };

    var createMissingNativeApiListeners = [];

    api.addCreateMissingNativeApiListener = function(listener) {
        createMissingNativeApiListeners.push(listener);
    };

    function createMissingNativeApi(win) {
        win = win || window;
        init();

        // Notify listeners
        for (var i = 0, len = createMissingNativeApiListeners.length; i < len; ++i) {
            createMissingNativeApiListeners[i](win);
        }
    }

    api.createMissingNativeApi = createMissingNativeApi;

    /**
     * @constructor
     */
    function Module(name) {
        this.name = name;
        this.initialized = false;
        this.supported = false;
    }

    Module.prototype.fail = function(reason) {
        this.initialized = true;
        this.supported = false;

        throw new Error("Module '" + this.name + "' failed to load: " + reason);
    };

    Module.prototype.warn = function(msg) {
        api.warn("Module " + this.name + ": " + msg);
    };

    Module.prototype.createError = function(msg) {
        return new Error("Error in Rangy " + this.name + " module: " + msg);
    };

    api.createModule = function(name, initFunc) {
        var module = new Module(name);
        api.modules[name] = module;

        moduleInitializers.push(function(api) {
            initFunc(api, module);
            module.initialized = true;
            module.supported = true;
        });
    };

    api.requireModules = function(modules) {
        for (var i = 0, len = modules.length, module, moduleName; i < len; ++i) {
            moduleName = modules[i];
            module = api.modules[moduleName];
            if (!module || !(module instanceof Module)) {
                throw new Error("Module '" + moduleName + "' not found");
            }
            if (!module.supported) {
                throw new Error("Module '" + moduleName + "' not supported");
            }
        }
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Wait for document to load before running tests

    var docReady = false;

    var loadHandler = function(e) {

        if (!docReady) {
            docReady = true;
            if (!api.initialized) {
                init();
            }
        }
    };

    // Test whether we have window and document objects that we will need
    if (typeof window == UNDEFINED) {
        fail("No window found");
        return;
    }
    if (typeof document == UNDEFINED) {
        fail("No document found");
        return;
    }

    if (isHostMethod(document, "addEventListener")) {
        document.addEventListener("DOMContentLoaded", loadHandler, false);
    }

    // Add a fallback in case the DOMContentLoaded event isn't supported
    if (isHostMethod(window, "addEventListener")) {
        window.addEventListener("load", loadHandler, false);
    } else if (isHostMethod(window, "attachEvent")) {
        window.attachEvent("onload", loadHandler);
    } else {
        fail("Window does not have required addEventListener or attachEvent method");
    }

    return api;
})();
rangy.createModule("DomUtil", function(api, module) {

    var UNDEF = "undefined";
    var util = api.util;

    // Perform feature tests
    if (!util.areHostMethods(document, ["createDocumentFragment", "createElement", "createTextNode"])) {
        module.fail("document missing a Node creation method");
    }

    if (!util.isHostMethod(document, "getElementsByTagName")) {
        module.fail("document missing getElementsByTagName method");
    }

    var el = document.createElement("div");
    if (!util.areHostMethods(el, ["insertBefore", "appendChild", "cloneNode"] ||
            !util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]))) {
        module.fail("Incomplete Element implementation");
    }

    // innerHTML is required for Range's createContextualFragment method
    if (!util.isHostProperty(el, "innerHTML")) {
        module.fail("Element is missing innerHTML property");
    }

    var textNode = document.createTextNode("test");
    if (!util.areHostMethods(textNode, ["splitText", "deleteData", "insertData", "appendData", "cloneNode"] ||
            !util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]) ||
            !util.areHostProperties(textNode, ["data"]))) {
        module.fail("Incomplete Text Node implementation");
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Removed use of indexOf because of a bizarre bug in Opera that is thrown in one of the Acid3 tests. I haven't been
    // able to replicate it outside of the test. The bug is that indexOf returns -1 when called on an Array that
    // contains just the document as a single element and the value searched for is the document.
    var arrayContains = /*Array.prototype.indexOf ?
        function(arr, val) {
            return arr.indexOf(val) > -1;
        }:*/

        function(arr, val) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === val) {
                    return true;
                }
            }
            return false;
        };

    // Opera 11 puts HTML elements in the null namespace, it seems, and IE 7 has undefined namespaceURI
    function isHtmlNamespace(node) {
        var ns;
        return typeof node.namespaceURI == UNDEF || ((ns = node.namespaceURI) === null || ns == "http://www.w3.org/1999/xhtml");
    }

    function parentElement(node) {
        var parent = node.parentNode;
        return (parent.nodeType == 1) ? parent : null;
    }

    function getNodeIndex(node) {
        var i = 0;
        while( (node = node.previousSibling) ) {
            i++;
        }
        return i;
    }

    function getNodeLength(node) {
        var childNodes;
        return isCharacterDataNode(node) ? node.length : ((childNodes = node.childNodes) ? childNodes.length : 0);
    }

    function getCommonAncestor(node1, node2) {
        var ancestors = [], n;
        for (n = node1; n; n = n.parentNode) {
            ancestors.push(n);
        }

        for (n = node2; n; n = n.parentNode) {
            if (arrayContains(ancestors, n)) {
                return n;
            }
        }

        return null;
    }

    function isAncestorOf(ancestor, descendant, selfIsAncestor) {
        var n = selfIsAncestor ? descendant : descendant.parentNode;
        while (n) {
            if (n === ancestor) {
                return true;
            } else {
                n = n.parentNode;
            }
        }
        return false;
    }

    function getClosestAncestorIn(node, ancestor, selfIsAncestor) {
        var p, n = selfIsAncestor ? node : node.parentNode;
        while (n) {
            p = n.parentNode;
            if (p === ancestor) {
                return n;
            }
            n = p;
        }
        return null;
    }

    function isCharacterDataNode(node) {
        var t = node.nodeType;
        return t == 3 || t == 4 || t == 8 ; // Text, CDataSection or Comment
    }

    function insertAfter(node, precedingNode) {
        var nextNode = precedingNode.nextSibling, parent = precedingNode.parentNode;
        if (nextNode) {
            parent.insertBefore(node, nextNode);
        } else {
            parent.appendChild(node);
        }
        return node;
    }

    // Note that we cannot use splitText() because it is bugridden in IE 9.
    function splitDataNode(node, index) {
        var newNode = node.cloneNode(false);
        newNode.deleteData(0, index);
        node.deleteData(index, node.length - index);
        insertAfter(newNode, node);
        return newNode;
    }

    function getDocument(node) {
        if (node.nodeType == 9) {
            return node;
        } else if (typeof node.ownerDocument != UNDEF) {
            return node.ownerDocument;
        } else if (typeof node.document != UNDEF) {
            return node.document;
        } else if (node.parentNode) {
            return getDocument(node.parentNode);
        } else {
            throw new Error("getDocument: no document found for node");
        }
    }

    function getWindow(node) {
        var doc = getDocument(node);
        if (typeof doc.defaultView != UNDEF) {
            return doc.defaultView;
        } else if (typeof doc.parentWindow != UNDEF) {
            return doc.parentWindow;
        } else {
            throw new Error("Cannot get a window object for node");
        }
    }

    function getIframeDocument(iframeEl) {
        if (typeof iframeEl.contentDocument != UNDEF) {
            return iframeEl.contentDocument;
        } else if (typeof iframeEl.contentWindow != UNDEF) {
            return iframeEl.contentWindow.document;
        } else {
            throw new Error("getIframeWindow: No Document object found for iframe element");
        }
    }

    function getIframeWindow(iframeEl) {
        if (typeof iframeEl.contentWindow != UNDEF) {
            return iframeEl.contentWindow;
        } else if (typeof iframeEl.contentDocument != UNDEF) {
            return iframeEl.contentDocument.defaultView;
        } else {
            throw new Error("getIframeWindow: No Window object found for iframe element");
        }
    }

    function getBody(doc) {
        return util.isHostObject(doc, "body") ? doc.body : doc.getElementsByTagName("body")[0];
    }

    function getRootContainer(node) {
        var parent;
        while ( (parent = node.parentNode) ) {
            node = parent;
        }
        return node;
    }

    function comparePoints(nodeA, offsetA, nodeB, offsetB) {
        // See http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html#Level-2-Range-Comparing
        var nodeC, root, childA, childB, n;
        if (nodeA == nodeB) {

            // Case 1: nodes are the same
            return offsetA === offsetB ? 0 : (offsetA < offsetB) ? -1 : 1;
        } else if ( (nodeC = getClosestAncestorIn(nodeB, nodeA, true)) ) {

            // Case 2: node C (container B or an ancestor) is a child node of A
            return offsetA <= getNodeIndex(nodeC) ? -1 : 1;
        } else if ( (nodeC = getClosestAncestorIn(nodeA, nodeB, true)) ) {

            // Case 3: node C (container A or an ancestor) is a child node of B
            return getNodeIndex(nodeC) < offsetB  ? -1 : 1;
        } else {

            // Case 4: containers are siblings or descendants of siblings
            root = getCommonAncestor(nodeA, nodeB);
            childA = (nodeA === root) ? root : getClosestAncestorIn(nodeA, root, true);
            childB = (nodeB === root) ? root : getClosestAncestorIn(nodeB, root, true);

            if (childA === childB) {
                // This shouldn't be possible

                throw new Error("comparePoints got to case 4 and childA and childB are the same!");
            } else {
                n = root.firstChild;
                while (n) {
                    if (n === childA) {
                        return -1;
                    } else if (n === childB) {
                        return 1;
                    }
                    n = n.nextSibling;
                }
                throw new Error("Should not be here!");
            }
        }
    }

    function fragmentFromNodeChildren(node) {
        var fragment = getDocument(node).createDocumentFragment(), child;
        while ( (child = node.firstChild) ) {
            fragment.appendChild(child);
        }
        return fragment;
    }

    function inspectNode(node) {
        if (!node) {
            return "[No node]";
        }
        if (isCharacterDataNode(node)) {
            return '"' + node.data + '"';
        } else if (node.nodeType == 1) {
            var idAttr = node.id ? ' id="' + node.id + '"' : "";
            return "<" + node.nodeName + idAttr + ">[" + node.childNodes.length + "]";
        } else {
            return node.nodeName;
        }
    }

    /**
     * @constructor
     */
    function NodeIterator(root) {
        this.root = root;
        this._next = root;
    }

    NodeIterator.prototype = {
        _current: null,

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            var n = this._current = this._next;
            var child, next;
            if (this._current) {
                child = n.firstChild;
                if (child) {
                    this._next = child;
                } else {
                    next = null;
                    while ((n !== this.root) && !(next = n.nextSibling)) {
                        n = n.parentNode;
                    }
                    this._next = next;
                }
            }
            return this._current;
        },

        detach: function() {
            this._current = this._next = this.root = null;
        }
    };

    function createIterator(root) {
        return new NodeIterator(root);
    }

    /**
     * @constructor
     */
    function DomPosition(node, offset) {
        this.node = node;
        this.offset = offset;
    }

    DomPosition.prototype = {
        equals: function(pos) {
            return this.node === pos.node & this.offset == pos.offset;
        },

        inspect: function() {
            return "[DomPosition(" + inspectNode(this.node) + ":" + this.offset + ")]";
        }
    };

    /**
     * @constructor
     */
    function DOMException(codeName) {
        this.code = this[codeName];
        this.codeName = codeName;
        this.message = "DOMException: " + this.codeName;
    }

    DOMException.prototype = {
        INDEX_SIZE_ERR: 1,
        HIERARCHY_REQUEST_ERR: 3,
        WRONG_DOCUMENT_ERR: 4,
        NO_MODIFICATION_ALLOWED_ERR: 7,
        NOT_FOUND_ERR: 8,
        NOT_SUPPORTED_ERR: 9,
        INVALID_STATE_ERR: 11
    };

    DOMException.prototype.toString = function() {
        return this.message;
    };

    api.dom = {
        arrayContains: arrayContains,
        isHtmlNamespace: isHtmlNamespace,
        parentElement: parentElement,
        getNodeIndex: getNodeIndex,
        getNodeLength: getNodeLength,
        getCommonAncestor: getCommonAncestor,
        isAncestorOf: isAncestorOf,
        getClosestAncestorIn: getClosestAncestorIn,
        isCharacterDataNode: isCharacterDataNode,
        insertAfter: insertAfter,
        splitDataNode: splitDataNode,
        getDocument: getDocument,
        getWindow: getWindow,
        getIframeWindow: getIframeWindow,
        getIframeDocument: getIframeDocument,
        getBody: getBody,
        getRootContainer: getRootContainer,
        comparePoints: comparePoints,
        inspectNode: inspectNode,
        fragmentFromNodeChildren: fragmentFromNodeChildren,
        createIterator: createIterator,
        DomPosition: DomPosition
    };

    api.DOMException = DOMException;
});rangy.createModule("DomRange", function(api, module) {
    api.requireModules( ["DomUtil"] );


    var dom = api.dom;
    var DomPosition = dom.DomPosition;
    var DOMException = api.DOMException;
    
    /*----------------------------------------------------------------------------------------------------------------*/

    // Utility functions

    function isNonTextPartiallySelected(node, range) {
        return (node.nodeType != 3) &&
               (dom.isAncestorOf(node, range.startContainer, true) || dom.isAncestorOf(node, range.endContainer, true));
    }

    function getRangeDocument(range) {
        return dom.getDocument(range.startContainer);
    }

    function dispatchEvent(range, type, args) {
        var listeners = range._listeners[type];
        if (listeners) {
            for (var i = 0, len = listeners.length; i < len; ++i) {
                listeners[i].call(range, {target: range, args: args});
            }
        }
    }

    function getBoundaryBeforeNode(node) {
        return new DomPosition(node.parentNode, dom.getNodeIndex(node));
    }

    function getBoundaryAfterNode(node) {
        return new DomPosition(node.parentNode, dom.getNodeIndex(node) + 1);
    }

    function insertNodeAtPosition(node, n, o) {
        var firstNodeInserted = node.nodeType == 11 ? node.firstChild : node;
        if (dom.isCharacterDataNode(n)) {
            if (o == n.length) {
                dom.insertAfter(node, n);
            } else {
                n.parentNode.insertBefore(node, o == 0 ? n : dom.splitDataNode(n, o));
            }
        } else if (o >= n.childNodes.length) {
            n.appendChild(node);
        } else {
            n.insertBefore(node, n.childNodes[o]);
        }
        return firstNodeInserted;
    }

    function cloneSubtree(iterator) {
        var partiallySelected;
        for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {
            partiallySelected = iterator.isPartiallySelectedSubtree();

            node = node.cloneNode(!partiallySelected);
            if (partiallySelected) {
                subIterator = iterator.getSubtreeIterator();
                node.appendChild(cloneSubtree(subIterator));
                subIterator.detach(true);
            }

            if (node.nodeType == 10) { // DocumentType
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }
            frag.appendChild(node);
        }
        return frag;
    }

    function iterateSubtree(rangeIterator, func, iteratorState) {
        var it, n;
        iteratorState = iteratorState || { stop: false };
        for (var node, subRangeIterator; node = rangeIterator.next(); ) {
            //log.debug("iterateSubtree, partially selected: " + rangeIterator.isPartiallySelectedSubtree(), nodeToString(node));
            if (rangeIterator.isPartiallySelectedSubtree()) {
                // The node is partially selected by the Range, so we can use a new RangeIterator on the portion of the
                // node selected by the Range.
                if (func(node) === false) {
                    iteratorState.stop = true;
                    return;
                } else {
                    subRangeIterator = rangeIterator.getSubtreeIterator();
                    iterateSubtree(subRangeIterator, func, iteratorState);
                    subRangeIterator.detach(true);
                    if (iteratorState.stop) {
                        return;
                    }
                }
            } else {
                // The whole node is selected, so we can use efficient DOM iteration to iterate over the node and its
                // descendant
                it = dom.createIterator(node);
                while ( (n = it.next()) ) {
                    if (func(n) === false) {
                        iteratorState.stop = true;
                        return;
                    }
                }
            }
        }
    }

    function deleteSubtree(iterator) {
        var subIterator;
        while (iterator.next()) {
            if (iterator.isPartiallySelectedSubtree()) {
                subIterator = iterator.getSubtreeIterator();
                deleteSubtree(subIterator);
                subIterator.detach(true);
            } else {
                iterator.remove();
            }
        }
    }

    function extractSubtree(iterator) {

        for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {


            if (iterator.isPartiallySelectedSubtree()) {
                node = node.cloneNode(false);
                subIterator = iterator.getSubtreeIterator();
                node.appendChild(extractSubtree(subIterator));
                subIterator.detach(true);
            } else {
                iterator.remove();
            }
            if (node.nodeType == 10) { // DocumentType
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }
            frag.appendChild(node);
        }
        return frag;
    }

    function getNodesInRange(range, nodeTypes, filter) {
        //log.info("getNodesInRange, " + nodeTypes.join(","));
        var filterNodeTypes = !!(nodeTypes && nodeTypes.length), regex;
        var filterExists = !!filter;
        if (filterNodeTypes) {
            regex = new RegExp("^(" + nodeTypes.join("|") + ")$");
        }

        var nodes = [];
        iterateSubtree(new RangeIterator(range, false), function(node) {
            if ((!filterNodeTypes || regex.test(node.nodeType)) && (!filterExists || filter(node))) {
                nodes.push(node);
            }
        });
        return nodes;
    }

    function inspect(range) {
        var name = (typeof range.getName == "undefined") ? "Range" : range.getName();
        return "[" + name + "(" + dom.inspectNode(range.startContainer) + ":" + range.startOffset + ", " +
                dom.inspectNode(range.endContainer) + ":" + range.endOffset + ")]";
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // RangeIterator code partially borrows from IERange by Tim Ryan (http://github.com/timcameronryan/IERange)

    /**
     * @constructor
     */
    function RangeIterator(range, clonePartiallySelectedTextNodes) {
        this.range = range;
        this.clonePartiallySelectedTextNodes = clonePartiallySelectedTextNodes;



        if (!range.collapsed) {
            this.sc = range.startContainer;
            this.so = range.startOffset;
            this.ec = range.endContainer;
            this.eo = range.endOffset;
            var root = range.commonAncestorContainer;

            if (this.sc === this.ec && dom.isCharacterDataNode(this.sc)) {
                this.isSingleCharacterDataNode = true;
                this._first = this._last = this._next = this.sc;
            } else {
                this._first = this._next = (this.sc === root && !dom.isCharacterDataNode(this.sc)) ?
                    this.sc.childNodes[this.so] : dom.getClosestAncestorIn(this.sc, root, true);
                this._last = (this.ec === root && !dom.isCharacterDataNode(this.ec)) ?
                    this.ec.childNodes[this.eo - 1] : dom.getClosestAncestorIn(this.ec, root, true);
            }

        }
    }

    RangeIterator.prototype = {
        _current: null,
        _next: null,
        _first: null,
        _last: null,
        isSingleCharacterDataNode: false,

        reset: function() {
            this._current = null;
            this._next = this._first;
        },

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            // Move to next node
            var current = this._current = this._next;
            if (current) {
                this._next = (current !== this._last) ? current.nextSibling : null;

                // Check for partially selected text nodes
                if (dom.isCharacterDataNode(current) && this.clonePartiallySelectedTextNodes) {
                    if (current === this.ec) {

                        (current = current.cloneNode(true)).deleteData(this.eo, current.length - this.eo);
                    }
                    if (this._current === this.sc) {

                        (current = current.cloneNode(true)).deleteData(0, this.so);
                    }
                }
            }

            return current;
        },

        remove: function() {
            var current = this._current, start, end;

            if (dom.isCharacterDataNode(current) && (current === this.sc || current === this.ec)) {
                start = (current === this.sc) ? this.so : 0;
                end = (current === this.ec) ? this.eo : current.length;
                if (start != end) {
                    current.deleteData(start, end - start);
                }
            } else {
                if (current.parentNode) {
                    current.parentNode.removeChild(current);
                } else {

                }
            }
        },

        // Checks if the current node is partially selected
        isPartiallySelectedSubtree: function() {
            var current = this._current;
            return isNonTextPartiallySelected(current, this.range);
        },

        getSubtreeIterator: function() {
            var subRange;
            if (this.isSingleCharacterDataNode) {
                subRange = this.range.cloneRange();
                subRange.collapse();
            } else {
                subRange = new Range(getRangeDocument(this.range));
                var current = this._current;
                var startContainer = current, startOffset = 0, endContainer = current, endOffset = dom.getNodeLength(current);

                if (dom.isAncestorOf(current, this.sc, true)) {
                    startContainer = this.sc;
                    startOffset = this.so;
                }
                if (dom.isAncestorOf(current, this.ec, true)) {
                    endContainer = this.ec;
                    endOffset = this.eo;
                }

                updateBoundaries(subRange, startContainer, startOffset, endContainer, endOffset);
            }
            return new RangeIterator(subRange, this.clonePartiallySelectedTextNodes);
        },

        detach: function(detachRange) {
            if (detachRange) {
                this.range.detach();
            }
            this.range = this._current = this._next = this._first = this._last = this.sc = this.so = this.ec = this.eo = null;
        }
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Exceptions

    /**
     * @constructor
     */
    function RangeException(codeName) {
        this.code = this[codeName];
        this.codeName = codeName;
        this.message = "RangeException: " + this.codeName;
    }

    RangeException.prototype = {
        BAD_BOUNDARYPOINTS_ERR: 1,
        INVALID_NODE_TYPE_ERR: 2
    };

    RangeException.prototype.toString = function() {
        return this.message;
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    /**
     * Currently iterates through all nodes in the range on creation until I think of a decent way to do it
     * TODO: Look into making this a proper iterator, not requiring preloading everything first
     * @constructor
     */
    function RangeNodeIterator(range, nodeTypes, filter) {
        this.nodes = getNodesInRange(range, nodeTypes, filter);
        this._next = this.nodes[0];
        this._position = 0;
    }

    RangeNodeIterator.prototype = {
        _current: null,

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            this._current = this._next;
            this._next = this.nodes[ ++this._position ];
            return this._current;
        },

        detach: function() {
            this._current = this._next = this.nodes = null;
        }
    };

    var beforeAfterNodeTypes = [1, 3, 4, 5, 7, 8, 10];
    var rootContainerNodeTypes = [2, 9, 11];
    var readonlyNodeTypes = [5, 6, 10, 12];
    var insertableNodeTypes = [1, 3, 4, 5, 7, 8, 10, 11];
    var surroundNodeTypes = [1, 3, 4, 5, 7, 8];

    function createAncestorFinder(nodeTypes) {
        return function(node, selfIsAncestor) {
            var t, n = selfIsAncestor ? node : node.parentNode;
            while (n) {
                t = n.nodeType;
                if (dom.arrayContains(nodeTypes, t)) {
                    return n;
                }
                n = n.parentNode;
            }
            return null;
        };
    }

    var getRootContainer = dom.getRootContainer;
    var getDocumentOrFragmentContainer = createAncestorFinder( [9, 11] );
    var getReadonlyAncestor = createAncestorFinder(readonlyNodeTypes);
    var getDocTypeNotationEntityAncestor = createAncestorFinder( [6, 10, 12] );

    function assertNoDocTypeNotationEntityAncestor(node, allowSelf) {
        if (getDocTypeNotationEntityAncestor(node, allowSelf)) {
            throw new RangeException("INVALID_NODE_TYPE_ERR");
        }
    }

    function assertNotDetached(range) {
        if (!range.startContainer) {
            throw new DOMException("INVALID_STATE_ERR");
        }
    }

    function assertValidNodeType(node, invalidTypes) {
        if (!dom.arrayContains(invalidTypes, node.nodeType)) {
            throw new RangeException("INVALID_NODE_TYPE_ERR");
        }
    }

    function assertValidOffset(node, offset) {
        if (offset < 0 || offset > (dom.isCharacterDataNode(node) ? node.length : node.childNodes.length)) {
            throw new DOMException("INDEX_SIZE_ERR");
        }
    }

    function assertSameDocumentOrFragment(node1, node2) {
        if (getDocumentOrFragmentContainer(node1, true) !== getDocumentOrFragmentContainer(node2, true)) {
            throw new DOMException("WRONG_DOCUMENT_ERR");
        }
    }

    function assertNodeNotReadOnly(node) {
        if (getReadonlyAncestor(node, true)) {
            throw new DOMException("NO_MODIFICATION_ALLOWED_ERR");
        }
    }

    function assertNode(node, codeName) {
        if (!node) {
            throw new DOMException(codeName);
        }
    }

    function isOrphan(node) {
        return !dom.arrayContains(rootContainerNodeTypes, node.nodeType) && !getDocumentOrFragmentContainer(node, true);
    }

    function isValidOffset(node, offset) {
        return offset <= (dom.isCharacterDataNode(node) ? node.length : node.childNodes.length);
    }

    function isRangeValid(range) {
        return (!!range.startContainer && !!range.endContainer
                && !isOrphan(range.startContainer)
                && !isOrphan(range.endContainer)
                && isValidOffset(range.startContainer, range.startOffset)
                && isValidOffset(range.endContainer, range.endOffset));
    }

    function assertRangeValid(range) {
        assertNotDetached(range);
        if (!isRangeValid(range)) {
            throw new Error("Range error: Range is no longer valid after DOM mutation (" + range.inspect() + ")");
        }
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Test the browser's innerHTML support to decide how to implement createContextualFragment
    var styleEl = document.createElement("style");
    var htmlParsingConforms = false;
    try {
        styleEl.innerHTML = "<b>x</b>";
        htmlParsingConforms = (styleEl.firstChild.nodeType == 3); // Opera incorrectly creates an element node
    } catch (e) {
        // IE 6 and 7 throw
    }

    api.features.htmlParsingConforms = htmlParsingConforms;

    var createContextualFragment = htmlParsingConforms ?

        // Implementation as per HTML parsing spec, trusting in the browser's implementation of innerHTML. See
        // discussion and base code for this implementation at issue 67.
        // Spec: http://html5.org/specs/dom-parsing.html#extensions-to-the-range-interface
        // Thanks to Aleks Williams.
        function(fragmentStr) {
            // "Let node the context object's start's node."
            var node = this.startContainer;
            var doc = dom.getDocument(node);

            // "If the context object's start's node is null, raise an INVALID_STATE_ERR
            // exception and abort these steps."
            if (!node) {
                throw new DOMException("INVALID_STATE_ERR");
            }

            // "Let element be as follows, depending on node's interface:"
            // Document, Document Fragment: null
            var el = null;

            // "Element: node"
            if (node.nodeType == 1) {
                el = node;

            // "Text, Comment: node's parentElement"
            } else if (dom.isCharacterDataNode(node)) {
                el = dom.parentElement(node);
            }

            // "If either element is null or element's ownerDocument is an HTML document
            // and element's local name is "html" and element's namespace is the HTML
            // namespace"
            if (el === null || (
                el.nodeName == "HTML"
                && dom.isHtmlNamespace(dom.getDocument(el).documentElement)
                && dom.isHtmlNamespace(el)
            )) {

            // "let element be a new Element with "body" as its local name and the HTML
            // namespace as its namespace.""
                el = doc.createElement("body");
            } else {
                el = el.cloneNode(false);
            }

            // "If the node's document is an HTML document: Invoke the HTML fragment parsing algorithm."
            // "If the node's document is an XML document: Invoke the XML fragment parsing algorithm."
            // "In either case, the algorithm must be invoked with fragment as the input
            // and element as the context element."
            el.innerHTML = fragmentStr;

            // "If this raises an exception, then abort these steps. Otherwise, let new
            // children be the nodes returned."

            // "Let fragment be a new DocumentFragment."
            // "Append all new children to fragment."
            // "Return fragment."
            return dom.fragmentFromNodeChildren(el);
        } :

        // In this case, innerHTML cannot be trusted, so fall back to a simpler, non-conformant implementation that
        // previous versions of Rangy used (with the exception of using a body element rather than a div)
        function(fragmentStr) {
            assertNotDetached(this);
            var doc = getRangeDocument(this);
            var el = doc.createElement("body");
            el.innerHTML = fragmentStr;

            return dom.fragmentFromNodeChildren(el);
        };

    /*----------------------------------------------------------------------------------------------------------------*/

    var rangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
        "commonAncestorContainer"];

    var s2s = 0, s2e = 1, e2e = 2, e2s = 3;
    var n_b = 0, n_a = 1, n_b_a = 2, n_i = 3;

    function RangePrototype() {}

    RangePrototype.prototype = {
        attachListener: function(type, listener) {
            this._listeners[type].push(listener);
        },

        compareBoundaryPoints: function(how, range) {
            assertRangeValid(this);
            assertSameDocumentOrFragment(this.startContainer, range.startContainer);

            var nodeA, offsetA, nodeB, offsetB;
            var prefixA = (how == e2s || how == s2s) ? "start" : "end";
            var prefixB = (how == s2e || how == s2s) ? "start" : "end";
            nodeA = this[prefixA + "Container"];
            offsetA = this[prefixA + "Offset"];
            nodeB = range[prefixB + "Container"];
            offsetB = range[prefixB + "Offset"];
            return dom.comparePoints(nodeA, offsetA, nodeB, offsetB);
        },

        insertNode: function(node) {
            assertRangeValid(this);
            assertValidNodeType(node, insertableNodeTypes);
            assertNodeNotReadOnly(this.startContainer);

            if (dom.isAncestorOf(node, this.startContainer, true)) {
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }

            // No check for whether the container of the start of the Range is of a type that does not allow
            // children of the type of node: the browser's DOM implementation should do this for us when we attempt
            // to add the node

            var firstNodeInserted = insertNodeAtPosition(node, this.startContainer, this.startOffset);
            this.setStartBefore(firstNodeInserted);
        },

        cloneContents: function() {
            assertRangeValid(this);

            var clone, frag;
            if (this.collapsed) {
                return getRangeDocument(this).createDocumentFragment();
            } else {
                if (this.startContainer === this.endContainer && dom.isCharacterDataNode(this.startContainer)) {
                    clone = this.startContainer.cloneNode(true);
                    clone.data = clone.data.slice(this.startOffset, this.endOffset);
                    frag = getRangeDocument(this).createDocumentFragment();
                    frag.appendChild(clone);
                    return frag;
                } else {
                    var iterator = new RangeIterator(this, true);
                    clone = cloneSubtree(iterator);
                    iterator.detach();
                }
                return clone;
            }
        },

        canSurroundContents: function() {
            assertRangeValid(this);
            assertNodeNotReadOnly(this.startContainer);
            assertNodeNotReadOnly(this.endContainer);

            // Check if the contents can be surrounded. Specifically, this means whether the range partially selects
            // no non-text nodes.
            var iterator = new RangeIterator(this, true);
            var boundariesInvalid = (iterator._first && (isNonTextPartiallySelected(iterator._first, this)) ||
                    (iterator._last && isNonTextPartiallySelected(iterator._last, this)));
            iterator.detach();
            return !boundariesInvalid;
        },

        surroundContents: function(node) {
            assertValidNodeType(node, surroundNodeTypes);

            if (!this.canSurroundContents()) {
                throw new RangeException("BAD_BOUNDARYPOINTS_ERR");
            }

            // Extract the contents
            var content = this.extractContents();

            // Clear the children of the node
            if (node.hasChildNodes()) {
                while (node.lastChild) {
                    node.removeChild(node.lastChild);
                }
            }

            // Insert the new node and add the extracted contents
            insertNodeAtPosition(node, this.startContainer, this.startOffset);
            node.appendChild(content);

            this.selectNode(node);
        },

        cloneRange: function() {
            assertRangeValid(this);
            var range = new Range(getRangeDocument(this));
            var i = rangeProperties.length, prop;
            while (i--) {
                prop = rangeProperties[i];
                range[prop] = this[prop];
            }
            return range;
        },

        toString: function() {
            assertRangeValid(this);
            var sc = this.startContainer;
            if (sc === this.endContainer && dom.isCharacterDataNode(sc)) {
                return (sc.nodeType == 3 || sc.nodeType == 4) ? sc.data.slice(this.startOffset, this.endOffset) : "";
            } else {
                var textBits = [], iterator = new RangeIterator(this, true);

                iterateSubtree(iterator, function(node) {
                    // Accept only text or CDATA nodes, not comments

                    if (node.nodeType == 3 || node.nodeType == 4) {
                        textBits.push(node.data);
                    }
                });
                iterator.detach();
                return textBits.join("");
            }
        },

        // The methods below are all non-standard. The following batch were introduced by Mozilla but have since
        // been removed from Mozilla.

        compareNode: function(node) {
            assertRangeValid(this);

            var parent = node.parentNode;
            var nodeIndex = dom.getNodeIndex(node);

            if (!parent) {
                throw new DOMException("NOT_FOUND_ERR");
            }

            var startComparison = this.comparePoint(parent, nodeIndex),
                endComparison = this.comparePoint(parent, nodeIndex + 1);

            if (startComparison < 0) { // Node starts before
                return (endComparison > 0) ? n_b_a : n_b;
            } else {
                return (endComparison > 0) ? n_a : n_i;
            }
        },

        comparePoint: function(node, offset) {
            assertRangeValid(this);
            assertNode(node, "HIERARCHY_REQUEST_ERR");
            assertSameDocumentOrFragment(node, this.startContainer);

            if (dom.comparePoints(node, offset, this.startContainer, this.startOffset) < 0) {
                return -1;
            } else if (dom.comparePoints(node, offset, this.endContainer, this.endOffset) > 0) {
                return 1;
            }
            return 0;
        },

        createContextualFragment: createContextualFragment,

        toHtml: function() {
            assertRangeValid(this);
            var container = getRangeDocument(this).createElement("div");
            container.appendChild(this.cloneContents());
            return container.innerHTML;
        },

        // touchingIsIntersecting determines whether this method considers a node that borders a range intersects
        // with it (as in WebKit) or not (as in Gecko pre-1.9, and the default)
        intersectsNode: function(node, touchingIsIntersecting) {
            assertRangeValid(this);
            assertNode(node, "NOT_FOUND_ERR");
            if (dom.getDocument(node) !== getRangeDocument(this)) {
                return false;
            }

            var parent = node.parentNode, offset = dom.getNodeIndex(node);
            assertNode(parent, "NOT_FOUND_ERR");

            var startComparison = dom.comparePoints(parent, offset, this.endContainer, this.endOffset),
                endComparison = dom.comparePoints(parent, offset + 1, this.startContainer, this.startOffset);

            return touchingIsIntersecting ? startComparison <= 0 && endComparison >= 0 : startComparison < 0 && endComparison > 0;
        },


        isPointInRange: function(node, offset) {
            assertRangeValid(this);
            assertNode(node, "HIERARCHY_REQUEST_ERR");
            assertSameDocumentOrFragment(node, this.startContainer);

            return (dom.comparePoints(node, offset, this.startContainer, this.startOffset) >= 0) &&
                   (dom.comparePoints(node, offset, this.endContainer, this.endOffset) <= 0);
        },

        // The methods below are non-standard and invented by me.

        // Sharing a boundary start-to-end or end-to-start does not count as intersection.
        intersectsRange: function(range, touchingIsIntersecting) {
            assertRangeValid(this);

            if (getRangeDocument(range) != getRangeDocument(this)) {
                throw new DOMException("WRONG_DOCUMENT_ERR");
            }

            var startComparison = dom.comparePoints(this.startContainer, this.startOffset, range.endContainer, range.endOffset),
                endComparison = dom.comparePoints(this.endContainer, this.endOffset, range.startContainer, range.startOffset);

            return touchingIsIntersecting ? startComparison <= 0 && endComparison >= 0 : startComparison < 0 && endComparison > 0;
        },

        intersection: function(range) {
            if (this.intersectsRange(range)) {
                var startComparison = dom.comparePoints(this.startContainer, this.startOffset, range.startContainer, range.startOffset),
                    endComparison = dom.comparePoints(this.endContainer, this.endOffset, range.endContainer, range.endOffset);

                var intersectionRange = this.cloneRange();

                if (startComparison == -1) {
                    intersectionRange.setStart(range.startContainer, range.startOffset);
                }
                if (endComparison == 1) {
                    intersectionRange.setEnd(range.endContainer, range.endOffset);
                }
                return intersectionRange;
            }
            return null;
        },

        union: function(range) {
            if (this.intersectsRange(range, true)) {
                var unionRange = this.cloneRange();
                if (dom.comparePoints(range.startContainer, range.startOffset, this.startContainer, this.startOffset) == -1) {
                    unionRange.setStart(range.startContainer, range.startOffset);
                }
                if (dom.comparePoints(range.endContainer, range.endOffset, this.endContainer, this.endOffset) == 1) {
                    unionRange.setEnd(range.endContainer, range.endOffset);
                }
                return unionRange;
            } else {
                throw new RangeException("Ranges do not intersect");
            }
        },

        containsNode: function(node, allowPartial) {
            if (allowPartial) {
                return this.intersectsNode(node, false);
            } else {
                return this.compareNode(node) == n_i;
            }
        },

        containsNodeContents: function(node) {
            return this.comparePoint(node, 0) >= 0 && this.comparePoint(node, dom.getNodeLength(node)) <= 0;
        },

        containsRange: function(range) {
            return this.intersection(range).equals(range);
        },

        containsNodeText: function(node) {
            var nodeRange = this.cloneRange();
            nodeRange.selectNode(node);
            var textNodes = nodeRange.getNodes([3]);
            if (textNodes.length > 0) {
                nodeRange.setStart(textNodes[0], 0);
                var lastTextNode = textNodes.pop();
                nodeRange.setEnd(lastTextNode, lastTextNode.length);
                var contains = this.containsRange(nodeRange);
                nodeRange.detach();
                return contains;
            } else {
                return this.containsNodeContents(node);
            }
        },

        createNodeIterator: function(nodeTypes, filter) {
            assertRangeValid(this);
            return new RangeNodeIterator(this, nodeTypes, filter);
        },

        getNodes: function(nodeTypes, filter) {
            assertRangeValid(this);
            return getNodesInRange(this, nodeTypes, filter);
        },

        getDocument: function() {
            return getRangeDocument(this);
        },

        collapseBefore: function(node) {
            assertNotDetached(this);

            this.setEndBefore(node);
            this.collapse(false);
        },

        collapseAfter: function(node) {
            assertNotDetached(this);

            this.setStartAfter(node);
            this.collapse(true);
        },

        getName: function() {
            return "DomRange";
        },

        equals: function(range) {
            return Range.rangesEqual(this, range);
        },

        isValid: function() {
            return isRangeValid(this);
        },

        inspect: function() {
            return inspect(this);
        }
    };

    function copyComparisonConstantsToObject(obj) {
        obj.START_TO_START = s2s;
        obj.START_TO_END = s2e;
        obj.END_TO_END = e2e;
        obj.END_TO_START = e2s;

        obj.NODE_BEFORE = n_b;
        obj.NODE_AFTER = n_a;
        obj.NODE_BEFORE_AND_AFTER = n_b_a;
        obj.NODE_INSIDE = n_i;
    }

    function copyComparisonConstants(constructor) {
        copyComparisonConstantsToObject(constructor);
        copyComparisonConstantsToObject(constructor.prototype);
    }

    function createRangeContentRemover(remover, boundaryUpdater) {
        return function() {
            assertRangeValid(this);

            var sc = this.startContainer, so = this.startOffset, root = this.commonAncestorContainer;

            var iterator = new RangeIterator(this, true);

            // Work out where to position the range after content removal
            var node, boundary;
            if (sc !== root) {
                node = dom.getClosestAncestorIn(sc, root, true);
                boundary = getBoundaryAfterNode(node);
                sc = boundary.node;
                so = boundary.offset;
            }

            // Check none of the range is read-only
            iterateSubtree(iterator, assertNodeNotReadOnly);

            iterator.reset();

            // Remove the content
            var returnValue = remover(iterator);
            iterator.detach();

            // Move to the new position
            boundaryUpdater(this, sc, so, sc, so);

            return returnValue;
        };
    }

    function createPrototypeRange(constructor, boundaryUpdater, detacher) {
        function createBeforeAfterNodeSetter(isBefore, isStart) {
            return function(node) {
                assertNotDetached(this);
                assertValidNodeType(node, beforeAfterNodeTypes);
                assertValidNodeType(getRootContainer(node), rootContainerNodeTypes);

                var boundary = (isBefore ? getBoundaryBeforeNode : getBoundaryAfterNode)(node);
                (isStart ? setRangeStart : setRangeEnd)(this, boundary.node, boundary.offset);
            };
        }

        function setRangeStart(range, node, offset) {
            var ec = range.endContainer, eo = range.endOffset;
            if (node !== range.startContainer || offset !== range.startOffset) {
                // Check the root containers of the range and the new boundary, and also check whether the new boundary
                // is after the current end. In either case, collapse the range to the new position
                if (getRootContainer(node) != getRootContainer(ec) || dom.comparePoints(node, offset, ec, eo) == 1) {
                    ec = node;
                    eo = offset;
                }
                boundaryUpdater(range, node, offset, ec, eo);
            }
        }

        function setRangeEnd(range, node, offset) {
            var sc = range.startContainer, so = range.startOffset;
            if (node !== range.endContainer || offset !== range.endOffset) {
                // Check the root containers of the range and the new boundary, and also check whether the new boundary
                // is after the current end. In either case, collapse the range to the new position
                if (getRootContainer(node) != getRootContainer(sc) || dom.comparePoints(node, offset, sc, so) == -1) {
                    sc = node;
                    so = offset;
                }
                boundaryUpdater(range, sc, so, node, offset);
            }
        }

        function setRangeStartAndEnd(range, node, offset) {
            if (node !== range.startContainer || offset !== range.startOffset || node !== range.endContainer || offset !== range.endOffset) {
                boundaryUpdater(range, node, offset, node, offset);
            }
        }

        constructor.prototype = new RangePrototype();

        api.util.extend(constructor.prototype, {
            setStart: function(node, offset) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeStart(this, node, offset);
            },

            setEnd: function(node, offset) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeEnd(this, node, offset);
            },

            setStartBefore: createBeforeAfterNodeSetter(true, true),
            setStartAfter: createBeforeAfterNodeSetter(false, true),
            setEndBefore: createBeforeAfterNodeSetter(true, false),
            setEndAfter: createBeforeAfterNodeSetter(false, false),

            collapse: function(isStart) {
                assertRangeValid(this);
                if (isStart) {
                    boundaryUpdater(this, this.startContainer, this.startOffset, this.startContainer, this.startOffset);
                } else {
                    boundaryUpdater(this, this.endContainer, this.endOffset, this.endContainer, this.endOffset);
                }
            },

            selectNodeContents: function(node) {
                // This doesn't seem well specified: the spec talks only about selecting the node's contents, which
                // could be taken to mean only its children. However, browsers implement this the same as selectNode for
                // text nodes, so I shall do likewise
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);

                boundaryUpdater(this, node, 0, node, dom.getNodeLength(node));
            },

            selectNode: function(node) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, false);
                assertValidNodeType(node, beforeAfterNodeTypes);

                var start = getBoundaryBeforeNode(node), end = getBoundaryAfterNode(node);
                boundaryUpdater(this, start.node, start.offset, end.node, end.offset);
            },

            extractContents: createRangeContentRemover(extractSubtree, boundaryUpdater),

            deleteContents: createRangeContentRemover(deleteSubtree, boundaryUpdater),

            canSurroundContents: function() {
                assertRangeValid(this);
                assertNodeNotReadOnly(this.startContainer);
                assertNodeNotReadOnly(this.endContainer);

                // Check if the contents can be surrounded. Specifically, this means whether the range partially selects
                // no non-text nodes.
                var iterator = new RangeIterator(this, true);
                var boundariesInvalid = (iterator._first && (isNonTextPartiallySelected(iterator._first, this)) ||
                        (iterator._last && isNonTextPartiallySelected(iterator._last, this)));
                iterator.detach();
                return !boundariesInvalid;
            },

            detach: function() {
                detacher(this);
            },

            splitBoundaries: function() {
                assertRangeValid(this);


                var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;
                var startEndSame = (sc === ec);

                if (dom.isCharacterDataNode(ec) && eo > 0 && eo < ec.length) {
                    dom.splitDataNode(ec, eo);

                }

                if (dom.isCharacterDataNode(sc) && so > 0 && so < sc.length) {

                    sc = dom.splitDataNode(sc, so);
                    if (startEndSame) {
                        eo -= so;
                        ec = sc;
                    } else if (ec == sc.parentNode && eo >= dom.getNodeIndex(sc)) {
                        eo++;
                    }
                    so = 0;

                }
                boundaryUpdater(this, sc, so, ec, eo);
            },

            normalizeBoundaries: function() {
                assertRangeValid(this);

                var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;

                var mergeForward = function(node) {
                    var sibling = node.nextSibling;
                    if (sibling && sibling.nodeType == node.nodeType) {
                        ec = node;
                        eo = node.length;
                        node.appendData(sibling.data);
                        sibling.parentNode.removeChild(sibling);
                    }
                };

                var mergeBackward = function(node) {
                    var sibling = node.previousSibling;
                    if (sibling && sibling.nodeType == node.nodeType) {
                        sc = node;
                        var nodeLength = node.length;
                        so = sibling.length;
                        node.insertData(0, sibling.data);
                        sibling.parentNode.removeChild(sibling);
                        if (sc == ec) {
                            eo += so;
                            ec = sc;
                        } else if (ec == node.parentNode) {
                            var nodeIndex = dom.getNodeIndex(node);
                            if (eo == nodeIndex) {
                                ec = node;
                                eo = nodeLength;
                            } else if (eo > nodeIndex) {
                                eo--;
                            }
                        }
                    }
                };

                var normalizeStart = true;

                if (dom.isCharacterDataNode(ec)) {
                    if (ec.length == eo) {
                        mergeForward(ec);
                    }
                } else {
                    if (eo > 0) {
                        var endNode = ec.childNodes[eo - 1];
                        if (endNode && dom.isCharacterDataNode(endNode)) {
                            mergeForward(endNode);
                        }
                    }
                    normalizeStart = !this.collapsed;
                }

                if (normalizeStart) {
                    if (dom.isCharacterDataNode(sc)) {
                        if (so == 0) {
                            mergeBackward(sc);
                        }
                    } else {
                        if (so < sc.childNodes.length) {
                            var startNode = sc.childNodes[so];
                            if (startNode && dom.isCharacterDataNode(startNode)) {
                                mergeBackward(startNode);
                            }
                        }
                    }
                } else {
                    sc = ec;
                    so = eo;
                }

                boundaryUpdater(this, sc, so, ec, eo);
            },

            collapseToPoint: function(node, offset) {
                assertNotDetached(this);

                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeStartAndEnd(this, node, offset);
            }
        });

        copyComparisonConstants(constructor);
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Updates commonAncestorContainer and collapsed after boundary change
    function updateCollapsedAndCommonAncestor(range) {
        range.collapsed = (range.startContainer === range.endContainer && range.startOffset === range.endOffset);
        range.commonAncestorContainer = range.collapsed ?
            range.startContainer : dom.getCommonAncestor(range.startContainer, range.endContainer);
    }

    function updateBoundaries(range, startContainer, startOffset, endContainer, endOffset) {
        var startMoved = (range.startContainer !== startContainer || range.startOffset !== startOffset);
        var endMoved = (range.endContainer !== endContainer || range.endOffset !== endOffset);

        range.startContainer = startContainer;
        range.startOffset = startOffset;
        range.endContainer = endContainer;
        range.endOffset = endOffset;

        updateCollapsedAndCommonAncestor(range);
        dispatchEvent(range, "boundarychange", {startMoved: startMoved, endMoved: endMoved});
    }

    function detach(range) {
        assertNotDetached(range);
        range.startContainer = range.startOffset = range.endContainer = range.endOffset = null;
        range.collapsed = range.commonAncestorContainer = null;
        dispatchEvent(range, "detach", null);
        range._listeners = null;
    }

    /**
     * @constructor
     */
    function Range(doc) {
        this.startContainer = doc;
        this.startOffset = 0;
        this.endContainer = doc;
        this.endOffset = 0;
        this._listeners = {
            boundarychange: [],
            detach: []
        };
        updateCollapsedAndCommonAncestor(this);
    }

    createPrototypeRange(Range, updateBoundaries, detach);

    api.rangePrototype = RangePrototype.prototype;

    Range.rangeProperties = rangeProperties;
    Range.RangeIterator = RangeIterator;
    Range.copyComparisonConstants = copyComparisonConstants;
    Range.createPrototypeRange = createPrototypeRange;
    Range.inspect = inspect;
    Range.getRangeDocument = getRangeDocument;
    Range.rangesEqual = function(r1, r2) {
        return r1.startContainer === r2.startContainer &&
               r1.startOffset === r2.startOffset &&
               r1.endContainer === r2.endContainer &&
               r1.endOffset === r2.endOffset;
    };

    api.DomRange = Range;
    api.RangeException = RangeException;
});rangy.createModule("WrappedRange", function(api, module) {
    api.requireModules( ["DomUtil", "DomRange"] );

    /**
     * @constructor
     */
    var WrappedRange;
    var dom = api.dom;
    var DomPosition = dom.DomPosition;
    var DomRange = api.DomRange;



    /*----------------------------------------------------------------------------------------------------------------*/

    /*
    This is a workaround for a bug where IE returns the wrong container element from the TextRange's parentElement()
    method. For example, in the following (where pipes denote the selection boundaries):

    <ul id="ul"><li id="a">| a </li><li id="b"> b |</li></ul>

    var range = document.selection.createRange();
    alert(range.parentElement().id); // Should alert "ul" but alerts "b"

    This method returns the common ancestor node of the following:
    - the parentElement() of the textRange
    - the parentElement() of the textRange after calling collapse(true)
    - the parentElement() of the textRange after calling collapse(false)
     */
    function getTextRangeContainerElement(textRange) {
        var parentEl = textRange.parentElement();

        var range = textRange.duplicate();
        range.collapse(true);
        var startEl = range.parentElement();
        range = textRange.duplicate();
        range.collapse(false);
        var endEl = range.parentElement();
        var startEndContainer = (startEl == endEl) ? startEl : dom.getCommonAncestor(startEl, endEl);

        return startEndContainer == parentEl ? startEndContainer : dom.getCommonAncestor(parentEl, startEndContainer);
    }

    function textRangeIsCollapsed(textRange) {
        return textRange.compareEndPoints("StartToEnd", textRange) == 0;
    }

    // Gets the boundary of a TextRange expressed as a node and an offset within that node. This function started out as
    // an improved version of code found in Tim Cameron Ryan's IERange (http://code.google.com/p/ierange/) but has
    // grown, fixing problems with line breaks in preformatted text, adding workaround for IE TextRange bugs, handling
    // for inputs and images, plus optimizations.
    function getTextRangeBoundaryPosition(textRange, wholeRangeContainerElement, isStart, isCollapsed) {
        var workingRange = textRange.duplicate();

        workingRange.collapse(isStart);
        var containerElement = workingRange.parentElement();

        // Sometimes collapsing a TextRange that's at the start of a text node can move it into the previous node, so
        // check for that
        // TODO: Find out when. Workaround for wholeRangeContainerElement may break this
        if (!dom.isAncestorOf(wholeRangeContainerElement, containerElement, true)) {
            containerElement = wholeRangeContainerElement;

        }



        // Deal with nodes that cannot "contain rich HTML markup". In practice, this means form inputs, images and
        // similar. See http://msdn.microsoft.com/en-us/library/aa703950%28VS.85%29.aspx
        if (!containerElement.canHaveHTML) {
            return new DomPosition(containerElement.parentNode, dom.getNodeIndex(containerElement));
        }

        var workingNode = dom.getDocument(containerElement).createElement("span");
        var comparison, workingComparisonType = isStart ? "StartToStart" : "StartToEnd";
        var previousNode, nextNode, boundaryPosition, boundaryNode;

        // Move the working range through the container's children, starting at the end and working backwards, until the
        // working range reaches or goes past the boundary we're interested in
        do {
            containerElement.insertBefore(workingNode, workingNode.previousSibling);
            workingRange.moveToElementText(workingNode);
        } while ( (comparison = workingRange.compareEndPoints(workingComparisonType, textRange)) > 0 &&
                workingNode.previousSibling);

        // We've now reached or gone past the boundary of the text range we're interested in
        // so have identified the node we want
        boundaryNode = workingNode.nextSibling;

        if (comparison == -1 && boundaryNode && dom.isCharacterDataNode(boundaryNode)) {
            // This is a character data node (text, comment, cdata). The working range is collapsed at the start of the
            // node containing the text range's boundary, so we move the end of the working range to the boundary point
            // and measure the length of its text to get the boundary's offset within the node.
            workingRange.setEndPoint(isStart ? "EndToStart" : "EndToEnd", textRange);


            var offset;

            if (/[\r\n]/.test(boundaryNode.data)) {
                /*
                For the particular case of a boundary within a text node containing line breaks (within a <pre> element,
                for example), we need a slightly complicated approach to get the boundary's offset in IE. The facts:

                - Each line break is represented as \r in the text node's data/nodeValue properties
                - Each line break is represented as \r\n in the TextRange's 'text' property
                - The 'text' property of the TextRange does not contain trailing line breaks

                To get round the problem presented by the final fact above, we can use the fact that TextRange's
                moveStart() and moveEnd() methods return the actual number of characters moved, which is not necessarily
                the same as the number of characters it was instructed to move. The simplest approach is to use this to
                store the characters moved when moving both the start and end of the range to the start of the document
                body and subtracting the start offset from the end offset (the "move-negative-gazillion" method).
                However, this is extremely slow when the document is large and the range is near the end of it. Clearly
                doing the mirror image (i.e. moving the range boundaries to the end of the document) has the same
                problem.

                Another approach that works is to use moveStart() to move the start boundary of the range up to the end
                boundary one character at a time and incrementing a counter with the value returned by the moveStart()
                call. However, the check for whether the start boundary has reached the end boundary is expensive, so
                this method is slow (although unlike "move-negative-gazillion" is largely unaffected by the location of
                the range within the document).

                The method below is a hybrid of the two methods above. It uses the fact that a string containing the
                TextRange's 'text' property with each \r\n converted to a single \r character cannot be longer than the
                text of the TextRange, so the start of the range is moved that length initially and then a character at
                a time to make up for any trailing line breaks not contained in the 'text' property. This has good
                performance in most situations compared to the previous two methods.
                */
                var tempRange = workingRange.duplicate();
                var rangeLength = tempRange.text.replace(/\r\n/g, "\r").length;

                offset = tempRange.moveStart("character", rangeLength);
                while ( (comparison = tempRange.compareEndPoints("StartToEnd", tempRange)) == -1) {
                    offset++;
                    tempRange.moveStart("character", 1);
                }
            } else {
                offset = workingRange.text.length;
            }
            boundaryPosition = new DomPosition(boundaryNode, offset);
        } else {


            // If the boundary immediately follows a character data node and this is the end boundary, we should favour
            // a position within that, and likewise for a start boundary preceding a character data node
            previousNode = (isCollapsed || !isStart) && workingNode.previousSibling;
            nextNode = (isCollapsed || isStart) && workingNode.nextSibling;



            if (nextNode && dom.isCharacterDataNode(nextNode)) {
                boundaryPosition = new DomPosition(nextNode, 0);
            } else if (previousNode && dom.isCharacterDataNode(previousNode)) {
                boundaryPosition = new DomPosition(previousNode, previousNode.length);
            } else {
                boundaryPosition = new DomPosition(containerElement, dom.getNodeIndex(workingNode));
            }
        }

        // Clean up
        workingNode.parentNode.removeChild(workingNode);

        return boundaryPosition;
    }

    // Returns a TextRange representing the boundary of a TextRange expressed as a node and an offset within that node.
    // This function started out as an optimized version of code found in Tim Cameron Ryan's IERange
    // (http://code.google.com/p/ierange/)
    function createBoundaryTextRange(boundaryPosition, isStart) {
        var boundaryNode, boundaryParent, boundaryOffset = boundaryPosition.offset;
        var doc = dom.getDocument(boundaryPosition.node);
        var workingNode, childNodes, workingRange = doc.body.createTextRange();
        var nodeIsDataNode = dom.isCharacterDataNode(boundaryPosition.node);

        if (nodeIsDataNode) {
            boundaryNode = boundaryPosition.node;
            boundaryParent = boundaryNode.parentNode;
        } else {
            childNodes = boundaryPosition.node.childNodes;
            boundaryNode = (boundaryOffset < childNodes.length) ? childNodes[boundaryOffset] : null;
            boundaryParent = boundaryPosition.node;
        }

        // Position the range immediately before the node containing the boundary
        workingNode = doc.createElement("span");

        // Making the working element non-empty element persuades IE to consider the TextRange boundary to be within the
        // element rather than immediately before or after it, which is what we want
        workingNode.innerHTML = "&#feff;";

        // insertBefore is supposed to work like appendChild if the second parameter is null. However, a bug report
        // for IERange suggests that it can crash the browser: http://code.google.com/p/ierange/issues/detail?id=12
        if (boundaryNode) {
            boundaryParent.insertBefore(workingNode, boundaryNode);
        } else {
            boundaryParent.appendChild(workingNode);
        }

        workingRange.moveToElementText(workingNode);
        workingRange.collapse(!isStart);

        // Clean up
        boundaryParent.removeChild(workingNode);

        // Move the working range to the text offset, if required
        if (nodeIsDataNode) {
            workingRange[isStart ? "moveStart" : "moveEnd"]("character", boundaryOffset);
        }

        return workingRange;
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    if (api.features.implementsDomRange && (!api.features.implementsTextRange || !api.config.preferTextRange)) {
        // This is a wrapper around the browser's native DOM Range. It has two aims:
        // - Provide workarounds for specific browser bugs
        // - provide convenient extensions, which are inherited from Rangy's DomRange

        (function() {
            var rangeProto;
            var rangeProperties = DomRange.rangeProperties;
            var canSetRangeStartAfterEnd;

            function updateRangeProperties(range) {
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = range.nativeRange[prop];
                }
            }

            function updateNativeRange(range, startContainer, startOffset, endContainer,endOffset) {
                var startMoved = (range.startContainer !== startContainer || range.startOffset != startOffset);
                var endMoved = (range.endContainer !== endContainer || range.endOffset != endOffset);

                // Always set both boundaries for the benefit of IE9 (see issue 35)
                if (startMoved || endMoved) {
                    range.setEnd(endContainer, endOffset);
                    range.setStart(startContainer, startOffset);
                }
            }

            function detach(range) {
                range.nativeRange.detach();
                range.detached = true;
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = null;
                }
            }

            var createBeforeAfterNodeSetter;

            WrappedRange = function(range) {
                if (!range) {
                    throw new Error("Range must be specified");
                }
                this.nativeRange = range;
                updateRangeProperties(this);
            };

            DomRange.createPrototypeRange(WrappedRange, updateNativeRange, detach);

            rangeProto = WrappedRange.prototype;

            rangeProto.selectNode = function(node) {
                this.nativeRange.selectNode(node);
                updateRangeProperties(this);
            };

            rangeProto.deleteContents = function() {
                this.nativeRange.deleteContents();
                updateRangeProperties(this);
            };

            rangeProto.extractContents = function() {
                var frag = this.nativeRange.extractContents();
                updateRangeProperties(this);
                return frag;
            };

            rangeProto.cloneContents = function() {
                return this.nativeRange.cloneContents();
            };

            // TODO: Until I can find a way to programmatically trigger the Firefox bug (apparently long-standing, still
            // present in 3.6.8) that throws "Index or size is negative or greater than the allowed amount" for
            // insertNode in some circumstances, all browsers will have to use the Rangy's own implementation of
            // insertNode, which works but is almost certainly slower than the native implementation.
/*
            rangeProto.insertNode = function(node) {
                this.nativeRange.insertNode(node);
                updateRangeProperties(this);
            };
*/

            rangeProto.surroundContents = function(node) {
                this.nativeRange.surroundContents(node);
                updateRangeProperties(this);
            };

            rangeProto.collapse = function(isStart) {
                this.nativeRange.collapse(isStart);
                updateRangeProperties(this);
            };

            rangeProto.cloneRange = function() {
                return new WrappedRange(this.nativeRange.cloneRange());
            };

            rangeProto.refresh = function() {
                updateRangeProperties(this);
            };

            rangeProto.toString = function() {
                return this.nativeRange.toString();
            };

            // Create test range and node for feature detection

            var testTextNode = document.createTextNode("test");
            dom.getBody(document).appendChild(testTextNode);
            var range = document.createRange();

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for Firefox 2 bug that prevents moving the start of a Range to a point after its current end and
            // correct for it

            range.setStart(testTextNode, 0);
            range.setEnd(testTextNode, 0);

            try {
                range.setStart(testTextNode, 1);
                canSetRangeStartAfterEnd = true;

                rangeProto.setStart = function(node, offset) {
                    this.nativeRange.setStart(node, offset);
                    updateRangeProperties(this);
                };

                rangeProto.setEnd = function(node, offset) {
                    this.nativeRange.setEnd(node, offset);
                    updateRangeProperties(this);
                };

                createBeforeAfterNodeSetter = function(name) {
                    return function(node) {
                        this.nativeRange[name](node);
                        updateRangeProperties(this);
                    };
                };

            } catch(ex) {


                canSetRangeStartAfterEnd = false;

                rangeProto.setStart = function(node, offset) {
                    try {
                        this.nativeRange.setStart(node, offset);
                    } catch (ex) {
                        this.nativeRange.setEnd(node, offset);
                        this.nativeRange.setStart(node, offset);
                    }
                    updateRangeProperties(this);
                };

                rangeProto.setEnd = function(node, offset) {
                    try {
                        this.nativeRange.setEnd(node, offset);
                    } catch (ex) {
                        this.nativeRange.setStart(node, offset);
                        this.nativeRange.setEnd(node, offset);
                    }
                    updateRangeProperties(this);
                };

                createBeforeAfterNodeSetter = function(name, oppositeName) {
                    return function(node) {
                        try {
                            this.nativeRange[name](node);
                        } catch (ex) {
                            this.nativeRange[oppositeName](node);
                            this.nativeRange[name](node);
                        }
                        updateRangeProperties(this);
                    };
                };
            }

            rangeProto.setStartBefore = createBeforeAfterNodeSetter("setStartBefore", "setEndBefore");
            rangeProto.setStartAfter = createBeforeAfterNodeSetter("setStartAfter", "setEndAfter");
            rangeProto.setEndBefore = createBeforeAfterNodeSetter("setEndBefore", "setStartBefore");
            rangeProto.setEndAfter = createBeforeAfterNodeSetter("setEndAfter", "setStartAfter");

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for and correct Firefox 2 behaviour with selectNodeContents on text nodes: it collapses the range to
            // the 0th character of the text node
            range.selectNodeContents(testTextNode);
            if (range.startContainer == testTextNode && range.endContainer == testTextNode &&
                    range.startOffset == 0 && range.endOffset == testTextNode.length) {
                rangeProto.selectNodeContents = function(node) {
                    this.nativeRange.selectNodeContents(node);
                    updateRangeProperties(this);
                };
            } else {
                rangeProto.selectNodeContents = function(node) {
                    this.setStart(node, 0);
                    this.setEnd(node, DomRange.getEndOffset(node));
                };
            }

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for WebKit bug that has the beahviour of compareBoundaryPoints round the wrong way for constants
            // START_TO_END and END_TO_START: https://bugs.webkit.org/show_bug.cgi?id=20738

            range.selectNodeContents(testTextNode);
            range.setEnd(testTextNode, 3);

            var range2 = document.createRange();
            range2.selectNodeContents(testTextNode);
            range2.setEnd(testTextNode, 4);
            range2.setStart(testTextNode, 2);

            if (range.compareBoundaryPoints(range.START_TO_END, range2) == -1 &
                    range.compareBoundaryPoints(range.END_TO_START, range2) == 1) {
                // This is the wrong way round, so correct for it


                rangeProto.compareBoundaryPoints = function(type, range) {
                    range = range.nativeRange || range;
                    if (type == range.START_TO_END) {
                        type = range.END_TO_START;
                    } else if (type == range.END_TO_START) {
                        type = range.START_TO_END;
                    }
                    return this.nativeRange.compareBoundaryPoints(type, range);
                };
            } else {
                rangeProto.compareBoundaryPoints = function(type, range) {
                    return this.nativeRange.compareBoundaryPoints(type, range.nativeRange || range);
                };
            }

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for existence of createContextualFragment and delegate to it if it exists
            if (api.util.isHostMethod(range, "createContextualFragment")) {
                rangeProto.createContextualFragment = function(fragmentStr) {
                    return this.nativeRange.createContextualFragment(fragmentStr);
                };
            }

            /*--------------------------------------------------------------------------------------------------------*/

            // Clean up
            dom.getBody(document).removeChild(testTextNode);
            range.detach();
            range2.detach();
        })();

        api.createNativeRange = function(doc) {
            doc = doc || document;
            return doc.createRange();
        };
    } else if (api.features.implementsTextRange) {
        // This is a wrapper around a TextRange, providing full DOM Range functionality using rangy's DomRange as a
        // prototype

        WrappedRange = function(textRange) {
            this.textRange = textRange;
            this.refresh();
        };

        WrappedRange.prototype = new DomRange(document);

        WrappedRange.prototype.refresh = function() {
            var start, end;

            // TextRange's parentElement() method cannot be trusted. getTextRangeContainerElement() works around that.
            var rangeContainerElement = getTextRangeContainerElement(this.textRange);

            if (textRangeIsCollapsed(this.textRange)) {
                end = start = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true, true);
            } else {

                start = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true, false);
                end = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, false, false);
            }

            this.setStart(start.node, start.offset);
            this.setEnd(end.node, end.offset);
        };

        DomRange.copyComparisonConstants(WrappedRange);

        // Add WrappedRange as the Range property of the global object to allow expression like Range.END_TO_END to work
        var globalObj = (function() { return this; })();
        if (typeof globalObj.Range == "undefined") {
            globalObj.Range = WrappedRange;
        }

        api.createNativeRange = function(doc) {
            doc = doc || document;
            return doc.body.createTextRange();
        };
    }

    if (api.features.implementsTextRange) {
        WrappedRange.rangeToTextRange = function(range) {
            if (range.collapsed) {
                var tr = createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);



                return tr;

                //return createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);
            } else {
                var startRange = createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);
                var endRange = createBoundaryTextRange(new DomPosition(range.endContainer, range.endOffset), false);
                var textRange = dom.getDocument(range.startContainer).body.createTextRange();
                textRange.setEndPoint("StartToStart", startRange);
                textRange.setEndPoint("EndToEnd", endRange);
                return textRange;
            }
        };
    }

    WrappedRange.prototype.getName = function() {
        return "WrappedRange";
    };

    api.WrappedRange = WrappedRange;

    api.createRange = function(doc) {
        doc = doc || document;
        return new WrappedRange(api.createNativeRange(doc));
    };

    api.createRangyRange = function(doc) {
        doc = doc || document;
        return new DomRange(doc);
    };

    api.createIframeRange = function(iframeEl) {
        return api.createRange(dom.getIframeDocument(iframeEl));
    };

    api.createIframeRangyRange = function(iframeEl) {
        return api.createRangyRange(dom.getIframeDocument(iframeEl));
    };

    api.addCreateMissingNativeApiListener(function(win) {
        var doc = win.document;
        if (typeof doc.createRange == "undefined") {
            doc.createRange = function() {
                return api.createRange(this);
            };
        }
        doc = win = null;
    });
});rangy.createModule("WrappedSelection", function(api, module) {
    // This will create a selection object wrapper that follows the Selection object found in the WHATWG draft DOM Range
    // spec (http://html5.org/specs/dom-range.html)

    api.requireModules( ["DomUtil", "DomRange", "WrappedRange"] );

    api.config.checkSelectionRanges = true;

    var BOOLEAN = "boolean",
        windowPropertyName = "_rangySelection",
        dom = api.dom,
        util = api.util,
        DomRange = api.DomRange,
        WrappedRange = api.WrappedRange,
        DOMException = api.DOMException,
        DomPosition = dom.DomPosition,
        getSelection,
        selectionIsCollapsed,
        CONTROL = "Control";



    function getWinSelection(winParam) {
        return (winParam || window).getSelection();
    }

    function getDocSelection(winParam) {
        return (winParam || window).document.selection;
    }

    // Test for the Range/TextRange and Selection features required
    // Test for ability to retrieve selection
    var implementsWinGetSelection = api.util.isHostMethod(window, "getSelection"),
        implementsDocSelection = api.util.isHostObject(document, "selection");

    var useDocumentSelection = implementsDocSelection && (!implementsWinGetSelection || api.config.preferTextRange);

    if (useDocumentSelection) {
        getSelection = getDocSelection;
        api.isSelectionValid = function(winParam) {
            var doc = (winParam || window).document, nativeSel = doc.selection;

            // Check whether the selection TextRange is actually contained within the correct document
            return (nativeSel.type != "None" || dom.getDocument(nativeSel.createRange().parentElement()) == doc);
        };
    } else if (implementsWinGetSelection) {
        getSelection = getWinSelection;
        api.isSelectionValid = function() {
            return true;
        };
    } else {
        module.fail("Neither document.selection or window.getSelection() detected.");
    }

    api.getNativeSelection = getSelection;

    var testSelection = getSelection();
    var testRange = api.createNativeRange(document);
    var body = dom.getBody(document);

    // Obtaining a range from a selection
    var selectionHasAnchorAndFocus = util.areHostObjects(testSelection, ["anchorNode", "focusNode"] &&
                                     util.areHostProperties(testSelection, ["anchorOffset", "focusOffset"]));
    api.features.selectionHasAnchorAndFocus = selectionHasAnchorAndFocus;

    // Test for existence of native selection extend() method
    var selectionHasExtend = util.isHostMethod(testSelection, "extend");
    api.features.selectionHasExtend = selectionHasExtend;

    // Test if rangeCount exists
    var selectionHasRangeCount = (typeof testSelection.rangeCount == "number");
    api.features.selectionHasRangeCount = selectionHasRangeCount;

    var selectionSupportsMultipleRanges = false;
    var collapsedNonEditableSelectionsSupported = true;

    if (util.areHostMethods(testSelection, ["addRange", "getRangeAt", "removeAllRanges"]) &&
            typeof testSelection.rangeCount == "number" && api.features.implementsDomRange) {

        (function() {
            var iframe = document.createElement("iframe");
            iframe.frameBorder = 0;
            iframe.style.position = "absolute";
            iframe.style.left = "-10000px";
            body.appendChild(iframe);

            var iframeDoc = dom.getIframeDocument(iframe);
            iframeDoc.open();
            iframeDoc.write("<html><head></head><body>12</body></html>");
            iframeDoc.close();

            var sel = dom.getIframeWindow(iframe).getSelection();
            var docEl = iframeDoc.documentElement;
            var iframeBody = docEl.lastChild, textNode = iframeBody.firstChild;

            // Test whether the native selection will allow a collapsed selection within a non-editable element
            var r1 = iframeDoc.createRange();
            r1.setStart(textNode, 1);
            r1.collapse(true);
            sel.addRange(r1);
            collapsedNonEditableSelectionsSupported = (sel.rangeCount == 1);
            sel.removeAllRanges();

            // Test whether the native selection is capable of supporting multiple ranges
            var r2 = r1.cloneRange();
            r1.setStart(textNode, 0);
            r2.setEnd(textNode, 2);
            sel.addRange(r1);
            sel.addRange(r2);

            selectionSupportsMultipleRanges = (sel.rangeCount == 2);

            // Clean up
            r1.detach();
            r2.detach();

            body.removeChild(iframe);
        })();
    }

    api.features.selectionSupportsMultipleRanges = selectionSupportsMultipleRanges;
    api.features.collapsedNonEditableSelectionsSupported = collapsedNonEditableSelectionsSupported;

    // ControlRanges
    var implementsControlRange = false, testControlRange;

    if (body && util.isHostMethod(body, "createControlRange")) {
        testControlRange = body.createControlRange();
        if (util.areHostProperties(testControlRange, ["item", "add"])) {
            implementsControlRange = true;
        }
    }
    api.features.implementsControlRange = implementsControlRange;

    // Selection collapsedness
    if (selectionHasAnchorAndFocus) {
        selectionIsCollapsed = function(sel) {
            return sel.anchorNode === sel.focusNode && sel.anchorOffset === sel.focusOffset;
        };
    } else {
        selectionIsCollapsed = function(sel) {
            return sel.rangeCount ? sel.getRangeAt(sel.rangeCount - 1).collapsed : false;
        };
    }

    function updateAnchorAndFocusFromRange(sel, range, backwards) {
        var anchorPrefix = backwards ? "end" : "start", focusPrefix = backwards ? "start" : "end";
        sel.anchorNode = range[anchorPrefix + "Container"];
        sel.anchorOffset = range[anchorPrefix + "Offset"];
        sel.focusNode = range[focusPrefix + "Container"];
        sel.focusOffset = range[focusPrefix + "Offset"];
    }

    function updateAnchorAndFocusFromNativeSelection(sel) {
        var nativeSel = sel.nativeSelection;
        sel.anchorNode = nativeSel.anchorNode;
        sel.anchorOffset = nativeSel.anchorOffset;
        sel.focusNode = nativeSel.focusNode;
        sel.focusOffset = nativeSel.focusOffset;
    }

    function updateEmptySelection(sel) {
        sel.anchorNode = sel.focusNode = null;
        sel.anchorOffset = sel.focusOffset = 0;
        sel.rangeCount = 0;
        sel.isCollapsed = true;
        sel._ranges.length = 0;
    }

    function getNativeRange(range) {
        var nativeRange;
        if (range instanceof DomRange) {
            nativeRange = range._selectionNativeRange;
            if (!nativeRange) {
                nativeRange = api.createNativeRange(dom.getDocument(range.startContainer));
                nativeRange.setEnd(range.endContainer, range.endOffset);
                nativeRange.setStart(range.startContainer, range.startOffset);
                range._selectionNativeRange = nativeRange;
                range.attachListener("detach", function() {

                    this._selectionNativeRange = null;
                });
            }
        } else if (range instanceof WrappedRange) {
            nativeRange = range.nativeRange;
        } else if (api.features.implementsDomRange && (range instanceof dom.getWindow(range.startContainer).Range)) {
            nativeRange = range;
        }
        return nativeRange;
    }

    function rangeContainsSingleElement(rangeNodes) {
        if (!rangeNodes.length || rangeNodes[0].nodeType != 1) {
            return false;
        }
        for (var i = 1, len = rangeNodes.length; i < len; ++i) {
            if (!dom.isAncestorOf(rangeNodes[0], rangeNodes[i])) {
                return false;
            }
        }
        return true;
    }

    function getSingleElementFromRange(range) {
        var nodes = range.getNodes();
        if (!rangeContainsSingleElement(nodes)) {
            throw new Error("getSingleElementFromRange: range " + range.inspect() + " did not consist of a single element");
        }
        return nodes[0];
    }

    function isTextRange(range) {
        return !!range && typeof range.text != "undefined";
    }

    function updateFromTextRange(sel, range) {
        // Create a Range from the selected TextRange
        var wrappedRange = new WrappedRange(range);
        sel._ranges = [wrappedRange];

        updateAnchorAndFocusFromRange(sel, wrappedRange, false);
        sel.rangeCount = 1;
        sel.isCollapsed = wrappedRange.collapsed;
    }

    function updateControlSelection(sel) {
        // Update the wrapped selection based on what's now in the native selection
        sel._ranges.length = 0;
        if (sel.docSelection.type == "None") {
            updateEmptySelection(sel);
        } else {
            var controlRange = sel.docSelection.createRange();
            if (isTextRange(controlRange)) {
                // This case (where the selection type is "Control" and calling createRange() on the selection returns
                // a TextRange) can happen in IE 9. It happens, for example, when all elements in the selected
                // ControlRange have been removed from the ControlRange and removed from the document.
                updateFromTextRange(sel, controlRange);
            } else {
                sel.rangeCount = controlRange.length;
                var range, doc = dom.getDocument(controlRange.item(0));
                for (var i = 0; i < sel.rangeCount; ++i) {
                    range = api.createRange(doc);
                    range.selectNode(controlRange.item(i));
                    sel._ranges.push(range);
                }
                sel.isCollapsed = sel.rangeCount == 1 && sel._ranges[0].collapsed;
                updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], false);
            }
        }
    }

    function addRangeToControlSelection(sel, range) {
        var controlRange = sel.docSelection.createRange();
        var rangeElement = getSingleElementFromRange(range);

        // Create a new ControlRange containing all the elements in the selected ControlRange plus the element
        // contained by the supplied range
        var doc = dom.getDocument(controlRange.item(0));
        var newControlRange = dom.getBody(doc).createControlRange();
        for (var i = 0, len = controlRange.length; i < len; ++i) {
            newControlRange.add(controlRange.item(i));
        }
        try {
            newControlRange.add(rangeElement);
        } catch (ex) {
            throw new Error("addRange(): Element within the specified Range could not be added to control selection (does it have layout?)");
        }
        newControlRange.select();

        // Update the wrapped selection based on what's now in the native selection
        updateControlSelection(sel);
    }

    var getSelectionRangeAt;

    if (util.isHostMethod(testSelection,  "getRangeAt")) {
        getSelectionRangeAt = function(sel, index) {
            try {
                return sel.getRangeAt(index);
            } catch(ex) {
                return null;
            }
        };
    } else if (selectionHasAnchorAndFocus) {
        getSelectionRangeAt = function(sel) {
            var doc = dom.getDocument(sel.anchorNode);
            var range = api.createRange(doc);
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);

            // Handle the case when the selection was selected backwards (from the end to the start in the
            // document)
            if (range.collapsed !== this.isCollapsed) {
                range.setStart(sel.focusNode, sel.focusOffset);
                range.setEnd(sel.anchorNode, sel.anchorOffset);
            }

            return range;
        };
    }

    /**
     * @constructor
     */
    function WrappedSelection(selection, docSelection, win) {
        this.nativeSelection = selection;
        this.docSelection = docSelection;
        this._ranges = [];
        this.win = win;
        this.refresh();
    }

    api.getSelection = function(win) {
        win = win || window;
        var sel = win[windowPropertyName];
        var nativeSel = getSelection(win), docSel = implementsDocSelection ? getDocSelection(win) : null;
        if (sel) {
            sel.nativeSelection = nativeSel;
            sel.docSelection = docSel;
            sel.refresh(win);
        } else {
            sel = new WrappedSelection(nativeSel, docSel, win);
            win[windowPropertyName] = sel;
        }
        return sel;
    };

    api.getIframeSelection = function(iframeEl) {
        return api.getSelection(dom.getIframeWindow(iframeEl));
    };

    var selProto = WrappedSelection.prototype;

    function createControlSelection(sel, ranges) {
        // Ensure that the selection becomes of type "Control"
        var doc = dom.getDocument(ranges[0].startContainer);
        var controlRange = dom.getBody(doc).createControlRange();
        for (var i = 0, el; i < rangeCount; ++i) {
            el = getSingleElementFromRange(ranges[i]);
            try {
                controlRange.add(el);
            } catch (ex) {
                throw new Error("setRanges(): Element within the one of the specified Ranges could not be added to control selection (does it have layout?)");
            }
        }
        controlRange.select();

        // Update the wrapped selection based on what's now in the native selection
        updateControlSelection(sel);
    }

    // Selecting a range
    if (!useDocumentSelection && selectionHasAnchorAndFocus && util.areHostMethods(testSelection, ["removeAllRanges", "addRange"])) {
        selProto.removeAllRanges = function() {
            this.nativeSelection.removeAllRanges();
            updateEmptySelection(this);
        };

        var addRangeBackwards = function(sel, range) {
            var doc = DomRange.getRangeDocument(range);
            var endRange = api.createRange(doc);
            endRange.collapseToPoint(range.endContainer, range.endOffset);
            sel.nativeSelection.addRange(getNativeRange(endRange));
            sel.nativeSelection.extend(range.startContainer, range.startOffset);
            sel.refresh();
        };

        if (selectionHasRangeCount) {
            selProto.addRange = function(range, backwards) {
                if (implementsControlRange && implementsDocSelection && this.docSelection.type == CONTROL) {
                    addRangeToControlSelection(this, range);
                } else {
                    if (backwards && selectionHasExtend) {
                        addRangeBackwards(this, range);
                    } else {
                        var previousRangeCount;
                        if (selectionSupportsMultipleRanges) {
                            previousRangeCount = this.rangeCount;
                        } else {
                            this.removeAllRanges();
                            previousRangeCount = 0;
                        }
                        this.nativeSelection.addRange(getNativeRange(range));

                        // Check whether adding the range was successful
                        this.rangeCount = this.nativeSelection.rangeCount;

                        if (this.rangeCount == previousRangeCount + 1) {
                            // The range was added successfully

                            // Check whether the range that we added to the selection is reflected in the last range extracted from
                            // the selection
                            if (api.config.checkSelectionRanges) {
                                var nativeRange = getSelectionRangeAt(this.nativeSelection, this.rangeCount - 1);
                                if (nativeRange && !DomRange.rangesEqual(nativeRange, range)) {
                                    // Happens in WebKit with, for example, a selection placed at the start of a text node
                                    range = new WrappedRange(nativeRange);
                                }
                            }
                            this._ranges[this.rangeCount - 1] = range;
                            updateAnchorAndFocusFromRange(this, range, selectionIsBackwards(this.nativeSelection));
                            this.isCollapsed = selectionIsCollapsed(this);
                        } else {
                            // The range was not added successfully. The simplest thing is to refresh
                            this.refresh();
                        }
                    }
                }
            };
        } else {
            selProto.addRange = function(range, backwards) {
                if (backwards && selectionHasExtend) {
                    addRangeBackwards(this, range);
                } else {
                    this.nativeSelection.addRange(getNativeRange(range));
                    this.refresh();
                }
            };
        }

        selProto.setRanges = function(ranges) {
            if (implementsControlRange && ranges.length > 1) {
                createControlSelection(this, ranges);
            } else {
                this.removeAllRanges();
                for (var i = 0, len = ranges.length; i < len; ++i) {
                    this.addRange(ranges[i]);
                }
            }
        };
    } else if (util.isHostMethod(testSelection, "empty") && util.isHostMethod(testRange, "select") &&
               implementsControlRange && useDocumentSelection) {

        selProto.removeAllRanges = function() {
            // Added try/catch as fix for issue #21
            try {
                this.docSelection.empty();

                // Check for empty() not working (issue #24)
                if (this.docSelection.type != "None") {
                    // Work around failure to empty a control selection by instead selecting a TextRange and then
                    // calling empty()
                    var doc;
                    if (this.anchorNode) {
                        doc = dom.getDocument(this.anchorNode);
                    } else if (this.docSelection.type == CONTROL) {
                        var controlRange = this.docSelection.createRange();
                        if (controlRange.length) {
                            doc = dom.getDocument(controlRange.item(0)).body.createTextRange();
                        }
                    }
                    if (doc) {
                        var textRange = doc.body.createTextRange();
                        textRange.select();
                        this.docSelection.empty();
                    }
                }
            } catch(ex) {}
            updateEmptySelection(this);
        };

        selProto.addRange = function(range) {
            if (this.docSelection.type == CONTROL) {
                addRangeToControlSelection(this, range);
            } else {
                WrappedRange.rangeToTextRange(range).select();
                this._ranges[0] = range;
                this.rangeCount = 1;
                this.isCollapsed = this._ranges[0].collapsed;
                updateAnchorAndFocusFromRange(this, range, false);
            }
        };

        selProto.setRanges = function(ranges) {
            this.removeAllRanges();
            var rangeCount = ranges.length;
            if (rangeCount > 1) {
                createControlSelection(this, ranges);
            } else if (rangeCount) {
                this.addRange(ranges[0]);
            }
        };
    } else {
        module.fail("No means of selecting a Range or TextRange was found");
        return false;
    }

    selProto.getRangeAt = function(index) {
        if (index < 0 || index >= this.rangeCount) {
            throw new DOMException("INDEX_SIZE_ERR");
        } else {
            return this._ranges[index];
        }
    };

    var refreshSelection;

    if (useDocumentSelection) {
        refreshSelection = function(sel) {
            var range;
            if (api.isSelectionValid(sel.win)) {
                range = sel.docSelection.createRange();
            } else {
                range = dom.getBody(sel.win.document).createTextRange();
                range.collapse(true);
            }


            if (sel.docSelection.type == CONTROL) {
                updateControlSelection(sel);
            } else if (isTextRange(range)) {
                updateFromTextRange(sel, range);
            } else {
                updateEmptySelection(sel);
            }
        };
    } else if (util.isHostMethod(testSelection, "getRangeAt") && typeof testSelection.rangeCount == "number") {
        refreshSelection = function(sel) {
            if (implementsControlRange && implementsDocSelection && sel.docSelection.type == CONTROL) {
                updateControlSelection(sel);
            } else {
                sel._ranges.length = sel.rangeCount = sel.nativeSelection.rangeCount;
                if (sel.rangeCount) {
                    for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                        sel._ranges[i] = new api.WrappedRange(sel.nativeSelection.getRangeAt(i));
                    }
                    updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], selectionIsBackwards(sel.nativeSelection));
                    sel.isCollapsed = selectionIsCollapsed(sel);
                } else {
                    updateEmptySelection(sel);
                }
            }
        };
    } else if (selectionHasAnchorAndFocus && typeof testSelection.isCollapsed == BOOLEAN && typeof testRange.collapsed == BOOLEAN && api.features.implementsDomRange) {
        refreshSelection = function(sel) {
            var range, nativeSel = sel.nativeSelection;
            if (nativeSel.anchorNode) {
                range = getSelectionRangeAt(nativeSel, 0);
                sel._ranges = [range];
                sel.rangeCount = 1;
                updateAnchorAndFocusFromNativeSelection(sel);
                sel.isCollapsed = selectionIsCollapsed(sel);
            } else {
                updateEmptySelection(sel);
            }
        };
    } else {
        module.fail("No means of obtaining a Range or TextRange from the user's selection was found");
        return false;
    }

    selProto.refresh = function(checkForChanges) {
        var oldRanges = checkForChanges ? this._ranges.slice(0) : null;
        refreshSelection(this);
        if (checkForChanges) {
            var i = oldRanges.length;
            if (i != this._ranges.length) {
                return false;
            }
            while (i--) {
                if (!DomRange.rangesEqual(oldRanges[i], this._ranges[i])) {
                    return false;
                }
            }
            return true;
        }
    };

    // Removal of a single range
    var removeRangeManually = function(sel, range) {
        var ranges = sel.getAllRanges(), removed = false;
        sel.removeAllRanges();
        for (var i = 0, len = ranges.length; i < len; ++i) {
            if (removed || range !== ranges[i]) {
                sel.addRange(ranges[i]);
            } else {
                // According to the draft WHATWG Range spec, the same range may be added to the selection multiple
                // times. removeRange should only remove the first instance, so the following ensures only the first
                // instance is removed
                removed = true;
            }
        }
        if (!sel.rangeCount) {
            updateEmptySelection(sel);
        }
    };

    if (implementsControlRange) {
        selProto.removeRange = function(range) {
            if (this.docSelection.type == CONTROL) {
                var controlRange = this.docSelection.createRange();
                var rangeElement = getSingleElementFromRange(range);

                // Create a new ControlRange containing all the elements in the selected ControlRange minus the
                // element contained by the supplied range
                var doc = dom.getDocument(controlRange.item(0));
                var newControlRange = dom.getBody(doc).createControlRange();
                var el, removed = false;
                for (var i = 0, len = controlRange.length; i < len; ++i) {
                    el = controlRange.item(i);
                    if (el !== rangeElement || removed) {
                        newControlRange.add(controlRange.item(i));
                    } else {
                        removed = true;
                    }
                }
                newControlRange.select();

                // Update the wrapped selection based on what's now in the native selection
                updateControlSelection(this);
            } else {
                removeRangeManually(this, range);
            }
        };
    } else {
        selProto.removeRange = function(range) {
            removeRangeManually(this, range);
        };
    }

    // Detecting if a selection is backwards
    var selectionIsBackwards;
    if (!useDocumentSelection && selectionHasAnchorAndFocus && api.features.implementsDomRange) {
        selectionIsBackwards = function(sel) {
            var backwards = false;
            if (sel.anchorNode) {
                backwards = (dom.comparePoints(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset) == 1);
            }
            return backwards;
        };

        selProto.isBackwards = function() {
            return selectionIsBackwards(this);
        };
    } else {
        selectionIsBackwards = selProto.isBackwards = function() {
            return false;
        };
    }

    // Selection text
    // This is conformant to the new WHATWG DOM Range draft spec but differs from WebKit and Mozilla's implementation
    selProto.toString = function() {

        var rangeTexts = [];
        for (var i = 0, len = this.rangeCount; i < len; ++i) {
            rangeTexts[i] = "" + this._ranges[i];
        }
        return rangeTexts.join("");
    };

    function assertNodeInSameDocument(sel, node) {
        if (sel.anchorNode && (dom.getDocument(sel.anchorNode) !== dom.getDocument(node))) {
            throw new DOMException("WRONG_DOCUMENT_ERR");
        }
    }

    // No current browsers conform fully to the HTML 5 draft spec for this method, so Rangy's own method is always used
    selProto.collapse = function(node, offset) {
        assertNodeInSameDocument(this, node);
        var range = api.createRange(dom.getDocument(node));
        range.collapseToPoint(node, offset);
        this.removeAllRanges();
        this.addRange(range);
        this.isCollapsed = true;
    };

    selProto.collapseToStart = function() {
        if (this.rangeCount) {
            var range = this._ranges[0];
            this.collapse(range.startContainer, range.startOffset);
        } else {
            throw new DOMException("INVALID_STATE_ERR");
        }
    };

    selProto.collapseToEnd = function() {
        if (this.rangeCount) {
            var range = this._ranges[this.rangeCount - 1];
            this.collapse(range.endContainer, range.endOffset);
        } else {
            throw new DOMException("INVALID_STATE_ERR");
        }
    };

    // The HTML 5 spec is very specific on how selectAllChildren should be implemented so the native implementation is
    // never used by Rangy.
    selProto.selectAllChildren = function(node) {
        assertNodeInSameDocument(this, node);
        var range = api.createRange(dom.getDocument(node));
        range.selectNodeContents(node);
        this.removeAllRanges();
        this.addRange(range);
    };

    selProto.deleteFromDocument = function() {
        // Sepcial behaviour required for Control selections
        if (implementsControlRange && implementsDocSelection && this.docSelection.type == CONTROL) {
            var controlRange = this.docSelection.createRange();
            var element;
            while (controlRange.length) {
                element = controlRange.item(0);
                controlRange.remove(element);
                element.parentNode.removeChild(element);
            }
            this.refresh();
        } else if (this.rangeCount) {
            var ranges = this.getAllRanges();
            this.removeAllRanges();
            for (var i = 0, len = ranges.length; i < len; ++i) {
                ranges[i].deleteContents();
            }
            // The HTML5 spec says nothing about what the selection should contain after calling deleteContents on each
            // range. Firefox moves the selection to where the final selected range was, so we emulate that
            this.addRange(ranges[len - 1]);
        }
    };

    // The following are non-standard extensions
    selProto.getAllRanges = function() {
        return this._ranges.slice(0);
    };

    selProto.setSingleRange = function(range) {
        this.setRanges( [range] );
    };

    selProto.containsNode = function(node, allowPartial) {
        for (var i = 0, len = this._ranges.length; i < len; ++i) {
            if (this._ranges[i].containsNode(node, allowPartial)) {
                return true;
            }
        }
        return false;
    };

    selProto.toHtml = function() {
        var html = "";
        if (this.rangeCount) {
            var container = DomRange.getRangeDocument(this._ranges[0]).createElement("div");
            for (var i = 0, len = this._ranges.length; i < len; ++i) {
                container.appendChild(this._ranges[i].cloneContents());
            }
            html = container.innerHTML;
        }
        return html;
    };

    function inspect(sel) {
        var rangeInspects = [];
        var anchor = new DomPosition(sel.anchorNode, sel.anchorOffset);
        var focus = new DomPosition(sel.focusNode, sel.focusOffset);
        var name = (typeof sel.getName == "function") ? sel.getName() : "Selection";

        if (typeof sel.rangeCount != "undefined") {
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                rangeInspects[i] = DomRange.inspect(sel.getRangeAt(i));
            }
        }
        return "[" + name + "(Ranges: " + rangeInspects.join(", ") +
                ")(anchor: " + anchor.inspect() + ", focus: " + focus.inspect() + "]";

    }

    selProto.getName = function() {
        return "WrappedSelection";
    };

    selProto.inspect = function() {
        return inspect(this);
    };

    selProto.detach = function() {
        this.win[windowPropertyName] = null;
        this.win = this.anchorNode = this.focusNode = null;
    };

    WrappedSelection.inspect = inspect;

    api.Selection = WrappedSelection;

    api.selectionPrototype = selProto;

    api.addCreateMissingNativeApiListener(function(win) {
        if (typeof win.getSelection == "undefined") {
            win.getSelection = function() {
                return api.getSelection(this);
            };
        }
        win = null;
    });
});

/**
 * @license Selection save and restore module for Rangy.
 * Saves and restores user selections using marker invisible elements in the DOM.
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * http://code.google.com/p/rangy/
 *
 * Depends on Rangy core.
 *
 * Copyright 2012, Tim Down
 * Licensed under the MIT license.
 * Version: 1.2.3
 * Build date: 26 February 2012
 */
rangy.createModule("SaveRestore", function(api, module) {
    api.requireModules( ["DomUtil", "DomRange", "WrappedRange"] );

    var dom = api.dom;

    var markerTextChar = "\ufeff";

    function gEBI(id, doc) {
        return (doc || document).getElementById(id);
    }

    function insertRangeBoundaryMarker(range, atStart) {
        var markerId = "selectionBoundary_" + (+new Date()) + "_" + ("" + Math.random()).slice(2);
        var markerEl;
        var doc = dom.getDocument(range.startContainer);

        // Clone the Range and collapse to the appropriate boundary point
        var boundaryRange = range.cloneRange();
        boundaryRange.collapse(atStart);

        // Create the marker element containing a single invisible character using DOM methods and insert it
        markerEl = doc.createElement("span");
        markerEl.id = markerId;
        markerEl.style.lineHeight = "0";
        markerEl.style.display = "none";
        markerEl.className = "rangySelectionBoundary";
        markerEl.appendChild(doc.createTextNode(markerTextChar));

        boundaryRange.insertNode(markerEl);
        boundaryRange.detach();
        return markerEl;
    }

    function setRangeBoundary(doc, range, markerId, atStart) {
        var markerEl = gEBI(markerId, doc);
        if (markerEl) {
            range[atStart ? "setStartBefore" : "setEndBefore"](markerEl);
            markerEl.parentNode.removeChild(markerEl);
        } else {
            module.warn("Marker element has been removed. Cannot restore selection.");
        }
    }

    function compareRanges(r1, r2) {
        return r2.compareBoundaryPoints(r1.START_TO_START, r1);
    }

    function saveSelection(win) {
        win = win || window;
        var doc = win.document;
        if (!api.isSelectionValid(win)) {
            module.warn("Cannot save selection. This usually happens when the selection is collapsed and the selection document has lost focus.");
            return;
        }
        var sel = api.getSelection(win);
        var ranges = sel.getAllRanges();
        var rangeInfos = [], startEl, endEl, range;

        // Order the ranges by position within the DOM, latest first
        ranges.sort(compareRanges);

        for (var i = 0, len = ranges.length; i < len; ++i) {
            range = ranges[i];
            if (range.collapsed) {
                endEl = insertRangeBoundaryMarker(range, false);
                rangeInfos.push({
                    markerId: endEl.id,
                    collapsed: true
                });
            } else {
                endEl = insertRangeBoundaryMarker(range, false);
                startEl = insertRangeBoundaryMarker(range, true);

                rangeInfos[i] = {
                    startMarkerId: startEl.id,
                    endMarkerId: endEl.id,
                    collapsed: false,
                    backwards: ranges.length == 1 && sel.isBackwards()
                };
            }
        }

        // Now that all the markers are in place and DOM manipulation over, adjust each range's boundaries to lie
        // between its markers
        for (i = len - 1; i >= 0; --i) {
            range = ranges[i];
            if (range.collapsed) {
                range.collapseBefore(gEBI(rangeInfos[i].markerId, doc));
            } else {
                range.setEndBefore(gEBI(rangeInfos[i].endMarkerId, doc));
                range.setStartAfter(gEBI(rangeInfos[i].startMarkerId, doc));
            }
        }

        // Ensure current selection is unaffected
        sel.setRanges(ranges);
        return {
            win: win,
            doc: doc,
            rangeInfos: rangeInfos,
            restored: false
        };
    }

    function restoreSelection(savedSelection, preserveDirection) {
        if (!savedSelection.restored) {
            var rangeInfos = savedSelection.rangeInfos;
            var sel = api.getSelection(savedSelection.win);
            var ranges = [];

            // Ranges are in reverse order of appearance in the DOM. We want to restore earliest first to avoid
            // normalization affecting previously restored ranges.
            for (var len = rangeInfos.length, i = len - 1, rangeInfo, range; i >= 0; --i) {
                rangeInfo = rangeInfos[i];
                range = api.createRange(savedSelection.doc);
                if (rangeInfo.collapsed) {
                    var markerEl = gEBI(rangeInfo.markerId, savedSelection.doc);
                    if (markerEl) {
                        markerEl.style.display = "inline";
                        var previousNode = markerEl.previousSibling;

                        // Workaround for issue 17
                        if (previousNode && previousNode.nodeType == 3) {
                            markerEl.parentNode.removeChild(markerEl);
                            range.collapseToPoint(previousNode, previousNode.length);
                        } else {
                            range.collapseBefore(markerEl);
                            markerEl.parentNode.removeChild(markerEl);
                        }
                    } else {
                        module.warn("Marker element has been removed. Cannot restore selection.");
                    }
                } else {
                    setRangeBoundary(savedSelection.doc, range, rangeInfo.startMarkerId, true);
                    setRangeBoundary(savedSelection.doc, range, rangeInfo.endMarkerId, false);
                }

                // Normalizing range boundaries is only viable if the selection contains only one range. For example,
                // if the selection contained two ranges that were both contained within the same single text node,
                // both would alter the same text node when restoring and break the other range.
                if (len == 1) {
                    range.normalizeBoundaries();
                }
                ranges[i] = range;
            }
            if (len == 1 && preserveDirection && api.features.selectionHasExtend && rangeInfos[0].backwards) {
                sel.removeAllRanges();
                sel.addRange(ranges[0], true);
            } else {
                sel.setRanges(ranges);
            }

            savedSelection.restored = true;
        }
    }

    function removeMarkerElement(doc, markerId) {
        var markerEl = gEBI(markerId, doc);
        if (markerEl) {
            markerEl.parentNode.removeChild(markerEl);
        }
    }

    function removeMarkers(savedSelection) {
        var rangeInfos = savedSelection.rangeInfos;
        for (var i = 0, len = rangeInfos.length, rangeInfo; i < len; ++i) {
            rangeInfo = rangeInfos[i];
            if (rangeInfo.collapsed) {
                removeMarkerElement(savedSelection.doc, rangeInfo.markerId);
            } else {
                removeMarkerElement(savedSelection.doc, rangeInfo.startMarkerId);
                removeMarkerElement(savedSelection.doc, rangeInfo.endMarkerId);
            }
        }
    }

    api.saveSelection = saveSelection;
    api.restoreSelection = restoreSelection;
    api.removeMarkerElement = removeMarkerElement;
    api.removeMarkers = removeMarkers;
});

/*!
  * Bowser - a browser detector
  * https://github.com/ded/bowser
  * MIT License | (c) Dustin Diaz 2011
  */
!function (name, definition) {
  if (typeof define == 'function') define(definition)
  else if (typeof module != 'undefined' && module.exports) module.exports['browser'] = definition()
  else this[name] = definition()
}('bowser', function () {
  /**
    * navigator.userAgent =>
    * Chrome:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.57 Safari/534.24"
    * Opera:   "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.7; U; en) Presto/2.7.62 Version/11.01"
    * Safari:  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"
    * IE:      "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)"
    * Firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0) Gecko/20100101 Firefox/4.0"
    * iPhone:  "Mozilla/5.0 (iPhone Simulator; U; CPU iPhone OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5"
    * iPad:    "Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5",
    * Android: "Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; T-Mobile G2 Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"
    * Touchpad: "Mozilla/5.0 (hp-tabled;Linux;hpwOS/3.0.5; U; en-US)) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/234.83 Safari/534.6 TouchPad/1.0"
    * PhantomJS: "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.5.0 Safari/534.34"
    */

  var ua = navigator.userAgent
    , t = true
    , ie = /msie/i.test(ua)
    , chrome = /chrome/i.test(ua)
    , phantom = /phantom/i.test(ua)
    , safari = /safari/i.test(ua) && !chrome && !phantom
    , iphone = /iphone/i.test(ua)
    , ipad = /ipad/i.test(ua)
    , touchpad = /touchpad/i.test(ua)
    , android = /android/i.test(ua)
    , opera = /opera/i.test(ua)
    , firefox = /firefox/i.test(ua)
    , gecko = /gecko\//i.test(ua)
    , seamonkey = /seamonkey\//i.test(ua)
    , webkitVersion = /version\/(\d+(\.\d+)?)/i
    , o

  function detect() {

    if (ie) return {
        msie: t
      , version: ua.match(/msie (\d+(\.\d+)?);/i)[1]
    }
    if (chrome) return {
        webkit: t
      , chrome: t
      , version: ua.match(/chrome\/(\d+(\.\d+)?)/i)[1]
    }
    if (phantom) return {
        webkit: t
      , phantom: t
      , version: ua.match(/phantomjs\/(\d+(\.\d+)+)/i)[1]
    }
    if (touchpad) return {
        webkit: t
      , touchpad: t
      , version : ua.match(/touchpad\/(\d+(\.\d+)?)/i)[1]
    }
    if (iphone || ipad) {
      o = {
          webkit: t
        , mobile: t
        , ios: t
        , iphone: iphone
        , ipad: ipad
      }
      // WTF: version is not part of user agent in web apps
      if (webkitVersion.test(ua)) {
        o.version = ua.match(webkitVersion)[1]
      }
      return o
    }
    if (android) return {
        webkit: t
      , android: t
      , mobile: t
      , version: ua.match(webkitVersion)[1]
    }
    if (safari) return {
        webkit: t
      , safari: t
      , version: ua.match(webkitVersion)[1]
    }
    if (opera) return {
        opera: t
      , version: ua.match(webkitVersion)[1]
    }
    if (gecko) {
      o = {
          gecko: t
        , mozilla: t
        , version: ua.match(/firefox\/(\d+(\.\d+)?)/i)[1]
      }
      if (firefox) o.firefox = t
      return o
    }
    if (seamonkey) return {
        seamonkey: t
      , version: ua.match(/seamonkey\/(\d+(\.\d+)?)/i)[1]
    }
  }

  var bowser = detect()

  // Graded Browser Support
  // http://developer.yahoo.com/yui/articles/gbs
  if ((bowser.msie && bowser.version >= 7) ||
      (bowser.chrome && bowser.version >= 10) ||
      (bowser.firefox && bowser.version >= 4.0) ||
      (bowser.safari && bowser.version >= 5) ||
      (bowser.opera && bowser.version >= 10.0)) {
    bowser.a = t;
  }

  else if ((bowser.msie && bowser.version < 7) ||
      (bowser.chrome && bowser.version < 10) ||
      (bowser.firefox && bowser.version < 4.0) ||
      (bowser.safari && bowser.version < 5) ||
      (bowser.opera && bowser.version < 10.0)) {
    bowser.c = t
  } else bowser.x = t

  return bowser
})
;(function(window, document, jQuery, undefined) {
  'use strict';

  var Editable = {};
var $ = (function() {
  return jQuery || function() {
    throw new Error('jQuery-like library not yet implemented');
  };
})();

var log, error;

// Allows for safe console logging
// If the last param is the string "trace" console.trace will be called
// configuration: disable with config.log = false
log = function() {
  if (config.log === false) { return; }

  var args, _ref;
  args = Array.prototype.slice.call(arguments);
  if (args.length) {
    if (args[args.length - 1] === "trace") {
      args.pop();
      if ((_ref = window.console) ? _ref.trace : void 0) {
        console.trace();
      }
    }
  }

  if (args.length === 1) {
    args = args[0];
  }

  if (window.console) {
    return console.log(args);
  }
};

// Allows for safe error logging
// Falls back to console.log if console.error is not available
error = function() {
  if (config.logErrors === false) { return; }

  var args;
  args = Array.prototype.slice.call(arguments);
  if (args.length === 1) {
    args = args[0];
  }

  if (window.console && typeof window.console.error === "function") {
    return console.error(args);
  } else if (window.console) {
    return console.log(args);
  }
};

var string = (function() {
  return {
    trimRight: function(text) {
      return text.replace(/\s+$/, '');
    },

    trimLeft: function(text) {
      return text.replace(/^\s+/, '');
    },

    trim: function(text) {
      return text.replace(/^\s+|\s+$/g, '');
    },

    isString: function(obj) {
      return toString.call(obj) === '[object String]';
    },

    /**
     * Turn any string into a regular expression.
     * This can be used to search or replace a string conveniently.
     */
    regexp: function(str, flags) {
      if (!flags) flags = 'g';
      var escapedStr = str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      return new RegExp(escapedStr, flags);
    }
  };
})();

/**
 * The Core module provides the Editable singleton that defines the Editable.JS
 * API and is the main entry point for Editable.JS.
 * It also provides the cursor module for cross-browser cursors, and the dom
 * submodule.
 *
 * @module core
 */

(function() {
  var isInitialized = false,
      editableSelector;

  var initialize = function() {
    if (!isInitialized) {
      isInitialized = true;
      editableSelector = '.' + config.editableClass;

      // make sure rangy is initialized. e.g Rangy doesn't initialize
      // when loaded after the document is ready.
      if (!rangy.initialized) {
        rangy.init();
      }

      dispatcher.setup();
    }
  };

  /**
   * Singleton for the Editable.JS API that is externally visible.
   * Note that the Editable literal is defined
   * first in editable.prefix in order for it to be the only externally visible
   * variable.
   *
   * @class Editable
   * @static
   */
  Editable = {
    /**
     * Initialzed Editable with a custom configuration
     */
    init: function(userConfiguration) {
      if (isInitialized) {
        error('Editable is already initialized');
        return;
      }

      $.extend(true, config, userConfiguration);
      initialize();
    },


    /**
     * Adds the Editable.JS API to the given target elements.
     * Opposite of {{#crossLink "Editable/remove"}}{{/crossLink}}.
     * Calls dispatcher.setup to setup all event listeners.
     *
     * @method add
     * @param {HTMLElement|Array(HTMLElement)|String} target A HTMLElement, an
     *    array of HTMLElement or a query selector representing the target where
     *    the API should be added on.
     * @param {Object} [elementConfiguration={}] Configuration options override.
     * @static
     * @chainable
     */
    add: function(target, elementConfiguration) {
      initialize();
      var elemConfig = $.extend(true, {}, config, elementConfiguration);
      // todo: store element configuration
      this.enable($(target));

      // todo: check css whitespace settings
      return this;
    },


    /**
     * Removes the Editable.JS API from the given target elements.
     * Opposite of {{#crossLink "Editable/add"}}{{/crossLink}}.
     *
     * @method remove
     * @param {HTMLElement|Array(HTMLElement)|String} target A HTMLElement, an
     *    array of HTMLElement or a query selector representing the target where
     *    the API should be removed from.
     * @static
     * @chainable
     */
    remove: function(target) {
      var $target = $(target);
      this.disable($target);
      $target.removeClass(config.editableDisabledClass);
      return this;
    },


    /**
     * Removes the Editable.JS API from the given target elements.
     * The target elements are marked as disabled.
     *
     * @method disable
     * @param { jQuery element | undefined  } target editable root element(s)
     *    If no param is specified all editables are disabled.
     * @static
     * @chainable
     */
    disable: function($elem) {
      $elem = $elem || $('.' + config.editableClass);
      $elem
        .removeAttr('contenteditable')
        .removeClass(config.editableClass)
        .addClass(config.editableDisabledClass);

      return this;
    },


    /**
     * Adds the Editable.JS API to the given target elements.
     *
     * @method enable
     * @param { jQuery element | undefined } target editable root element(s)
     *    If no param is specified all editables marked as disabled are enabled.
     * @static
     * @chainable
     */
    enable: function($elem) {
      $elem = $elem || $('.' + config.editableDisabledClass);
      $elem
        .attr('contenteditable', true)
        .removeClass(config.editableDisabledClass)
        .addClass(config.editableClass);

      $elem.each(function(index, el) {
        content.normalizeTags(el);
        content.normalizeSpaces(el);
      });

      return this;
    },

    /**
     * Set the cursor inside of an editable block.
     *
     * @method createCursor
     * @param position 'beginning', 'end', 'before', 'after'
     * @static
     */
    createCursor: function(element, position) {
      var cursor;
      var $host = $(element).closest(editableSelector);
      position = position || 'beginning';

      if ($host.length) {
        var range = rangy.createRange();

        if (position === 'beginning' || position === 'end') {
          range.selectNodeContents(element);
          range.collapse(position === 'beginning' ? true : false);
        } else if (element !== $host[0]) {
          if (position === 'before') {
            range.setStartBefore(element);
            range.setEndBefore(element);
          } else if (position === 'after') {
            range.setStartAfter(element);
            range.setEndAfter(element);
          }
        } else {
          error('EditableJS: cannot create cursor outside of an editable block.');
        }

        cursor = new Cursor($host[0], range);
      }

      return cursor;
    },

    createCursorAtBeginning: function(element) {
      this.createCursor(element, 'beginning');
    },

    createCursorAtEnd: function(element) {
      this.createCursor(element, 'end');
    },

    createCursorBefore: function(element) {
      this.createCursor(element, 'before');
    },

    createCursorAfter: function(element) {
      this.createCursor(element, 'after');
    },


    /**
     * Subscribe a callback function to a custom event fired by the API.
     * Opposite of {{#crossLink "Editable/off"}}{{/crossLink}}.
     *
     * @method on
     * @param {String} event The name of the event.
     * @param {Function} handler The callback to execute in response to the
     *     event.
     * @static
     * @chainable
     */
    on: function(event, handler) {
      initialize();
      // TODO throw error if event is not one of EVENTS
      // TODO throw error if handler is not a function
      dispatcher.addListener(event, handler);
      return this;
    },

    /**
     * Unsubscribe a callback function from a custom event fired by the API.
     * Opposite of {{#crossLink "Editable/on"}}{{/crossLink}}.
     *
     * @method off
     * @param {String} event The name of the event.
     * @param {Function|Boolean} handler The callback to remove from the
     *     event or the special value false to remove all callbacks.
     * @static
     * @chainable
     */
    off: function(event, handler) {
      // TODO throw error if event is not one of EVENTS
      // TODO if handler is flase remove all callbacks
      dispatcher.removeListener(event, handler);
      return this;
    },

    /**
     * Subscribe to the {{#crossLink "Editable/focus:event"}}{{/crossLink}}
     * event.
     *
     * @method focus
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    focus: function(handler) {
      return this.on('focus', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/blur:event"}}{{/crossLink}}
     * event.
     *
     * @method blur
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    blur: function(handler) {
      return this.on('blur', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/flow:event"}}{{/crossLink}}
     * event.
     *
     * @method flow
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    flow: function(handler) {
      return this.on('flow', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/selection:event"}}{{/crossLink}}
     * event.
     *
     * @method selection
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    selection: function(handler) {
      return this.on('selection', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/cursor:event"}}{{/crossLink}}
     * event.
     *
     * @method cursor
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    cursor: function(handler) {
      return this.on('cursor', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/newline:event"}}{{/crossLink}}
     * event.
     *
     * @method newline
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    newline: function(handler) {
      return this.on('newline', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/insert:event"}}{{/crossLink}}
     * event.
     *
     * @method insert
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    insert: function(handler) {
      return this.on('insert', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/split:event"}}{{/crossLink}}
     * event.
     *
     * @method split
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    split: function(handler) {
      return this.on('split', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/merge:event"}}{{/crossLink}}
     * event.
     *
     * @method merge
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    merge: function(handler) {
      return this.on('merge', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/empty:event"}}{{/crossLink}}
     * event.
     *
     * @method empty
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    empty: function(handler) {
      return this.on('empty', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/switch:event"}}{{/crossLink}}
     * event.
     *
     * @method switch
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    'switch': function(handler) {
      return this.on('switch', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/move:event"}}{{/crossLink}}
     * event.
     *
     * @method move
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    move: function(handler) {
      return this.on('move', handler);
    },

    /**
     * Subscribe to the {{#crossLink "Editable/clipboard:event"}}{{/crossLink}}
     * event.
     *
     * @method clipboard
     * @param {Function} handler The callback to execute in response to the
     *   event.
     * @static
     * @chainable
     */
    clipboard: function(handler) {
      return this.on('clipboard', handler);
    }
  };
})();

/**
 * The Behavior module defines the behavior triggered in response to the Editable.JS
 * events (see {{#crossLink "Editable"}}{{/crossLink}}).
 * The behavior can be overwritten by a user with Editable.init() or on
 * Editable.add() per element.
 *
 * @module core
 * @submodule behavior
 */


var behavior = (function() {
  /**
    * Singleton for the behavior module.
    * Provides default behavior of the Editable.JS API.
    *
    * @class Behavior
    * @static
    */
  return {
    focus: function(element) {
      log('Default focus behavior');
    },

    blur: function(element) {
      log('Default blur behavior');
      content.cleanInternals(element);
    },

    flow: function(element, action) {
      log('Default flow behavior');
    },

    selection: function(element, selection) {
      if (selection) {
        log('Default selection behavior');
      } else {
        log('Default selection empty behavior');
      }
    },

    cursor: function(element, cursor) {
      if (cursor) {
        log('Default cursor behavior');
      } else {
        log('Default cursor empty behavior');
      }
    },

    newline: function(element, cursor) {
      log(cursor);
      log('Default newline behavior');

      var atEnd = cursor.isAtEnd();
      var br = document.createElement('br');
      cursor.insertBefore(br);

      if(atEnd) {
        log('at the end');

        var noWidthSpace = document.createTextNode('\u200B');
        cursor.insertAfter(noWidthSpace);

        // var trailingBr = document.createElement('br');
        // trailingBr.setAttribute('type', '-editablejs');
        // cursor.insertAfter(trailingBr);

      } else {
        log('not at the end');
      }

      cursor.setSelection();
    },

    insert: function(element, direction, cursor) {
      log('Default insert ' + direction + ' behavior');
      var parent = element.parentNode;
      var newElement = element.cloneNode(false);
      if(newElement.id) newElement.removeAttribute('id');

      switch(direction) {
      case 'before':
        parent.insertBefore(newElement, element);
        element.focus();
        break;
      case 'after':
        parent.insertBefore(newElement, element.nextSibling);
        newElement.focus();
        break;
      }
    },

    split: function(element, before, after, cursor) {
      var parent = element.parentNode;
      var newStart = after.firstChild;
      parent.insertBefore(before, element);
      parent.replaceChild(after, element);
      content.normalizeTags(newStart);
      content.normalizeSpaces(newStart);
      newStart.focus();
    },

    merge: function(element, direction, cursor) {
      log('Default merge ' + direction + ' behavior');
      var container, merger, fragment, chunks, i, newChild, range;

      switch(direction) {
      case 'before':
        container = block.previous(element);
        merger = element;
        break;
      case 'after':
        container = element;
        merger = block.next(element);
        break;
      }

      if(!(container && merger))
        return;

      if(container.childNodes.length > 0)
        cursor.moveAtTextEnd(container);
      else
        cursor.moveAtBeginning(container);
      cursor.setSelection();

      fragment = document.createDocumentFragment();
      chunks = merger.childNodes;
      for(i = 0; i < chunks.length; i++) {
        fragment.appendChild(chunks[i].cloneNode(true));
      }
      newChild = container.appendChild(fragment);

      merger.parentNode.removeChild(merger);

      cursor.save();
      content.normalizeTags(container);
      content.normalizeSpaces(container);
      cursor.restore();
      cursor.setSelection();
    },

    empty: function(element) {
      log('Default empty behavior');
    },

    'switch': function(element, direction, cursor) {
      log('Default switch behavior');

      var next, previous;

      switch(direction) {
      case 'before':
        previous = block.previous(element);
        if (previous) {
          cursor.moveAtTextEnd(previous);
          cursor.setSelection();
        }
        break;
      case 'after':
        next = block.next(element);
        if (next) {
          cursor.moveAtBeginning(next);
          cursor.setSelection();
        }
        break;
      }
    },

    move: function(element, selection, direction) {
      log('Default move behavior');
    },

    clipboard: function(element, action, cursor) {
      log('Default clipboard behavior');
      var pasteHolder, sel;

      if(action !== 'paste') return;

      element.setAttribute(config.pastingAttribute, true);

      if(cursor.isSelection) {
        cursor = cursor.deleteContent();
      }

      pasteHolder = document.createElement('textarea');
      pasteHolder.setAttribute('style', 'position: absolute; left: -9999px');
      cursor.insertAfter(pasteHolder);
      sel = rangy.saveSelection();
      pasteHolder.focus();

      setTimeout(function() {
        var pasteValue, pasteElement, cursor;
        pasteValue = pasteHolder.value;
        element.removeChild(pasteHolder);

        rangy.restoreSelection(sel);
        cursor = selectionWatcher.forceCursor();
        pasteElement = document.createTextNode(pasteValue);
        content.normalizeSpaces(pasteElement);
        cursor.insertAfter(pasteElement);
        cursor.moveAfter(pasteElement);
        cursor.setSelection();

        element.removeAttribute(config.pastingAttribute);
      }, 0);
    }
  };
})();

var block = (function() {
  return {
    next: function(element) {
      var next = element.nextElementSibling;
      if(next && next.getAttribute('contenteditable')) return next;
      return null;
    },

    previous: function(element) {
      var previous = element.previousElementSibling;
      if(previous && previous.getAttribute('contenteditable')) return previous;
      return null;
    }
  };
})();


/**
 * Defines all supported event types by Editable.JS and provides default
 * implementations for them defined in {{#crossLink "Behavior"}}{{/crossLink}}
 *
 * @type {Object}
 */
var config = {
  log: false,
  logErrors: true,
  editableClass: 'js-editable',
  editableDisabledClass: 'js-editable-disabled',
  pastingAttribute: 'data-editable-is-pasting',
  mouseMoveSelectionChanges: false,
  boldTag: '<strong>',
  italicTag: '<em>',

  event: {
    /**
     * The focus event is triggered when an element gains focus.
     * The default behavior is to... TODO
     *
     * @event focus
     * @param {HTMLElement} element The element triggering the event.
     */
    focus: function(element) {
      behavior.focus(element);
    },

    /**
     * The blur event is triggered when an element looses focus.
     * The default behavior is to... TODO
     *
     * @event blur
     * @param {HTMLElement} element The element triggering the event.
     */
    blur: function(element) {
      behavior.blur(element);
    },

    /**
     * The flow event is triggered when the user starts typing or pause typing.
     * The default behavior is to... TODO
     *
     * @event flow
     * @param {HTMLElement} element The element triggering the event.
     * @param {String} action The flow action: "start" or "pause".
     */
    flow: function(element, action) {
      behavior.flow(element, action);
    },

    /**
     * The selection event is triggered after the user has selected some
     * content.
     * The default behavior is to... TODO
     *
     * @event selection
     * @param {HTMLElement} element The element triggering the event.
     * @param {Selection} selection The actual Selection object.
     */
    selection: function(element, selection) {
      behavior.selection(element, selection);
    },

    /**
     * The cursor event is triggered after cursor position has changed.
     * The default behavior is to... TODO
     *
     * @event cursor
     * @param {HTMLElement} element The element triggering the event.
     * @param {Cursor} cursor The actual Cursor object.
     */
    cursor: function(element, cursor) {
      behavior.cursor(element, cursor);
    },

    /**
     * The newline event is triggered when a newline should be inserted. This
     * happens when SHIFT+ENTER key is pressed.
     * The default behavior is to add a <br />
     *
     * @event newline
     * @param {HTMLElement} element The element triggering the event.
     * @param {Cursor} cursor The actual cursor object.
     */
    newline: function(element, cursor) {
      behavior.newline(element, cursor);
    },

    /**
     * The split event is triggered when a block should be splitted into two
     * blocks. This happens when ENTER is pressed within a non-empty block.
     * The default behavior is to... TODO
     *
     * @event split
     * @param {HTMLElement} element The element triggering the event.
     * @param {String} before The HTML string before the split.
     * @param {String} after The HTML string after the split.
     * @param {Cursor} cursor The actual cursor object.
     */
    split: function(element, before, after, cursor) {
      behavior.split(element, before, after, cursor);
    },


    /**
     * The insert event is triggered when a new block should be inserted. This
     * happens when ENTER key is pressed at the beginning of a block (should
     * insert before) or at the end of a block (should insert after).
     * The default behavior is to... TODO
     *
     * @event insert
     * @param {HTMLElement} element The element triggering the event.
     * @param {String} direction The insert direction: "before" or "after".
     * @param {Cursor} cursor The actual cursor object.
     */
    insert: function(element, direction, cursor) {
      behavior.insert(element, direction, cursor);
    },


    /**
     * The merge event is triggered when two needs to be merged. This happens
     * when BACKSPACE is pressed at the beginning of a block (should merge with
     * the preceeding block) or DEL is pressed at the end of a block (should
     * merge with the following block).
     * The default behavior is to... TODO
     *
     * @event merge
     * @param {HTMLElement} element The element triggering the event.
     * @param {String} direction The merge direction: "before" or "after".
     * @param {Cursor} cursor The actual cursor object.
     */
    merge: function(element, direction, cursor) {
      behavior.merge(element, direction, cursor);
    },

    /**
     * The empty event is triggered when a block is emptied.
     * The default behavior is to... TODO
     *
     * @event empty
     * @param {HTMLElement} element The element triggering the event.
     */
    empty: function(element) {
      behavior.empty(element);
    },

    /**
     * The switch event is triggered when the user switches to another block.
     * This happens when an ARROW key is pressed near the boundaries of a block.
     * The default behavior is to... TODO
     *
     * @event switch
     * @param {HTMLElement} element The element triggering the event.
     * @param {String} direction The switch direction: "before" or "after".
     * @param {Cursor} cursor The actual cursor object.*
     */
    'switch': function(element, direction, cursor) {
      behavior.switch(element, direction, cursor);
    },

    /**
     * The move event is triggered when the user moves a selection in a block.
     * This happens when the user selects some (or all) content in a block and
     * an ARROW key is pressed (up: drag before, down: drag after).
     * The default behavior is to... TODO
     *
     * @event move
     * @param {HTMLElement} element The element triggering the event.
     * @param {Selection} selection The actual Selection object.
     * @param {String} direction The move direction: "before" or "after".
     */
    move: function(element, selection, direction) {
      behavior.move(element, selection, direction);
    },

    /**
     * The clipboard event is triggered when the user copies, pastes or cuts
     * a selection within a block.
     * The default behavior is to... TODO
     *
     * @event clipboard
     * @param {HTMLElement} element The element triggering the event.
     * @param {String} action The clipboard action: "copy", "paste", "cut".
     * @param {Cursor} cursor The actual cursor object.
     */
    clipboard: function(element, action, cursor) {
      behavior.clipboard(element, action, cursor);
    }
  }
};


var content = (function() {

  var restoreRange = function(host, range, func) {
    range = rangeSaveRestore.save(range);
    func.call(content);
    return rangeSaveRestore.restore(host, range);
  };

  return {
    /**
     * Remove empty tags and merge consecutive tags (they must have the same
     * attributes).
     *
     * @method normalizeTags
     * @param  {HTMLElement} element The element to process.
     */
    normalizeTags: function(element) {
      var i, j, node, sibling;

      var fragment = document.createDocumentFragment();

      for (i = 0; i < element.childNodes.length; i++) {
        node = element.childNodes[i];
        if(!node) continue;

        // skip empty tags, so they'll get removed
        if(node.nodeName !== 'BR' && !node.textContent) continue;

        if(node.nodeType === 1 && node.nodeName !== 'BR') {
          sibling = node;
          while((sibling = sibling.nextSibling) !== null) {
            if(!parser.isSameNode(sibling, node))
              break;

            for(j = 0; j < sibling.childNodes.length; j++) {
              node.appendChild(sibling.childNodes[j].cloneNode(true));
            }

            sibling.parentNode.removeChild(sibling);
          }

          this.normalizeTags(node);
        }

        fragment.appendChild(node.cloneNode(true));
      }

      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      element.appendChild(fragment);
    },

    /**
     * Clean the element from character, tags, etc... added by the plugin logic.
     *
     * @method cleanInternals
     * @param  {HTMLElement} element The element to process.
     */
    cleanInternals: function(element) {
      element.innerHTML = element.innerHTML.replace(/\u200B/g, '<br />');
    },

    /**
     * Convert the first and last space to a non breaking space charcter to
     * prevent visual collapse by some browser.
     *
     * @method normalizeSpaces
     * @param  {HTMLElement} element The element to process.
     */
    normalizeSpaces: function(element) {
      var nonBreakingSpace = '\u00A0';

      if(!element) return;

      if(element.nodeType === 3) {
        element.nodeValue = element.nodeValue.replace(/^(\s)/, nonBreakingSpace).replace(/(\s)$/, nonBreakingSpace);
      }
      else {
        this.normalizeSpaces(element.firstChild);
        this.normalizeSpaces(element.lastChild);
      }
    },

    /**
     * Get all tags that start or end inside the range
     */
    getTags: function(host, range, filterFunc) {
      var tags = this.getInnerTags(range, filterFunc);

      // get all tags that surround the range
      var node = range.commonAncestorContainer;
      while (node !== host) {
        if (!filterFunc || filterFunc(node)) {
          tags.push(node);
        }
        node = node.parentNode;
      }
      return tags;
    },

    getTagsByName: function(host, range, tagName) {
      return this.getTags(host, range, function(node) {
        return node.nodeName === tagName.toUpperCase();
      });
    },

    /**
     * Get all tags that start or end inside the range
     */
    getInnerTags: function(range, filterFunc) {
      return range.getNodes([1], filterFunc);
    },

    /**
     * Transform an array of elements into a an array
     * of tagnames in uppercase
     *
     * @return example: ['STRONG', 'B']
     */
    getTagNames: function(elements) {
      var names = [];
      if (!elements) return names;

      for (var i = 0; i < elements.length; i++) {
        names.push(elements[i].nodeName);
      }
      return names;
    },

    isAffectedBy: function(host, range, tagName) {
      var elem;
      var tags = this.getTags(host, range);
      for (var i = 0; i < tags.length; i++) {
        elem = tags[i];
        if (elem.nodeName === tagName.toUpperCase()) {
          return true;
        }
      }

      return false;
    },

    /**
     * Check if the range selects all of the elements contents,
     * not less or more.
     *
     * @param visible: Only compare visible text. That way it does not
     *   matter if the user selects an additional whitespace or not.
     */
    isExactSelection: function(range, elem, visible) {
      var elemRange = rangy.createRange();
      elemRange.selectNodeContents(elem);
      if (range.intersectsRange(elemRange)) {
        var rangeText = range.toString();
        var elemText = $(elem).text();

        if (visible) {
          rangeText = string.trim(rangeText);
          elemText = string.trim(elemText);
        }

        return rangeText !== '' && rangeText === elemText;
      } else {
        return false;
      }
    },

    expandTo: function(host, range, elem) {
      range.selectNodeContents(elem);
      return range;
    },

    toggleTag: function(host, range, elem) {
      var elems = this.getTagsByName(host, range, elem.nodeName);

      if (elems.length === 1 &&
          this.isExactSelection(range, elems[0], 'visible')) {
        return this.removeFormatting(host, range, elem.nodeName);
      }

      return this.forceWrap(host, range, elem);
    },

    isWrappable: function(range) {
      return range.canSurroundContents();
    },

    forceWrap: function(host, range, elem) {
      range = restoreRange(host, range, function(){
        this.nuke(host, range, elem.nodeName);
      });

      // remove all tags if the range is not wrappable
      if (!this.isWrappable(range)) {
        range = restoreRange(host, range, function(){
          this.nuke(host, range);
        });
      }

      this.wrap(range, elem);
      return range;
    },

    wrap: function(range, elem) {
      elem = string.isString(elem) ?
        $(elem)[0] :
        elem;

      if(this.isWrappable(range)) {
        var a = range.surroundContents(elem);
      } else {
        console.log('content.wrap(): can not surround range');
      }
    },

    unwrap: function(elem) {
      $(elem).contents().unwrap();
    },

    removeFormatting: function(host, range, tagName) {
      return restoreRange(host, range, function(){
        this.nuke(host, range, tagName);
      });
    },

    /**
     * Unwrap all tags this range is affected by.
     * Can also affect content outside of the range.
     */
    nuke: function(host, range, tagName) {
      var tags = this.getTags(host, range);
      for (var i = 0; i < tags.length; i++) {
        var elem = tags[i];
        if ( !tagName || elem.nodeName === tagName.toUpperCase() ) {
          this.unwrap(elem);
        }
      }
    },

    /**
     * Insert a single character (or string) before or after the
     * the range.
     */
    insertCharacter: function(range, character, atStart) {
      var insertEl = document.createTextNode(character);

      var boundaryRange = range.cloneRange();
      boundaryRange.collapse(atStart);
      boundaryRange.insertNode(insertEl);
      boundaryRange.detach();

      if (atStart) {
        range.setStartBefore(insertEl);
      } else {
        range.setEndAfter(insertEl);
      }
      range.normalizeBoundaries();
    },

    /**
     * Surround the range with characters like start and end quotes.
     *
     * @method surround
     */
    surround: function(host, range, startCharacter, endCharacter) {
      if (!endCharacter) endCharacter = startCharacter;
      this.insertCharacter(range, endCharacter, false);
      this.insertCharacter(range, startCharacter, true);
      return range;
    },

    /**
     * Removes a character from the text within a range.
     *
     * @method deleteCharacter
     */
    deleteCharacter: function(host, range, character) {
      if (this.containsString(range, character)) {
        range.splitBoundaries();
        range = restoreRange(host, range, function() {
          var charRegexp = string.regexp(character);

          var textNodes = range.getNodes([3], function(node) {
            return node.nodeValue.search(charRegexp) >= 0;
          });

          for(var i = 0; i < textNodes.length; i++) {
            var node = textNodes[i];
            node.nodeValue = node.nodeValue.replace(charRegexp, '');
          }
        });
        range.normalizeBoundaries();
      }

      return range;
    },

    containsString: function(range, str) {
      var text = range.toString();
      return text.indexOf(str) >= 0;
    },

    /**
     * Unwrap all tags this range is affected by.
     * Can also affect content outside of the range.
     */
    nukeTag: function(host, range, tagName) {
      var tags = this.getTags(host, range);
      for (var i = 0; i < tags.length; i++) {
        var elem = tags[i];
        if (elem.nodeName === tagName)
          this.unwrap(elem);
      }
    }
  };
})();

/**
 * The Cursor module provides a cross-browser abstraction layer for cursor.
 *
 * @module core
 * @submodule cursor
 */

var Cursor = (function() {

  /**
   * Class for the Cursor module.
   *
   * @class Cursor
   * @constructor
   */
  var Cursor = function(editableHost, rangyRange) {
    this.host = editableHost;
    this.range = rangyRange;
    this.isCursor = true;
  };

  Cursor.prototype = (function() {
    return {
      isAtEnd: function() {
        return parser.isEndOfHost(
          this.host,
          this.range.endContainer,
          this.range.endOffset);
      },

      isAtTextEnd: function() {
        return parser.isTextEndOfHost(
          this.host,
          this.range.endContainer,
          this.range.endOffset);
      },

      isAtBeginning: function() {
        return parser.isBeginningOfHost(
          this.host,
          this.range.startContainer,
          this.range.startOffset);
      },

      /**
       * Insert content before the cursor
       *
       * @param DOM node or document fragment
       */
      insertBefore: function(element) {
        if (parser.isDocumentFragmentWithoutChildren(element)) return;

        var preceedingElement = element;
        if (element.nodeType === 11) { // DOCUMENT_FRAGMENT_NODE
          var lastIndex = element.childNodes.length - 1;
          preceedingElement = element.childNodes[lastIndex];
        }

        this.range.insertNode(element);
        this.range.setStartAfter(preceedingElement);
        this.range.setEndAfter(preceedingElement);
      },

      /**
       * Insert content after the cursor
       *
       * @param DOM node or document fragment
       */
      insertAfter: function(element) {
        if (parser.isDocumentFragmentWithoutChildren(element)) return;
        this.range.insertNode(element);
      },

      setSelection: function() {
        rangy.getSelection().setSingleRange(this.range);
      },

      before: function() {
        var fragment = null;
        var range = this.range.cloneRange();
        range.setStartBefore(this.host);
        fragment = range.cloneContents();
        range.detach();
        return fragment;
      },

      after: function() {
        var fragment = null;
        var range = this.range.cloneRange();
        range.setEndAfter(this.host);
        fragment = range.cloneContents();
        range.detach();
        return fragment;
      },

      /**
       * Get the BoundingClientRect of the cursor.
       * The returned values are absolute to document.body.
       */
      getCoordinates: function() {
        var coords = this.range.nativeRange.getBoundingClientRect();

        // code from mdn: https://developer.mozilla.org/en-US/docs/Web/API/window.scrollX
        var x = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
        var y = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

        // translate into absolute positions
        return {
          top: coords.top + y,
          bottom: coords.bottom + y,
          left: coords.left + x,
          right: coords.right + x,
          height: coords.height,
          width: coords.width
        };
      },

      detach: function() {
        this.range.detach();
      },

      moveBefore: function(element) {
        this.setHost(element);
        this.range.setStartBefore(element);
        this.range.setEndBefore(element);
        if (this.isSelection) return new Cursor(this.host, this.range);
      },

      moveAfter: function(element) {
        this.setHost(element);
        this.range.setStartAfter(element);
        this.range.setEndAfter(element);
        if (this.isSelection) return new Cursor(this.host, this.range);
      },

      moveAtBeginning: function(element) {
        if (!element) element = this.host;
        this.setHost(element);
        this.range.selectNodeContents(element);
        this.range.collapse(true);
        if (this.isSelection) return new Cursor(this.host, this.range);
      },

      moveAtEnd: function(element) {
        if (!element) element = this.host;
        this.setHost(element);
        this.range.selectNodeContents(element);
        this.range.collapse(false);
        if (this.isSelection) return new Cursor(this.host, this.range);
      },

      moveAtTextEnd: function(element) {
        return this.moveAtEnd(parser.latestChild(element));
      },

      setHost: function(element) {
        this.host = parser.getHost(element);
        if (!this.host) {
          error('Can not set cursor outside of an editable block');
        }
      },

      save: function() {
        this.savedRangeInfo = rangeSaveRestore.save(this.range);
        this.savedRangeInfo.host = this.host;
      },

      restore: function() {
        if (this.savedRangeInfo) {
          this.host = this.savedRangeInfo.host;
          this.range = rangeSaveRestore.restore(this.host, this.savedRangeInfo);
          this.savedRangeInfo = undefined;
        } else {
          error('Could not restore selection');
        }
      },

      equals: function(cursor) {
        if(!cursor) return false;

        if(!cursor.host) return false;
        if(!cursor.host.isEqualNode(this.host)) return false;

        if(!cursor.range) return false;
        if(!cursor.range.equals(this.range)) return false;

        return true;
      }
    };
  })();

  return Cursor;
})();


/**
 * The Dispatcher module is responsible for dealing with events and their handlers.
 *
 * @module core
 * @submodule dispatcher
 */

var dispatcher = (function() {
  /**
   * Contains the list of event listeners grouped by event type.
   *
   * @private
   * @type {Object}
   */
  var listeners = {},
      editableSelector;

  /**
   * Sets up events that are triggered on modifying an element.
   *
   * @method setupElementEvents
   * @param {HTMLElement} $document: The document element.
   * @param {Function} notifier: The callback to be triggered when the event is caught.
   */
  var setupElementEvents = function($document, notifier) {
    $document.on('focus.editable', editableSelector, function(event) {
      if(this.getAttribute(config.pastingAttribute)) return;
      notifier('focus', this);
    }).on('blur.editable', editableSelector, function(event) {
      if(this.getAttribute(config.pastingAttribute)) return;
      notifier('blur', this);
    }).on('copy.editable', editableSelector, function(event) {
      log('Copy');
      notifier('clipboard', this, 'copy', selectionWatcher.getFreshSelection());
    }).on('cut.editable', editableSelector, function(event) {
      log('Cut');
      notifier('clipboard', this, 'cut', selectionWatcher.getFreshSelection());
    }).on('paste.editable', editableSelector, function(event) {
      log('Paste');
      notifier('clipboard', this, 'paste', selectionWatcher.getFreshSelection());
    });
  };

  /**
   * Sets up events that are triggered on keyboard events.
   * Keyboard definitions are in {{#crossLink "Keyboard"}}{{/crossLink}}.
   *
   * @method setupKeyboardEvents
   * @param {HTMLElement} $document: The document element.
   * @param {Function} notifier: The callback to be triggered when the event is caught.
   */
  var setupKeyboardEvents = function($document, notifier) {
    var dispatchSwitchEvent = function(event, element, direction) {
      var cursor;

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;

      cursor = selectionWatcher.getSelection();
      if (!cursor || cursor.isSelection) return;

      // Detect if the browser moved the cursor in the next tick.
      // If the cursor stays at its position, fire the switch event.
      setTimeout(function() {
        var newCursor = selectionWatcher.forceCursor();
        if (newCursor.equals(cursor)) {
          event.preventDefault();
          event.stopPropagation();
          notifier('switch', element, direction, newCursor);
        }
      }, 1);
    };

    $document.on('keydown.editable', editableSelector, function(event) {
      keyboard.dispatchKeyEvent(event, this);
    });

    keyboard.on('left', function(event) {
      log('Left key pressed');
      dispatchSwitchEvent(event, this, 'before');
    }).on('up', function(event) {
      log('Up key pressed');
      dispatchSwitchEvent(event, this, 'before');
    }).on('right', function(event) {
      log('Right key pressed');
      dispatchSwitchEvent(event, this, 'after');
    }).on('down', function(event) {
      log('Down key pressed');
      dispatchSwitchEvent(event, this, 'after');
    }).on('tab', function(event) {
      log('Tab key pressed');
    }).on('shiftTab', function(event) {
      log('Shift+Tab key pressed');
    }).on('esc', function(event) {
      log('Esc key pressed');
    }).on('backspace', function(event) {
      log('Backspace key pressed');

      var range = selectionWatcher.getFreshRange();
      if (range.isCursor) {
        var cursor = range.getCursor();
        if ( cursor.isAtBeginning() ) {
          event.preventDefault();
          event.stopPropagation();
          notifier('merge', this, 'before', cursor);
        }
      }
    }).on('delete', function(event) {
      log('Delete key pressed');

      var range = selectionWatcher.getFreshRange();
      if (range.isCursor) {
        var cursor = range.getCursor();
        if(cursor.isAtTextEnd()) {
          event.preventDefault();
          event.stopPropagation();
          notifier('merge', this, 'after', cursor);
        }
      }
    }).on('enter', function(event) {
      log('Enter key pressed');

      event.preventDefault();
      event.stopPropagation();
      var range = selectionWatcher.getFreshRange();
      var cursor = range.forceCursor();

      if (cursor.isAtTextEnd()) {
        notifier('insert', this, 'after', cursor);
      } else if(cursor.isAtBeginning()) {
        notifier('insert', this, 'before', cursor);
      } else {
        notifier('split', this, cursor.before(), cursor.after(), cursor);
      }

    }).on('shiftEnter', function(event) {
      log('Shift+Enter key pressed');
      event.preventDefault();
      event.stopPropagation();
      var cursor = selectionWatcher.forceCursor();
      notifier('newline', this, cursor);
    });
  };

  /**
   * Sets up events that are triggered on a selection change.
   *
   * @method setupSelectionChangeEvents
   * @param {HTMLElement} $document: The document element.
   * @param {Function} notifier: The callback to be triggered when the event is caught.
   */
  var setupSelectionChangeEvents = function($document, notifier) {
    var selectionDirty = false;
    var suppressSelectionChanges = false;

    // fires on mousemove (thats probably a bit too much)
    // catches changes like 'select all' from context menu
    $document.on('selectionchange.editable', function(event) {
      if (suppressSelectionChanges) {
        selectionDirty = true;
      } else {
        notifier();
      }
    });

    // listen for selection changes by mouse so we can
    // suppress the selectionchange event and only fire the
    // change event on mouseup
    $document.on('mousedown.editable', editableSelector, function(event) {
      if (config.mouseMoveSelectionChanges === false) {
        suppressSelectionChanges = true;

        // Without this timeout the previous selection is active
        // until the mouseup event (no. not good).
        setTimeout(notifier, 0);
      }

      $document.on('mouseup.editableSelection', function(event) {
        $document.off('.editableSelection');
        suppressSelectionChanges = false;

        if (selectionDirty) {
          selectionDirty = false;
          notifier();
        }
      });
    });
  };

  /**
   * Fallback solution to support selection change events on browsers that don't
   * support selectionChange.
   *
   * @method setupSelectionChangeFallback
   * @param {HTMLElement} $document: The document element.
   * @param {Function} notifier: The callback to be triggered when the event is caught.
   */
  var setupSelectionChangeFallback = function($document, notifier) {
    // listen for selection changes by mouse
    $document.on('mouseup.editableSelection', function(event) {

      // In Opera when clicking outside of a block
      // it does not update the selection as it should
      // without the timeout
      setTimeout(notifier, 0);
    });

    // listen for selection changes by keys
    $document.on('keyup.editable', editableSelector, function(event) {

      // when pressing Command + Shift + Left for example the keyup is only triggered
      // after at least two keys are released. Strange. The culprit seems to be the
      // Command key. Do we need a workaround?
      notifier();
    });
  };

  return {
    addListener: function(event, listener) {
      if (listeners[event] === undefined) {
        listeners[event] = [];
      }

      listeners[event].unshift(listener);
    },

    removeListener: function(event, listener) {
      var eventListeners = listeners[event];
      if (eventListeners === undefined) return;

      for (var i=0, len=eventListeners.length; i < len; i++) {
        if (eventListeners[i] === listener){
          eventListeners.splice(i, 1);
          break;
        }
      }
    },

    notifyListeners: function(event) {
      var eventListeners = listeners[event];
      if (eventListeners === undefined) return;

      for (var i=0, len=eventListeners.length; i < len; i++) {
        if(eventListeners[i].apply(
            Editable,
            Array.prototype.slice.call(arguments).splice(1)
        ) === false)
          break;
      }
    },

    /**
     * Sets up all events that Editable.JS is catching.
     *
     * @method setup
     */
    setup: function() {

      var $document = $(document);
      var eventType = null;
      editableSelector = '.' + config.editableClass;

      listeners = {};
      // TODO check the config.event object to prevent
      // registering invalid handlers
      for(eventType in config.event) {
        this.addListener(eventType, config.event[eventType]);
      }

      // setup all events notifications
      setupElementEvents($document, this.notifyListeners);
      setupKeyboardEvents($document, this.notifyListeners);

      // cache selectionChanged function for simplicity
      var selectionChanged = selectionWatcher.selectionChanged;

      if (browserFeatures.selectionchange) {
        setupSelectionChangeEvents($document, selectionChanged);
      } else {
        setupSelectionChangeFallback($document, selectionChanged);
      }
    }
  };
})();

var browserFeatures = (function() {
  /**
   * Check for contenteditable support
   *
   * (from Modernizr)
   * this is known to false positive in some mobile browsers
   * here is a whitelist of verified working browsers:
   * https://github.com/NielsLeenheer/html5test/blob/549f6eac866aa861d9649a0707ff2c0157895706/scripts/engine.js#L2083
   */
  var contenteditable = typeof document.documentElement.contentEditable !== 'undefined';

  /**
   * Check selectionchange event (currently supported in IE, Chrome and Safari)
   *
   * To handle selectionchange in firefox see CKEditor selection object
   * https://github.com/ckeditor/ckeditor-dev/blob/master/core/selection.js#L388
   */
  var selectionchange = (function() {

    // not exactly feature detection... is it?
    return !(bowser.gecko || bowser.opera);
  })();


  return {
    contenteditable: contenteditable,
    selectionchange: selectionchange
  };

})();

jQuery.fn.editable = function(add) {
  if (add === undefined || add) {
    Editable.add(this);
  } else {
    Editable.remove(this);
  }

  return this;
};

/**
 * The Keyboard module defines an event API for key events.
 * @module core
 * @submodule keyboard
 */

var keyboard = (function() {
  var key = {
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    tab: 9,
    esc: 27,
    backspace: 8,
    'delete': 46,
    enter: 13
  };

  var listeners = {};

  var addListener = function(event, listener) {
    if (listeners[event] === undefined) {
      listeners[event] = [];
    }

    listeners[event].push(listener);
  };

  var notifyListeners = function(event, context) {
    var eventListeners = listeners[event];
    if (eventListeners === undefined) return;

    for (var i=0, len=eventListeners.length; i < len; i++) {
      if(eventListeners[i].apply(
          context,
          Array.prototype.slice.call(arguments).splice(2)
      ) === false)
        break;
    }
  };

  /**
   * Singleton that defines its own API for keyboard events and dispatches
   * keyboard events from the browser to this API.
   * The keyboard API events are handled by {{#crossLink "Dispatcher"}}{{/crossLink}}.
   * @class Keyboard
   * @static
   */
  return {
    dispatchKeyEvent: function(event, target) {
      switch (event.keyCode) {

      case key.left:
        notifyListeners('left', target, event);
        break;

      case key.right:
        notifyListeners('right', target, event);
        break;

      case key.up:
        notifyListeners('up', target, event);
        break;

      case key.down:
        notifyListeners('down', target, event);
        break;

      case key.tab:
        if (event.shiftKey) {
          notifyListeners('shiftTab', target, event);
        } else {
          notifyListeners('tab', target, event);
        }
        break;

      case key.esc:
        notifyListeners('esc', target, event);
        break;

      case key.backspace:
        notifyListeners('backspace', target, event);
        break;

      case key['delete']:
        notifyListeners('delete', target, event);
        break;

      case key.enter:
        if (event.shiftKey) {
          notifyListeners('shiftEnter', target, event);
        } else {
          notifyListeners('enter', target, event);
        }
        break;

      }
    },

    on: function(event, handler) {
      addListener(event, handler);
      return this;
    },

    // export key-codes for testing
    key: key
  };
})();

/**
 * The parser module provides helper methods to parse html-chunks
 * manipulations and helpers for common tasks.
 *
 * @module core
 * @submodule parser
 */


/** DOM NODE TYPES:
  *
  * 'ELEMENT_NODE': 1
  * 'ATTRIBUTE_NODE': 2
  * 'TEXT_NODE': 3
  * 'CDATA_SECTION_NODE': 4
  * 'ENTITY_REFERENCE_NODE': 5
  * 'ENTITY_NODE': 6
  * 'PROCESSING_INSTRUCTION_NODE': 7
  * 'COMMENT_NODE': 8
  * 'DOCUMENT_NODE': 9
  * 'DOCUMENT_TYPE_NODE': 10
  * 'DOCUMENT_FRAGMENT_NODE': 11
  * 'NOTATION_NODE': 12
  */

var parser = (function() {
  /**
   * Singleton that provides DOM lookup helpers.
   * @class Parser
   * @static
   */
  return {

    /**
     * Get the editableJS host block of a node.
     *
     * @method getHost
     * @param {DOM Node}
     * @return {DOM Node}
     */
    getHost: function(node) {
      var editableSelector = '.' + config.editableClass;
      var hostNode = $(node).closest(editableSelector);
      return hostNode.length ? hostNode[0] : undefined;
    },

    /**
     * Get the index of a node.
     * So that parent.childNodes[ getIndex(node) ] would return the node again
     *
     * @method getNodeIndex
     * @param {HTMLElement}
     */
    getNodeIndex: function(node) {
      var index = 0;
      while ((node = node.previousSibling) !== null) {
        index += 1;
      }
      return index;
    },

    /**
     * Check if node contains text or element nodes
     * whitespace counts too!
     *
     * @method isVoid
     * @param {HTMLElement}
     */
    isVoid: function(node) {
      var child, i, len;
      var childNodes = node.childNodes;

      for (i = 0, len = childNodes.length; i < len; i++) {
        child = childNodes[i];

        if (child.nodeType === 3 && !this.isVoidTextNode(child)) {
          return false;
        } else if (child.nodeType === 1) {
          return false;
        }
      }
      return true;
    },

    /**
     * Check if node is a text node and completely empty without any whitespace
     *
     * @method isVoidTextNode
     * @param {HTMLElement}
     */
    isVoidTextNode: function(node) {
      return node.nodeType === 3 && !node.nodeValue;
    },

    /**
     * Check if node is a text node and contains nothing but whitespace
     *
     * @method isWhitespaceOnly
     * @param {HTMLElement}
     */
    isWhitespaceOnly: function(node) {
      return node.nodeType === 3 && this.lastOffsetWithContent(node) === 0;
    },

    isLinebreak: function(node) {
      return node.nodeType === 1 && node.tagName === 'BR';
    },

    /**
     * Returns the last offset where the cursor can be positioned to
     * be at the visible end of its container.
     * Currently works only for empty text nodes (not empty tags)
     *
     * @method isWhitespaceOnly
     * @param {HTMLElement}
     */
    lastOffsetWithContent: function(node) {
      if (node.nodeType === 3) {
        return string.trimRight(node.nodeValue).length;
      } else {
        var i,
            childNodes = node.childNodes;

        for (i = childNodes.length - 1; i >= 0; i--) {
          node = childNodes[i];
          if (this.isWhitespaceOnly(node) || this.isLinebreak(node)) {
            continue;
          } else {
            // The offset starts at 0 before the first element
            // and ends with the length after the last element.
            return i + 1;
          }
        }
        return 0;
      }
    },

    isBeginningOfHost: function(host, container, offset) {
      if (container === host) {
        return this.isStartOffset(container, offset);
      }

      if (this.isStartOffset(container, offset)) {
        var parentContainer = container.parentNode;

        // The index of the element simulates a range offset
        // right before the element.
        var offsetInParent = this.getNodeIndex(container);
        return this.isBeginningOfHost(host, parentContainer, offsetInParent);
      } else {
        return false;
      }
    },

    isEndOfHost: function(host, container, offset) {
      if (container === host) {
        return this.isEndOffset(container, offset);
      }

      if (this.isEndOffset(container, offset)) {
        var parentContainer = container.parentNode;

        // The index of the element plus one simulates a range offset
        // right after the element.
        var offsetInParent = this.getNodeIndex(container) + 1;
        return this.isEndOfHost(host, parentContainer, offsetInParent);
      } else {
        return false;
      }
    },

    isStartOffset: function (container, offset) {
      if (container.nodeType === 3) {
        return offset === 0;
      } else {
        if(container.childNodes.length === 0)
          return true;
        else
          return container.childNodes[offset] === container.firstChild;
      }
    },

    isEndOffset: function (container, offset) {
      if (container.nodeType === 3) {
        return offset === container.length;
      } else {
        if(container.childNodes.length === 0)
          return true;
        else if (offset > 0)
          return container.childNodes[offset - 1] === container.lastChild;
        else
          return false;
      }
    },

    isTextEndOfHost: function(host, container, offset) {
      if (container === host) {
        return this.isTextEndOffset(container, offset);
      }

      if (this.isTextEndOffset(container, offset)) {
        var parentContainer = container.parentNode;

        // The index of the element plus one simulates a range offset
        // right after the element.
        var offsetInParent = this.getNodeIndex(container) + 1;
        return this.isTextEndOfHost(host, parentContainer, offsetInParent);
      } else {
        return false;
      }
    },

    isTextEndOffset: function (container, offset) {
      if (container.nodeType === 3) {
        var text = string.trimRight(container.nodeValue);
        return offset >= text.length;
      } else if (container.childNodes.length === 0) {
        return true;
      } else {
        var lastOffset = this.lastOffsetWithContent(container);
        return offset >= lastOffset;
      }
    },

    isSameNode: function(target, source) {
      var i, len, attr;

      if(target.nodeType !== source.nodeType)
        return false;

      if(target.nodeName !== source.nodeName)
        return false;

      for(i = 0, len = target.attributes.length; i < len; i++) {
        attr = target.attributes[i];
        if(source.getAttribute(attr.name) !== attr.value)
          return false;
      }

      return true;
    },

    /**
     * Return the deepest last child of a node.
     *
     * @method  latestChild
     * @param  {HTMLElement} container The container to iterate on.
     * @return {HTMLElement}           THe deepest last child in the container.
     */
    latestChild: function(container) {
      if(container.lastChild)
        return this.latestChild(container.lastChild);
      else
        return container;
    },

    /**
     * Checks if a documentFragment has no children.
     * Fragments without children can cause errors if inserted into ranges.
     *
     * @method  isDocumentFragmentWithoutChildren
     * @param  {HTMLElement} DOM node.
     * @return {Boolean}
     */
    isDocumentFragmentWithoutChildren: function(fragment) {
      if (fragment &&
          fragment.nodeType === 11 &&
          fragment.childNodes.length === 0) {
        return true;
      }
      return false;
    }
  };
})();

/** RangeContainer
 *
 * primarily used to compare ranges
 * its designed to work with undefined ranges as well
 * so we can easily compare them without checking for undefined
 * all the time
 */
var RangeContainer = function(editableHost, rangyRange) {
  this.host = editableHost && editableHost.jquery ?
    editableHost[0] :
    editableHost;
  this.range = rangyRange;
  this.isAnythingSelected = (rangyRange !== undefined);
  this.isCursor = (this.isAnythingSelected && rangyRange.collapsed);
  this.isSelection = (this.isAnythingSelected && !this.isCursor);
};

RangeContainer.prototype.getCursor = function() {
  if (this.isCursor) {
    return new Cursor(this.host, this.range);
  }
};

RangeContainer.prototype.getSelection = function() {
  if (this.isSelection) {
    return new Selection(this.host, this.range);
  }
};

RangeContainer.prototype.forceCursor = function() {
  if (this.isSelection) {
    var selection = this.getSelection();
    return selection.deleteContent();
  } else {
    return this.getCursor();
  }
};

RangeContainer.prototype.isDifferentFrom = function(otherRangeContainer) {
  otherRangeContainer = otherRangeContainer || new RangeContainer();
  var self = this.range;
  var other = otherRangeContainer.range;
  if (self && other) {
    return !self.equals(other);
  } else if (!self && !other) {
    return false;
  } else {
    return true;
  }
};


/**
 * Inspired by the Selection save and restore module for Rangy by Tim Down
 * Saves and restores ranges using invisible marker elements in the DOM.
 */
var rangeSaveRestore = (function() {
  var boundaryMarkerId = 0;

  // (U+FEFF) zero width no-break space
  var markerTextChar = '\ufeff';

  var getMarker = function(host, id) {
    return host.querySelector('#'+ id);
  };

  return {

    insertRangeBoundaryMarker: function(range, atStart) {
      var markerId = 'editable-range-boundary-' + (boundaryMarkerId += 1);
      var markerEl;
      var doc = window.document;

      // Clone the Range and collapse to the appropriate boundary point
      var boundaryRange = range.cloneRange();
      boundaryRange.collapse(atStart);

      // Create the marker element containing a single invisible character using DOM methods and insert it
      markerEl = doc.createElement('span');
      markerEl.id = markerId;
      markerEl.style.lineHeight = '0';
      markerEl.style.display = 'none';
      // markerEl.className = "rangySelectionBoundary";
      markerEl.appendChild(doc.createTextNode(markerTextChar));

      boundaryRange.insertNode(markerEl);
      boundaryRange.detach();
      return markerEl;
    },

    setRangeBoundary: function(host, range, markerId, atStart) {
      var markerEl = getMarker(host, markerId);
      if (markerEl) {
        range[atStart ? 'setStartBefore' : 'setEndBefore'](markerEl);
        markerEl.parentNode.removeChild(markerEl);
      } else {
        console.log('Marker element has been removed. Cannot restore selection.');
      }
    },

    save: function(range) {
      var doc = window.document;
      var rangeInfo, startEl, endEl;

      // insert markers
      if (range.collapsed) {
        endEl = this.insertRangeBoundaryMarker(range, false);
        rangeInfo = {
          markerId: endEl.id,
          collapsed: true
        };
      } else {
        endEl = this.insertRangeBoundaryMarker(range, false);
        startEl = this.insertRangeBoundaryMarker(range, true);

        rangeInfo = {
          startMarkerId: startEl.id,
          endMarkerId: endEl.id,
          collapsed: false
        };
      }

      // Adjust each range's boundaries to lie between its markers
      if (range.collapsed) {
        range.collapseBefore(endEl);
      } else {
        range.setEndBefore(endEl);
        range.setStartAfter(startEl);
      }

      return rangeInfo;
    },

    restore: function(host, rangeInfo) {
      if (rangeInfo.restored) return;

      var range = rangy.createRange();
      if (rangeInfo.collapsed) {
        var markerEl = getMarker(host, rangeInfo.markerId);
        if (markerEl) {
          markerEl.style.display = 'inline';
          var previousNode = markerEl.previousSibling;

          // Workaround for rangy issue 17
          if (previousNode && previousNode.nodeType === 3) {
            markerEl.parentNode.removeChild(markerEl);
            range.collapseToPoint(previousNode, previousNode.length);
          } else {
            range.collapseBefore(markerEl);
            markerEl.parentNode.removeChild(markerEl);
          }
        } else {
          console.log('Marker element has been removed. Cannot restore selection.');
        }
      } else {
        this.setRangeBoundary(host, range, rangeInfo.startMarkerId, true);
        this.setRangeBoundary(host, range, rangeInfo.endMarkerId, false);
      }

      range.normalizeBoundaries();
      return range;
    }
  };
})();

/**
 * The SelectionWatcher module watches for selection changes inside
 * of editable blocks.
 *
 * @module core
 * @submodule selectionWatcher
 */
var selectionWatcher = (function() {

  var rangySelection,
      currentSelection,
      currentRange;

  /**
   * Return a RangeContainer if the current selection is within an editable
   * otherwise return an empty RangeContainer
   */
  var getRangeContainer = function() {
    rangySelection = rangy.getSelection();

    // rangeCount is 0 or 1 in all browsers except firefox
    // firefox can work with multiple ranges
    // (on a mac hold down the command key to select multiple ranges)
    if (rangySelection.rangeCount) {
      var range = rangySelection.getRangeAt(0);
      var hostNode = parser.getHost(range.commonAncestorContainer);
      if (hostNode) {
        return new RangeContainer(hostNode, range);
      }
    }

    // return an empty range container
    return new RangeContainer();
  };

  return {

    /**
     * Gets a fresh RangeContainer with the current selection or cursor.
     *
     * @return RangeContainer instance
     */
    getFreshRange: function() {
      return getRangeContainer();
    },

    /**
     * Gets a fresh RangeContainer with the current selection or cursor.
     *
     * @return Either a Cursor or Selection instance or undefined if
     * there is neither a selection or cursor.
     */
    getFreshSelection: function() {
      var range = getRangeContainer();

      return range.isCursor ?
        range.getCursor() :
        range.getSelection();
    },

    /**
     * Get the selection set by the last selectionChanged event.
     * Sometimes the event does not fire fast enough and the seleciton
     * you get is not the one the user sees.
     * In those cases use #getFreshSelection()
     *
     * @return Either a Cursor or Selection instance or undefined if
     * there is neither a selection or cursor.
     */
    getSelection: function() {
      return currentSelection;
    },

    forceCursor: function() {
      var range = getRangeContainer();
      return range.forceCursor();
    },

    selectionChanged: function() {
      var newRange = getRangeContainer();
      if (newRange.isDifferentFrom(currentRange)) {
        var lastSelection = currentSelection;
        currentRange = newRange;

        // empty selection or cursor
        if (lastSelection) {
          if (lastSelection.isCursor && !currentRange.isCursor) {
            dispatcher.notifyListeners('cursor', lastSelection.host);
          } else if (lastSelection.isSelection && !currentRange.isSelection) {
            dispatcher.notifyListeners('selection', lastSelection.host);
          }
        }

        // set new selection or cursor and fire event
        if (currentRange.isCursor) {
          currentSelection = new Cursor(currentRange.host, currentRange.range);
          dispatcher.notifyListeners('cursor', currentSelection.host, currentSelection);
        } else if (currentRange.isSelection) {
          currentSelection = new Selection(currentRange.host, currentRange.range);
          dispatcher.notifyListeners('selection', currentSelection.host, currentSelection);
        } else {
          currentSelection = undefined;
        }
      }
    }
  };
})();

/**
 * The Selection module provides a cross-browser abstraction layer for range
 * and selection.
 *
 * @module core
 * @submodule selection
 */

var Selection = (function() {

  /**
   * Class that represents a selection and provides functionality to access or
   * modify the selection.
   *
   * @class Selection
   * @constructor
   */
  var Selection = function(editableHost, rangyRange) {
    this.host = editableHost;
    this.range = rangyRange;
    this.isSelection = true;
  };

  // add Cursor prototpye to Selection prototype chain
  var Base = function() {};
  Base.prototype = Cursor.prototype;
  Selection.prototype = $.extend(new Base(), {
    /**
     * Get the text inside the selection.
     *
     * @method text
     */
    text: function() {
      return this.range.toString();
    },

    /**
     * Get the html inside the selection.
     *
     * @method html
     */
    html: function() {
      return this.range.toHtml();
    },

    /**
     *
     * @method isAllSelected
     */
    isAllSelected: function() {
      return parser.isBeginningOfHost(
        this.host,
        this.range.startContainer,
        this.range.startOffset) &&
      parser.isTextEndOfHost(
        this.host,
        this.range.endContainer,
        this.range.endOffset);
    },

    /**
     * Get the ClientRects of this selection.
     * Use this if you want more precision than getBoundingClientRect can give.
     */
    getRects: function() {
      var coords = this.range.nativeRange.getClientRects();

      // todo: translate into absolute positions
      // just like Cursor#getCoordinates()
      return coords;
    },

    /**
     *
     * @method link
     */
    link: function(href, attrs) {
      var $link = $('<a>');
      if (href) $link.attr('href', href);
      for (var name in attrs) {
        $link.attr(name, attrs[name]);
      }

      this.forceWrap($link[0]);
    },

    unlink: function() {
      this.removeFormatting('a');
    },

    toggleLink: function(href, attrs) {
      var links = this.getTagsByName('a');
      if (links.length >= 1) {
        var firstLink = links[0];
        if (this.isExactSelection(firstLink, 'visible')) {
          this.unlink();
        } else {
          this.expandTo(firstLink);
        }
      } else {
        this.link(href, attrs);
      }
    },

    toggle: function(elem) {
      this.range = content.toggleTag(this.host, this.range, elem);
      this.setSelection();
    },

    /**
     *
     * @method makeBold
     */
    makeBold: function() {
      var $bold = $(config.boldTag);
      this.forceWrap($bold[0]);
    },

    toggleBold: function() {
      var $bold = $(config.boldTag);
      this.toggle($bold[0]);
    },

    /**
     *
     * @method giveEmphasis
     */
    giveEmphasis: function() {
      var $em = $(config.italicTag);
      this.forceWrap($em[0]);
    },

    toggleEmphasis: function() {
      var $italic = $(config.italicTag);
      this.toggle($italic[0]);
    },

    /**
     * Surround the selection with characters like quotes.
     *
     * @method surround
     * @param {String} E.g. '«'
     * @param {String} E.g. '»'
     */
    surround: function(startCharacter, endCharacter) {
      this.range = content.surround(this.host, this.range, startCharacter, endCharacter);
      this.setSelection();
    },

    removeSurround: function(startCharacter, endCharacter) {
      this.range = content.deleteCharacter(this.host, this.range, startCharacter);
      this.range = content.deleteCharacter(this.host, this.range, endCharacter);
      this.setSelection();
    },

    toggleSurround: function(startCharacter, endCharacter) {
      if (this.containsString(startCharacter) &&
        this.containsString(endCharacter)) {
        this.removeSurround(startCharacter, endCharacter);
      } else {
        this.surround(startCharacter, endCharacter);
      }
    },

    /**
     * @method removeFormatting
     * @param {String} tagName. E.g. 'a' to remove all links.
     */
    removeFormatting: function(tagName) {
      this.range = content.removeFormatting(this.host, this.range, tagName);
      this.setSelection();
    },

    /**
     * Delete the contents inside the range. After that the selection will be a
     * cursor.
     *
     * @method deleteContent
     * @return Cursor instance
     */
    deleteContent: function() {
      this.range.deleteContents();
      return new Cursor(this.host, this.range);
    },

    /**
     * Expand the current selection.
     *
     * @method expandTo
     * @param {DOM Node}
     */
    expandTo: function(elem) {
      this.range = content.expandTo(this.host, this.range, elem);
      this.setSelection();
    },

    /**
     * Wrap the selection with the specified tag. If any other tag with
     * the same tagName is affecting the selection this tag will be
     * remove first.
     *
     * @method forceWrap
     */
    forceWrap: function(elem) {
      this.range = content.forceWrap(this.host, this.range, elem);
      this.setSelection();
    },

    /**
     * Get all tags that affect the current selection. Optionally pass a
     * method to filter the returned elements.
     *
     * @method getTags
     * @param {Function filter(node)} [Optional] Method to filter the returned
     *   DOM Nodes.
     * @return {Array of DOM Nodes}
     */
    getTags: function(filterFunc) {
      return content.getTags(this.host, this.range, filterFunc);
    },

    /**
     * Get all tags of the specified type that affect the current selection.
     *
     * @method getTagsByName
     * @param {String} tagName. E.g. 'a' to get all links.
     * @return {Array of DOM Nodes}
     */
    getTagsByName: function(tagName) {
      return content.getTagsByName(this.host, this.range, tagName);
    },

    /**
     * Check if the selection is the same as the elements contents.
     *
     * @method isExactSelection
     * @param {DOM Node}
     * @param {flag:  undefined or 'visible'} if 'visible' is passed
     *   whitespaces at the beginning or end of the selection will
     *   be ignored.
     * @return {Boolean}
     */
    isExactSelection: function(elem, onlyVisible) {
      return content.isExactSelection(this.range, elem, onlyVisible);
    },

    /**
     * Check if the selection contains the passed string.
     *
     * @method containsString
     * @return {Boolean}
     */
    containsString: function(str) {
      return content.containsString(this.range, str);
    },

    /**
     * Delete all occurences of the specified character from the
     * selection.
     *
     * @method deleteCharacter
     */
    deleteCharacter: function(character) {
      this.range = content.deleteCharacter(this.host, this.range, character);
      this.setSelection();
    }
  });

  return Selection;
})();

  window.Editable = Editable;
})(window, document, window.jQuery);