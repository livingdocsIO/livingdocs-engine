require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DragDrop, Kickstart, SnippetArray, chainable, chainableProxy, document, pageReady, setupApi, stash, words;

chainableProxy = require('./modules/chainable_proxy');

words = require('./modules/words');

stash = require('./modules/stash');

document = require('./document');

Kickstart = require('./kickstart/kickstart');

DragDrop = require('./interaction/drag_drop');

SnippetArray = require('./snippet_tree/snippet_array');

window.doc = function(search) {
  return document.find(search);
};

chainable = chainableProxy(doc);

setupApi = function() {
  this.kickstart = chainable(document, 'kickstart');
  this.Kickstart = Kickstart;
  this.init = chainable(document, 'init');
  this.ready = chainable(document.ready, 'add');
  this.createView = $.proxy(document, 'createView');
  this.getDesign = function() {
    return document.design;
  };
  this.add = $.proxy(document, 'add');
  this.create = $.proxy(document, 'createModel');
  this.toJson = $.proxy(document, 'toJson');
  this.toHtml = $.proxy(document, 'toHtml');
  this.readableJson = function() {
    return words.readableJson(document.toJson());
  };
  this.printTree = $.proxy(document, 'printTree');
  this.eachContainer = chainable(document, 'eachContainer');
  this.document = document;
  this.changed = chainable(document.changed, 'add');
  this.DragDrop = DragDrop;
  stash.init();
  this.stash = $.proxy(stash, 'stash');
  this.stash.snapshot = $.proxy(stash, 'snapshot');
  this.stash["delete"] = $.proxy(stash, 'delete');
  this.stash.restore = $.proxy(stash, 'restore');
  this.stash.get = $.proxy(stash, 'get');
  this.stash.list = $.proxy(stash, 'list');
  this.words = words;
  return this.fn = SnippetArray.prototype;
};

pageReady = function() {
  var page;
  page = document.page;
  this.restore = chainable(document, 'restore');
  this.snippetFocused = chainable(page.focus.snippetFocus, 'add');
  this.snippetBlurred = chainable(page.focus.snippetBlur, 'add');
  this.startDrag = $.proxy(page, 'startDrag');
  this.snippetWillBeDragged = $.proxy(page.snippetWillBeDragged, 'add');
  this.snippetWillBeDragged.remove = $.proxy(page.snippetWillBeDragged, 'remove');
  this.snippetWasDropped = $.proxy(page.snippetWasDropped, 'add');
  this.snippetWasDropped.remove = $.proxy(page.snippetWasDropped, 'remove');
  this.imageClick = chainable(page.imageClick, 'add');
  this.htmlElementClick = chainable(page.htmlElementClick, 'add');
  return this.textSelection = chainable(page.editableController.selection, 'add');
};

setupApi.call(doc);

doc.ready(function() {
  return pageReady.call(doc);
});


},{"./document":5,"./interaction/drag_drop":7,"./kickstart/kickstart":13,"./modules/chainable_proxy":14,"./modules/stash":23,"./modules/words":24,"./snippet_tree/snippet_array":31}],2:[function(require,module,exports){
var config, enrichConfig;

module.exports = config = (function() {
  return {
    wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?",
    singleLineBreak: /^<br\s*\/?>\s*$/,
    zeroWidthCharacter: '\ufeff',
    attributePrefix: 'data',
    html: {
      css: {
        section: 'doc-section',
        snippet: 'doc-snippet',
        editable: 'doc-editable',
        "interface": 'doc-ui',
        snippetHighlight: 'doc-snippet-highlight',
        containerHighlight: 'doc-container-highlight',
        draggedPlaceholder: 'doc-dragged-placeholder',
        dragged: 'doc-dragged',
        beforeDrop: 'doc-before-drop',
        afterDrop: 'doc-after-drop',
        preventSelection: 'doc-no-selection',
        maximizedContainer: 'doc-js-maximized-container',
        interactionBlocker: 'doc-interaction-blocker'
      },
      attr: {
        template: 'data-doc-template',
        placeholder: 'data-doc-placeholder'
      }
    },
    kickstart: {
      attr: {
        styles: 'doc-styles'
      }
    },
    directives: {
      container: {
        attr: 'doc-container',
        renderedAttr: 'calculated later',
        elementDirective: true,
        defaultName: 'default'
      },
      editable: {
        attr: 'doc-editable',
        renderedAttr: 'calculated later',
        elementDirective: true,
        defaultName: 'default'
      },
      image: {
        attr: 'doc-image',
        renderedAttr: 'calculated later',
        elementDirective: true,
        defaultName: 'image'
      },
      html: {
        attr: 'doc-html',
        renderedAttr: 'calculated later',
        elementDirective: true,
        defaultName: 'default'
      },
      optional: {
        attr: 'doc-optional',
        renderedAttr: 'calculated later',
        elementDirective: false
      }
    },
    animations: {
      optionals: {
        show: function($elem) {
          return $elem.slideDown(250);
        },
        hide: function($elem) {
          return $elem.slideUp(250);
        }
      }
    },
    editable: {
      insertSnippet: 'text'
    }
  };
})();

enrichConfig = function() {
  var name, prefix, value, _ref, _results;
  this.docClass = this.html.css;
  this.docAttr = this.html.attr;
  this.docDirective = {};
  this.templateAttrLookup = {};
  _ref = this.directives;
  _results = [];
  for (name in _ref) {
    value = _ref[name];
    if (this.attributePrefix) {
      prefix = "" + this.attributePrefix + "-";
    }
    value.renderedAttr = "" + (prefix || '') + value.attr;
    this.docDirective[name] = value.renderedAttr;
    _results.push(this.templateAttrLookup[value.attr] = name);
  }
  return _results;
};

enrichConfig.call(config);


},{}],3:[function(require,module,exports){
var Design, DesignStyle, Template, assert, log;

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

Template = require('../template/template');

DesignStyle = require('./design_style');

module.exports = Design = (function() {
  function Design(design) {
    var config, groups, templates;
    templates = design.templates || design.snippets;
    config = design.config;
    groups = design.config.groups || design.groups;
    this.namespace = (config != null ? config.namespace : void 0) || 'livingdocs-templates';
    this.css = config.css;
    this.js = config.js;
    this.fonts = config.fonts;
    this.templates = [];
    this.groups = {};
    this.styles = {};
    this.storeTemplateDefinitions(templates);
    this.globalStyles = this.createDesignStyleCollection(design.config.styles);
    this.addGroups(groups);
    this.addTemplatesNotInGroups();
  }

  Design.prototype.storeTemplateDefinitions = function(templates) {
    var template, _i, _len, _results;
    this.templateDefinitions = {};
    _results = [];
    for (_i = 0, _len = templates.length; _i < _len; _i++) {
      template = templates[_i];
      _results.push(this.templateDefinitions[template.id] = template);
    }
    return _results;
  };

  Design.prototype.add = function(templateDefinition, styles) {
    var template, templateOnlyStyles, templateStyles;
    this.templateDefinitions[templateDefinition.id] = void 0;
    templateOnlyStyles = this.createDesignStyleCollection(templateDefinition.styles);
    templateStyles = $.extend({}, styles, templateOnlyStyles);
    template = new Template({
      namespace: this.namespace,
      id: templateDefinition.id,
      title: templateDefinition.title,
      styles: templateStyles,
      html: templateDefinition.html,
      weight: templateDefinition.sortOrder || 0
    });
    this.templates.push(template);
    return template;
  };

  Design.prototype.addGroups = function(collection) {
    var group, groupName, groupOnlyStyles, groupStyles, template, templateDefinition, templateId, templates, _i, _len, _ref, _results;
    _results = [];
    for (groupName in collection) {
      group = collection[groupName];
      groupOnlyStyles = this.createDesignStyleCollection(group.styles);
      groupStyles = $.extend({}, this.globalStyles, groupOnlyStyles);
      templates = {};
      _ref = group.templates;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        templateId = _ref[_i];
        templateDefinition = this.templateDefinitions[templateId];
        if (templateDefinition) {
          template = this.add(templateDefinition, groupStyles);
          templates[template.id] = template;
        } else {
          log.warn("The template '" + templateId + "' referenced in the group '" + groupName + "' does not exist.");
        }
      }
      _results.push(this.addGroup(groupName, group, templates));
    }
    return _results;
  };

  Design.prototype.addTemplatesNotInGroups = function(globalStyles) {
    var templateDefinition, templateId, _ref, _results;
    _ref = this.templateDefinitions;
    _results = [];
    for (templateId in _ref) {
      templateDefinition = _ref[templateId];
      if (templateDefinition) {
        _results.push(this.add(templateDefinition, this.globalStyles));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Design.prototype.addGroup = function(name, group, templates) {
    return this.groups[name] = {
      title: group.title,
      templates: templates
    };
  };

  Design.prototype.createDesignStyleCollection = function(styles) {
    var designStyle, designStyles, styleDefinition, _i, _len;
    designStyles = {};
    if (styles) {
      for (_i = 0, _len = styles.length; _i < _len; _i++) {
        styleDefinition = styles[_i];
        designStyle = this.createDesignStyle(styleDefinition);
        if (designStyle) {
          designStyles[designStyle.name] = designStyle;
        }
      }
    }
    return designStyles;
  };

  Design.prototype.createDesignStyle = function(styleDefinition) {
    if (styleDefinition && styleDefinition.name) {
      return new DesignStyle({
        name: styleDefinition.name,
        type: styleDefinition.type,
        options: styleDefinition.options,
        value: styleDefinition.value
      });
    }
  };

  Design.prototype.remove = function(identifier) {
    return this.checkNamespace(identifier, (function(_this) {
      return function(id) {
        return _this.templates.splice(_this.getIndex(id), 1);
      };
    })(this));
  };

  Design.prototype.get = function(identifier) {
    return this.checkNamespace(identifier, (function(_this) {
      return function(id) {
        var template;
        template = void 0;
        _this.each(function(t, index) {
          if (t.id === id) {
            return template = t;
          }
        });
        return template;
      };
    })(this));
  };

  Design.prototype.getIndex = function(identifier) {
    return this.checkNamespace(identifier, (function(_this) {
      return function(id) {
        var index;
        index = void 0;
        _this.each(function(t, i) {
          if (t.id === id) {
            return index = i;
          }
        });
        return index;
      };
    })(this));
  };

  Design.prototype.checkNamespace = function(identifier, callback) {
    var id, namespace, _ref;
    _ref = Template.parseIdentifier(identifier), namespace = _ref.namespace, id = _ref.id;
    assert(!namespace || this.namespace === namespace, "design " + this.namespace + ": cannot get template with different namespace " + namespace + " ");
    return callback(id);
  };

  Design.prototype.each = function(callback) {
    var index, template, _i, _len, _ref, _results;
    _ref = this.templates;
    _results = [];
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      template = _ref[index];
      _results.push(callback(template, index));
    }
    return _results;
  };

  Design.prototype.list = function() {
    var templates;
    templates = [];
    this.each(function(template) {
      return templates.push(template.identifier);
    });
    return templates;
  };

  Design.prototype.info = function(identifier) {
    var template;
    template = this.get(identifier);
    return template.printDoc();
  };

  return Design;

})();


},{"../modules/logging/assert":19,"../modules/logging/log":20,"../template/template":40,"./design_style":4}],4:[function(require,module,exports){
var DesignStyle, assert, log;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

module.exports = DesignStyle = (function() {
  function DesignStyle(_arg) {
    var options, value;
    this.name = _arg.name, this.type = _arg.type, value = _arg.value, options = _arg.options;
    switch (this.type) {
      case 'option':
        assert(value, "TemplateStyle error: no 'value' provided");
        this.value = value;
        break;
      case 'select':
        assert(options, "TemplateStyle error: no 'options' provided");
        this.options = options;
        break;
      default:
        log.error("TemplateStyle error: unknown type '" + this.type + "'");
    }
  }

  DesignStyle.prototype.cssClassChanges = function(value) {
    if (this.validateValue(value)) {
      if (this.type === 'option') {
        return {
          remove: !value ? [this.value] : void 0,
          add: value
        };
      } else if (this.type === 'select') {
        return {
          remove: this.otherClasses(value),
          add: value
        };
      }
    } else {
      if (this.type === 'option') {
        return {
          remove: currentValue,
          add: void 0
        };
      } else if (this.type === 'select') {
        return {
          remove: this.otherClasses(void 0),
          add: void 0
        };
      }
    }
  };

  DesignStyle.prototype.validateValue = function(value) {
    if (!value) {
      return true;
    } else if (this.type === 'option') {
      return value === this.value;
    } else if (this.type === 'select') {
      return this.containsOption(value);
    } else {
      return log.warn("Not implemented: DesignStyle#validateValue() for type " + this.type);
    }
  };

  DesignStyle.prototype.containsOption = function(value) {
    var option, _i, _len, _ref;
    _ref = this.options;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      option = _ref[_i];
      if (value === option.value) {
        return true;
      }
    }
    return false;
  };

  DesignStyle.prototype.otherOptions = function(value) {
    var option, others, _i, _len, _ref;
    others = [];
    _ref = this.options;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      option = _ref[_i];
      if (option.value !== value) {
        others.push(option);
      }
    }
    return others;
  };

  DesignStyle.prototype.otherClasses = function(value) {
    var option, others, _i, _len, _ref;
    others = [];
    _ref = this.options;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      option = _ref[_i];
      if (option.value !== value) {
        others.push(option.value);
      }
    }
    return others;
  };

  return DesignStyle;

})();


},{"../modules/logging/assert":19,"../modules/logging/log":20}],5:[function(require,module,exports){
var Design, InteractivePage, Kickstart, Page, Renderer, RenderingContainer, SnippetTree, assert;

assert = require('./modules/logging/assert');

Design = require('./design/design');

SnippetTree = require('./snippet_tree/snippet_tree');

Kickstart = require('./kickstart/kickstart');

RenderingContainer = require('./rendering_container/rendering_container');

Page = require('./rendering_container/page');

InteractivePage = require('./rendering_container/interactive_page');

Renderer = require('./rendering/renderer');

module.exports = (function() {
  return {
    initialized: false,
    uniqueId: 0,
    ready: $.Callbacks('memory once'),
    changed: $.Callbacks(),
    init: function(_arg) {
      var design, json, rootNode, _ref;
      _ref = _arg != null ? _arg : {}, design = _ref.design, json = _ref.json, rootNode = _ref.rootNode;
      assert(!this.initialized, 'document is already initialized');
      this.initialized = true;
      this.design = new Design(design);
      this.snippetTree = json && this.design ? new SnippetTree({
        content: json,
        design: this.design
      }) : new SnippetTree();
      this.snippetTree.changed.add((function(_this) {
        return function() {
          return _this.changed.fire();
        };
      })(this));
      this.page = new InteractivePage({
        renderNode: rootNode,
        design: this.design
      });
      this.renderer = new Renderer({
        snippetTree: this.snippetTree,
        renderingContainer: this.page
      });
      return this.renderer.ready((function(_this) {
        return function() {
          return _this.ready.fire();
        };
      })(this));
    },
    createView: function(parent) {
      var $parent, createRendererAndResolvePromise, deferred, iframe;
      if (parent == null) {
        parent = window.document.body;
      }
      createRendererAndResolvePromise = (function(_this) {
        return function() {
          var page, renderer;
          page = new Page({
            renderNode: iframe.contentDocument.body,
            hostWindow: iframe.contentWindow,
            design: _this.design
          });
          renderer = new Renderer({
            renderingContainer: page,
            snippetTree: _this.snippetTree
          });
          return deferred.resolve({
            iframe: iframe,
            renderer: renderer
          });
        };
      })(this);
      deferred = $.Deferred();
      $parent = $(parent).first();
      iframe = $parent[0].ownerDocument.createElement('iframe');
      iframe.src = 'about:blank';
      iframe.onload = createRendererAndResolvePromise;
      $parent.append(iframe);
      return deferred.promise();
    },
    eachContainer: function(callback) {
      return this.snippetTree.eachContainer(callback);
    },
    add: function(input) {
      var snippet;
      if (jQuery.type(input) === 'string') {
        snippet = this.createModel(input);
      } else {
        snippet = input;
      }
      if (snippet) {
        this.snippetTree.append(snippet);
      }
      return snippet;
    },
    createModel: function(identifier) {
      var template;
      template = this.getTemplate(identifier);
      if (template) {
        return template.createModel();
      }
    },
    find: function(search) {
      return this.snippetTree.find(search);
    },
    printTree: function() {
      return this.snippetTree.print();
    },
    toJson: function() {
      var json;
      json = this.snippetTree.toJson();
      json['meta'] = {
        title: void 0,
        author: void 0,
        created: void 0,
        published: void 0
      };
      return json;
    },
    toHtml: function() {
      return new Renderer({
        snippetTree: this.snippetTree,
        renderingContainer: new RenderingContainer()
      }).html();
    },
    restore: function(contentJson, resetFirst) {
      if (resetFirst == null) {
        resetFirst = true;
      }
      if (resetFirst) {
        this.reset();
      }
      this.snippetTree.fromJson(contentJson, this.design);
      return this.renderer.render();
    },
    reset: function() {
      this.renderer.clear();
      return this.snippetTree.detach();
    },
    getTemplate: function(identifier) {
      var template, _ref;
      template = (_ref = this.design) != null ? _ref.get(identifier) : void 0;
      assert(template, "could not find template " + identifier);
      return template;
    },
    kickstart: function(_arg) {
      var design, destination, json, scriptNode, xmlTemplate;
      xmlTemplate = _arg.xmlTemplate, scriptNode = _arg.scriptNode, destination = _arg.destination, design = _arg.design;
      json = new Kickstart({
        xmlTemplate: xmlTemplate,
        scriptNode: scriptNode,
        design: design
      }).getSnippetTree().toJson();
      return this.init({
        design: design,
        json: json,
        rootNode: destination
      });
    }
  };
})();


},{"./design/design":3,"./kickstart/kickstart":13,"./modules/logging/assert":19,"./rendering/renderer":25,"./rendering_container/interactive_page":28,"./rendering_container/page":29,"./rendering_container/rendering_container":30,"./snippet_tree/snippet_tree":34}],6:[function(require,module,exports){
var config, docClass;

config = require('../configuration/defaults');

docClass = config.html.css;

module.exports = (function() {
  var sectionRegex, snippetRegex;
  snippetRegex = new RegExp("(?: |^)" + docClass.snippet + "(?: |$)");
  sectionRegex = new RegExp("(?: |^)" + docClass.section + "(?: |$)");
  return {
    findSnippetView: function(node) {
      var view;
      node = this.getElementNode(node);
      while (node && node.nodeType === 1) {
        if (snippetRegex.test(node.className)) {
          view = this.getSnippetView(node);
          return view;
        }
        node = node.parentNode;
      }
      return void 0;
    },
    findNodeContext: function(node) {
      var nodeContext;
      node = this.getElementNode(node);
      while (node && node.nodeType === 1) {
        nodeContext = this.getNodeContext(node);
        if (nodeContext) {
          return nodeContext;
        }
        node = node.parentNode;
      }
      return void 0;
    },
    getNodeContext: function(node) {
      var directiveAttr, directiveType, obj, _ref;
      _ref = config.directives;
      for (directiveType in _ref) {
        obj = _ref[directiveType];
        if (!obj.elementDirective) {
          continue;
        }
        directiveAttr = obj.renderedAttr;
        if (node.hasAttribute(directiveAttr)) {
          return {
            contextAttr: directiveAttr,
            attrName: node.getAttribute(directiveAttr)
          };
        }
      }
      return void 0;
    },
    findContainer: function(node) {
      var containerAttr, containerName, view;
      node = this.getElementNode(node);
      containerAttr = config.directives.container.renderedAttr;
      while (node && node.nodeType === 1) {
        if (node.hasAttribute(containerAttr)) {
          containerName = node.getAttribute(containerAttr);
          if (!sectionRegex.test(node.className)) {
            view = this.findSnippetView(node);
          }
          return {
            node: node,
            containerName: containerName,
            snippetView: view
          };
        }
        node = node.parentNode;
      }
      return {};
    },
    getImageName: function(node) {
      var imageAttr, imageName;
      imageAttr = config.directives.image.renderedAttr;
      if (node.hasAttribute(imageAttr)) {
        imageName = node.getAttribute(imageAttr);
        return imageName;
      }
    },
    getHtmlElementName: function(node) {
      var htmlAttr, htmlElementName;
      htmlAttr = config.directives.html.renderedAttr;
      if (node.hasAttribute(htmlAttr)) {
        htmlElementName = node.getAttribute(htmlAttr);
        return htmlElementName;
      }
    },
    getEditableName: function(node) {
      var editableAttr, imageName;
      editableAttr = config.directives.editable.renderedAttr;
      if (node.hasAttribute(editableAttr)) {
        imageName = node.getAttribute(editableAttr);
        return editableName;
      }
    },
    dropTarget: function(node, _arg) {
      var containerAttr, containerName, coords, insertSnippet, left, pos, top, view;
      top = _arg.top, left = _arg.left;
      node = this.getElementNode(node);
      containerAttr = config.directives.container.renderedAttr;
      while (node && node.nodeType === 1) {
        if (node.hasAttribute(containerAttr)) {
          containerName = node.getAttribute(containerAttr);
          if (!sectionRegex.test(node.className)) {
            insertSnippet = this.getPositionInContainer($(node), {
              top: top,
              left: left
            });
            if (insertSnippet) {
              coords = this.getInsertPosition(insertSnippet.$elem[0], insertSnippet.position);
              return {
                snippetView: insertSnippet.snippetView,
                position: insertSnippet.position,
                coords: coords
              };
            } else {
              view = this.findSnippetView(node);
              return {
                containerName: containerName,
                parent: view,
                node: node
              };
            }
          }
        } else if (snippetRegex.test(node.className)) {
          pos = this.getPositionInSnippet($(node), {
            top: top,
            left: left
          });
          view = this.getSnippetView(node);
          coords = this.getInsertPosition(node, pos.position);
          return {
            snippetView: view,
            position: pos.position,
            coords: coords
          };
        } else if (sectionRegex.test(node.className)) {
          return {
            root: true
          };
        }
        node = node.parentNode;
      }
      return {};
    },
    getInsertPosition: function(elem, position) {
      var rect;
      rect = this.getBoundingClientRect(elem);
      if (position === 'before') {
        return {
          top: rect.top,
          left: rect.left,
          width: rect.width
        };
      } else {
        return {
          top: rect.bottom,
          left: rect.left,
          width: rect.width
        };
      }
    },
    getPositionInSnippet: function($elem, _arg) {
      var elemBottom, elemHeight, elemTop, left, top;
      top = _arg.top, left = _arg.left;
      elemTop = $elem.offset().top;
      elemHeight = $elem.outerHeight();
      elemBottom = elemTop + elemHeight;
      if (this.distance(top, elemTop) < this.distance(top, elemBottom)) {
        return {
          position: 'before'
        };
      } else {
        return {
          position: 'after'
        };
      }
    },
    getPositionInContainer: function($container, _arg) {
      var $snippets, closest, insertSnippet, left, top;
      top = _arg.top, left = _arg.left;
      $snippets = $container.find("." + docClass.snippet);
      closest = void 0;
      insertSnippet = void 0;
      $snippets.each((function(_this) {
        return function(index, elem) {
          var $elem, elemBottom, elemHeight, elemTop;
          $elem = $(elem);
          elemTop = $elem.offset().top;
          elemHeight = $elem.outerHeight();
          elemBottom = elemTop + elemHeight;
          if (!closest || _this.distance(top, elemTop) < closest) {
            closest = _this.distance(top, elemTop);
            insertSnippet = {
              $elem: $elem,
              position: 'before'
            };
          }
          if (!closest || _this.distance(top, elemBottom) < closest) {
            closest = _this.distance(top, elemBottom);
            insertSnippet = {
              $elem: $elem,
              position: 'after'
            };
          }
          if (insertSnippet) {
            return insertSnippet.snippetView = _this.getSnippetView(insertSnippet.$elem[0]);
          }
        };
      })(this));
      return insertSnippet;
    },
    distance: function(a, b) {
      if (a > b) {
        return a - b;
      } else {
        return b - a;
      }
    },
    maximizeContainerHeight: function(view) {
      var $elem, $parent, elem, name, outer, parentHeight, _ref, _results;
      if (view.template.containerCount > 1) {
        _ref = view.containers;
        _results = [];
        for (name in _ref) {
          elem = _ref[name];
          $elem = $(elem);
          if ($elem.hasClass(docClass.maximizedContainer)) {
            continue;
          }
          $parent = $elem.parent();
          parentHeight = $parent.height();
          outer = $elem.outerHeight(true) - $elem.height();
          $elem.height(parentHeight - outer);
          _results.push($elem.addClass(docClass.maximizedContainer));
        }
        return _results;
      }
    },
    restoreContainerHeight: function() {
      return $("." + docClass.maximizedContainer).css('height', '').removeClass(docClass.maximizedContainer);
    },
    getElementNode: function(node) {
      if (node != null ? node.jquery : void 0) {
        return node[0];
      } else if ((node != null ? node.nodeType : void 0) === 3) {
        return node.parentNode;
      } else {
        return node;
      }
    },
    getSnippetView: function(node) {
      return $(node).data('snippet');
    },
    getBoundingClientRect: function(node) {
      var coords, scrollX, scrollY;
      coords = node.getBoundingClientRect();
      scrollX = window.pageXOffset !== void 0 ? window.pageXOffset : (document.documentElement || window.document.body.parentNode || window.document.body).scrollLeft;
      scrollY = window.pageYOffset !== void 0 ? window.pageYOffset : (document.documentElement || window.document.body.parentNode || window.document.body).scrollTop;
      coords = {
        top: coords.top + scrollY,
        bottom: coords.bottom + scrollY,
        left: coords.left + scrollX,
        right: coords.right + scrollX
      };
      coords.height = coords.bottom - coords.top;
      coords.width = coords.right - coords.left;
      return coords;
    }
  };
})();


},{"../configuration/defaults":2}],7:[function(require,module,exports){
var DragDrop, config, docClass, dom;

dom = require('./dom');

config = require('../configuration/defaults');

docClass = config.html.css;

module.exports = DragDrop = (function() {
  function DragDrop(options) {
    this.defaultOptions = $.extend({
      longpressDelay: 0,
      longpressDistanceLimit: 10,
      minDistance: 0,
      direct: false,
      preventDefault: true,
      createPlaceholder: DragDrop.placeholder,
      scrollNearEdge: 50
    }, options);
    this.drag = {};
    this.$origin = void 0;
    this.$dragged = void 0;
  }

  DragDrop.prototype.mousedown = function($origin, event, options) {
    if (options == null) {
      options = {};
    }
    this.reset();
    this.drag.initialized = true;
    this.options = $.extend({}, this.defaultOptions, options);
    if (event.type === 'touchstart') {
      this.drag.startPoint = {
        left: event.originalEvent.changedTouches[0].pageX,
        top: event.originalEvent.changedTouches[0].pageY
      };
    } else {
      this.drag.startPoint = {
        left: event.pageX,
        top: event.pageY
      };
    }
    this.$origin = $origin;
    if (this.options.longpressDelay && this.options.longpressDistanceLimit) {
      this.drag.timeout = setTimeout((function(_this) {
        return function() {
          return _this.start();
        };
      })(this), this.options.longpressDelay);
    }
    if (this.options.preventDefault) {
      return event.preventDefault();
    }
  };

  DragDrop.prototype.start = function() {
    var mouseLeft, mouseTop, _ref;
    this.drag.started = true;
    mouseLeft = this.drag.startPoint.left;
    mouseTop = this.drag.startPoint.top;
    if (typeof this.options.onDragStart === 'function') {
      this.options.onDragStart.call(this, this.drag, {
        left: mouseLeft,
        top: mouseTop
      });
    }
    $(window.document.body).addClass(docClass.preventSelection);
    if (this.options.direct) {
      this.$dragged = this.$origin;
    } else {
      this.$dragged = this.options.createPlaceholder(this.drag, this.$origin);
    }
    if (this.drag.fixed) {
      this.drag.$body = $(window.document.body);
    }
    this.move(mouseLeft, mouseTop);
    if (!this.direct) {
      this.$dragged.appendTo(window.document.body).show();
      return (_ref = this.$origin) != null ? _ref.addClass(docClass.dragged) : void 0;
    }
  };

  DragDrop.prototype.scrollIntoView = function(top, event) {
    var abovePageBottom, delta, inScrollDownArea, inScrollUpArea, shouldScroll, viewportBottom, viewportTop;
    if (this.lastScrollPosition) {
      delta = top - this.lastScrollPosition;
      viewportTop = $(window).scrollTop();
      viewportBottom = viewportTop + $(window).height();
      shouldScroll = delta < 0 ? (inScrollUpArea = top < viewportTop + this.defaultOptions.scrollNearEdge, viewportTop !== 0 && inScrollUpArea) : (abovePageBottom = viewportBottom - $(window).height() < ($(window.document).height()), inScrollDownArea = top > viewportBottom - this.defaultOptions.scrollNearEdge, abovePageBottom && inScrollDownArea);
      if (shouldScroll) {
        window.scrollBy(0, delta);
      }
    }
    return this.lastScrollPosition = top;
  };

  DragDrop.prototype.move = function(mouseLeft, mouseTop, event) {
    var left, top;
    if (this.drag.started) {
      if (this.drag.mouseToSnippet) {
        left = mouseLeft - this.drag.mouseToSnippet.left;
        top = mouseTop - this.drag.mouseToSnippet.top;
      } else {
        left = mouseLeft;
        top = mouseTop;
      }
      if (this.drag.fixed) {
        top = top - this.drag.$body.scrollTop();
        left = left - this.drag.$body.scrollLeft();
      }
      if (left < 2) {
        left = 2;
      }
      if (top < 2) {
        top = 2;
      }
      this.$dragged.css({
        position: 'absolute',
        left: "" + left + "px",
        top: "" + top + "px"
      });
      this.scrollIntoView(top, event);
      if (!this.direct) {
        return this.dropTarget(mouseLeft, mouseTop, event);
      }
    } else if (this.drag.initialized) {
      if (this.options.longpressDelay && this.options.longpressDistanceLimit) {
        if (this.distance({
          left: mouseLeft,
          top: mouseTop
        }, this.drag.startPoint) > this.options.longpressDistanceLimit) {
          this.reset();
        }
      }
      if (this.options.minDistance && this.distance({
        left: mouseLeft,
        top: mouseTop
      }, this.drag.startPoint) > this.options.minDistance) {
        return this.start();
      }
    }
  };

  DragDrop.prototype.drop = function() {
    if (this.drag.started) {
      if (typeof this.options.onDrop === 'function') {
        this.options.onDrop.call(this, this.drag, this.$origin);
      }
    }
    return this.reset();
  };

  DragDrop.prototype.dropTarget = function(mouseLeft, mouseTop, event) {
    var dragTarget, elem, x, y;
    if (this.$dragged && event) {
      elem = void 0;
      if (event.type === 'touchstart' || event.type === 'touchmove') {
        x = event.originalEvent.changedTouches[0].clientX;
        y = event.originalEvent.changedTouches[0].clientY;
      } else {
        x = event.clientX;
        y = event.clientY;
      }
      if (x && y) {
        this.$dragged.hide();
        elem = window.document.elementFromPoint(x, y);
        this.$dragged.show();
      }
      if (elem) {
        dragTarget = dom.dropTarget(elem, {
          top: mouseTop,
          left: mouseLeft
        });
        this.drag.target = dragTarget;
      } else {
        this.drag.target = {};
      }
      if (typeof this.options.onDrag === 'function') {
        return this.options.onDrag.call(this, this.drag.target, this.drag, {
          left: mouseLeft,
          top: mouseTop
        });
      }
    }
  };

  DragDrop.prototype.distance = function(pointA, pointB) {
    var distX, distY;
    if (!pointA || !pointB) {
      return void 0;
    }
    distX = pointA.left - pointB.left;
    distY = pointA.top - pointB.top;
    return Math.sqrt((distX * distX) + (distY * distY));
  };

  DragDrop.prototype.reset = function() {
    if (this.drag.initialized) {
      if (this.drag.timeout) {
        clearTimeout(this.drag.timeout);
      }
      if (this.drag.preview) {
        this.drag.preview.remove();
      }
      if (this.$dragged && this.$dragged !== this.$origin) {
        this.$dragged.remove();
      }
      if (this.$origin) {
        this.$origin.removeClass(docClass.dragged);
        this.$origin.show();
      }
      $(window.document.body).removeClass(docClass.preventSelection);
      this.drag = {};
      this.$origin = void 0;
      return this.$dragged = void 0;
    }
  };

  return DragDrop;

})();

DragDrop.cloneOrigin = function(drag, $origin) {
  var backgroundColor, draggedCopy, hasBackgroundColor, marginLeft, marginTop, snippetOffset, snippetWidth;
  if (!drag.mouseToSnippet) {
    snippetOffset = $origin.offset();
    marginTop = parseFloat($origin.css("margin-top"));
    marginLeft = parseFloat($origin.css("margin-left"));
    drag.mouseToSnippet = {
      left: mouseLeft - snippetOffset.left + marginLeft,
      top: mouseTop - snippetOffset.top + marginTop
    };
  }
  snippetWidth = drag.width || $origin.width();
  draggedCopy = $origin.clone();
  draggedCopy.css({
    position: "absolute",
    width: snippetWidth
  }).removeClass(docClass.snippetHighlight).addClass(docClass.draggedPlaceholder);
  backgroundColor = $origin.css("background-color");
  hasBackgroundColor = backgroundColor !== "transparent" && backgroundColor !== "rgba(0, 0, 0, 0)";
  if (!hasBackgroundColor) {
    draggedCopy.css({
      "background-color": "#fff"
    });
  }
  return draggedCopy;
};

DragDrop.placeholder = function(drag) {
  var $placeholder, numberOfDraggedElems, snippetWidth, template;
  snippetWidth = drag.width;
  numberOfDraggedElems = 1;
  if (!drag.mouseToSnippet) {
    drag.mouseToSnippet = {
      left: 2,
      top: -15
    };
  }
  template = "<div class=\"doc-drag-placeholder-item\">\n  <span class=\"doc-drag-counter\">" + numberOfDraggedElems + "</span>\n  Selected Item\n</div>";
  $placeholder = $(template);
  if (snippetWidth) {
    $placeholder.css({
      width: snippetWidth
    });
  }
  return $placeholder.css({
    position: "absolute"
  });
};


},{"../configuration/defaults":2,"./dom":6}],8:[function(require,module,exports){
var EditableController, config, dom,
  __slice = [].slice;

dom = require('./dom');

config = require('../configuration/defaults');

module.exports = EditableController = (function() {
  function EditableController(page) {
    this.page = page;
    Editable.init({
      log: false
    });
    this.editableAttr = config.directives.editable.renderedAttr;
    this.selection = $.Callbacks();
    Editable.focus(this.withContext(this.focus)).blur(this.withContext(this.blur)).insert(this.withContext(this.insert)).merge(this.withContext(this.merge)).split(this.withContext(this.split)).selection(this.withContext(this.selectionChanged)).newline(this.withContext(this.newline));
  }

  EditableController.prototype.add = function(nodes) {
    return Editable.add(nodes);
  };

  EditableController.prototype.disableAll = function() {
    return $('[contenteditable]').attr('contenteditable', 'false');
  };

  EditableController.prototype.reenableAll = function() {
    return $('[contenteditable]').attr('contenteditable', 'true');
  };

  EditableController.prototype.withContext = function(func) {
    return (function(_this) {
      return function() {
        var args, editableName, element, view;
        element = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        view = dom.findSnippetView(element);
        editableName = element.getAttribute(_this.editableAttr);
        args.unshift(view, editableName);
        return func.apply(_this, args);
      };
    })(this);
  };

  EditableController.prototype.updateModel = function(view, editableName) {
    var value;
    value = view.get(editableName);
    if (config.singleLineBreak.test(value) || value === '') {
      value = void 0;
    }
    return view.model.set(editableName, value);
  };

  EditableController.prototype.focus = function(view, editableName) {
    var element;
    view.focusEditable(editableName);
    element = view.getDirectiveElement(editableName);
    this.page.focus.editableFocused(element, view);
    return true;
  };

  EditableController.prototype.blur = function(view, editableName) {
    var element;
    view.blurEditable(editableName);
    element = view.getDirectiveElement(editableName);
    this.page.focus.editableBlurred(element, view);
    this.updateModel(view, editableName);
    return true;
  };

  EditableController.prototype.insert = function(view, editableName, direction, cursor) {
    var copy, newView, snippetName, template;
    if (this.hasSingleEditable(view)) {
      snippetName = config.editable.insertSnippet;
      template = this.page.design.get(snippetName);
      copy = template.createModel();
      newView = direction === 'before' ? (view.model.before(copy), view.prev()) : (view.model.after(copy), view.next());
      if (newView) {
        newView.focus();
      }
    }
    return false;
  };

  EditableController.prototype.merge = function(view, editableName, direction, cursor) {
    var contents, el, elem, frag, mergedView, _i, _len;
    if (this.hasSingleEditable(view)) {
      mergedView = direction === 'before' ? view.prev() : view.next();
      if (mergedView && mergedView.template === view.template) {
        contents = view.directives.$getElem(editableName).contents();
        frag = this.page.document.createDocumentFragment();
        for (_i = 0, _len = contents.length; _i < _len; _i++) {
          el = contents[_i];
          frag.appendChild(el);
        }
        mergedView.focus();
        elem = mergedView.getDirectiveElement(editableName);
        cursor = Editable.createCursor(elem, direction === 'before' ? 'end' : 'beginning');
        cursor[direction === 'before' ? 'insertAfter' : 'insertBefore'](frag);
        cursor.save();
        this.updateModel(mergedView, editableName);
        cursor.restore();
        view.model.remove();
        cursor.setSelection();
      }
    }
    return false;
  };

  EditableController.prototype.split = function(view, editableName, before, after, cursor) {
    var afterContent, beforeContent, copy;
    if (this.hasSingleEditable(view)) {
      copy = view.template.createModel();
      beforeContent = before.querySelector('*').innerHTML;
      afterContent = after.querySelector('*').innerHTML;
      view.model.set(editableName, beforeContent);
      copy.set(editableName, afterContent);
      view.model.after(copy);
      view.next().focus();
    }
    return false;
  };

  EditableController.prototype.selectionChanged = function(view, editableName, selection) {
    var element;
    element = view.getDirectiveElement(editableName);
    return this.selection.fire(view, element, selection);
  };

  EditableController.prototype.newline = function(view, editable, cursor) {
    return false;
  };

  EditableController.prototype.hasSingleEditable = function(view) {
    return view.directives.length === 1 && view.directives[0].type === 'editable';
  };

  return EditableController;

})();


},{"../configuration/defaults":2,"./dom":6}],9:[function(require,module,exports){
var Focus, dom;

dom = require('./dom');

module.exports = Focus = (function() {
  function Focus() {
    this.editableNode = void 0;
    this.snippetView = void 0;
    this.snippetFocus = $.Callbacks();
    this.snippetBlur = $.Callbacks();
  }

  Focus.prototype.setFocus = function(snippetView, editableNode) {
    if (editableNode !== this.editableNode) {
      this.resetEditable();
      this.editableNode = editableNode;
    }
    if (snippetView !== this.snippetView) {
      this.resetSnippetView();
      if (snippetView) {
        this.snippetView = snippetView;
        return this.snippetFocus.fire(this.snippetView);
      }
    }
  };

  Focus.prototype.editableFocused = function(editableNode, snippetView) {
    if (this.editableNode !== editableNode) {
      snippetView || (snippetView = dom.findSnippetView(editableNode));
      return this.setFocus(snippetView, editableNode);
    }
  };

  Focus.prototype.editableBlurred = function(editableNode) {
    if (this.editableNode === editableNode) {
      return this.setFocus(this.snippetView, void 0);
    }
  };

  Focus.prototype.snippetFocused = function(snippetView) {
    if (this.snippetView !== snippetView) {
      return this.setFocus(snippetView, void 0);
    }
  };

  Focus.prototype.blur = function() {
    return this.setFocus(void 0, void 0);
  };

  Focus.prototype.resetEditable = function() {
    if (this.editableNode) {
      return this.editableNode = void 0;
    }
  };

  Focus.prototype.resetSnippetView = function() {
    var previous;
    if (this.snippetView) {
      previous = this.snippetView;
      this.snippetView = void 0;
      return this.snippetBlur.fire(previous);
    }
  };

  return Focus;

})();


},{"./dom":6}],10:[function(require,module,exports){
var SnippetDrag, config, docClass, dom;

dom = require('./dom');

config = require('../configuration/defaults');

docClass = config.html.css;

module.exports = SnippetDrag = (function() {
  function SnippetDrag(_arg) {
    var page, snippet;
    snippet = _arg.snippet, page = _arg.page;
    this.snippet = snippet;
    this.page = page;
    this.$highlightedContainer = {};
    this.onStart = $.proxy(this.onStart, this);
    this.onDrag = $.proxy(this.onDrag, this);
    this.onDrop = $.proxy(this.onDrop, this);
    this.classAdded = [];
  }

  SnippetDrag.prototype.onStart = function() {
    this.page.snippetWillBeDragged.fire(this.snippet);
    this.$insertPreview = $("<div class='doc-drag-preview'>");
    this.page.$body.append(this.$insertPreview).css('cursor', 'pointer');
    this.page.editableController.disableAll();
    return this.page.blurFocusedElement();
  };

  SnippetDrag.prototype.removeCssClasses = function() {
    var $html, _i, _len, _ref;
    _ref = this.classAdded;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      $html = _ref[_i];
      $html.removeClass(docClass.afterDrop).removeClass(docClass.beforeDrop);
    }
    return this.classAdded = [];
  };

  SnippetDrag.prototype.isValidTarget = function(target) {
    if (target.snippetView && target.snippetView.model !== this.snippet) {
      return true;
    } else if (target.containerName) {
      return true;
    }
    return false;
  };

  SnippetDrag.prototype.onDrag = function(target, drag, cursor) {
    var $container, coords, _base, _base1;
    if (!this.isValidTarget(target)) {
      $container = target = {};
    }
    if (target.containerName) {
      dom.maximizeContainerHeight(target.parent);
      $container = $(target.node);
    } else if (target.snippetView) {
      dom.maximizeContainerHeight(target.snippetView);
      $container = target.snippetView.get$container();
      $container.addClass(docClass.containerHighlight);
    } else {
      $container = target = {};
    }
    if ($container[0] !== this.$highlightedContainer[0]) {
      if (typeof (_base = this.$highlightedContainer).removeClass === "function") {
        _base.removeClass(docClass.containerHighlight);
      }
      this.$highlightedContainer = $container;
      if (typeof (_base1 = this.$highlightedContainer).addClass === "function") {
        _base1.addClass(docClass.containerHighlight);
      }
    }
    if (target.coords) {
      coords = target.coords;
      return this.$insertPreview.css({
        left: "" + coords.left + "px",
        top: "" + (coords.top - 5) + "px",
        width: "" + coords.width + "px"
      }).show();
    } else {
      return this.$insertPreview.hide();
    }
  };

  SnippetDrag.prototype.onDrop = function(drag) {
    var snippetView, target, _base;
    this.page.$body.css('cursor', '');
    this.page.editableController.reenableAll();
    this.$insertPreview.remove();
    if (typeof (_base = this.$highlightedContainer).removeClass === "function") {
      _base.removeClass(docClass.containerHighlight);
    }
    dom.restoreContainerHeight();
    target = drag.target;
    if (target && this.isValidTarget(target)) {
      if (snippetView = target.snippetView) {
        if (target.position === 'before') {
          snippetView.model.before(this.snippet);
        } else {
          snippetView.model.after(this.snippet);
        }
      } else if (target.containerName) {
        target.parent.model.append(target.containerName, this.snippet);
      }
      return this.page.snippetWasDropped.fire(this.snippet);
    } else {

    }
  };

  return SnippetDrag;

})();


},{"../configuration/defaults":2,"./dom":6}],"xmldom":[function(require,module,exports){
module.exports=require('BBz8zn');
},{}],"BBz8zn":[function(require,module,exports){
var DOMParserShim;

exports.DOMParser = DOMParserShim = (function() {
  function DOMParserShim() {}

  DOMParserShim.prototype.parseFromString = function(xmlTemplate) {
    return $.parseXML(xmlTemplate);
  };

  return DOMParserShim;

})();

exports.XMLSerializer = XMLSerializer;


},{}],13:[function(require,module,exports){
var DOMParser, Design, Kickstart, SnippetTree, XMLSerializer, assert, log, words;

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

words = require('../modules/words');

Design = require('../design/design');

SnippetTree = require('../snippet_tree/snippet_tree');

DOMParser = require('xmldom').DOMParser;

XMLSerializer = require('xmldom').XMLSerializer;

module.exports = Kickstart = (function() {
  function Kickstart(_arg) {
    var design, destination, scriptNode, xmlTemplate, _ref;
    _ref = _arg != null ? _arg : {}, xmlTemplate = _ref.xmlTemplate, scriptNode = _ref.scriptNode, destination = _ref.destination, design = _ref.design;
    if (!(this instanceof Kickstart)) {
      return new Kickstart({
        xmlTemplate: xmlTemplate,
        scriptNode: scriptNode,
        destination: destination,
        design: design
      });
    }
    assert(scriptNode || xmlTemplate, 'Please provide parameter "xmlTemplate" or "scriptNode"');
    if (scriptNode) {
      xmlTemplate = "<root>" + $(scriptNode).text() + "</root>";
    }
    this.template = Kickstart.parseXML(xmlTemplate);
    this.design = new Design(design);
    this.snippetTree = new SnippetTree();
    this.addRootSnippets($(this.template).children());
  }

  Kickstart.parseXML = function(xmlTemplate) {
    var xmlDoc;
    xmlDoc = new DOMParser().parseFromString(xmlTemplate);
    return xmlDoc.firstChild;
  };

  Kickstart.prototype.addRootSnippets = function(xmlElements) {
    var index, row, snippetModel, xmlElement, _i, _len, _results;
    _results = [];
    for (index = _i = 0, _len = xmlElements.length; _i < _len; index = ++_i) {
      xmlElement = xmlElements[index];
      snippetModel = this.createSnippet(xmlElement);
      this.setChildren(snippetModel, xmlElement);
      _results.push(row = this.snippetTree.append(snippetModel));
    }
    return _results;
  };

  Kickstart.prototype.setChildren = function(snippetModel, snippetXML) {
    this.populateSnippetContainers(snippetModel, snippetXML);
    this.setEditables(snippetModel, snippetXML);
    return this.setEditableStyles(snippetModel, snippetXML);
  };

  Kickstart.prototype.populateSnippetContainers = function(snippetModel, snippetXML) {
    var child, container, containerDirective, containers, directives, editableContainer, hasOnlyOneContainer, _i, _j, _len, _len1, _ref, _results, _results1;
    directives = snippetModel.template.directives;
    if (directives.length === 1 && directives.container) {
      hasOnlyOneContainer = true;
      containerDirective = directives.container[0];
    }
    if (hasOnlyOneContainer && !this.descendants(snippetXML, containerDirective.name).length) {
      _ref = this.descendants(snippetXML);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        _results.push(this.appendSnippetToContainer(snippetModel, child, containerDirective.name));
      }
      return _results;
    } else {
      containers = snippetModel.containers ? Object.keys(snippetModel.containers) : [];
      _results1 = [];
      for (_j = 0, _len1 = containers.length; _j < _len1; _j++) {
        container = containers[_j];
        _results1.push((function() {
          var _k, _len2, _ref1, _results2;
          _ref1 = this.descendants(snippetXML, container);
          _results2 = [];
          for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
            editableContainer = _ref1[_k];
            _results2.push((function() {
              var _l, _len3, _ref2, _results3;
              _ref2 = this.descendants(editableContainer);
              _results3 = [];
              for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
                child = _ref2[_l];
                _results3.push(this.appendSnippetToContainer(snippetModel, child, this.nodeNameToCamelCase(editableContainer)));
              }
              return _results3;
            }).call(this));
          }
          return _results2;
        }).call(this));
      }
      return _results1;
    }
  };

  Kickstart.prototype.appendSnippetToContainer = function(snippetModel, snippetXML, region) {
    var snippet;
    snippet = this.createSnippet(snippetXML);
    snippetModel.append(region, snippet);
    return this.setChildren(snippet, snippetXML);
  };

  Kickstart.prototype.setEditables = function(snippetModel, snippetXML) {
    var editableName, value, _results;
    _results = [];
    for (editableName in snippetModel.content) {
      value = this.getValueForEditable(editableName, snippetXML, snippetModel.template.directives.length);
      if (value) {
        _results.push(snippetModel.set(editableName, value));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Kickstart.prototype.getValueForEditable = function(editableName, snippetXML, directivesQuantity) {
    var child, value;
    child = this.descendants(snippetXML, editableName)[0];
    value = this.getXmlValue(child);
    if (!value && directivesQuantity === 1) {
      log.warn("The editable '" + editableName + "' of '" + (this.nodeToSnippetName(snippetXML)) + "' has no content. Display parent HTML instead.");
      value = this.getXmlValue(snippetXML);
    }
    return value;
  };

  Kickstart.prototype.nodeNameToCamelCase = function(element) {
    return words.camelize(element.nodeName);
  };

  Kickstart.prototype.setEditableStyles = function(snippetModel, snippetXML) {
    var style, styles, _i, _len, _results;
    styles = $(snippetXML).attr(config.kickstart.attr.styles);
    if (styles) {
      styles = styles.split(/\s*;\s*/);
      _results = [];
      for (_i = 0, _len = styles.length; _i < _len; _i++) {
        style = styles[_i];
        style = style.split(/\s*:\s*/);
        if (style.length > 1) {
          _results.push(snippetModel.setStyle(style[0], style[1]));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  Kickstart.prototype.nodeToSnippetName = function(element) {
    var snippet, snippetName;
    snippetName = this.nodeNameToCamelCase(element);
    snippet = this.design.get(snippetName);
    assert(snippet, "The Template named '" + snippetName + "' does not exist.");
    return snippetName;
  };

  Kickstart.prototype.createSnippet = function(xml) {
    return this.design.get(this.nodeToSnippetName(xml)).createModel();
  };

  Kickstart.prototype.descendants = function(xml, nodeName) {
    var tagLimiter;
    if (nodeName) {
      tagLimiter = words.snakeCase(nodeName);
    }
    return $(xml).children(tagLimiter);
  };

  Kickstart.prototype.getXmlValue = function(node) {
    var end, start, string;
    if (node) {
      string = new XMLSerializer().serializeToString(node);
      start = string.indexOf('>') + 1;
      end = string.lastIndexOf('<');
      if (end > start) {
        return string.substring(start, end);
      }
    }
  };

  Kickstart.prototype.getSnippetTree = function() {
    return this.snippetTree;
  };

  Kickstart.prototype.toHtml = function() {
    var renderer;
    renderer = new Renderer({
      snippetTree: this.snippetTree,
      renderingContainer: new RenderingContainer()
    });
    return renderer.html();
  };

  return Kickstart;

})();


},{"../design/design":3,"../modules/logging/assert":19,"../modules/logging/log":20,"../modules/words":24,"../snippet_tree/snippet_tree":34,"xmldom":"BBz8zn"}],14:[function(require,module,exports){
module.exports = function(chainedObj) {
  return function(fn, context) {
    var args, proxy, tmp;
    if (typeof context === 'string') {
      tmp = fn[context];
      context = fn;
      fn = tmp;
    }
    args = Array.prototype.slice.call(arguments, 2);
    proxy = function() {
      fn.apply(context || this, args.concat(Array.prototype.slice.call(arguments)));
      return chainedObj;
    };
    return proxy;
  };
};


},{}],15:[function(require,module,exports){
var __slice = [].slice;

module.exports = (function() {
  return {
    callOnce: function(callbacks, listener) {
      var selfRemovingFunc;
      selfRemovingFunc = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        callbacks.remove(selfRemovingFunc);
        return listener.apply(this, args);
      };
      callbacks.add(selfRemovingFunc);
      return selfRemovingFunc;
    }
  };
})();


},{}],16:[function(require,module,exports){
module.exports = (function() {
  var idCounter, lastId;
  idCounter = lastId = void 0;
  return {
    next: function(user) {
      var nextId;
      if (user == null) {
        user = 'doc';
      }
      nextId = Date.now().toString(32);
      if (lastId === nextId) {
        idCounter += 1;
      } else {
        idCounter = 0;
        lastId = nextId;
      }
      return "" + user + "-" + nextId + idCounter;
    }
  };
})();


},{}],17:[function(require,module,exports){
var LimitedLocalstore, localstore;

localstore = require('./localstore');

module.exports = LimitedLocalstore = (function() {
  function LimitedLocalstore(key, limit) {
    this.key = key;
    this.limit = limit;
    this.limit || (this.limit = 10);
    this.index = void 0;
  }

  LimitedLocalstore.prototype.push = function(obj) {
    var index, reference, removeRef;
    reference = {
      key: this.nextKey(),
      date: Date.now()
    };
    index = this.getIndex();
    index.push(reference);
    while (index.length > this.limit) {
      removeRef = index[0];
      index.splice(0, 1);
      localstore.remove(removeRef.key);
    }
    localstore.set(reference.key, obj);
    return localstore.set("" + this.key + "--index", index);
  };

  LimitedLocalstore.prototype.pop = function() {
    var index, reference, value;
    index = this.getIndex();
    if (index && index.length) {
      reference = index.pop();
      value = localstore.get(reference.key);
      localstore.remove(reference.key);
      this.setIndex();
      return value;
    } else {
      return void 0;
    }
  };

  LimitedLocalstore.prototype.get = function(num) {
    var index, reference, value;
    index = this.getIndex();
    if (index && index.length) {
      num || (num = index.length - 1);
      reference = index[num];
      return value = localstore.get(reference.key);
    } else {
      return void 0;
    }
  };

  LimitedLocalstore.prototype.clear = function() {
    var index, reference;
    index = this.getIndex();
    while (reference = index.pop()) {
      localstore.remove(reference.key);
    }
    return this.setIndex();
  };

  LimitedLocalstore.prototype.getIndex = function() {
    this.index || (this.index = localstore.get("" + this.key + "--index") || []);
    return this.index;
  };

  LimitedLocalstore.prototype.setIndex = function() {
    if (this.index) {
      return localstore.set("" + this.key + "--index", this.index);
    }
  };

  LimitedLocalstore.prototype.nextKey = function() {
    var addendum;
    addendum = Math.floor(Math.random() * 1e16).toString(32);
    return "" + this.key + "-" + addendum;
  };

  return LimitedLocalstore;

})();


},{"./localstore":18}],18:[function(require,module,exports){
module.exports = (function(win) {
  var available, storage, storageName;
  available = void 0;
  storageName = 'localStorage';
  storage = win[storageName];
  return {
    set: function(key, value) {
      if (value == null) {
        return this.remove(key);
      }
      storage.setItem(key, this.serialize(value));
      return value;
    },
    get: function(key) {
      return this.deserialize(storage.getItem(key));
    },
    remove: function(key) {
      return storage.removeItem(key);
    },
    clear: function() {
      return storage.clear();
    },
    isSupported: function() {
      if (available != null) {
        return available;
      }
      return available = this.detectLocalstore();
    },
    serialize: function(value) {
      return JSON.stringify(value);
    },
    deserialize: function(value) {
      var error;
      if (typeof value !== 'string') {
        return void 0;
      }
      try {
        return JSON.parse(value);
      } catch (_error) {
        error = _error;
        return value || void 0;
      }
    },
    detectLocalstore: function() {
      var error, retrievedValue, testKey;
      if (win[storageName] == null) {
        return false;
      }
      testKey = '__localstore-feature-detection__';
      try {
        this.set(testKey, testKey);
        retrievedValue = this.get(testKey);
        this.remove(testKey);
        return retrievedValue === testKey;
      } catch (_error) {
        error = _error;
        return false;
      }
    }
  };
})(window);


},{}],19:[function(require,module,exports){
var assert, log;

log = require('./log');

module.exports = assert = function(condition, message) {
  if (!condition) {
    return log.error(message);
  }
};


},{"./log":20}],20:[function(require,module,exports){
var log,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = log = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  if (window.console != null) {
    if (args.length && args[args.length - 1] === 'trace') {
      args.pop();
      if (window.console.trace != null) {
        window.console.trace();
      }
    }
    window.console.log.apply(window.console, args);
    return void 0;
  }
};

(function() {
  var LivingdocsError, notify;
  LivingdocsError = (function(_super) {
    __extends(LivingdocsError, _super);

    function LivingdocsError(message) {
      LivingdocsError.__super__.constructor.apply(this, arguments);
      this.message = message;
      this.thrownByLivingdocs = true;
    }

    return LivingdocsError;

  })(Error);
  notify = function(message, level) {
    if (level == null) {
      level = 'error';
    }
    if (typeof _rollbar !== "undefined" && _rollbar !== null) {
      _rollbar.push(new Error(message), function() {
        var _ref;
        if ((level === 'critical' || level === 'error') && (((_ref = window.console) != null ? _ref.error : void 0) != null)) {
          return window.console.error.call(window.console, message);
        } else {
          return log.call(void 0, message);
        }
      });
    } else {
      if (level === 'critical' || level === 'error') {
        throw new LivingdocsError(message);
      } else {
        log.call(void 0, message);
      }
    }
    return void 0;
  };
  log.debug = function(message) {
    if (!log.debugDisabled) {
      return notify(message, 'debug');
    }
  };
  log.warn = function(message) {
    if (!log.warningsDisabled) {
      return notify(message, 'warning');
    }
  };
  return log.error = function(message) {
    return notify(message, 'error');
  };
})();


},{}],21:[function(require,module,exports){
var Semaphore, assert;

assert = require('../modules/logging/assert');

module.exports = Semaphore = (function() {
  function Semaphore() {
    this.count = 0;
    this.started = false;
    this.wasFired = false;
    this.callbacks = [];
  }

  Semaphore.prototype.addCallback = function(callback) {
    if (this.wasFired) {
      return callback();
    } else {
      return this.callbacks.push(callback);
    }
  };

  Semaphore.prototype.isReady = function() {
    return this.wasFired;
  };

  Semaphore.prototype.start = function() {
    assert(!this.started, "Unable to start Semaphore once started.");
    this.started = true;
    return this.fireIfReady();
  };

  Semaphore.prototype.increment = function() {
    assert(!this.wasFired, "Unable to increment count once Semaphore is fired.");
    return this.count += 1;
  };

  Semaphore.prototype.decrement = function() {
    assert(this.count > 0, "Unable to decrement count resulting in negative count.");
    this.count -= 1;
    return this.fireIfReady();
  };

  Semaphore.prototype.wait = function() {
    this.increment();
    return (function(_this) {
      return function() {
        return _this.decrement();
      };
    })(this);
  };

  Semaphore.prototype.fireIfReady = function() {
    var callback, _i, _len, _ref, _results;
    if (this.count === 0 && this.started === true) {
      this.wasFired = true;
      _ref = this.callbacks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback());
      }
      return _results;
    }
  };

  return Semaphore;

})();


},{"../modules/logging/assert":19}],22:[function(require,module,exports){
module.exports = (function() {
  return {
    isEmpty: function(obj) {
      var name;
      if (obj == null) {
        return true;
      }
      for (name in obj) {
        if (obj.hasOwnProperty(name)) {
          return false;
        }
      }
      return true;
    },
    flatCopy: function(obj) {
      var copy, name, value;
      copy = void 0;
      for (name in obj) {
        value = obj[name];
        copy || (copy = {});
        copy[name] = value;
      }
      return copy;
    }
  };
})();


},{}],23:[function(require,module,exports){
var LimitedLocalstore, assert, document, words;

assert = require('./logging/assert');

LimitedLocalstore = require('./limited_localstore');

words = require('./words');

document = require('../document');

module.exports = (function() {
  var initialized;
  initialized = false;
  return {
    init: function() {
      if (!initialized) {
        initialized = true;
        return this.store = new LimitedLocalstore('stash', 10);
      }
    },
    snapshot: function() {
      return this.store.push(document.toJson());
    },
    stash: function() {
      this.snapshot();
      return document.reset();
    },
    "delete": function() {
      return this.store.pop();
    },
    get: function() {
      return this.store.get();
    },
    restore: function() {
      var json;
      json = this.store.get();
      assert(json, 'stash is empty');
      return document.restore(json);
    },
    list: function() {
      var entries, obj;
      entries = (function() {
        var _i, _len, _ref, _results;
        _ref = this.store.getIndex();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          _results.push({
            key: obj.key,
            date: new Date(obj.date).toString()
          });
        }
        return _results;
      }).call(this);
      return words.readableJson(entries);
    }
  };
})();


},{"../document":5,"./limited_localstore":17,"./logging/assert":19,"./words":24}],24:[function(require,module,exports){
module.exports = (function() {
  return {
    humanize: function(str) {
      var uncamelized;
      uncamelized = $.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1 $2').toLowerCase();
      return this.titleize(uncamelized);
    },
    capitalize: function(str) {
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    titleize: function(str) {
      if (str == null) {
        return '';
      } else {
        return String(str).replace(/(?:^|\s)\S/g, function(c) {
          return c.toUpperCase();
        });
      }
    },
    snakeCase: function(str) {
      return $.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },
    prefix: function(prefix, string) {
      if (string.indexOf(prefix) === 0) {
        return string;
      } else {
        return "" + prefix + string;
      }
    },
    readableJson: function(obj) {
      return JSON.stringify(obj, null, 2);
    },
    camelize: function(str) {
      return $.trim(str).replace(/[-_\s]+(.)?/g, function(match, c) {
        return c.toUpperCase();
      });
    },
    trim: function(str) {
      return str.replace(/^\s+|\s+$/g, '');
    }
  };
})();


},{}],25:[function(require,module,exports){
var Renderer, Semaphore, assert, log;

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

Semaphore = require('../modules/semaphore');

module.exports = Renderer = (function() {
  function Renderer(_arg) {
    this.snippetTree = _arg.snippetTree, this.renderingContainer = _arg.renderingContainer;
    assert(this.snippetTree, 'no snippet tree specified');
    assert(this.renderingContainer, 'no rendering container specified');
    this.$root = $(this.renderingContainer.renderNode);
    this.setupSnippetTreeListeners();
    this.snippetViews = {};
    this.readySemaphore = new Semaphore();
    this.renderOncePageReady();
    this.readySemaphore.start();
  }

  Renderer.prototype.renderOncePageReady = function() {
    this.readySemaphore.increment();
    return this.renderingContainer.ready((function(_this) {
      return function() {
        _this.render();
        return _this.readySemaphore.decrement();
      };
    })(this));
  };

  Renderer.prototype.ready = function(callback) {
    return this.readySemaphore.addCallback(callback);
  };

  Renderer.prototype.isReady = function() {
    return this.readySemaphore.isReady();
  };

  Renderer.prototype.html = function() {
    assert(this.isReady(), 'Cannot generate html. Renderer is not ready.');
    return this.renderingContainer.html();
  };

  Renderer.prototype.setupSnippetTreeListeners = function() {
    this.snippetTree.snippetAdded.add($.proxy(this.snippetAdded, this));
    this.snippetTree.snippetRemoved.add($.proxy(this.snippetRemoved, this));
    this.snippetTree.snippetMoved.add($.proxy(this.snippetMoved, this));
    this.snippetTree.snippetContentChanged.add($.proxy(this.snippetContentChanged, this));
    return this.snippetTree.snippetHtmlChanged.add($.proxy(this.snippetHtmlChanged, this));
  };

  Renderer.prototype.snippetAdded = function(model) {
    return this.insertSnippet(model);
  };

  Renderer.prototype.snippetRemoved = function(model) {
    this.removeSnippet(model);
    return this.deleteCachedSnippetViewForSnippet(model);
  };

  Renderer.prototype.snippetMoved = function(model) {
    this.removeSnippet(model);
    return this.insertSnippet(model);
  };

  Renderer.prototype.snippetContentChanged = function(model) {
    return this.snippetViewForSnippet(model).updateContent();
  };

  Renderer.prototype.snippetHtmlChanged = function(model) {
    return this.snippetViewForSnippet(model).updateHtml();
  };

  Renderer.prototype.snippetViewForSnippet = function(model) {
    var _base, _name;
    return (_base = this.snippetViews)[_name = model.id] || (_base[_name] = model.createView(this.renderingContainer.isReadOnly));
  };

  Renderer.prototype.deleteCachedSnippetViewForSnippet = function(model) {
    return delete this.snippetViews[model.id];
  };

  Renderer.prototype.render = function() {
    return this.snippetTree.each((function(_this) {
      return function(model) {
        return _this.insertSnippet(model);
      };
    })(this));
  };

  Renderer.prototype.clear = function() {
    this.snippetTree.each((function(_this) {
      return function(model) {
        return _this.snippetViewForSnippet(model).setAttachedToDom(false);
      };
    })(this));
    return this.$root.empty();
  };

  Renderer.prototype.redraw = function() {
    this.clear();
    return this.render();
  };

  Renderer.prototype.insertSnippet = function(model) {
    var snippetView;
    if (this.isSnippetAttached(model)) {
      return;
    }
    if (this.isSnippetAttached(model.previous)) {
      this.insertSnippetAsSibling(model.previous, model);
    } else if (this.isSnippetAttached(model.next)) {
      this.insertSnippetAsSibling(model.next, model);
    } else if (model.parentContainer) {
      this.appendSnippetToParentContainer(model);
    } else {
      log.error('Snippet could not be inserted by renderer.');
    }
    snippetView = this.snippetViewForSnippet(model);
    snippetView.setAttachedToDom(true);
    this.renderingContainer.snippetViewWasInserted(snippetView);
    return this.attachChildSnippets(model);
  };

  Renderer.prototype.isSnippetAttached = function(model) {
    return model && this.snippetViewForSnippet(model).isAttachedToDom;
  };

  Renderer.prototype.attachChildSnippets = function(model) {
    return model.children((function(_this) {
      return function(childModel) {
        if (!_this.isSnippetAttached(childModel)) {
          return _this.insertSnippet(childModel);
        }
      };
    })(this));
  };

  Renderer.prototype.insertSnippetAsSibling = function(sibling, model) {
    var method;
    method = sibling === model.previous ? 'after' : 'before';
    return this.$nodeForSnippet(sibling)[method](this.$nodeForSnippet(model));
  };

  Renderer.prototype.appendSnippetToParentContainer = function(model) {
    return this.$nodeForSnippet(model).appendTo(this.$nodeForContainer(model.parentContainer));
  };

  Renderer.prototype.$nodeForSnippet = function(model) {
    return this.snippetViewForSnippet(model).$html;
  };

  Renderer.prototype.$nodeForContainer = function(container) {
    var parentView;
    if (container.isRoot) {
      return this.$root;
    } else {
      parentView = this.snippetViewForSnippet(container.parentSnippet);
      return $(parentView.getDirectiveElement(container.name));
    }
  };

  Renderer.prototype.removeSnippet = function(model) {
    this.snippetViewForSnippet(model).setAttachedToDom(false);
    return this.$nodeForSnippet(model).detach();
  };

  return Renderer;

})();


},{"../modules/logging/assert":19,"../modules/logging/log":20,"../modules/semaphore":21}],26:[function(require,module,exports){
var DirectiveIterator, SnippetView, config, dom, eventing;

config = require('../configuration/defaults');

DirectiveIterator = require('../template/directive_iterator');

eventing = require('../modules/eventing');

dom = require('../interaction/dom');

module.exports = SnippetView = (function() {
  function SnippetView(_arg) {
    this.model = _arg.model, this.$html = _arg.$html, this.directives = _arg.directives, this.isReadOnly = _arg.isReadOnly;
    this.template = this.model.template;
    this.isAttachedToDom = false;
    this.wasAttachedToDom = $.Callbacks();
    if (!this.isReadOnly) {
      this.$html.data('snippet', this).addClass(config.html.css['snippet']).attr(config.html.attr['template'], this.template.identifier);
    }
    this.render();
  }

  SnippetView.prototype.render = function(mode) {
    this.updateContent();
    return this.updateHtml();
  };

  SnippetView.prototype.updateContent = function() {
    this.content(this.model.content);
    if (!this.hasFocus()) {
      this.displayOptionals();
    }
    return this.stripHtmlIfReadOnly();
  };

  SnippetView.prototype.updateHtml = function() {
    var name, value, _ref;
    _ref = this.model.styles;
    for (name in _ref) {
      value = _ref[name];
      this.style(name, value);
    }
    return this.stripHtmlIfReadOnly();
  };

  SnippetView.prototype.displayOptionals = function() {
    return this.directives.each((function(_this) {
      return function(directive) {
        var $elem;
        if (directive.optional) {
          $elem = $(directive.elem);
          if (_this.model.isEmpty(directive.name)) {
            return $elem.css('display', 'none');
          } else {
            return $elem.css('display', '');
          }
        }
      };
    })(this));
  };

  SnippetView.prototype.showOptionals = function() {
    return this.directives.each((function(_this) {
      return function(directive) {
        if (directive.optional) {
          return config.animations.optionals.show($(directive.elem));
        }
      };
    })(this));
  };

  SnippetView.prototype.hideEmptyOptionals = function() {
    return this.directives.each((function(_this) {
      return function(directive) {
        if (directive.optional && _this.model.isEmpty(directive.name)) {
          return config.animations.optionals.hide($(directive.elem));
        }
      };
    })(this));
  };

  SnippetView.prototype.next = function() {
    return this.$html.next().data('snippet');
  };

  SnippetView.prototype.prev = function() {
    return this.$html.prev().data('snippet');
  };

  SnippetView.prototype.afterFocused = function() {
    this.$html.addClass(config.html.css.snippetHighlight);
    return this.showOptionals();
  };

  SnippetView.prototype.afterBlurred = function() {
    this.$html.removeClass(config.html.css.snippetHighlight);
    return this.hideEmptyOptionals();
  };

  SnippetView.prototype.focus = function(cursor) {
    var first, _ref;
    first = (_ref = this.directives.editable) != null ? _ref[0].elem : void 0;
    return $(first).focus();
  };

  SnippetView.prototype.hasFocus = function() {
    return this.$html.hasClass(config.html.css.snippetHighlight);
  };

  SnippetView.prototype.getBoundingClientRect = function() {
    return dom.getBoundingClientRect(this.$html[0]);
  };

  SnippetView.prototype.content = function(content) {
    var name, value, _results;
    _results = [];
    for (name in content) {
      value = content[name];
      _results.push(this.set(name, value));
    }
    return _results;
  };

  SnippetView.prototype.set = function(name, value) {
    var directive;
    directive = this.directives.get(name);
    switch (directive.type) {
      case 'editable':
        return this.setEditable(name, value);
      case 'image':
        return this.setImage(name, value);
      case 'html':
        return this.setHtml(name, value);
    }
  };

  SnippetView.prototype.get = function(name) {
    var directive;
    directive = this.directives.get(name);
    switch (directive.type) {
      case 'editable':
        return this.getEditable(name);
      case 'image':
        return this.getImage(name);
      case 'html':
        return this.getHtml(name);
    }
  };

  SnippetView.prototype.getEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.html();
  };

  SnippetView.prototype.setEditable = function(name, value) {
    var $elem, placeholder;
    $elem = this.directives.$getElem(name);
    placeholder = value ? config.zeroWidthCharacter : this.template.defaults[name];
    $elem.attr(config.html.attr.placeholder, placeholder);
    return $elem.html(value || '');
  };

  SnippetView.prototype.focusEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.attr(config.html.attr.placeholder, config.zeroWidthCharacter);
  };

  SnippetView.prototype.blurEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    if (this.model.isEmpty(name)) {
      return $elem.attr(config.html.attr.placeholder, this.template.defaults[name]);
    }
  };

  SnippetView.prototype.getHtml = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.html();
  };

  SnippetView.prototype.setHtml = function(name, value) {
    var $elem;
    $elem = this.directives.$getElem(name);
    $elem.html(value || '');
    if (!value) {
      $elem.html(this.template.defaults[name]);
    } else if (value && !this.isReadOnly) {
      this.blockInteraction($elem);
    }
    this.directivesToReset || (this.directivesToReset = {});
    return this.directivesToReset[name] = name;
  };

  SnippetView.prototype.getDirectiveElement = function(directiveName) {
    var _ref;
    return (_ref = this.directives.get(directiveName)) != null ? _ref.elem : void 0;
  };

  SnippetView.prototype.resetDirectives = function() {
    var $elem, name, _results;
    _results = [];
    for (name in this.directivesToReset) {
      $elem = this.directives.$getElem(name);
      if ($elem.find('iframe').length) {
        _results.push(this.set(name, this.model.content[name]));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SnippetView.prototype.getImage = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.attr('src');
  };

  SnippetView.prototype.setImage = function(name, value) {
    var $elem, setPlaceholder;
    $elem = this.directives.$getElem(name);
    if (value) {
      this.cancelDelayed(name);
      return this.setImageAttribute($elem, value);
    } else {
      setPlaceholder = $.proxy(this.setPlaceholderImage, this, $elem);
      return this.delayUntilAttached(name, setPlaceholder);
    }
  };

  SnippetView.prototype.setImageAttribute = function($elem, value) {
    if ($elem[0].nodeName === 'IMG') {
      return $elem.attr('src', value);
    } else {
      return $elem.attr('style', "background-image:url(" + value + ")");
    }
  };

  SnippetView.prototype.setPlaceholderImage = function($elem) {
    var height, value, width;
    if ($elem[0].nodeName === 'IMG') {
      width = $elem.width();
      height = $elem.height();
    } else {
      width = $elem.outerWidth();
      height = $elem.outerHeight();
    }
    value = "http://placehold.it/" + width + "x" + height + "/BEF56F/B2E668";
    return this.setImageAttribute($elem, value);
  };

  SnippetView.prototype.style = function(name, className) {
    var changes, removeClass, _i, _len, _ref;
    changes = this.template.styles[name].cssClassChanges(className);
    if (changes.remove) {
      _ref = changes.remove;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        removeClass = _ref[_i];
        this.$html.removeClass(removeClass);
      }
    }
    return this.$html.addClass(changes.add);
  };

  SnippetView.prototype.disableTabbing = function($elem) {
    return setTimeout((function(_this) {
      return function() {
        return $elem.find('iframe').attr('tabindex', '-1');
      };
    })(this), 400);
  };

  SnippetView.prototype.blockInteraction = function($elem) {
    var $blocker;
    this.ensureRelativePosition($elem);
    $blocker = $("<div class='" + config.html.css.interactionBlocker + "'>").attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;');
    $elem.append($blocker);
    return this.disableTabbing($elem);
  };

  SnippetView.prototype.ensureRelativePosition = function($elem) {
    var position;
    position = $elem.css('position');
    if (position !== 'absolute' && position !== 'fixed' && position !== 'relative') {
      return $elem.css('position', 'relative');
    }
  };

  SnippetView.prototype.get$container = function() {
    return $(dom.findContainer(this.$html[0]).node);
  };

  SnippetView.prototype.delayUntilAttached = function(name, func) {
    if (this.isAttachedToDom) {
      return func();
    } else {
      this.cancelDelayed(name);
      this.delayed || (this.delayed = {});
      return this.delayed[name] = eventing.callOnce(this.wasAttachedToDom, (function(_this) {
        return function() {
          _this.delayed[name] = void 0;
          return func();
        };
      })(this));
    }
  };

  SnippetView.prototype.cancelDelayed = function(name) {
    var _ref;
    if ((_ref = this.delayed) != null ? _ref[name] : void 0) {
      this.wasAttachedToDom.remove(this.delayed[name]);
      return this.delayed[name] = void 0;
    }
  };

  SnippetView.prototype.stripHtmlIfReadOnly = function() {
    var elem, iterator, _results;
    if (!this.isReadOnly) {
      return;
    }
    iterator = new DirectiveIterator(this.$html[0]);
    _results = [];
    while (elem = iterator.nextElement()) {
      this.stripDocClasses(elem);
      this.stripDocAttributes(elem);
      _results.push(this.stripEmptyAttributes(elem));
    }
    return _results;
  };

  SnippetView.prototype.stripDocClasses = function(elem) {
    var $elem, klass, _i, _len, _ref, _results;
    $elem = $(elem);
    _ref = elem.className.split(/\s+/);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      klass = _ref[_i];
      if (/doc\-.*/i.test(klass)) {
        _results.push($elem.removeClass(klass));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SnippetView.prototype.stripDocAttributes = function(elem) {
    var $elem, attribute, name, _i, _len, _ref, _results;
    $elem = $(elem);
    _ref = Array.prototype.slice.apply(elem.attributes);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      attribute = _ref[_i];
      name = attribute.name;
      if (/data\-doc\-.*/i.test(name)) {
        _results.push($elem.removeAttr(name));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SnippetView.prototype.stripEmptyAttributes = function(elem) {
    var $elem, attribute, isEmptyAttribute, isStrippableAttribute, strippableAttributes, _i, _len, _ref, _results;
    $elem = $(elem);
    strippableAttributes = ['style', 'class'];
    _ref = Array.prototype.slice.apply(elem.attributes);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      attribute = _ref[_i];
      isStrippableAttribute = strippableAttributes.indexOf(attribute.name) >= 0;
      isEmptyAttribute = attribute.value.trim() === '';
      if (isStrippableAttribute && isEmptyAttribute) {
        _results.push($elem.removeAttr(attribute.name));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SnippetView.prototype.setAttachedToDom = function(newVal) {
    if (newVal === this.isAttachedToDom) {
      return;
    }
    this.isAttachedToDom = newVal;
    if (newVal) {
      this.resetDirectives();
      return this.wasAttachedToDom.fire();
    }
  };

  return SnippetView;

})();


},{"../configuration/defaults":2,"../interaction/dom":6,"../modules/eventing":15,"../template/directive_iterator":39}],27:[function(require,module,exports){
var CssLoader, Semaphore;

Semaphore = require('../modules/semaphore');

module.exports = CssLoader = (function() {
  function CssLoader(window) {
    this.window = window;
    this.loadedUrls = [];
  }

  CssLoader.prototype.load = function(urls, callback) {
    var semaphore, url, _i, _len;
    if (callback == null) {
      callback = $.noop;
    }
    if (!$.isArray(urls)) {
      urls = [urls];
    }
    semaphore = new Semaphore();
    semaphore.addCallback(callback);
    for (_i = 0, _len = urls.length; _i < _len; _i++) {
      url = urls[_i];
      this.loadSingleUrl(url, semaphore.wait());
    }
    return semaphore.start();
  };

  CssLoader.prototype.loadSingleUrl = function(url, callback) {
    var link;
    if (callback == null) {
      callback = $.noop;
    }
    if (this.isUrlLoaded(url)) {
      return callback();
    } else {
      link = $('<link rel="stylesheet" type="text/css" />')[0];
      link.onload = callback;
      link.href = url;
      this.window.document.head.appendChild(link);
      return this.markUrlAsLoaded(url);
    }
  };

  CssLoader.prototype.isUrlLoaded = function(url) {
    return this.loadedUrls.indexOf(url) >= 0;
  };

  CssLoader.prototype.markUrlAsLoaded = function(url) {
    return this.loadedUrls.push(url);
  };

  return CssLoader;

})();


},{"../modules/semaphore":21}],28:[function(require,module,exports){
var DragDrop, EditableController, Focus, InteractivePage, Page, SnippetDrag, config, dom,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

config = require('../configuration/defaults');

Page = require('./page');

dom = require('../interaction/dom');

Focus = require('../interaction/focus');

EditableController = require('../interaction/editable_controller');

DragDrop = require('../interaction/drag_drop');

SnippetDrag = require('../interaction/snippet_drag');

module.exports = InteractivePage = (function(_super) {
  var LEFT_MOUSE_BUTTON;

  __extends(InteractivePage, _super);

  LEFT_MOUSE_BUTTON = 1;

  InteractivePage.prototype.isReadOnly = false;

  function InteractivePage(_arg) {
    var hostWindow, renderNode, _ref;
    _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, hostWindow = _ref.hostWindow;
    InteractivePage.__super__.constructor.apply(this, arguments);
    this.focus = new Focus();
    this.editableController = new EditableController(this);
    this.imageClick = $.Callbacks();
    this.htmlElementClick = $.Callbacks();
    this.snippetWillBeDragged = $.Callbacks();
    this.snippetWasDropped = $.Callbacks();
    this.snippetDragDrop = new DragDrop({
      longpressDelay: 400,
      longpressDistanceLimit: 10,
      preventDefault: false
    });
    this.focus.snippetFocus.add($.proxy(this.afterSnippetFocused, this));
    this.focus.snippetBlur.add($.proxy(this.afterSnippetBlurred, this));
    this.$document.on('click.livingdocs', $.proxy(this.click, this)).on('mousedown.livingdocs', $.proxy(this.mousedown, this)).on('touchstart.livingdocs', $.proxy(this.mousedown, this)).on('dragstart', $.proxy(this.browserDragStart, this));
  }

  InteractivePage.prototype.browserDragStart = function(event) {
    event.preventDefault();
    return event.stopPropagation();
  };

  InteractivePage.prototype.removeListeners = function() {
    this.$document.off('.livingdocs');
    return this.$document.off('.livingdocs-drag');
  };

  InteractivePage.prototype.mousedown = function(event) {
    var snippetView;
    if (event.which !== LEFT_MOUSE_BUTTON && event.type === 'mousedown') {
      return;
    }
    snippetView = dom.findSnippetView(event.target);
    if (snippetView) {
      return this.startDrag({
        snippetView: snippetView,
        dragDrop: this.snippetDragDrop,
        event: event
      });
    }
  };

  InteractivePage.prototype.registerDragStopEvents = function(dragDrop, event) {
    var eventNames;
    eventNames = event.type === 'touchstart' ? 'touchend.livingdocs-drag touchcancel.livingdocs-drag touchleave.livingdocs-drag' : 'mouseup.livingdocs-drag';
    return this.$document.on(eventNames, (function(_this) {
      return function() {
        dragDrop.drop();
        return _this.$document.off('.livingdocs-drag');
      };
    })(this));
  };

  InteractivePage.prototype.registerDragMoveEvents = function(dragDrop, event) {
    if (event.type === 'touchstart') {
      return this.$document.on('touchmove.livingdocs-drag', function(event) {
        event.preventDefault();
        return dragDrop.move(event.originalEvent.changedTouches[0].pageX, event.originalEvent.changedTouches[0].pageY, event);
      });
    } else {
      return this.$document.on('mousemove.livingdocs-drag', function(event) {
        return dragDrop.move(event.pageX, event.pageY, event);
      });
    }
  };

  InteractivePage.prototype.startDrag = function(_arg) {
    var $snippet, dragDrop, event, snippet, snippetDrag, snippetView;
    snippet = _arg.snippet, snippetView = _arg.snippetView, dragDrop = _arg.dragDrop, event = _arg.event;
    if (!(snippet || snippetView)) {
      return;
    }
    if (snippetView) {
      snippet = snippetView.model;
    }
    this.registerDragMoveEvents(dragDrop, event);
    this.registerDragStopEvents(dragDrop, event);
    snippetDrag = new SnippetDrag({
      snippet: snippet,
      page: this
    });
    if (snippetView) {
      $snippet = snippetView.$html;
    }
    return dragDrop.mousedown($snippet, event, {
      onDragStart: snippetDrag.onStart,
      onDrag: snippetDrag.onDrag,
      onDrop: snippetDrag.onDrop
    });
  };

  InteractivePage.prototype.click = function(event) {
    var nodeContext, snippetView;
    snippetView = dom.findSnippetView(event.target);
    nodeContext = dom.findNodeContext(event.target);
    if (snippetView) {
      this.focus.snippetFocused(snippetView);
      if (nodeContext) {
        switch (nodeContext.contextAttr) {
          case config.directives.image.renderedAttr:
            return this.imageClick.fire(snippetView, nodeContext.attrName, event);
          case config.directives.html.renderedAttr:
            return this.htmlElementClick.fire(snippetView, nodeContext.attrName, event);
        }
      }
    } else {
      return this.focus.blur();
    }
  };

  InteractivePage.prototype.getFocusedElement = function() {
    return window.document.activeElement;
  };

  InteractivePage.prototype.blurFocusedElement = function() {
    var focusedElement;
    this.focus.setFocus(void 0);
    focusedElement = this.getFocusedElement();
    if (focusedElement) {
      return $(focusedElement).blur();
    }
  };

  InteractivePage.prototype.snippetViewWasInserted = function(snippetView) {
    return this.initializeEditables(snippetView);
  };

  InteractivePage.prototype.initializeEditables = function(snippetView) {
    var directive, editableNodes;
    if (snippetView.directives.editable) {
      editableNodes = (function() {
        var _i, _len, _ref, _results;
        _ref = snippetView.directives.editable;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          directive = _ref[_i];
          _results.push(directive.elem);
        }
        return _results;
      })();
      return this.editableController.add(editableNodes);
    }
  };

  InteractivePage.prototype.afterSnippetFocused = function(snippetView) {
    return snippetView.afterFocused();
  };

  InteractivePage.prototype.afterSnippetBlurred = function(snippetView) {
    return snippetView.afterBlurred();
  };

  return InteractivePage;

})(Page);


},{"../configuration/defaults":2,"../interaction/dom":6,"../interaction/drag_drop":7,"../interaction/editable_controller":8,"../interaction/focus":9,"../interaction/snippet_drag":10,"./page":29}],29:[function(require,module,exports){
var CssLoader, Page, RenderingContainer, config,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

RenderingContainer = require('./rendering_container');

CssLoader = require('./css_loader');

config = require('../configuration/defaults');

module.exports = Page = (function(_super) {
  __extends(Page, _super);

  function Page(_arg) {
    var hostWindow, readOnly, renderNode, _ref;
    _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, readOnly = _ref.readOnly, hostWindow = _ref.hostWindow, this.design = _ref.design;
    if (readOnly != null) {
      this.isReadOnly = readOnly;
    }
    this.setWindow(hostWindow);
    Page.__super__.constructor.call(this);
    renderNode = renderNode || $("." + config.html.css.section, this.$body);
    if (renderNode.jquery) {
      this.renderNode = renderNode[0];
    } else {
      this.renderNode = renderNode;
    }
  }

  Page.prototype.beforeReady = function() {
    var _ref;
    this.cssLoader = new CssLoader(this.window);
    if ((_ref = this.design) != null ? _ref.css : void 0) {
      return this.cssLoader.load(this.design.css, this.readySemaphore.wait());
    }
  };

  Page.prototype.setWindow = function(hostWindow) {
    this.window = hostWindow || window;
    this.document = this.window.document;
    this.$document = $(this.document);
    return this.$body = $(this.document.body);
  };

  return Page;

})(RenderingContainer);


},{"../configuration/defaults":2,"./css_loader":27,"./rendering_container":30}],30:[function(require,module,exports){
var RenderingContainer, Semaphore;

Semaphore = require('../modules/semaphore');

module.exports = RenderingContainer = (function() {
  RenderingContainer.prototype.isReadOnly = true;

  function RenderingContainer() {
    this.renderNode = $('<div/>')[0];
    this.readySemaphore = new Semaphore();
    this.beforeReady();
    this.readySemaphore.start();
  }

  RenderingContainer.prototype.html = function() {
    return $(this.renderNode).html();
  };

  RenderingContainer.prototype.snippetViewWasInserted = function(snippetView) {};

  RenderingContainer.prototype.beforeReady = function() {};

  RenderingContainer.prototype.ready = function(callback) {
    return this.readySemaphore.addCallback(callback);
  };

  return RenderingContainer;

})();


},{"../modules/semaphore":21}],31:[function(require,module,exports){
var SnippetArray;

module.exports = SnippetArray = (function() {
  function SnippetArray(snippets) {
    this.snippets = snippets;
    if (this.snippets == null) {
      this.snippets = [];
    }
    this.createPseudoArray();
  }

  SnippetArray.prototype.createPseudoArray = function() {
    var index, result, _i, _len, _ref;
    _ref = this.snippets;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      result = _ref[index];
      this[index] = result;
    }
    this.length = this.snippets.length;
    if (this.snippets.length) {
      this.first = this[0];
      return this.last = this[this.snippets.length - 1];
    }
  };

  SnippetArray.prototype.each = function(callback) {
    var snippet, _i, _len, _ref;
    _ref = this.snippets;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      snippet = _ref[_i];
      callback(snippet);
    }
    return this;
  };

  SnippetArray.prototype.remove = function() {
    this.each(function(snippet) {
      return snippet.remove();
    });
    return this;
  };

  return SnippetArray;

})();


},{}],32:[function(require,module,exports){
var SnippetContainer, assert;

assert = require('../modules/logging/assert');

module.exports = SnippetContainer = (function() {
  function SnippetContainer(_arg) {
    var isRoot;
    this.parentSnippet = _arg.parentSnippet, this.name = _arg.name, isRoot = _arg.isRoot;
    this.isRoot = isRoot != null;
    this.first = this.last = void 0;
  }

  SnippetContainer.prototype.prepend = function(snippet) {
    if (this.first) {
      this.insertBefore(this.first, snippet);
    } else {
      this.attachSnippet(snippet);
    }
    return this;
  };

  SnippetContainer.prototype.append = function(snippet) {
    if (this.parentSnippet) {
      assert(snippet !== this.parentSnippet, 'cannot append snippet to itself');
    }
    if (this.last) {
      this.insertAfter(this.last, snippet);
    } else {
      this.attachSnippet(snippet);
    }
    return this;
  };

  SnippetContainer.prototype.insertBefore = function(snippet, insertedSnippet) {
    var position;
    if (snippet.previous === insertedSnippet) {
      return;
    }
    assert(snippet !== insertedSnippet, 'cannot insert snippet before itself');
    position = {
      previous: snippet.previous,
      next: snippet,
      parentContainer: snippet.parentContainer
    };
    return this.attachSnippet(insertedSnippet, position);
  };

  SnippetContainer.prototype.insertAfter = function(snippet, insertedSnippet) {
    var position;
    if (snippet.next === insertedSnippet) {
      return;
    }
    assert(snippet !== insertedSnippet, 'cannot insert snippet after itself');
    position = {
      previous: snippet,
      next: snippet.next,
      parentContainer: snippet.parentContainer
    };
    return this.attachSnippet(insertedSnippet, position);
  };

  SnippetContainer.prototype.up = function(snippet) {
    if (snippet.previous != null) {
      return this.insertBefore(snippet.previous, snippet);
    }
  };

  SnippetContainer.prototype.down = function(snippet) {
    if (snippet.next != null) {
      return this.insertAfter(snippet.next, snippet);
    }
  };

  SnippetContainer.prototype.getSnippetTree = function() {
    var _ref;
    return this.snippetTree || ((_ref = this.parentSnippet) != null ? _ref.snippetTree : void 0);
  };

  SnippetContainer.prototype.each = function(callback) {
    var snippet, _results;
    snippet = this.first;
    _results = [];
    while (snippet) {
      snippet.descendantsAndSelf(callback);
      _results.push(snippet = snippet.next);
    }
    return _results;
  };

  SnippetContainer.prototype.eachContainer = function(callback) {
    callback(this);
    return this.each(function(snippet) {
      var name, snippetContainer, _ref, _results;
      _ref = snippet.containers;
      _results = [];
      for (name in _ref) {
        snippetContainer = _ref[name];
        _results.push(callback(snippetContainer));
      }
      return _results;
    });
  };

  SnippetContainer.prototype.all = function(callback) {
    callback(this);
    return this.each(function(snippet) {
      var name, snippetContainer, _ref, _results;
      callback(snippet);
      _ref = snippet.containers;
      _results = [];
      for (name in _ref) {
        snippetContainer = _ref[name];
        _results.push(callback(snippetContainer));
      }
      return _results;
    });
  };

  SnippetContainer.prototype.remove = function(snippet) {
    snippet.destroy();
    return this._detachSnippet(snippet);
  };

  SnippetContainer.prototype.ui = function() {
    var snippetTree;
    if (!this.uiInjector) {
      snippetTree = this.getSnippetTree();
      snippetTree.renderer.createInterfaceInjector(this);
    }
    return this.uiInjector;
  };

  SnippetContainer.prototype.attachSnippet = function(snippet, position) {
    var func, snippetTree;
    if (position == null) {
      position = {};
    }
    func = (function(_this) {
      return function() {
        return _this.link(snippet, position);
      };
    })(this);
    if (snippetTree = this.getSnippetTree()) {
      return snippetTree.attachingSnippet(snippet, func);
    } else {
      return func();
    }
  };

  SnippetContainer.prototype._detachSnippet = function(snippet) {
    var func, snippetTree;
    func = (function(_this) {
      return function() {
        return _this.unlink(snippet);
      };
    })(this);
    if (snippetTree = this.getSnippetTree()) {
      return snippetTree.detachingSnippet(snippet, func);
    } else {
      return func();
    }
  };

  SnippetContainer.prototype.link = function(snippet, position) {
    if (snippet.parentContainer) {
      this.unlink(snippet);
    }
    position.parentContainer || (position.parentContainer = this);
    return this.setSnippetPosition(snippet, position);
  };

  SnippetContainer.prototype.unlink = function(snippet) {
    var container, _ref, _ref1;
    container = snippet.parentContainer;
    if (container) {
      if (snippet.previous == null) {
        container.first = snippet.next;
      }
      if (snippet.next == null) {
        container.last = snippet.previous;
      }
      if ((_ref = snippet.next) != null) {
        _ref.previous = snippet.previous;
      }
      if ((_ref1 = snippet.previous) != null) {
        _ref1.next = snippet.next;
      }
      return this.setSnippetPosition(snippet, {});
    }
  };

  SnippetContainer.prototype.setSnippetPosition = function(snippet, _arg) {
    var next, parentContainer, previous;
    parentContainer = _arg.parentContainer, previous = _arg.previous, next = _arg.next;
    snippet.parentContainer = parentContainer;
    snippet.previous = previous;
    snippet.next = next;
    if (parentContainer) {
      if (previous) {
        previous.next = snippet;
      }
      if (next) {
        next.previous = snippet;
      }
      if (snippet.previous == null) {
        parentContainer.first = snippet;
      }
      if (snippet.next == null) {
        return parentContainer.last = snippet;
      }
    }
  };

  return SnippetContainer;

})();


},{"../modules/logging/assert":19}],33:[function(require,module,exports){
var SnippetContainer, SnippetModel, assert, guid, log, serialization;

SnippetContainer = require('./snippet_container');

guid = require('../modules/guid');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

serialization = require('../modules/serialization');

module.exports = SnippetModel = (function() {
  function SnippetModel(_arg) {
    var id, _ref;
    _ref = _arg != null ? _arg : {}, this.template = _ref.template, id = _ref.id;
    assert(this.template, 'cannot instantiate snippet without template reference');
    this.initializeDirectives();
    this.styles = {};
    this.id = id || guid.next();
    this.identifier = this.template.identifier;
    this.next = void 0;
    this.previous = void 0;
    this.snippetTree = void 0;
  }

  SnippetModel.prototype.initializeDirectives = function() {
    var directive, _i, _len, _ref, _results;
    _ref = this.template.directives;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      directive = _ref[_i];
      switch (directive.type) {
        case 'container':
          this.containers || (this.containers = {});
          _results.push(this.containers[directive.name] = new SnippetContainer({
            name: directive.name,
            parentSnippet: this
          }));
          break;
        case 'editable':
        case 'image':
        case 'html':
          this.content || (this.content = {});
          _results.push(this.content[directive.name] = void 0);
          break;
        default:
          _results.push(log.error("Template directive type '" + directive.type + "' not implemented in SnippetModel"));
      }
    }
    return _results;
  };

  SnippetModel.prototype.createView = function(isReadOnly) {
    return this.template.createView(this, isReadOnly);
  };

  SnippetModel.prototype.hasContainers = function() {
    return this.template.directives.count('container') > 0;
  };

  SnippetModel.prototype.hasEditables = function() {
    return this.template.directives.count('editable') > 0;
  };

  SnippetModel.prototype.hasHtml = function() {
    return this.template.directives.count('html') > 0;
  };

  SnippetModel.prototype.hasImages = function() {
    return this.template.directives.count('image') > 0;
  };

  SnippetModel.prototype.before = function(snippetModel) {
    if (snippetModel) {
      this.parentContainer.insertBefore(this, snippetModel);
      return this;
    } else {
      return this.previous;
    }
  };

  SnippetModel.prototype.after = function(snippetModel) {
    if (snippetModel) {
      this.parentContainer.insertAfter(this, snippetModel);
      return this;
    } else {
      return this.next;
    }
  };

  SnippetModel.prototype.append = function(containerName, snippetModel) {
    if (arguments.length === 1) {
      snippetModel = containerName;
      containerName = config.directives.container.defaultName;
    }
    this.containers[containerName].append(snippetModel);
    return this;
  };

  SnippetModel.prototype.prepend = function(containerName, snippetModel) {
    if (arguments.length === 1) {
      snippetModel = containerName;
      containerName = config.directives.container.defaultName;
    }
    this.containers[containerName].prepend(snippetModel);
    return this;
  };

  SnippetModel.prototype.set = function(name, value) {
    var _ref;
    assert((_ref = this.content) != null ? _ref.hasOwnProperty(name) : void 0, "set error: " + this.identifier + " has no content named " + name);
    if (this.content[name] !== value) {
      this.content[name] = value;
      if (this.snippetTree) {
        return this.snippetTree.contentChanging(this, name);
      }
    }
  };

  SnippetModel.prototype.get = function(name) {
    var _ref;
    assert((_ref = this.content) != null ? _ref.hasOwnProperty(name) : void 0, "get error: " + this.identifier + " has no content named " + name);
    return this.content[name];
  };

  SnippetModel.prototype.isEmpty = function(name) {
    var value;
    value = this.get(name);
    return value === void 0 || value === '';
  };

  SnippetModel.prototype.style = function(name, value) {
    if (arguments.length === 1) {
      return this.styles[name];
    } else {
      return this.setStyle(name, value);
    }
  };

  SnippetModel.prototype.setStyle = function(name, value) {
    var style;
    style = this.template.styles[name];
    if (!style) {
      return log.warn("Unknown style '" + name + "' in SnippetModel " + this.identifier);
    } else if (!style.validateValue(value)) {
      return log.warn("Invalid value '" + value + "' for style '" + name + "' in SnippetModel " + this.identifier);
    } else {
      if (this.styles[name] !== value) {
        this.styles[name] = value;
        if (this.snippetTree) {
          return this.snippetTree.htmlChanging(this, 'style', {
            name: name,
            value: value
          });
        }
      }
    }
  };

  SnippetModel.prototype.copy = function() {
    return log.warn("SnippetModel#copy() is not implemented yet.");
  };

  SnippetModel.prototype.copyWithoutContent = function() {
    return this.template.createModel();
  };

  SnippetModel.prototype.up = function() {
    this.parentContainer.up(this);
    return this;
  };

  SnippetModel.prototype.down = function() {
    this.parentContainer.down(this);
    return this;
  };

  SnippetModel.prototype.remove = function() {
    return this.parentContainer.remove(this);
  };

  SnippetModel.prototype.destroy = function() {
    if (this.uiInjector) {
      return this.uiInjector.remove();
    }
  };

  SnippetModel.prototype.getParent = function() {
    var _ref;
    return (_ref = this.parentContainer) != null ? _ref.parentSnippet : void 0;
  };

  SnippetModel.prototype.ui = function() {
    if (!this.uiInjector) {
      this.snippetTree.renderer.createInterfaceInjector(this);
    }
    return this.uiInjector;
  };

  SnippetModel.prototype.parents = function(callback) {
    var snippetModel, _results;
    snippetModel = this;
    _results = [];
    while ((snippetModel = snippetModel.getParent())) {
      _results.push(callback(snippetModel));
    }
    return _results;
  };

  SnippetModel.prototype.children = function(callback) {
    var name, snippetContainer, snippetModel, _ref, _results;
    _ref = this.containers;
    _results = [];
    for (name in _ref) {
      snippetContainer = _ref[name];
      snippetModel = snippetContainer.first;
      _results.push((function() {
        var _results1;
        _results1 = [];
        while (snippetModel) {
          callback(snippetModel);
          _results1.push(snippetModel = snippetModel.next);
        }
        return _results1;
      })());
    }
    return _results;
  };

  SnippetModel.prototype.descendants = function(callback) {
    var name, snippetContainer, snippetModel, _ref, _results;
    _ref = this.containers;
    _results = [];
    for (name in _ref) {
      snippetContainer = _ref[name];
      snippetModel = snippetContainer.first;
      _results.push((function() {
        var _results1;
        _results1 = [];
        while (snippetModel) {
          callback(snippetModel);
          snippetModel.descendants(callback);
          _results1.push(snippetModel = snippetModel.next);
        }
        return _results1;
      })());
    }
    return _results;
  };

  SnippetModel.prototype.descendantsAndSelf = function(callback) {
    callback(this);
    return this.descendants(callback);
  };

  SnippetModel.prototype.descendantContainers = function(callback) {
    return this.descendantsAndSelf(function(snippetModel) {
      var name, snippetContainer, _ref, _results;
      _ref = snippetModel.containers;
      _results = [];
      for (name in _ref) {
        snippetContainer = _ref[name];
        _results.push(callback(snippetContainer));
      }
      return _results;
    });
  };

  SnippetModel.prototype.allDescendants = function(callback) {
    return this.descendantsAndSelf((function(_this) {
      return function(snippetModel) {
        var name, snippetContainer, _ref, _results;
        if (snippetModel !== _this) {
          callback(snippetModel);
        }
        _ref = snippetModel.containers;
        _results = [];
        for (name in _ref) {
          snippetContainer = _ref[name];
          _results.push(callback(snippetContainer));
        }
        return _results;
      };
    })(this));
  };

  SnippetModel.prototype.childrenAndSelf = function(callback) {
    callback(this);
    return this.children(callback);
  };

  SnippetModel.prototype.toJson = function() {
    var json, name;
    json = {
      id: this.id,
      identifier: this.identifier
    };
    if (!serialization.isEmpty(this.content)) {
      json.content = serialization.flatCopy(this.content);
    }
    if (!serialization.isEmpty(this.styles)) {
      json.styles = serialization.flatCopy(this.styles);
    }
    for (name in this.containers) {
      json.containers || (json.containers = {});
      json.containers[name] = [];
    }
    return json;
  };

  return SnippetModel;

})();

SnippetModel.fromJson = function(json, design) {
  var child, containerName, model, name, snippetArray, styleName, template, value, _i, _len, _ref, _ref1, _ref2;
  template = design.get(json.identifier);
  assert(template, "error while deserializing snippet: unknown template identifier '" + json.identifier + "'");
  model = new SnippetModel({
    template: template,
    id: json.id
  });
  _ref = json.content;
  for (name in _ref) {
    value = _ref[name];
    assert(model.content.hasOwnProperty(name), "error while deserializing snippet: unknown content '" + name + "'");
    model.content[name] = value;
  }
  _ref1 = json.styles;
  for (styleName in _ref1) {
    value = _ref1[styleName];
    model.style(styleName, value);
  }
  _ref2 = json.containers;
  for (containerName in _ref2) {
    snippetArray = _ref2[containerName];
    assert(model.containers.hasOwnProperty(containerName), "error while deserializing snippet: unknown container " + containerName);
    if (snippetArray) {
      assert($.isArray(snippetArray), "error while deserializing snippet: container is not array " + containerName);
      for (_i = 0, _len = snippetArray.length; _i < _len; _i++) {
        child = snippetArray[_i];
        model.append(containerName, SnippetModel.fromJson(child, design));
      }
    }
  }
  return model;
};


},{"../modules/guid":16,"../modules/logging/assert":19,"../modules/logging/log":20,"../modules/serialization":22,"./snippet_container":32}],34:[function(require,module,exports){
var SnippetArray, SnippetContainer, SnippetModel, SnippetTree, assert,
  __slice = [].slice;

assert = require('../modules/logging/assert');

SnippetContainer = require('./snippet_container');

SnippetArray = require('./snippet_array');

SnippetModel = require('./snippet_model');

module.exports = SnippetTree = (function() {
  function SnippetTree(_arg) {
    var content, design, _ref;
    _ref = _arg != null ? _arg : {}, content = _ref.content, design = _ref.design;
    this.root = new SnippetContainer({
      isRoot: true
    });
    if ((content != null) && (design != null)) {
      this.fromJson(content, design);
    }
    this.root.snippetTree = this;
    this.initializeEvents();
  }

  SnippetTree.prototype.prepend = function(snippet) {
    this.root.prepend(snippet);
    return this;
  };

  SnippetTree.prototype.append = function(snippet) {
    this.root.append(snippet);
    return this;
  };

  SnippetTree.prototype.initializeEvents = function() {
    this.snippetAdded = $.Callbacks();
    this.snippetRemoved = $.Callbacks();
    this.snippetMoved = $.Callbacks();
    this.snippetContentChanged = $.Callbacks();
    this.snippetHtmlChanged = $.Callbacks();
    this.snippetSettingsChanged = $.Callbacks();
    return this.changed = $.Callbacks();
  };

  SnippetTree.prototype.each = function(callback) {
    return this.root.each(callback);
  };

  SnippetTree.prototype.eachContainer = function(callback) {
    return this.root.eachContainer(callback);
  };

  SnippetTree.prototype.all = function(callback) {
    return this.root.all(callback);
  };

  SnippetTree.prototype.find = function(search) {
    var res;
    if (typeof search === 'string') {
      res = [];
      this.each(function(snippet) {
        if (snippet.identifier === search || snippet.template.id === search) {
          return res.push(snippet);
        }
      });
      return new SnippetArray(res);
    } else {
      return new SnippetArray();
    }
  };

  SnippetTree.prototype.detach = function() {
    var oldRoot;
    this.root.snippetTree = void 0;
    this.each(function(snippet) {
      return snippet.snippetTree = void 0;
    });
    oldRoot = this.root;
    this.root = new SnippetContainer({
      isRoot: true
    });
    return oldRoot;
  };

  SnippetTree.prototype.print = function() {
    var addLine, output, walker;
    output = 'SnippetTree\n-----------\n';
    addLine = function(text, indentation) {
      if (indentation == null) {
        indentation = 0;
      }
      return output += "" + (Array(indentation + 1).join(" ")) + text + "\n";
    };
    walker = function(snippet, indentation) {
      var name, snippetContainer, template, _ref;
      if (indentation == null) {
        indentation = 0;
      }
      template = snippet.template;
      addLine("- " + template.title + " (" + template.identifier + ")", indentation);
      _ref = snippet.containers;
      for (name in _ref) {
        snippetContainer = _ref[name];
        addLine("" + name + ":", indentation + 2);
        if (snippetContainer.first) {
          walker(snippetContainer.first, indentation + 4);
        }
      }
      if (snippet.next) {
        return walker(snippet.next, indentation);
      }
    };
    if (this.root.first) {
      walker(this.root.first);
    }
    return output;
  };

  SnippetTree.prototype.attachingSnippet = function(snippet, attachSnippetFunc) {
    if (snippet.snippetTree === this) {
      attachSnippetFunc();
      return this.fireEvent('snippetMoved', snippet);
    } else {
      if (snippet.snippetTree != null) {
        snippet.snippetContainer.detachSnippet(snippet);
      }
      snippet.descendantsAndSelf((function(_this) {
        return function(descendant) {
          return descendant.snippetTree = _this;
        };
      })(this));
      attachSnippetFunc();
      return this.fireEvent('snippetAdded', snippet);
    }
  };

  SnippetTree.prototype.fireEvent = function() {
    var args, event;
    event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    this[event].fire.apply(event, args);
    return this.changed.fire();
  };

  SnippetTree.prototype.detachingSnippet = function(snippet, detachSnippetFunc) {
    assert(snippet.snippetTree === this, 'cannot remove snippet from another SnippetTree');
    snippet.descendantsAndSelf(function(descendants) {
      return descendants.snippetTree = void 0;
    });
    detachSnippetFunc();
    return this.fireEvent('snippetRemoved', snippet);
  };

  SnippetTree.prototype.contentChanging = function(snippet) {
    return this.fireEvent('snippetContentChanged', snippet);
  };

  SnippetTree.prototype.htmlChanging = function(snippet) {
    return this.fireEvent('snippetHtmlChanged', snippet);
  };

  SnippetTree.prototype.printJson = function() {
    return words.readableJson(this.toJson());
  };

  SnippetTree.prototype.toJson = function() {
    var json, snippetToJson, walker;
    json = {};
    json['content'] = [];
    snippetToJson = function(snippet, level, containerArray) {
      var snippetJson;
      snippetJson = snippet.toJson();
      containerArray.push(snippetJson);
      return snippetJson;
    };
    walker = function(snippet, level, jsonObj) {
      var containerArray, name, snippetContainer, snippetJson, _ref;
      snippetJson = snippetToJson(snippet, level, jsonObj);
      _ref = snippet.containers;
      for (name in _ref) {
        snippetContainer = _ref[name];
        containerArray = snippetJson.containers[snippetContainer.name] = [];
        if (snippetContainer.first) {
          walker(snippetContainer.first, level + 1, containerArray);
        }
      }
      if (snippet.next) {
        return walker(snippet.next, level, jsonObj);
      }
    };
    if (this.root.first) {
      walker(this.root.first, 0, json['content']);
    }
    return json;
  };

  SnippetTree.prototype.fromJson = function(json, design) {
    var snippet, snippetJson, _i, _len, _ref;
    this.root.snippetTree = void 0;
    if (json.content) {
      _ref = json.content;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        snippetJson = _ref[_i];
        snippet = SnippetModel.fromJson(snippetJson, design);
        this.root.append(snippet);
      }
    }
    this.root.snippetTree = this;
    return this.root.each((function(_this) {
      return function(snippet) {
        return snippet.snippetTree = _this;
      };
    })(this));
  };

  return SnippetTree;

})();


},{"../modules/logging/assert":19,"./snippet_array":31,"./snippet_container":32,"./snippet_model":33}],35:[function(require,module,exports){
var Directive, config;

config = require('../configuration/defaults');

module.exports = Directive = (function() {
  function Directive(_arg) {
    var name;
    name = _arg.name, this.type = _arg.type, this.elem = _arg.elem;
    this.name = name || config.directives[this.type].defaultName;
    this.config = config.directives[this.type];
    this.optional = false;
  }

  Directive.prototype.renderedAttr = function() {
    return this.config.renderedAttr;
  };

  Directive.prototype.isElementDirective = function() {
    return this.config.elementDirective;
  };

  Directive.prototype.clone = function() {
    var newDirective;
    newDirective = new Directive({
      name: this.name,
      type: this.type
    });
    newDirective.optional = this.optional;
    return newDirective;
  };

  return Directive;

})();


},{"../configuration/defaults":2}],36:[function(require,module,exports){
var Directive, DirectiveCollection, assert, config;

assert = require('../modules/logging/assert');

config = require('../configuration/defaults');

Directive = require('./directive');

module.exports = DirectiveCollection = (function() {
  function DirectiveCollection(all) {
    this.all = all != null ? all : {};
    this.length = 0;
  }

  DirectiveCollection.prototype.add = function(directive) {
    var _name;
    this.assertNameNotUsed(directive);
    this[this.length] = directive;
    directive.index = this.length;
    this.length += 1;
    this.all[directive.name] = directive;
    this[_name = directive.type] || (this[_name] = []);
    return this[directive.type].push(directive);
  };

  DirectiveCollection.prototype.next = function(name) {
    var directive;
    if (name instanceof Directive) {
      directive = name;
    }
    directive || (directive = this.all[name]);
    return this[directive.index += 1];
  };

  DirectiveCollection.prototype.nextOfType = function(name) {
    var directive, requiredType;
    if (name instanceof Directive) {
      directive = name;
    }
    directive || (directive = this.all[name]);
    requiredType = directive.type;
    while (directive = this.next(directive)) {
      if (directive.type === requiredType) {
        return directive;
      }
    }
  };

  DirectiveCollection.prototype.get = function(name) {
    return this.all[name];
  };

  DirectiveCollection.prototype.$getElem = function(name) {
    return $(this.all[name].elem);
  };

  DirectiveCollection.prototype.count = function(type) {
    var _ref;
    if (type) {
      return (_ref = this[type]) != null ? _ref.length : void 0;
    } else {
      return this.length;
    }
  };

  DirectiveCollection.prototype.each = function(callback) {
    var directive, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      directive = this[_i];
      _results.push(callback(directive));
    }
    return _results;
  };

  DirectiveCollection.prototype.clone = function() {
    var newCollection;
    newCollection = new DirectiveCollection();
    this.each(function(directive) {
      return newCollection.add(directive.clone());
    });
    return newCollection;
  };

  DirectiveCollection.prototype.assertAllLinked = function() {
    this.each(function(directive) {
      if (!directive.elem) {
        return false;
      }
    });
    return true;
  };

  DirectiveCollection.prototype.assertNameNotUsed = function(directive) {
    return assert(directive && !this.all[directive.name], "" + directive.type + " Template parsing error:\n" + config.directives[directive.type].renderedAttr + "=\"" + directive.name + "\".\n\"" + directive.name + "\" is a duplicate name.");
  };

  return DirectiveCollection;

})();


},{"../configuration/defaults":2,"../modules/logging/assert":19,"./directive":35}],37:[function(require,module,exports){
var Directive, config;

config = require('../configuration/defaults');

Directive = require('./directive');

module.exports = (function() {
  var attributePrefix;
  attributePrefix = /^(x-|data-)/;
  return {
    parse: function(elem) {
      var elemDirective, modifications;
      elemDirective = void 0;
      modifications = [];
      this.parseDirectives(elem, function(directive) {
        if (directive.isElementDirective()) {
          return elemDirective = directive;
        } else {
          return modifications.push(directive);
        }
      });
      if (elemDirective) {
        this.applyModifications(elemDirective, modifications);
      }
      return elemDirective;
    },
    parseDirectives: function(elem, func) {
      var attr, attributeName, data, directive, directiveData, normalizedName, type, _i, _j, _len, _len1, _ref, _results;
      directiveData = [];
      _ref = elem.attributes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        attributeName = attr.name;
        normalizedName = attributeName.replace(attributePrefix, '');
        if (type = config.templateAttrLookup[normalizedName]) {
          directiveData.push({
            attributeName: attributeName,
            directive: new Directive({
              name: attr.value,
              type: type,
              elem: elem
            })
          });
        }
      }
      _results = [];
      for (_j = 0, _len1 = directiveData.length; _j < _len1; _j++) {
        data = directiveData[_j];
        directive = data.directive;
        this.rewriteAttribute(directive, data.attributeName);
        _results.push(func(directive));
      }
      return _results;
    },
    applyModifications: function(mainDirective, modifications) {
      var directive, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = modifications.length; _i < _len; _i++) {
        directive = modifications[_i];
        switch (directive.type) {
          case 'optional':
            _results.push(mainDirective.optional = true);
            break;
          default:
            _results.push(void 0);
        }
      }
      return _results;
    },
    rewriteAttribute: function(directive, attributeName) {
      if (directive.isElementDirective()) {
        if (attributeName !== directive.renderedAttr()) {
          return this.normalizeAttribute(directive, attributeName);
        } else if (!directive.name) {
          return this.normalizeAttribute(directive);
        }
      } else {
        return this.removeAttribute(directive, attributeName);
      }
    },
    normalizeAttribute: function(directive, attributeName) {
      var elem;
      elem = directive.elem;
      if (attributeName) {
        this.removeAttribute(directive, attributeName);
      }
      return elem.setAttribute(directive.renderedAttr(), directive.name);
    },
    removeAttribute: function(directive, attributeName) {
      return directive.elem.removeAttribute(attributeName);
    }
  };
})();


},{"../configuration/defaults":2,"./directive":35}],38:[function(require,module,exports){
var config, directiveFinder;

config = require('../configuration/defaults');

module.exports = directiveFinder = (function() {
  var attributePrefix;
  attributePrefix = /^(x-|data-)/;
  return {
    link: function(elem, directiveCollection) {
      var attr, directive, normalizedName, type, _i, _len, _ref;
      _ref = elem.attributes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        normalizedName = attr.name.replace(attributePrefix, '');
        if (type = config.templateAttrLookup[normalizedName]) {
          directive = directiveCollection.get(attr.value);
          directive.elem = elem;
        }
      }
      return void 0;
    }
  };
})();


},{"../configuration/defaults":2}],39:[function(require,module,exports){
var DirectiveIterator, config;

config = require('../configuration/defaults');

module.exports = DirectiveIterator = (function() {
  function DirectiveIterator(root) {
    this.root = this._next = root;
    this.containerAttr = config.directives.container.renderedAttr;
  }

  DirectiveIterator.prototype.current = null;

  DirectiveIterator.prototype.hasNext = function() {
    return !!this._next;
  };

  DirectiveIterator.prototype.next = function() {
    var child, n, next;
    n = this.current = this._next;
    child = next = void 0;
    if (this.current) {
      child = n.firstChild;
      if (child && n.nodeType === 1 && !n.hasAttribute(this.containerAttr)) {
        this._next = child;
      } else {
        next = null;
        while ((n !== this.root) && !(next = n.nextSibling)) {
          n = n.parentNode;
        }
        this._next = next;
      }
    }
    return this.current;
  };

  DirectiveIterator.prototype.nextElement = function() {
    while (this.next()) {
      if (this.current.nodeType === 1) {
        break;
      }
    }
    return this.current;
  };

  DirectiveIterator.prototype.detach = function() {
    return this.current = this._next = this.root = null;
  };

  return DirectiveIterator;

})();


},{"../configuration/defaults":2}],40:[function(require,module,exports){
var DirectiveCollection, DirectiveIterator, SnippetModel, SnippetView, Template, assert, config, directiveCompiler, directiveFinder, log, words;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

words = require('../modules/words');

config = require('../configuration/defaults');

DirectiveIterator = require('./directive_iterator');

DirectiveCollection = require('./directive_collection');

directiveCompiler = require('./directive_compiler');

directiveFinder = require('./directive_finder');

SnippetModel = require('../snippet_tree/snippet_model');

SnippetView = require('../rendering/snippet_view');

module.exports = Template = (function() {
  function Template(_arg) {
    var html, identifier, styles, title, weight, _ref, _ref1;
    _ref = _arg != null ? _arg : {}, html = _ref.html, this.namespace = _ref.namespace, this.id = _ref.id, identifier = _ref.identifier, title = _ref.title, styles = _ref.styles, weight = _ref.weight;
    assert(html, 'Template: param html missing');
    if (identifier) {
      _ref1 = Template.parseIdentifier(identifier), this.namespace = _ref1.namespace, this.id = _ref1.id;
    }
    this.identifier = this.namespace && this.id ? "" + this.namespace + "." + this.id : void 0;
    this.$template = $(this.pruneHtml(html)).wrap('<div>');
    this.$wrap = this.$template.parent();
    this.title = title || words.humanize(this.id);
    this.styles = styles || {};
    this.weight = weight;
    this.defaults = {};
    this.parseTemplate();
  }

  Template.prototype.createModel = function() {
    return new SnippetModel({
      template: this
    });
  };

  Template.prototype.createView = function(snippetModel, isReadOnly) {
    var $elem, directives, snippetView;
    snippetModel || (snippetModel = this.createModel());
    $elem = this.$template.clone();
    directives = this.linkDirectives($elem[0]);
    return snippetView = new SnippetView({
      model: snippetModel,
      $html: $elem,
      directives: directives,
      isReadOnly: isReadOnly
    });
  };

  Template.prototype.pruneHtml = function(html) {
    html = $(html).filter(function(index) {
      return this.nodeType !== 8;
    });
    assert(html.length === 1, "Templates must contain one root element. The Template \"" + this.identifier + "\" contains " + html.length);
    return html;
  };

  Template.prototype.parseTemplate = function() {
    var elem;
    elem = this.$template[0];
    this.directives = this.compileDirectives(elem);
    return this.directives.each((function(_this) {
      return function(directive) {
        switch (directive.type) {
          case 'editable':
            return _this.formatEditable(directive.name, directive.elem);
          case 'container':
            return _this.formatContainer(directive.name, directive.elem);
          case 'html':
            return _this.formatHtml(directive.name, directive.elem);
        }
      };
    })(this));
  };

  Template.prototype.compileDirectives = function(elem) {
    var directive, directives, iterator;
    iterator = new DirectiveIterator(elem);
    directives = new DirectiveCollection();
    while (elem = iterator.nextElement()) {
      directive = directiveCompiler.parse(elem);
      if (directive) {
        directives.add(directive);
      }
    }
    return directives;
  };

  Template.prototype.linkDirectives = function(elem) {
    var iterator, snippetDirectives;
    iterator = new DirectiveIterator(elem);
    snippetDirectives = this.directives.clone();
    while (elem = iterator.nextElement()) {
      directiveFinder.link(elem, snippetDirectives);
    }
    return snippetDirectives;
  };

  Template.prototype.formatEditable = function(name, elem) {
    var $elem, defaultValue;
    $elem = $(elem);
    $elem.addClass(config.html.css.editable);
    defaultValue = words.trim(elem.innerHTML);
    if (defaultValue) {
      this.defaults[name] = defaultValue;
    }
    return elem.innerHTML = '';
  };

  Template.prototype.formatContainer = function(name, elem) {
    return elem.innerHTML = '';
  };

  Template.prototype.formatHtml = function(name, elem) {
    var defaultValue;
    defaultValue = words.trim(elem.innerHTML);
    if (defaultValue) {
      this.defaults[name] = defaultValue;
    }
    return elem.innerHTML = '';
  };

  Template.prototype.printDoc = function() {
    var doc;
    doc = {
      identifier: this.identifier
    };
    return words.readableJson(doc);
  };

  return Template;

})();

Template.parseIdentifier = function(identifier) {
  var parts;
  if (!identifier) {
    return;
  }
  parts = identifier.split('.');
  if (parts.length === 1) {
    return {
      namespace: void 0,
      id: parts[0]
    };
  } else if (parts.length === 2) {
    return {
      namespace: parts[0],
      id: parts[1]
    };
  } else {
    return log.error("could not parse snippet template identifier: " + identifier);
  }
};


},{"../configuration/defaults":2,"../modules/logging/assert":19,"../modules/logging/log":20,"../modules/words":24,"../rendering/snippet_view":26,"../snippet_tree/snippet_model":33,"./directive_collection":36,"./directive_compiler":37,"./directive_finder":38,"./directive_iterator":39}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9icm93c2VyX2FwaS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2RlZmF1bHRzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbl9zdHlsZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kb2N1bWVudC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kb20uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZHJhZ19kcm9wLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZm9jdXMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vc25pcHBldF9kcmFnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2tpY2tzdGFydC9icm93c2VyX3htbGRvbS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9raWNrc3RhcnQva2lja3N0YXJ0LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvY2hhaW5hYmxlX3Byb3h5LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZXZlbnRpbmcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ndWlkLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbGltaXRlZF9sb2NhbHN0b3JlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9jYWxzdG9yZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZW1hcGhvcmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZXJpYWxpemF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc3Rhc2guY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy93b3Jkcy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvcmVuZGVyZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3NuaXBwZXRfdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfYXJyYXkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X3RyZWUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb21waWxlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfZmluZGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS90ZW1wbGF0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBLHlHQUFBOztBQUFBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLDJCQUFSLENBQWpCLENBQUE7O0FBQUEsS0FDQSxHQUFRLE9BQUEsQ0FBUSxpQkFBUixDQURSLENBQUE7O0FBQUEsS0FFQSxHQUFRLE9BQUEsQ0FBUSxpQkFBUixDQUZSLENBQUE7O0FBQUEsUUFJQSxHQUFXLE9BQUEsQ0FBUSxZQUFSLENBSlgsQ0FBQTs7QUFBQSxTQUtBLEdBQVksT0FBQSxDQUFRLHVCQUFSLENBTFosQ0FBQTs7QUFBQSxRQU1BLEdBQVcsT0FBQSxDQUFRLHlCQUFSLENBTlgsQ0FBQTs7QUFBQSxZQU9BLEdBQWUsT0FBQSxDQUFRLDhCQUFSLENBUGYsQ0FBQTs7QUFBQSxNQWdCTSxDQUFDLEdBQVAsR0FBYSxTQUFDLE1BQUQsR0FBQTtTQUNYLFFBQVEsQ0FBQyxJQUFULENBQWMsTUFBZCxFQURXO0FBQUEsQ0FoQmIsQ0FBQTs7QUFBQSxTQW1CQSxHQUFZLGNBQUEsQ0FBZSxHQUFmLENBbkJaLENBQUE7O0FBQUEsUUFxQkEsR0FBVyxTQUFBLEdBQUE7QUFHVCxFQUFBLElBQUMsQ0FBQSxTQUFELEdBQWEsU0FBQSxDQUFVLFFBQVYsRUFBb0IsV0FBcEIsQ0FBYixDQUFBO0FBQUEsRUFDQSxJQUFDLENBQUEsU0FBRCxHQUFhLFNBRGIsQ0FBQTtBQUFBLEVBSUEsSUFBQyxDQUFBLElBQUQsR0FBUSxTQUFBLENBQVUsUUFBVixFQUFvQixNQUFwQixDQUpS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c291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjaGFpbmFibGVQcm94eSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9jaGFpbmFibGVfcHJveHknKVxud29yZHMgPSByZXF1aXJlKCcuL21vZHVsZXMvd29yZHMnKVxuc3Rhc2ggPSByZXF1aXJlKCcuL21vZHVsZXMvc3Rhc2gnKVxuXG5kb2N1bWVudCA9IHJlcXVpcmUoJy4vZG9jdW1lbnQnKVxuS2lja3N0YXJ0ID0gcmVxdWlyZSgnLi9raWNrc3RhcnQva2lja3N0YXJ0JylcbkRyYWdEcm9wID0gcmVxdWlyZSgnLi9pbnRlcmFjdGlvbi9kcmFnX2Ryb3AnKVxuU25pcHBldEFycmF5ID0gcmVxdWlyZSgnLi9zbmlwcGV0X3RyZWUvc25pcHBldF9hcnJheScpXG5cbiMgUHVibGljIEFQSVxuIyAtLS0tLS0tLS0tXG4jIFNpbmNlIHRoZSBsaXZpbmdkb2NzLWVuZ2luZSBjb2RlIGlzIGNvbnRhaW5lZCBpbiBpdHMgb3duIGZ1bmN0aW9uIGNsb3N1cmVcbiMgd2UgZXhwb3NlIG91ciBwdWJsaWMgQVBJIGhlcmUgZXhwbGljaXRseS5cbiNcbiMgYGRvYygpYDogcHJpbWFyeSBmdW5jdGlvbiBpbnRlcmZhY2Ugc2ltaWxhciB0byBqcXVlcnlcbiMgd2l0aCBzbmlwcGV0IHNlbGVjdG9ycyBhbmQgc3R1ZmYuLi5cbndpbmRvdy5kb2MgPSAoc2VhcmNoKSAtPlxuICBkb2N1bWVudC5maW5kKHNlYXJjaClcblxuY2hhaW5hYmxlID0gY2hhaW5hYmxlUHJveHkoZG9jKVxuXG5zZXR1cEFwaSA9IC0+XG5cbiAgIyBraWNrc3RhcnQgdGhlIGRvY3VtZW50XG4gIEBraWNrc3RhcnQgPSBjaGFpbmFibGUoZG9jdW1lbnQsICdraWNrc3RhcnQnKVxuICBAS2lja3N0YXJ0ID0gS2lja3N0YXJ0XG5cbiAgICAjIEluaXRpYWxpemUgdGhlIGRvY3VtZW50XG4gIEBpbml0ID0gY2hhaW5hYmxlKGRvY3VtZW50LCAnaW5pdCcpXG4gIEByZWFkeSA9IGNoYWluYWJsZShkb2N1bWVudC5yZWFkeSwgJ2FkZCcpXG5cbiAgQGNyZWF0ZVZpZXcgPSAkLnByb3h5KGRvY3VtZW50LCAnY3JlYXRlVmlldycpXG5cbiAgIyBBZGQgVGVtcGxhdGVzIHRvIHRoZSBkb2N1bWVudHNcbiAgQGdldERlc2lnbiA9IC0+IGRvY3VtZW50LmRlc2lnblxuXG4gICMgQXBwZW5kIGEgc25pcHBldCB0byB0aGUgZG9jdW1lbnRcbiAgIyBAcGFyYW0gaW5wdXQ6IChTdHJpbmcpIHNuaXBwZXQgaWRlbnRpZmllciBlLmcuIFwiYm9vdHN0cmFwLnRpdGxlXCIgb3IgKFNuaXBwZXQpXG4gICMgQHJldHVybiBTbmlwcGV0TW9kZWxcbiAgQGFkZCA9ICQucHJveHkoZG9jdW1lbnQsICdhZGQnKVxuXG4gICMgQ3JlYXRlIGEgbmV3IHNuaXBwZXQgaW5zdGFuY2UgKG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBkb2N1bWVudClcbiAgIyBAcGFyYW0gaWRlbnRpZmllcjogKFN0cmluZykgc25pcHBldCBpZGVudGlmaWVyIGUuZy4gXCJib290c3RyYXAudGl0bGVcIlxuICAjIEByZXR1cm4gU25pcHBldE1vZGVsXG4gIEBjcmVhdGUgPSAkLnByb3h5KGRvY3VtZW50LCAnY3JlYXRlTW9kZWwnKVxuXG4gICMgSnNvbiB0aGF0IGNhbiBiZSB1c2VkIGZvciBzYXZpbmcgb2YgdGhlIGRvY3VtZW50XG4gIEB0b0pzb24gPSAkLnByb3h5KGRvY3VtZW50LCAndG9Kc29uJylcbiAgQHRvSHRtbCA9ICQucHJveHkoZG9jdW1lbnQsICd0b0h0bWwnKVxuICBAcmVhZGFibGVKc29uID0gLT4gd29yZHMucmVhZGFibGVKc29uKCBkb2N1bWVudC50b0pzb24oKSApXG5cbiAgIyBQcmludCB0aGUgY29udGVudCBvZiB0aGUgc25pcHBldFRyZWUgaW4gYSByZWFkYWJsZSBzdHJpbmdcbiAgQHByaW50VHJlZSA9ICQucHJveHkoZG9jdW1lbnQsICdwcmludFRyZWUnKVxuXG4gIEBlYWNoQ29udGFpbmVyID0gY2hhaW5hYmxlKGRvY3VtZW50LCAnZWFjaENvbnRhaW5lcicpXG4gIEBkb2N1bWVudCA9IGRvY3VtZW50XG5cbiAgQGNoYW5nZWQgPSBjaGFpbmFibGUoZG9jdW1lbnQuY2hhbmdlZCwgJ2FkZCcpXG4gIEBEcmFnRHJvcCA9IERyYWdEcm9wXG5cbiAgIyBTdGFzaFxuICAjIC0tLS0tXG5cbiAgc3Rhc2guaW5pdCgpXG4gIEBzdGFzaCA9ICQucHJveHkoc3Rhc2gsICdzdGFzaCcpXG4gIEBzdGFzaC5zbmFwc2hvdCA9ICQucHJveHkoc3Rhc2gsICdzbmFwc2hvdCcpXG4gIEBzdGFzaC5kZWxldGUgPSAkLnByb3h5KHN0YXNoLCAnZGVsZXRlJylcbiAgQHN0YXNoLnJlc3RvcmUgPSAkLnByb3h5KHN0YXNoLCAncmVzdG9yZScpXG4gIEBzdGFzaC5nZXQgPSAkLnByb3h5KHN0YXNoLCAnZ2V0JylcbiAgQHN0YXNoLmxpc3QgPSAkLnByb3h5KHN0YXNoLCAnbGlzdCcpXG5cblxuICAjIFV0aWxzXG4gICMgLS0tLS1cblxuICAjIEV4cG9zZSBzdHJpbmcgdXRpbCAnd29yZHMnXG4gIEB3b3JkcyA9IHdvcmRzXG5cblxuICAjIEZvciBQbHVnaW5zICYgRXh0ZW5zaW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICMgZW5hYmxlIHNuaXBwZXQgZmluZGVyIHBsdWdpbnMgKGpxdWVyeSBsaWtlKVxuICBAZm4gPSBTbmlwcGV0QXJyYXk6OlxuXG5cbiMgQVBJIG1ldGhvZHMgdGhhdCBhcmUgb25seSBhdmFpbGFibGUgYWZ0ZXIgdGhlIHBhZ2UgaGFzIGluaXRpYWxpemVkXG5wYWdlUmVhZHkgPSAtPlxuICBwYWdlID0gZG9jdW1lbnQucGFnZVxuXG4gIEByZXN0b3JlID0gY2hhaW5hYmxlKGRvY3VtZW50LCAncmVzdG9yZScpXG5cbiAgIyBFdmVudHNcbiAgIyAtLS0tLS1cblxuICAjIEZpcmVkIHdoZW4gYSBzbmlwcGV0IGlzIGZvY3VzZWRcbiAgIyBjYWxsYmFjazogKHNuaXBwZXRWaWV3KSAtPlxuICBAc25pcHBldEZvY3VzZWQgPSBjaGFpbmFibGUocGFnZS5mb2N1cy5zbmlwcGV0Rm9jdXMsICdhZGQnKVxuXG4gICMgRmlyZWQgd2hlbiBhIHNuaXBwZXQgaXMgYmx1cnJlZFxuICAjIChhbHdheXMgZmlyZSBiZWZvcmUgdGhlIG5leHQgZm9jdXMgZXZlbnQpXG4gICMgY2FsbGJhY2s6IChzbmlwcGV0VmlldykgLT5cbiAgQHNuaXBwZXRCbHVycmVkID0gY2hhaW5hYmxlKHBhZ2UuZm9jdXMuc25pcHBldEJsdXIsICdhZGQnKVxuXG4gICMgQ2FsbCB0byBzdGFydCBhIGRyYWcgb3BlcmF0aW9uXG4gIEBzdGFydERyYWcgPSAkLnByb3h5KHBhZ2UsICdzdGFydERyYWcnKVxuXG4gICMgU25pcHBldCBEcmFnICYgRHJvcCBldmVudHNcbiAgQHNuaXBwZXRXaWxsQmVEcmFnZ2VkID0gJC5wcm94eShwYWdlLnNuaXBwZXRXaWxsQmVEcmFnZ2VkLCAnYWRkJylcbiAgQHNuaXBwZXRXaWxsQmVEcmFnZ2VkLnJlbW92ZSA9ICQucHJveHkocGFnZS5zbmlwcGV0V2lsbEJlRHJhZ2dlZCwgJ3JlbW92ZScpXG4gIEBzbmlwcGV0V2FzRHJvcHBlZCA9ICQucHJveHkocGFnZS5zbmlwcGV0V2FzRHJvcHBlZCwgJ2FkZCcpXG4gIEBzbmlwcGV0V2FzRHJvcHBlZC5yZW1vdmUgPSAkLnByb3h5KHBhZ2Uuc25pcHBldFdhc0Ryb3BwZWQsICdyZW1vdmUnKVxuXG4gICMgRmlyZWQgd2hlbiBhIHVzZXIgY2xpY2tzIG9uIGFuIGVkaXRhYmxlIGltYWdlXG4gICMgZXhhbXBsZSBjYWxsYmFjayBtZXRob2Q6XG4gICMgKHNuaXBwZXRWaWV3LCBpbWFnZU5hbWUpIC0+IHNuaXBwZXRWaWV3Lm1vZGVsLnNldChpbWFnZU5hbWUsIGltYWdlU3JjKVxuICBAaW1hZ2VDbGljayA9IGNoYWluYWJsZShwYWdlLmltYWdlQ2xpY2ssICdhZGQnKVxuXG5cbiAgIyBGaXJlZCB3aGVuIGEgdXNlciBjbGljayBvbiBhbiBlZGl0YWJsZSBodG1sIGVsZW1lbnQgb3Igb25lIG9mIGl0cyBjaGlsZHJlblxuICAjIGV4YW1wbGUgY2FsbGJhY2sgbWV0aG9kczpcbiAgIyAoc25pcHBldFZpZXcsIGh0bWxFbGVtZW50TmFtZSwgZXZlbnQpIC0+ICMgeW91ciBjb2RlIGhlcmVcbiAgQGh0bWxFbGVtZW50Q2xpY2sgPSBjaGFpbmFibGUocGFnZS5odG1sRWxlbWVudENsaWNrLCAnYWRkJylcblxuICAjIFRleHQgRXZlbnRzXG4gICMgLS0tLS0tLS0tLS1cblxuICAjIEZpcmVkIHdoZW4gZWRpdGFibGUgdGV4dCBpcyBzZWxlY3RlZFxuICAjIGNhbGxiYWNrOiAoc25pcHBldFZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbikgLT5cbiAgIyBAY2FsbGJhY2tQYXJhbSBzbmlwcGV0VmlldyAtIHNuaXBwZXRWaWV3IGluc3RhbmNlXG4gICMgQGNhbGxiYWNrUGFyYW0gZWxlbWVudCAtIERPTSBub2RlIHdpdGggY29udGVudGVkaXRhYmxlXG4gICMgQGNhbGxiYWNrUGFyYW0gc2VsZWN0aW9uIC0gc2VsZWN0aW9uIG9iamVjdCBmcm9tIGVkaXRhYmxlSlNcbiAgQHRleHRTZWxlY3Rpb24gPSBjaGFpbmFibGUocGFnZS5lZGl0YWJsZUNvbnRyb2xsZXIuc2VsZWN0aW9uLCAnYWRkJylcblxuXG4jIGV4ZWN1dGUgQVBJIHNldHVwXG5zZXR1cEFwaS5jYWxsKGRvYylcbmRvYy5yZWFkeSAtPlxuICBwYWdlUmVhZHkuY2FsbChkb2MpXG5cblxuXG4iLCIjIENvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLVxubW9kdWxlLmV4cG9ydHMgPSBjb25maWcgPSBkbyAtPlxuXG4gIHdvcmRTZXBhcmF0b3JzOiBcIi4vXFxcXCgpXFxcIic6LC47PD5+ISMlXiYqfCs9W117fWB+P1wiXG5cbiAgIyBzdHJpbmcgY29udGFpbm5nIG9ubHkgYSA8YnI+IGZvbGxvd2VkIGJ5IHdoaXRlc3BhY2VzXG4gIHNpbmdsZUxpbmVCcmVhazogL148YnJcXHMqXFwvPz5cXHMqJC9cblxuICAjIChVK0ZFRkYpIHplcm8gd2lkdGggbm8tYnJlYWsgc3BhY2VcbiAgemVyb1dpZHRoQ2hhcmFjdGVyOiAnXFx1ZmVmZidcblxuICBhdHRyaWJ1dGVQcmVmaXg6ICdkYXRhJ1xuXG4gICMgSGVyZSB5b3UgZmluZCBldmVyeXRoaW5nIHRoYXQgY2FuIGVuZCB1cCBpbiB0aGUgaHRtbFxuICAjIHRoZSBlbmdpbmUgc3BpdHMgb3V0IG9yIHdvcmtzIHdpdGguXG4gIGh0bWw6XG5cbiAgICAjIGNzcyBjbGFzc2VzIGluamVjdGVkIGJ5IHRoZSBlbmdpbmVcbiAgICBjc3M6XG4gICAgICAjIGRvY3VtZW50IGNsYXNzZXNcbiAgICAgIHNlY3Rpb246ICdkb2Mtc2VjdGlvbidcblxuICAgICAgIyBzbmlwcGV0IGNsYXNzZXNcbiAgICAgIHNuaXBwZXQ6ICdkb2Mtc25pcHBldCdcbiAgICAgIGVkaXRhYmxlOiAnZG9jLWVkaXRhYmxlJ1xuICAgICAgaW50ZXJmYWNlOiAnZG9jLXVpJ1xuXG4gICAgICAjIGhpZ2hsaWdodCBjbGFzc2VzXG4gICAgICBzbmlwcGV0SGlnaGxpZ2h0OiAnZG9jLXNuaXBwZXQtaGlnaGxpZ2h0J1xuICAgICAgY29udGFpbmVySGlnaGxpZ2h0OiAnZG9jLWNvbnRhaW5lci1oaWdobGlnaHQnXG5cbiAgICAgICMgZHJhZyAmIGRyb3BcbiAgICAgIGRyYWdnZWRQbGFjZWhvbGRlcjogJ2RvYy1kcmFnZ2VkLXBsYWNlaG9sZGVyJ1xuICAgICAgZHJhZ2dlZDogJ2RvYy1kcmFnZ2VkJ1xuICAgICAgYmVmb3JlRHJvcDogJ2RvYy1iZWZvcmUtZHJvcCdcbiAgICAgIGFmdGVyRHJvcDogJ2RvYy1hZnRlci1kcm9wJ1xuXG4gICAgICAjIHV0aWxpdHkgY2xhc3Nlc1xuICAgICAgcHJldmVudFNlbGVjdGlvbjogJ2RvYy1uby1zZWxlY3Rpb24nXG4gICAgICBtYXhpbWl6ZWRDb250YWluZXI6ICdkb2MtanMtbWF4aW1pemVkLWNvbnRhaW5lcidcbiAgICAgIGludGVyYWN0aW9uQmxvY2tlcjogJ2RvYy1pbnRlcmFjdGlvbi1ibG9ja2VyJ1xuXG4gICAgIyBhdHRyaWJ1dGVzIGluamVjdGVkIGJ5IHRoZSBlbmdpbmVcbiAgICBhdHRyOlxuICAgICAgdGVtcGxhdGU6ICdkYXRhLWRvYy10ZW1wbGF0ZSdcbiAgICAgIHBsYWNlaG9sZGVyOiAnZGF0YS1kb2MtcGxhY2Vob2xkZXInXG5cblxuICAjIGtpY2tzdGFydCBjb25maWdcbiAga2lja3N0YXJ0OlxuICAgIGF0dHI6XG4gICAgICBzdHlsZXM6ICdkb2Mtc3R5bGVzJ1xuXG4gICMgRGlyZWN0aXZlIGRlZmluaXRpb25zXG4gICNcbiAgIyBhdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiB0ZW1wbGF0ZXMgdG8gZGVmaW5lIHRoZSBkaXJlY3RpdmVcbiAgIyByZW5kZXJlZEF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIG91dHB1dCBodG1sXG4gICMgZWxlbWVudERpcmVjdGl2ZTogZGlyZWN0aXZlIHRoYXQgdGFrZXMgY29udHJvbCBvdmVyIHRoZSBlbGVtZW50XG4gICMgICAodGhlcmUgY2FuIG9ubHkgYmUgb25lIHBlciBlbGVtZW50KVxuICAjIGRlZmF1bHROYW1lOiBkZWZhdWx0IG5hbWUgaWYgbm9uZSB3YXMgc3BlY2lmaWVkIGluIHRoZSB0ZW1wbGF0ZVxuICBkaXJlY3RpdmVzOlxuICAgIGNvbnRhaW5lcjpcbiAgICAgIGF0dHI6ICdkb2MtY29udGFpbmVyJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBlZGl0YWJsZTpcbiAgICAgIGF0dHI6ICdkb2MtZWRpdGFibGUnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGltYWdlOlxuICAgICAgYXR0cjogJ2RvYy1pbWFnZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2ltYWdlJ1xuICAgIGh0bWw6XG4gICAgICBhdHRyOiAnZG9jLWh0bWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIG9wdGlvbmFsOlxuICAgICAgYXR0cjogJ2RvYy1vcHRpb25hbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiBmYWxzZVxuXG5cbiAgYW5pbWF0aW9uczpcbiAgICBvcHRpb25hbHM6XG4gICAgICBzaG93OiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlRG93bigyNTApXG5cbiAgICAgIGhpZGU6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVVcCgyNTApXG5cblxuICBlZGl0YWJsZTpcbiAgICBpbnNlcnRTbmlwcGV0OiAndGV4dCdcblxuXG4jIEVucmljaCB0aGUgY29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiNcbiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uIHdpdGggc2hvcnRoYW5kcyBhbmQgY29tcHV0ZWQgdmFsdWVzLlxuZW5yaWNoQ29uZmlnID0gLT5cblxuICAjIFNob3J0aGFuZHMgZm9yIHN0dWZmIHRoYXQgaXMgdXNlZCBhbGwgb3ZlciB0aGUgcGxhY2UgdG8gbWFrZVxuICAjIGNvZGUgYW5kIHNwZWNzIG1vcmUgcmVhZGFibGUuXG4gIEBkb2NDbGFzcyA9IEBodG1sLmNzc1xuICBAZG9jQXR0ciA9IEBodG1sLmF0dHJcbiAgQGRvY0RpcmVjdGl2ZSA9IHt9XG4gIEB0ZW1wbGF0ZUF0dHJMb29rdXAgPSB7fVxuXG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBAZGlyZWN0aXZlc1xuXG4gICAgIyBDcmVhdGUgdGhlIHJlbmRlcmVkQXR0cnMgZm9yIHRoZSBkaXJlY3RpdmVzXG4gICAgIyAocHJlcGVuZCBkaXJlY3RpdmUgYXR0cmlidXRlcyB3aXRoIHRoZSBjb25maWd1cmVkIHByZWZpeClcbiAgICBwcmVmaXggPSBcIiN7IEBhdHRyaWJ1dGVQcmVmaXggfS1cIiBpZiBAYXR0cmlidXRlUHJlZml4XG4gICAgdmFsdWUucmVuZGVyZWRBdHRyID0gXCIjeyBwcmVmaXggfHwgJycgfSN7IHZhbHVlLmF0dHIgfVwiXG5cblxuICAgIEBkb2NEaXJlY3RpdmVbbmFtZV0gPSB2YWx1ZS5yZW5kZXJlZEF0dHJcbiAgICBAdGVtcGxhdGVBdHRyTG9va3VwW3ZhbHVlLmF0dHJdID0gbmFtZVxuXG5cbmVucmljaENvbmZpZy5jYWxsKGNvbmZpZylcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5UZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL3RlbXBsYXRlJylcbkRlc2lnblN0eWxlID0gcmVxdWlyZSgnLi9kZXNpZ25fc3R5bGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlc2lnblxuXG4gIGNvbnN0cnVjdG9yOiAoZGVzaWduKSAtPlxuICAgIHRlbXBsYXRlcyA9IGRlc2lnbi50ZW1wbGF0ZXMgfHwgZGVzaWduLnNuaXBwZXRzXG4gICAgY29uZmlnID0gZGVzaWduLmNvbmZpZ1xuICAgIGdyb3VwcyA9IGRlc2lnbi5jb25maWcuZ3JvdXBzIHx8IGRlc2lnbi5ncm91cHNcblxuICAgIEBuYW1lc3BhY2UgPSBjb25maWc/Lm5hbWVzcGFjZSB8fCAnbGl2aW5nZG9jcy10ZW1wbGF0ZXMnXG4gICAgQGNzcyA9IGNvbmZpZy5jc3NcbiAgICBAanMgPSBjb25maWcuanNcbiAgICBAZm9udHMgPSBjb25maWcuZm9udHNcbiAgICBAdGVtcGxhdGVzID0gW11cbiAgICBAZ3JvdXBzID0ge31cbiAgICBAc3R5bGVzID0ge31cblxuICAgIEBzdG9yZVRlbXBsYXRlRGVmaW5pdGlvbnModGVtcGxhdGVzKVxuICAgIEBnbG9iYWxTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKGRlc2lnbi5jb25maWcuc3R5bGVzKVxuICAgIEBhZGRHcm91cHMoZ3JvdXBzKVxuICAgIEBhZGRUZW1wbGF0ZXNOb3RJbkdyb3VwcygpXG5cblxuICBzdG9yZVRlbXBsYXRlRGVmaW5pdGlvbnM6ICh0ZW1wbGF0ZXMpIC0+XG4gICAgQHRlbXBsYXRlRGVmaW5pdGlvbnMgPSB7fVxuICAgIGZvciB0ZW1wbGF0ZSBpbiB0ZW1wbGF0ZXNcbiAgICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlLmlkXSA9IHRlbXBsYXRlXG5cblxuICAjIHBhc3MgdGhlIHRlbXBsYXRlIGFzIG9iamVjdFxuICAjIGUuZyBhZGQoe2lkOiBcInRpdGxlXCIsIG5hbWU6XCJUaXRsZVwiLCBodG1sOiBcIjxoMSBkb2MtZWRpdGFibGU+VGl0bGU8L2gxPlwifSlcbiAgYWRkOiAodGVtcGxhdGVEZWZpbml0aW9uLCBzdHlsZXMpIC0+XG4gICAgQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGVEZWZpbml0aW9uLmlkXSA9IHVuZGVmaW5lZFxuICAgIHRlbXBsYXRlT25seVN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24odGVtcGxhdGVEZWZpbml0aW9uLnN0eWxlcylcbiAgICB0ZW1wbGF0ZVN0eWxlcyA9ICQuZXh0ZW5kKHt9LCBzdHlsZXMsIHRlbXBsYXRlT25seVN0eWxlcylcblxuICAgIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlXG4gICAgICBuYW1lc3BhY2U6IEBuYW1lc3BhY2VcbiAgICAgIGlkOiB0ZW1wbGF0ZURlZmluaXRpb24uaWRcbiAgICAgIHRpdGxlOiB0ZW1wbGF0ZURlZmluaXRpb24udGl0bGVcbiAgICAgIHN0eWxlczogdGVtcGxhdGVTdHlsZXNcbiAgICAgIGh0bWw6IHRlbXBsYXRlRGVmaW5pdGlvbi5odG1sXG4gICAgICB3ZWlnaHQ6IHRlbXBsYXRlRGVmaW5pdGlvbi5zb3J0T3JkZXIgfHwgMFxuXG4gICAgQHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlKVxuICAgIHRlbXBsYXRlXG5cblxuICBhZGRHcm91cHM6IChjb2xsZWN0aW9uKSAtPlxuICAgIGZvciBncm91cE5hbWUsIGdyb3VwIG9mIGNvbGxlY3Rpb25cbiAgICAgIGdyb3VwT25seVN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24oZ3JvdXAuc3R5bGVzKVxuICAgICAgZ3JvdXBTdHlsZXMgPSAkLmV4dGVuZCh7fSwgQGdsb2JhbFN0eWxlcywgZ3JvdXBPbmx5U3R5bGVzKVxuXG4gICAgICB0ZW1wbGF0ZXMgPSB7fVxuICAgICAgZm9yIHRlbXBsYXRlSWQgaW4gZ3JvdXAudGVtcGxhdGVzXG4gICAgICAgIHRlbXBsYXRlRGVmaW5pdGlvbiA9IEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlSWRdXG4gICAgICAgIGlmIHRlbXBsYXRlRGVmaW5pdGlvblxuICAgICAgICAgIHRlbXBsYXRlID0gQGFkZCh0ZW1wbGF0ZURlZmluaXRpb24sIGdyb3VwU3R5bGVzKVxuICAgICAgICAgIHRlbXBsYXRlc1t0ZW1wbGF0ZS5pZF0gPSB0ZW1wbGF0ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbG9nLndhcm4oXCJUaGUgdGVtcGxhdGUgJyN7dGVtcGxhdGVJZH0nIHJlZmVyZW5jZWQgaW4gdGhlIGdyb3VwICcje2dyb3VwTmFtZX0nIGRvZXMgbm90IGV4aXN0LlwiKVxuXG4gICAgICBAYWRkR3JvdXAoZ3JvdXBOYW1lLCBncm91cCwgdGVtcGxhdGVzKVxuXG5cbiAgYWRkVGVtcGxhdGVzTm90SW5Hcm91cHM6IChnbG9iYWxTdHlsZXMpIC0+XG4gICAgZm9yIHRlbXBsYXRlSWQsIHRlbXBsYXRlRGVmaW5pdGlvbiBvZiBAdGVtcGxhdGVEZWZpbml0aW9uc1xuICAgICAgaWYgdGVtcGxhdGVEZWZpbml0aW9uXG4gICAgICAgIEBhZGQodGVtcGxhdGVEZWZpbml0aW9uLCBAZ2xvYmFsU3R5bGVzKVxuXG5cbiAgYWRkR3JvdXA6IChuYW1lLCBncm91cCwgdGVtcGxhdGVzKSAtPlxuICAgIEBncm91cHNbbmFtZV0gPVxuICAgICAgdGl0bGU6IGdyb3VwLnRpdGxlXG4gICAgICB0ZW1wbGF0ZXM6IHRlbXBsYXRlc1xuXG5cbiAgY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uOiAoc3R5bGVzKSAtPlxuICAgIGRlc2lnblN0eWxlcyA9IHt9XG4gICAgaWYgc3R5bGVzXG4gICAgICBmb3Igc3R5bGVEZWZpbml0aW9uIGluIHN0eWxlc1xuICAgICAgICBkZXNpZ25TdHlsZSA9IEBjcmVhdGVEZXNpZ25TdHlsZShzdHlsZURlZmluaXRpb24pXG4gICAgICAgIGRlc2lnblN0eWxlc1tkZXNpZ25TdHlsZS5uYW1lXSA9IGRlc2lnblN0eWxlIGlmIGRlc2lnblN0eWxlXG5cbiAgICBkZXNpZ25TdHlsZXNcblxuXG4gIGNyZWF0ZURlc2lnblN0eWxlOiAoc3R5bGVEZWZpbml0aW9uKSAtPlxuICAgIGlmIHN0eWxlRGVmaW5pdGlvbiAmJiBzdHlsZURlZmluaXRpb24ubmFtZVxuICAgICAgbmV3IERlc2lnblN0eWxlXG4gICAgICAgIG5hbWU6IHN0eWxlRGVmaW5pdGlvbi5uYW1lXG4gICAgICAgIHR5cGU6IHN0eWxlRGVmaW5pdGlvbi50eXBlXG4gICAgICAgIG9wdGlvbnM6IHN0eWxlRGVmaW5pdGlvbi5vcHRpb25zXG4gICAgICAgIHZhbHVlOiBzdHlsZURlZmluaXRpb24udmFsdWVcblxuXG4gIHJlbW92ZTogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIEB0ZW1wbGF0ZXMuc3BsaWNlKEBnZXRJbmRleChpZCksIDEpXG5cblxuICBnZXQ6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICB0ZW1wbGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgQGVhY2ggKHQsIGluZGV4KSAtPlxuICAgICAgICBpZiB0LmlkID09IGlkXG4gICAgICAgICAgdGVtcGxhdGUgPSB0XG5cbiAgICAgIHRlbXBsYXRlXG5cblxuICBnZXRJbmRleDogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIGluZGV4ID0gdW5kZWZpbmVkXG4gICAgICBAZWFjaCAodCwgaSkgLT5cbiAgICAgICAgaWYgdC5pZCA9PSBpZFxuICAgICAgICAgIGluZGV4ID0gaVxuXG4gICAgICBpbmRleFxuXG5cbiAgY2hlY2tOYW1lc3BhY2U6IChpZGVudGlmaWVyLCBjYWxsYmFjaykgLT5cbiAgICB7IG5hbWVzcGFjZSwgaWQgfSA9IFRlbXBsYXRlLnBhcnNlSWRlbnRpZmllcihpZGVudGlmaWVyKVxuXG4gICAgYXNzZXJ0IG5vdCBuYW1lc3BhY2Ugb3IgQG5hbWVzcGFjZSBpcyBuYW1lc3BhY2UsXG4gICAgICBcImRlc2lnbiAjeyBAbmFtZXNwYWNlIH06IGNhbm5vdCBnZXQgdGVtcGxhdGUgd2l0aCBkaWZmZXJlbnQgbmFtZXNwYWNlICN7IG5hbWVzcGFjZSB9IFwiXG5cbiAgICBjYWxsYmFjayhpZClcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgdGVtcGxhdGUsIGluZGV4IGluIEB0ZW1wbGF0ZXNcbiAgICAgIGNhbGxiYWNrKHRlbXBsYXRlLCBpbmRleClcblxuXG4gICMgbGlzdCBhdmFpbGFibGUgVGVtcGxhdGVzXG4gIGxpc3Q6IC0+XG4gICAgdGVtcGxhdGVzID0gW11cbiAgICBAZWFjaCAodGVtcGxhdGUpIC0+XG4gICAgICB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgdGVtcGxhdGVzXG5cblxuICAjIHByaW50IGRvY3VtZW50YXRpb24gZm9yIGEgdGVtcGxhdGVcbiAgaW5mbzogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0KGlkZW50aWZpZXIpXG4gICAgdGVtcGxhdGUucHJpbnREb2MoKVxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25TdHlsZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgQHR5cGUsIHZhbHVlLCBvcHRpb25zIH0pIC0+XG4gICAgc3dpdGNoIEB0eXBlXG4gICAgICB3aGVuICdvcHRpb24nXG4gICAgICAgIGFzc2VydCB2YWx1ZSwgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAndmFsdWUnIHByb3ZpZGVkXCJcbiAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgIHdoZW4gJ3NlbGVjdCdcbiAgICAgICAgYXNzZXJ0IG9wdGlvbnMsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ29wdGlvbnMnIHByb3ZpZGVkXCJcbiAgICAgICAgQG9wdGlvbnMgPSBvcHRpb25zXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IHVua25vd24gdHlwZSAnI3sgQHR5cGUgfSdcIlxuXG5cbiAgIyBHZXQgaW5zdHJ1Y3Rpb25zIHdoaWNoIGNzcyBjbGFzc2VzIHRvIGFkZCBhbmQgcmVtb3ZlLlxuICAjIFdlIGRvIG5vdCBjb250cm9sIHRoZSBjbGFzcyBhdHRyaWJ1dGUgb2YgYSBzbmlwcGV0IERPTSBlbGVtZW50XG4gICMgc2luY2UgdGhlIFVJIG9yIG90aGVyIHNjcmlwdHMgY2FuIG1lc3Mgd2l0aCBpdCBhbnkgdGltZS4gU28gdGhlXG4gICMgaW5zdHJ1Y3Rpb25zIGFyZSBkZXNpZ25lZCBub3QgdG8gaW50ZXJmZXJlIHdpdGggb3RoZXIgY3NzIGNsYXNzZXNcbiAgIyBwcmVzZW50IGluIGFuIGVsZW1lbnRzIGNsYXNzIGF0dHJpYnV0ZS5cbiAgY3NzQ2xhc3NDaGFuZ2VzOiAodmFsdWUpIC0+XG4gICAgaWYgQHZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGlmIG5vdCB2YWx1ZSB0aGVuIFtAdmFsdWVdIGVsc2UgdW5kZWZpbmVkXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHZhbHVlKVxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgZWxzZVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBjdXJyZW50VmFsdWVcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHVuZGVmaW5lZClcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcblxuXG4gIHZhbGlkYXRlVmFsdWU6ICh2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICB2YWx1ZSA9PSBAdmFsdWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICBAY29udGFpbnNPcHRpb24odmFsdWUpXG4gICAgZWxzZVxuICAgICAgbG9nLndhcm4gXCJOb3QgaW1wbGVtZW50ZWQ6IERlc2lnblN0eWxlI3ZhbGlkYXRlVmFsdWUoKSBmb3IgdHlwZSAjeyBAdHlwZSB9XCJcblxuXG4gIGNvbnRhaW5zT3B0aW9uOiAodmFsdWUpIC0+XG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgcmV0dXJuIHRydWUgaWYgdmFsdWUgaXMgb3B0aW9uLnZhbHVlXG5cbiAgICBmYWxzZVxuXG5cbiAgb3RoZXJPcHRpb25zOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24gaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuXG5cbiAgb3RoZXJDbGFzc2VzOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24udmFsdWUgaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkRlc2lnbiA9IHJlcXVpcmUoJy4vZGVzaWduL2Rlc2lnbicpXG5TbmlwcGV0VHJlZSA9IHJlcXVpcmUoJy4vc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZScpXG5LaWNrc3RhcnQgPSByZXF1aXJlKCcuL2tpY2tzdGFydC9raWNrc3RhcnQnKVxuXG5SZW5kZXJpbmdDb250YWluZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5QYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZy9yZW5kZXJlcicpXG5cbiMgRG9jdW1lbnRcbiMgLS0tLS0tLS1cbiMgTWFuYWdlIHRoZSBkb2N1bWVudCBhbmQgaXRzIGRlcGVuZGVuY2llcy5cbiMgSW5pdGlhbHplIGV2ZXJ5dGluZy5cbiNcbiMgIyMjIERlc2lnbjpcbiMgTWFuYWdlIGF2YWlsYWJsZSBUZW1wbGF0ZXNcbiNcbiMgIyMjIEFzc2V0czpcbiMgTG9hZCBhbmQgbWFuYWdlIENTUyBhbmQgSmF2YXNjcmlwdCBkZXBlbmRlbmNpZXNcbiMgb2YgdGhlIGRlc2lnbnNcbiNcbiMgIyMjIENvbnRlbnQ6XG4jIEluaXRpYWxpemUgdGhlIFNuaXBwZXRUcmVlLlxuI1xuIyAjIyMgUGFnZTpcbiMgSW5pdGlhbGl6ZSBldmVudCBsaXN0ZW5lcnMuXG4jIExpbmsgdGhlIFNuaXBwZXRUcmVlIHdpdGggdGhlIERvbVRyZWUuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBEb2N1bWVudCBvYmplY3RcbiAgIyAtLS0tLS0tLS0tLS0tLS1cblxuICBpbml0aWFsaXplZDogZmFsc2VcbiAgdW5pcXVlSWQ6IDBcbiAgcmVhZHk6ICQuQ2FsbGJhY2tzKCdtZW1vcnkgb25jZScpXG4gIGNoYW5nZWQ6ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgKlB1YmxpYyBBUEkqXG4gIGluaXQ6ICh7IGRlc2lnbiwganNvbiwgcm9vdE5vZGUgfT17fSkgLT5cbiAgICBhc3NlcnQgbm90IEBpbml0aWFsaXplZCwgJ2RvY3VtZW50IGlzIGFscmVhZHkgaW5pdGlhbGl6ZWQnXG4gICAgQGluaXRpYWxpemVkID0gdHJ1ZVxuICAgIEBkZXNpZ24gPSBuZXcgRGVzaWduKGRlc2lnbilcblxuICAgIEBzbmlwcGV0VHJlZSA9IGlmIGpzb24gJiYgQGRlc2lnblxuICAgICAgbmV3IFNuaXBwZXRUcmVlKGNvbnRlbnQ6IGpzb24sIGRlc2lnbjogQGRlc2lnbilcbiAgICBlbHNlXG4gICAgICBuZXcgU25pcHBldFRyZWUoKVxuXG4gICAgIyBmb3J3YXJkIGNoYW5nZWQgZXZlbnRcbiAgICBAc25pcHBldFRyZWUuY2hhbmdlZC5hZGQgPT5cbiAgICAgIEBjaGFuZ2VkLmZpcmUoKVxuXG4gICAgIyBQYWdlIGluaXRpYWxpemF0aW9uXG4gICAgQHBhZ2UgPSBuZXcgSW50ZXJhY3RpdmVQYWdlKHJlbmRlck5vZGU6IHJvb3ROb2RlLCBkZXNpZ246IEBkZXNpZ24pXG5cbiAgICAjIHJlbmRlciBkb2N1bWVudFxuICAgIEByZW5kZXJlciA9IG5ldyBSZW5kZXJlclxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBAcGFnZVxuXG4gICAgQHJlbmRlcmVyLnJlYWR5ID0+IEByZWFkeS5maXJlKClcblxuXG4gIGNyZWF0ZVZpZXc6IChwYXJlbnQ9d2luZG93LmRvY3VtZW50LmJvZHkpIC0+XG4gICAgY3JlYXRlUmVuZGVyZXJBbmRSZXNvbHZlUHJvbWlzZSA9ID0+XG4gICAgICBwYWdlID0gbmV3IFBhZ2VcbiAgICAgICAgcmVuZGVyTm9kZTogaWZyYW1lLmNvbnRlbnREb2N1bWVudC5ib2R5XG4gICAgICAgIGhvc3RXaW5kb3c6IGlmcmFtZS5jb250ZW50V2luZG93XG4gICAgICAgIGRlc2lnbjogQGRlc2lnblxuICAgICAgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJcbiAgICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBwYWdlXG4gICAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgIGRlZmVycmVkLnJlc29sdmVcbiAgICAgICAgaWZyYW1lOiBpZnJhbWVcbiAgICAgICAgcmVuZGVyZXI6IHJlbmRlcmVyXG5cbiAgICBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKVxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuICAgIGlmcmFtZSA9ICRwYXJlbnRbMF0ub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKVxuICAgIGlmcmFtZS5zcmMgPSAnYWJvdXQ6YmxhbmsnXG4gICAgaWZyYW1lLm9ubG9hZCA9IGNyZWF0ZVJlbmRlcmVyQW5kUmVzb2x2ZVByb21pc2VcbiAgICAkcGFyZW50LmFwcGVuZChpZnJhbWUpXG5cbiAgICBkZWZlcnJlZC5wcm9taXNlKClcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaENvbnRhaW5lcihjYWxsYmFjaylcblxuXG4gICMgKlB1YmxpYyBBUEkqXG4gIGFkZDogKGlucHV0KSAtPlxuICAgIGlmIGpRdWVyeS50eXBlKGlucHV0KSA9PSAnc3RyaW5nJ1xuICAgICAgc25pcHBldCA9IEBjcmVhdGVNb2RlbChpbnB1dClcbiAgICBlbHNlXG4gICAgICBzbmlwcGV0ID0gaW5wdXRcblxuICAgIEBzbmlwcGV0VHJlZS5hcHBlbmQoc25pcHBldCkgaWYgc25pcHBldFxuICAgIHNuaXBwZXRcblxuXG4gICMgKlB1YmxpYyBBUEkqXG4gIGNyZWF0ZU1vZGVsOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBnZXRUZW1wbGF0ZShpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLmNyZWF0ZU1vZGVsKCkgaWYgdGVtcGxhdGVcblxuXG4gICMgZmluZCBhbGwgaW5zdGFuY2VzIG9mIGEgY2VydGFpbiBUZW1wbGF0ZVxuICAjIGUuZy4gc2VhcmNoIFwiYm9vdHN0cmFwLmhlcm9cIiBvciBqdXN0IFwiaGVyb1wiXG4gIGZpbmQ6IChzZWFyY2gpIC0+XG4gICAgQHNuaXBwZXRUcmVlLmZpbmQoc2VhcmNoKVxuXG5cbiAgIyBwcmludCB0aGUgU25pcHBldFRyZWVcbiAgcHJpbnRUcmVlOiAoKSAtPlxuICAgIEBzbmlwcGV0VHJlZS5wcmludCgpXG5cblxuICB0b0pzb246IC0+XG4gICAganNvbiA9IEBzbmlwcGV0VHJlZS50b0pzb24oKVxuICAgIGpzb25bJ21ldGEnXSA9XG4gICAgICB0aXRsZTogdW5kZWZpbmVkXG4gICAgICBhdXRob3I6IHVuZGVmaW5lZFxuICAgICAgY3JlYXRlZDogdW5kZWZpbmVkXG4gICAgICBwdWJsaXNoZWQ6IHVuZGVmaW5lZFxuXG4gICAganNvblxuXG5cbiAgdG9IdG1sOiAtPlxuICAgIG5ldyBSZW5kZXJlcihcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogbmV3IFJlbmRlcmluZ0NvbnRhaW5lcigpXG4gICAgKS5odG1sKClcblxuXG4gIHJlc3RvcmU6IChjb250ZW50SnNvbiwgcmVzZXRGaXJzdCA9IHRydWUpIC0+XG4gICAgQHJlc2V0KCkgaWYgcmVzZXRGaXJzdFxuICAgIEBzbmlwcGV0VHJlZS5mcm9tSnNvbihjb250ZW50SnNvbiwgQGRlc2lnbilcbiAgICBAcmVuZGVyZXIucmVuZGVyKClcblxuXG4gIHJlc2V0OiAtPlxuICAgIEByZW5kZXJlci5jbGVhcigpXG4gICAgQHNuaXBwZXRUcmVlLmRldGFjaCgpXG5cblxuICBnZXRUZW1wbGF0ZTogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZGVzaWduPy5nZXQoaWRlbnRpZmllcilcblxuICAgIGFzc2VydCB0ZW1wbGF0ZSwgXCJjb3VsZCBub3QgZmluZCB0ZW1wbGF0ZSAjeyBpZGVudGlmaWVyIH1cIlxuXG4gICAgdGVtcGxhdGVcblxuICBraWNrc3RhcnQ6ICh7IHhtbFRlbXBsYXRlLCBzY3JpcHROb2RlLCBkZXN0aW5hdGlvbiwgZGVzaWdufSkgLT5cbiAgICBqc29uID0gbmV3IEtpY2tzdGFydCh7eG1sVGVtcGxhdGUsIHNjcmlwdE5vZGUsIGRlc2lnbn0pLmdldFNuaXBwZXRUcmVlKCkudG9Kc29uKClcbiAgICBAaW5pdCh7IGRlc2lnbiwganNvbiwgcm9vdE5vZGU6IGRlc3RpbmF0aW9uIH0pXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmRvY0NsYXNzID0gY29uZmlnLmh0bWwuY3NzXG5cbiMgRE9NIGhlbHBlciBtZXRob2RzXG4jIC0tLS0tLS0tLS0tLS0tLS0tLVxuIyBNZXRob2RzIHRvIHBhcnNlIGFuZCB1cGRhdGUgdGhlIERvbSB0cmVlIGluIGFjY29yZGFuY2UgdG9cbiMgdGhlIFNuaXBwZXRUcmVlIGFuZCBMaXZpbmdkb2NzIGNsYXNzZXMgYW5kIGF0dHJpYnV0ZXNcbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cbiAgc25pcHBldFJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBkb2NDbGFzcy5zbmlwcGV0IH0oPzogfCQpXCIpXG4gIHNlY3Rpb25SZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgZG9jQ2xhc3Muc2VjdGlvbiB9KD86IHwkKVwiKVxuXG4gICMgRmluZCB0aGUgc25pcHBldCB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgIyBTbmlwcGV0cyBhcmUgbWFya2VkIGJ5IGEgY2xhc3MgYXQgdGhlIG1vbWVudC5cbiAgZmluZFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIHNuaXBwZXRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICB2aWV3ID0gQGdldFNuaXBwZXRWaWV3KG5vZGUpXG4gICAgICAgIHJldHVybiB2aWV3XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGZpbmROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBub2RlQ29udGV4dCA9IEBnZXROb2RlQ29udGV4dChub2RlKVxuICAgICAgcmV0dXJuIG5vZGVDb250ZXh0IGlmIG5vZGVDb250ZXh0XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGdldE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBmb3IgZGlyZWN0aXZlVHlwZSwgb2JqIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG4gICAgICBjb250aW51ZSBpZiBub3Qgb2JqLmVsZW1lbnREaXJlY3RpdmVcblxuICAgICAgZGlyZWN0aXZlQXR0ciA9IG9iai5yZW5kZXJlZEF0dHJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGV4dEF0dHI6IGRpcmVjdGl2ZUF0dHJcbiAgICAgICAgICBhdHRyTmFtZTogbm9kZS5nZXRBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIyBGaW5kIHRoZSBjb250YWluZXIgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gIGZpbmRDb250YWluZXI6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgaWYgbm90IHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICAgIHZpZXcgPSBAZmluZFNuaXBwZXRWaWV3KG5vZGUpXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBub2RlXG4gICAgICAgICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuICAgICAgICAgIHNuaXBwZXRWaWV3OiB2aWV3XG4gICAgICAgIH1cblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAge31cblxuXG4gIGdldEltYWdlTmFtZTogKG5vZGUpIC0+XG4gICAgaW1hZ2VBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgcmV0dXJuIGltYWdlTmFtZVxuXG5cbiAgZ2V0SHRtbEVsZW1lbnROYW1lOiAobm9kZSkgLT5cbiAgICBodG1sQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICBodG1sRWxlbWVudE5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIHJldHVybiBodG1sRWxlbWVudE5hbWVcblxuXG4gIGdldEVkaXRhYmxlTmFtZTogKG5vZGUpIC0+XG4gICAgZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgcmV0dXJuIGVkaXRhYmxlTmFtZVxuXG5cblxuICBkcm9wVGFyZ2V0OiAobm9kZSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGlmIG5vdCBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgICBpbnNlcnRTbmlwcGV0ID0gQGdldFBvc2l0aW9uSW5Db250YWluZXIoJChub2RlKSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgICBpZiBpbnNlcnRTbmlwcGV0XG4gICAgICAgICAgICBjb29yZHMgPSBAZ2V0SW5zZXJ0UG9zaXRpb24oaW5zZXJ0U25pcHBldC4kZWxlbVswXSwgaW5zZXJ0U25pcHBldC5wb3NpdGlvbilcbiAgICAgICAgICAgIHJldHVybiB7IHNuaXBwZXRWaWV3OiBpbnNlcnRTbmlwcGV0LnNuaXBwZXRWaWV3LCBwb3NpdGlvbjogaW5zZXJ0U25pcHBldC5wb3NpdGlvbiwgY29vcmRzIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB2aWV3ID0gQGZpbmRTbmlwcGV0Vmlldyhub2RlKVxuICAgICAgICAgICAgcmV0dXJuIHsgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZSwgcGFyZW50OiB2aWV3LCBub2RlOiBub2RlIH1cblxuICAgICAgZWxzZSBpZiBzbmlwcGV0UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgcG9zID0gQGdldFBvc2l0aW9uSW5TbmlwcGV0KCQobm9kZSksIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIHZpZXcgPSBAZ2V0U25pcHBldFZpZXcobm9kZSlcbiAgICAgICAgY29vcmRzID0gQGdldEluc2VydFBvc2l0aW9uKG5vZGUsIHBvcy5wb3NpdGlvbilcbiAgICAgICAgcmV0dXJuIHsgc25pcHBldFZpZXc6IHZpZXcsIHBvc2l0aW9uOiBwb3MucG9zaXRpb24sIGNvb3JkcyB9XG5cbiAgICAgIGVsc2UgaWYgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIHJldHVybiB7IHJvb3Q6IHRydWUgfVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICB7fVxuXG5cbiAgZ2V0SW5zZXJ0UG9zaXRpb246IChlbGVtLCBwb3NpdGlvbikgLT5cbiAgICByZWN0ID0gQGdldEJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIGlmIHBvc2l0aW9uID09ICdiZWZvcmUnXG4gICAgICB7IHRvcDogcmVjdC50b3AsIGxlZnQ6IHJlY3QubGVmdCwgd2lkdGg6IHJlY3Qud2lkdGggfVxuICAgIGVsc2VcbiAgICAgIHsgdG9wOiByZWN0LmJvdHRvbSwgbGVmdDogcmVjdC5sZWZ0LCB3aWR0aDogcmVjdC53aWR0aCB9XG5cblxuICAjIGZpZ3VyZSBvdXQgaWYgd2Ugc2hvdWxkIGluc2VydCBiZWZvcmUgb3IgYWZ0ZXIgc25pcHBldFxuICAjIGJhc2VkIG9uIHRoZSBjdXJzb3IgcG9zaXRpb25cbiAgZ2V0UG9zaXRpb25JblNuaXBwZXQ6ICgkZWxlbSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgIGlmIEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApIDwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgIHsgcG9zaXRpb246ICdiZWZvcmUnIH1cbiAgICBlbHNlXG4gICAgICB7IHBvc2l0aW9uOiAnYWZ0ZXInIH1cblxuXG4gICMgZmlndXJlIG91dCBpZiB0aGUgdXNlciB3YW50ZWQgdG8gaW5zZXJ0IGJldHdlZW4gc25pcHBldHNcbiAgIyBpbnN0ZWFkIG9mIGFwcGVuZGluZyB0byB0aGUgY29udGFpbmVyXG4gICMgKHRoaXMgY2FuIGJlIHRoZSBjYXNlIGlmIHRoZSBkcm9wIG9jY3VycyBvbiBhIG1hcmdpbilcbiAgZ2V0UG9zaXRpb25JbkNvbnRhaW5lcjogKCRjb250YWluZXIsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJHNuaXBwZXRzID0gJGNvbnRhaW5lci5maW5kKFwiLiN7IGRvY0NsYXNzLnNuaXBwZXQgfVwiKVxuICAgIGNsb3Nlc3QgPSB1bmRlZmluZWRcbiAgICBpbnNlcnRTbmlwcGV0ID0gdW5kZWZpbmVkXG5cbiAgICAkc25pcHBldHMuZWFjaCAoaW5kZXgsIGVsZW0pID0+XG4gICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgICAgaWYgbm90IGNsb3Nlc3Qgb3IgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKVxuICAgICAgICBpbnNlcnRTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdiZWZvcmUnfVxuICAgICAgaWYgbm90IGNsb3Nlc3Qgb3IgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgICBpbnNlcnRTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdhZnRlcid9XG5cbiAgICAgIGlmIGluc2VydFNuaXBwZXRcbiAgICAgICAgaW5zZXJ0U25pcHBldC5zbmlwcGV0VmlldyA9IEBnZXRTbmlwcGV0VmlldyhpbnNlcnRTbmlwcGV0LiRlbGVtWzBdKVxuXG4gICAgaW5zZXJ0U25pcHBldFxuXG5cbiAgZGlzdGFuY2U6IChhLCBiKSAtPlxuICAgIGlmIGEgPiBiIHRoZW4gYS1iIGVsc2UgYi1hXG5cblxuICAjIGZvcmNlIGFsbCBjb250YWluZXJzIG9mIGEgc25pcHBldCB0byBiZSBhcyBoaWdoIGFzIHRoZXkgY2FuIGJlXG4gICMgc2V0cyBjc3Mgc3R5bGUgaGVpZ2h0XG4gIG1heGltaXplQ29udGFpbmVySGVpZ2h0OiAodmlldykgLT5cbiAgICBpZiB2aWV3LnRlbXBsYXRlLmNvbnRhaW5lckNvdW50ID4gMVxuICAgICAgZm9yIG5hbWUsIGVsZW0gb2Ygdmlldy5jb250YWluZXJzXG4gICAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgICBjb250aW51ZSBpZiAkZWxlbS5oYXNDbGFzcyhkb2NDbGFzcy5tYXhpbWl6ZWRDb250YWluZXIpXG4gICAgICAgICRwYXJlbnQgPSAkZWxlbS5wYXJlbnQoKVxuICAgICAgICBwYXJlbnRIZWlnaHQgPSAkcGFyZW50LmhlaWdodCgpXG4gICAgICAgIG91dGVyID0gJGVsZW0ub3V0ZXJIZWlnaHQodHJ1ZSkgLSAkZWxlbS5oZWlnaHQoKVxuICAgICAgICAkZWxlbS5oZWlnaHQocGFyZW50SGVpZ2h0IC0gb3V0ZXIpXG4gICAgICAgICRlbGVtLmFkZENsYXNzKGRvY0NsYXNzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gICMgcmVtb3ZlIGFsbCBjc3Mgc3R5bGUgaGVpZ2h0IGRlY2xhcmF0aW9ucyBhZGRlZCBieVxuICAjIG1heGltaXplQ29udGFpbmVySGVpZ2h0KClcbiAgcmVzdG9yZUNvbnRhaW5lckhlaWdodDogKCkgLT5cbiAgICAkKFwiLiN7IGRvY0NsYXNzLm1heGltaXplZENvbnRhaW5lciB9XCIpXG4gICAgICAuY3NzKCdoZWlnaHQnLCAnJylcbiAgICAgIC5yZW1vdmVDbGFzcyhkb2NDbGFzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICBnZXRFbGVtZW50Tm9kZTogKG5vZGUpIC0+XG4gICAgaWYgbm9kZT8uanF1ZXJ5XG4gICAgICBub2RlWzBdXG4gICAgZWxzZSBpZiBub2RlPy5ub2RlVHlwZSA9PSAzICMgTm9kZS5URVhUX05PREUgPT0gM1xuICAgICAgbm9kZS5wYXJlbnROb2RlXG4gICAgZWxzZVxuICAgICAgbm9kZVxuXG5cbiAgIyBTbmlwcGV0cyBzdG9yZSBhIHJlZmVyZW5jZSBvZiB0aGVtc2VsdmVzIGluIHRoZWlyIERvbSBub2RlXG4gICMgY29uc2lkZXI6IHN0b3JlIHJlZmVyZW5jZSBkaXJlY3RseSB3aXRob3V0IGpRdWVyeVxuICBnZXRTbmlwcGV0VmlldzogKG5vZGUpIC0+XG4gICAgJChub2RlKS5kYXRhKCdzbmlwcGV0JylcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogKG5vZGUpIC0+XG4gICAgY29vcmRzID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXG4gICAgIyBjb2RlIGZyb20gbWRuOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvd2luZG93LnNjcm9sbFhcbiAgICBzY3JvbGxYID0gaWYgKHdpbmRvdy5wYWdlWE9mZnNldCAhPSB1bmRlZmluZWQpIHRoZW4gd2luZG93LnBhZ2VYT2Zmc2V0IGVsc2UgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW5kb3cuZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbmRvdy5kb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0XG4gICAgc2Nyb2xsWSA9IGlmICh3aW5kb3cucGFnZVlPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbmRvdy5wYWdlWU9mZnNldCBlbHNlIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luZG93LmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW5kb3cuZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wXG5cbiAgICAjIHRyYW5zbGF0ZSBpbnRvIGFic29sdXRlIHBvc2l0aW9uc1xuICAgIGNvb3JkcyA9XG4gICAgICB0b3A6IGNvb3Jkcy50b3AgKyBzY3JvbGxZXG4gICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20gKyBzY3JvbGxZXG4gICAgICBsZWZ0OiBjb29yZHMubGVmdCArIHNjcm9sbFhcbiAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQgKyBzY3JvbGxYXG5cbiAgICBjb29yZHMuaGVpZ2h0ID0gY29vcmRzLmJvdHRvbSAtIGNvb3Jkcy50b3BcbiAgICBjb29yZHMud2lkdGggPSBjb29yZHMucmlnaHQgLSBjb29yZHMubGVmdFxuXG4gICAgY29vcmRzXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5kb2NDbGFzcyA9IGNvbmZpZy5odG1sLmNzc1xuXG5cbiMgRHJhZ0Ryb3BcbiNcbiMgdG8gc3RhcnQgYSBkcmFnIG9wZXJhdGlvbjpcbiMgYURyYWdkcm9wSW5zdGFuY2UubW91c2Vkb3duKC4uLilcbiNcbiMgb3B0aW9ucyB0aGF0IGNhbiBiZSBzZXQgd2hlbiBjcmVhdGluZyBhbiBpbnN0YW5jZSBvciBvdmVyd3JpdHRlbiBmb3IgZXZlcnkgZHJhZyAoYXBwbGljYWJsZSBpbiBtb3VzZWRvd24gY2FsbClcbiMgQG9wdGlvbiBkaXJlY3Q6IGlmIHRydWUgdGhlIHNwZWNpZmllZCBlbGVtZW50IGl0c2VsZiBpcyBtb3ZlZCB3aGlsZSBkcmFnZ2luZywgb3RoZXJ3aXNlIGEgc2VtaS10cmFuc3BhcmVudCBjbG9uZSBpcyBjcmVhdGVkXG4jXG4jIGxvbmcgcHJlc3M6XG4jIEBvcHRpb24gbG9uZ3ByZXNzRGVsYXk6IG1pbGlzZWNvbmRzIHRoYXQgdGhlIG1vdXNlIG5lZWRzIHRvIGJlIHByZXNzZWQgYmVmb3JlIGRyYWcgaW5pdGlhdGVzXG4jIEBvcHRpb24gbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdDogaWYgdGhlIHBvaW50ZXIgaXMgbW92ZWQgYnkgbW9yZSBwaXhlbHMgZHVyaW5nIHRoZSBsb25ncHJlc3NEZWxheSB0aGUgZHJhZyBvcGVyYXRpb24gaXMgYWJvcnRlZFxuI1xuIyBjbGljayBmcmllbmRseTpcbiMgQG9wdGlvbiBtaW5EaXN0YW5jZTogZHJhZyBpcyBpbml0aWFsaXplZCBvbmx5IGlmIHRoZSBwb2ludGVyIGlzIG1vdmVkIGJ5IGEgbWluaW1hbCBkaXN0YW5jZVxuIyBAb3B0aW9uIHByZXZlbnREZWZhdWx0OiBjYWxsIHByZXZlbnREZWZhdWx0IG9uIG1vdXNlZG93biAocHJldmVudHMgYnJvd3NlciBkcmFnICYgZHJvcClcbiNcbiMgb3B0aW9ucyBmb3IgYSBzaW5nbGUgZHJhZyAocGFzcyBkaXJlY3RseSB0byBtb3VzZWRvd24gY2FsbClcbiMgQG9wdGlvbiBkcmFnLmZpeGVkOiBzZXQgdG8gdHJ1ZSBmb3IgcG9zaXRpb246IGZpeGVkIGVsZW1lbnRzXG4jIEBvcHRpb24gZHJhZy5tb3VzZVRvU25pcHBldDogZS5nLiB7IGxlZnQ6IDIwLCB0b3A6IDIwIH0sIGZvcmNlIHBvc2l0aW9uIG9mIGRyYWdnZWQgZWxlbWVudCByZWxhdGl2ZSB0byBjdXJzb3JcbiMgQG9wdGlvbiBkcmFnLndpZHRoOiBlLmcuIDMwMCwgZm9yY2Ugd2lkdGggb2YgZHJhZ2dlZCBlbGVtZW50XG4jIEBvcHRpb24gZHJhZy5vbkRyb3A6IGNhbGxiYWNrKCBkcmFnT2JqLCAkb3JpZ2luICksIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSBub2RlIGlzIGRyb3BwZWRcbiMgQG9wdGlvbiBkcmFnLm9uRHJhZzogY2FsbGJhY2soIHRyYWdUYXJnZXQsIGRyYWdPYmogKSwgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIG5vZGUgaXMgZHJvcHBlZFxuIyBAb3B0aW9uIGRyYWcub25EcmFnU3RhcnQ6IGNhbGxiYWNrKCBkcmFnT2JqICksIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSBkcmFnIHN0YXJ0ZWRcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcmFnRHJvcFxuXG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucykgLT5cblxuICAgIEBkZWZhdWx0T3B0aW9ucyA9ICQuZXh0ZW5kKHtcbiAgICAgICAgbG9uZ3ByZXNzRGVsYXk6IDBcbiAgICAgICAgbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdDogMTBcbiAgICAgICAgbWluRGlzdGFuY2U6IDBcbiAgICAgICAgZGlyZWN0OiBmYWxzZVxuICAgICAgICBwcmV2ZW50RGVmYXVsdDogdHJ1ZVxuICAgICAgICBjcmVhdGVQbGFjZWhvbGRlcjogRHJhZ0Ryb3AucGxhY2Vob2xkZXJcbiAgICAgICAgc2Nyb2xsTmVhckVkZ2U6IDUwXG4gICAgICB9LCBvcHRpb25zKVxuXG4gICAgIyBwZXIgZHJhZyBwcm9wZXJ0aWVzXG4gICAgQGRyYWcgPSB7fVxuXG4gICAgQCRvcmlnaW4gPSB1bmRlZmluZWRcbiAgICBAJGRyYWdnZWQgPSB1bmRlZmluZWRcblxuXG4gICMgc3RhcnQgYSBwb3NzaWJsZSBkcmFnXG4gICMgdGhlIGRyYWcgaXMgb25seSByZWFsbHkgc3RhcnRlZCBpZiBjb25zdHJhaW50cyBhcmUgbm90IHZpb2xhdGVkIChsb25ncHJlc3NEZWxheSBhbmQgbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdCBvciBtaW5EaXN0YW5jZSlcbiAgbW91c2Vkb3duOiAoJG9yaWdpbiwgZXZlbnQsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICBAcmVzZXQoKVxuICAgIEBkcmFnLmluaXRpYWxpemVkID0gdHJ1ZVxuICAgIEBvcHRpb25zID0gJC5leHRlbmQoe30sIEBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucylcbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0J1xuICAgICAgQGRyYWcuc3RhcnRQb2ludCA9XG4gICAgICAgIGxlZnQ6IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVhcbiAgICAgICAgdG9wOiBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VZXG4gICAgZWxzZVxuICAgICAgQGRyYWcuc3RhcnRQb2ludCA9IHsgbGVmdDogZXZlbnQucGFnZVgsIHRvcDogZXZlbnQucGFnZVkgfVxuICAgIEAkb3JpZ2luID0gJG9yaWdpblxuXG4gICAgaWYgQG9wdGlvbnMubG9uZ3ByZXNzRGVsYXkgYW5kIEBvcHRpb25zLmxvbmdwcmVzc0Rpc3RhbmNlTGltaXRcbiAgICAgIEBkcmFnLnRpbWVvdXQgPSBzZXRUaW1lb3V0KCA9PlxuICAgICAgICBAc3RhcnQoKVxuICAgICAgLCBAb3B0aW9ucy5sb25ncHJlc3NEZWxheSlcblxuICAgICMgcHJldmVudCBicm93c2VyIERyYWcgJiBEcm9wXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKSBpZiBAb3B0aW9ucy5wcmV2ZW50RGVmYXVsdFxuXG5cbiAgIyBzdGFydCB0aGUgZHJhZyBwcm9jZXNzXG4gIHN0YXJ0OiAtPlxuICAgIEBkcmFnLnN0YXJ0ZWQgPSB0cnVlXG5cbiAgICBtb3VzZUxlZnQgPSBAZHJhZy5zdGFydFBvaW50LmxlZnRcbiAgICBtb3VzZVRvcCA9IEBkcmFnLnN0YXJ0UG9pbnQudG9wXG5cbiAgICBpZiB0eXBlb2YgQG9wdGlvbnMub25EcmFnU3RhcnQgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICBAb3B0aW9ucy5vbkRyYWdTdGFydC5jYWxsKHRoaXMsIEBkcmFnLCB7IGxlZnQ6IG1vdXNlTGVmdCwgdG9wOiBtb3VzZVRvcCB9KVxuXG4gICAgIyBwcmV2ZW50IHRleHQtc2VsZWN0aW9ucyB3aGlsZSBkcmFnZ2luZ1xuICAgICQod2luZG93LmRvY3VtZW50LmJvZHkpLmFkZENsYXNzKGRvY0NsYXNzLnByZXZlbnRTZWxlY3Rpb24pXG5cbiAgICBpZiBAb3B0aW9ucy5kaXJlY3RcbiAgICAgIEAkZHJhZ2dlZCA9IEAkb3JpZ2luXG4gICAgZWxzZVxuICAgICAgQCRkcmFnZ2VkID0gQG9wdGlvbnMuY3JlYXRlUGxhY2Vob2xkZXIoQGRyYWcsIEAkb3JpZ2luKVxuXG4gICAgaWYgQGRyYWcuZml4ZWRcbiAgICAgIEBkcmFnLiRib2R5ID0gJCh3aW5kb3cuZG9jdW1lbnQuYm9keSlcblxuICAgICMgcG9zaXRpb25EcmFnZ2VkXG4gICAgQG1vdmUobW91c2VMZWZ0LCBtb3VzZVRvcClcblxuICAgIGlmICFAZGlyZWN0XG4gICAgICBAJGRyYWdnZWQuYXBwZW5kVG8od2luZG93LmRvY3VtZW50LmJvZHkpLnNob3coKVxuICAgICAgQCRvcmlnaW4/LmFkZENsYXNzKGRvY0NsYXNzLmRyYWdnZWQpXG5cblxuICAjIG9ubHkgdmVydGljYWwgc2Nyb2xsaW5nXG4gIHNjcm9sbEludG9WaWV3OiAodG9wLCBldmVudCkgLT5cbiAgICBpZiBAbGFzdFNjcm9sbFBvc2l0aW9uXG4gICAgICBkZWx0YSA9IHRvcCAtIEBsYXN0U2Nyb2xsUG9zaXRpb25cbiAgICAgIHZpZXdwb3J0VG9wID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpXG4gICAgICB2aWV3cG9ydEJvdHRvbSA9IHZpZXdwb3J0VG9wICsgJCh3aW5kb3cpLmhlaWdodCgpXG5cbiAgICAgIHNob3VsZFNjcm9sbCA9XG4gICAgICAgIGlmIGRlbHRhIDwgMCAjIHVwd2FyZCBtb3ZlbWVudFxuICAgICAgICAgIGluU2Nyb2xsVXBBcmVhID0gdG9wIDwgdmlld3BvcnRUb3AgKyBAZGVmYXVsdE9wdGlvbnMuc2Nyb2xsTmVhckVkZ2VcbiAgICAgICAgICB2aWV3cG9ydFRvcCAhPSAwICYmIGluU2Nyb2xsVXBBcmVhXG4gICAgICAgIGVsc2UgIyBkb3dud2FyZCBtb3ZlbWVudFxuICAgICAgICAgIGFib3ZlUGFnZUJvdHRvbSA9IHZpZXdwb3J0Qm90dG9tIC0gJCh3aW5kb3cpLmhlaWdodCgpIDwgKCQod2luZG93LmRvY3VtZW50KS5oZWlnaHQoKSlcbiAgICAgICAgICBpblNjcm9sbERvd25BcmVhID0gdG9wID4gdmlld3BvcnRCb3R0b20gLSBAZGVmYXVsdE9wdGlvbnMuc2Nyb2xsTmVhckVkZ2VcbiAgICAgICAgICBhYm92ZVBhZ2VCb3R0b20gJiYgaW5TY3JvbGxEb3duQXJlYVxuXG4gICAgICB3aW5kb3cuc2Nyb2xsQnkoMCwgZGVsdGEpIGlmIHNob3VsZFNjcm9sbFxuXG4gICAgQGxhc3RTY3JvbGxQb3NpdGlvbiA9IHRvcFxuXG5cbiAgbW92ZTogKG1vdXNlTGVmdCwgbW91c2VUb3AsIGV2ZW50KSAtPlxuICAgIGlmIEBkcmFnLnN0YXJ0ZWRcbiAgICAgIGlmIEBkcmFnLm1vdXNlVG9TbmlwcGV0XG4gICAgICAgIGxlZnQgPSBtb3VzZUxlZnQgLSBAZHJhZy5tb3VzZVRvU25pcHBldC5sZWZ0XG4gICAgICAgIHRvcCA9IG1vdXNlVG9wIC0gQGRyYWcubW91c2VUb1NuaXBwZXQudG9wXG4gICAgICBlbHNlXG4gICAgICAgIGxlZnQgPSBtb3VzZUxlZnRcbiAgICAgICAgdG9wID0gbW91c2VUb3BcblxuICAgICAgaWYgQGRyYWcuZml4ZWRcbiAgICAgICAgdG9wID0gdG9wIC0gQGRyYWcuJGJvZHkuc2Nyb2xsVG9wKClcbiAgICAgICAgbGVmdCA9IGxlZnQgLSBAZHJhZy4kYm9keS5zY3JvbGxMZWZ0KClcblxuICAgICAgbGVmdCA9IDIgaWYgbGVmdCA8IDJcbiAgICAgIHRvcCA9IDIgaWYgdG9wIDwgMlxuXG4gICAgICBAJGRyYWdnZWQuY3NzKHsgcG9zaXRpb246J2Fic29sdXRlJywgbGVmdDpcIiN7IGxlZnQgfXB4XCIsIHRvcDpcIiN7IHRvcCB9cHhcIiB9KVxuICAgICAgQHNjcm9sbEludG9WaWV3KHRvcCwgZXZlbnQpXG4gICAgICBAZHJvcFRhcmdldChtb3VzZUxlZnQsIG1vdXNlVG9wLCBldmVudCkgaWYgIUBkaXJlY3RcblxuICAgIGVsc2UgaWYgQGRyYWcuaW5pdGlhbGl6ZWRcblxuICAgICAgIyBsb25nIHByZXNzIG1lYXN1cmVtZW50IG9mIG1vdXNlIG1vdmVtZW50IHByaW9yIHRvIGRyYWcgaW5pdGlhbGl6YXRpb25cbiAgICAgIGlmIEBvcHRpb25zLmxvbmdwcmVzc0RlbGF5IGFuZCBAb3B0aW9ucy5sb25ncHJlc3NEaXN0YW5jZUxpbWl0XG4gICAgICAgIEByZXNldCgpIGlmIEBkaXN0YW5jZSh7IGxlZnQ6IG1vdXNlTGVmdCwgdG9wOiBtb3VzZVRvcCB9LCBAZHJhZy5zdGFydFBvaW50KSA+IEBvcHRpb25zLmxvbmdwcmVzc0Rpc3RhbmNlTGltaXRcblxuICAgICAgIyBkZWxheWVkIGluaXRpYWxpemF0aW9uIGFmdGVyIG1vdXNlIG1vdmVkIGEgbWluaW1hbCBkaXN0YW5jZVxuICAgICAgaWYgQG9wdGlvbnMubWluRGlzdGFuY2UgJiYgQGRpc3RhbmNlKHsgbGVmdDogbW91c2VMZWZ0LCB0b3A6IG1vdXNlVG9wIH0sIEBkcmFnLnN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubWluRGlzdGFuY2VcbiAgICAgICAgQHN0YXJ0KClcblxuXG4gIGRyb3A6ICgpIC0+XG4gICAgaWYgQGRyYWcuc3RhcnRlZFxuXG4gICAgICAjIGRyYWcgc3BlY2lmaWMgY2FsbGJhY2tcbiAgICAgIGlmIHR5cGVvZiBAb3B0aW9ucy5vbkRyb3AgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICBAb3B0aW9ucy5vbkRyb3AuY2FsbCh0aGlzLCBAZHJhZywgQCRvcmlnaW4pXG5cbiAgICBAcmVzZXQoKVxuXG5cbiAgZHJvcFRhcmdldDogKG1vdXNlTGVmdCwgbW91c2VUb3AsIGV2ZW50KSAtPlxuICAgIGlmIEAkZHJhZ2dlZCAmJiBldmVudFxuICAgICAgZWxlbSA9IHVuZGVmaW5lZFxuICAgICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgfHwgZXZlbnQudHlwZSA9PSAndG91Y2htb3ZlJ1xuICAgICAgICB4ID0gZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYXG4gICAgICAgIHkgPSBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFlcbiAgICAgIGVsc2VcbiAgICAgICAgeCA9IGV2ZW50LmNsaWVudFhcbiAgICAgICAgeSA9IGV2ZW50LmNsaWVudFlcblxuICAgICAgIyBnZXQgdGhlIGVsZW1lbnQgd2UncmUgY3VycmVudGx5IGhvdmVyaW5nXG4gICAgICBpZiB4ICYmIHlcbiAgICAgICAgQCRkcmFnZ2VkLmhpZGUoKVxuICAgICAgICAjIHRvZG86IFNhZmFyaSA0IGFuZCBPcGVyYSAxMC4xMCBuZWVkIHBhZ2VYL1kuXG4gICAgICAgIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh4LCB5KVxuICAgICAgICBAJGRyYWdnZWQuc2hvdygpXG5cbiAgICAgICMgY2hlY2sgaWYgYSBkcm9wIGlzIHBvc3NpYmxlXG4gICAgICBpZiBlbGVtXG4gICAgICAgIGRyYWdUYXJnZXQgPSBkb20uZHJvcFRhcmdldChlbGVtLCB7IHRvcDogbW91c2VUb3AsIGxlZnQ6IG1vdXNlTGVmdCB9KVxuICAgICAgICBAZHJhZy50YXJnZXQgPSBkcmFnVGFyZ2V0XG4gICAgICBlbHNlXG4gICAgICAgIEBkcmFnLnRhcmdldCA9IHt9XG5cbiAgICAgIGlmIHR5cGVvZiBAb3B0aW9ucy5vbkRyYWcgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICBAb3B0aW9ucy5vbkRyYWcuY2FsbCh0aGlzLCBAZHJhZy50YXJnZXQsIEBkcmFnLCB7IGxlZnQ6IG1vdXNlTGVmdCwgdG9wOiBtb3VzZVRvcCB9KVxuXG5cbiAgZGlzdGFuY2U6IChwb2ludEEsIHBvaW50QikgLT5cbiAgICByZXR1cm4gdW5kZWZpbmVkIGlmICFwb2ludEEgfHwgIXBvaW50QlxuXG4gICAgZGlzdFggPSBwb2ludEEubGVmdCAtIHBvaW50Qi5sZWZ0XG4gICAgZGlzdFkgPSBwb2ludEEudG9wIC0gcG9pbnRCLnRvcFxuICAgIE1hdGguc3FydCggKGRpc3RYICogZGlzdFgpICsgKGRpc3RZICogZGlzdFkpIClcblxuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBkcmFnLmluaXRpYWxpemVkXG4gICAgICBjbGVhclRpbWVvdXQoQGRyYWcudGltZW91dCkgaWYgQGRyYWcudGltZW91dFxuICAgICAgQGRyYWcucHJldmlldy5yZW1vdmUoKSBpZiBAZHJhZy5wcmV2aWV3XG5cbiAgICAgIGlmIEAkZHJhZ2dlZCBhbmQgQCRkcmFnZ2VkICE9IEAkb3JpZ2luXG4gICAgICAgIEAkZHJhZ2dlZC5yZW1vdmUoKVxuXG4gICAgICBpZiBAJG9yaWdpblxuICAgICAgICBAJG9yaWdpbi5yZW1vdmVDbGFzcyhkb2NDbGFzcy5kcmFnZ2VkKVxuICAgICAgICBAJG9yaWdpbi5zaG93KClcblxuICAgICAgJCh3aW5kb3cuZG9jdW1lbnQuYm9keSkucmVtb3ZlQ2xhc3MoZG9jQ2xhc3MucHJldmVudFNlbGVjdGlvbilcblxuICAgICAgQGRyYWcgPSB7fVxuICAgICAgQCRvcmlnaW4gPSB1bmRlZmluZWRcbiAgICAgIEAkZHJhZ2dlZCA9IHVuZGVmaW5lZFxuXG5cbiMgRHJhZyBwcmV2aWV3IG1ldGhvZCAtPiB0aGVzZSBhcmUgc2V0IGluIHRoZSBjb25maWd1cmF0aW9uIGFuZCBjYW4gYmUgcmVwbGFjZWRcbkRyYWdEcm9wLmNsb25lT3JpZ2luID0gKGRyYWcsICRvcmlnaW4pIC0+XG5cbiAgIyBjYWxjdWxhdGUgbW91c2UgcG9zaXRpb24gcmVsYXRpdmUgdG8gc25pcHBldFxuICBpZiAhZHJhZy5tb3VzZVRvU25pcHBldFxuICAgIHNuaXBwZXRPZmZzZXQgPSAkb3JpZ2luLm9mZnNldCgpXG4gICAgbWFyZ2luVG9wID0gcGFyc2VGbG9hdCggJG9yaWdpbi5jc3MoXCJtYXJnaW4tdG9wXCIpIClcbiAgICBtYXJnaW5MZWZ0ID0gcGFyc2VGbG9hdCggJG9yaWdpbi5jc3MoXCJtYXJnaW4tbGVmdFwiKSApXG4gICAgZHJhZy5tb3VzZVRvU25pcHBldCA9XG4gICAgICBsZWZ0OiAobW91c2VMZWZ0IC0gc25pcHBldE9mZnNldC5sZWZ0ICsgbWFyZ2luTGVmdClcbiAgICAgIHRvcDogKG1vdXNlVG9wIC0gc25pcHBldE9mZnNldC50b3AgKyBtYXJnaW5Ub3ApXG5cbiAgIyBjbG9uZSBzbmlwcGV0XG4gIHNuaXBwZXRXaWR0aCA9IGRyYWcud2lkdGggfHwgJG9yaWdpbi53aWR0aCgpXG4gIGRyYWdnZWRDb3B5ID0gJG9yaWdpbi5jbG9uZSgpXG5cbiAgZHJhZ2dlZENvcHkuY3NzKHsgcG9zaXRpb246IFwiYWJzb2x1dGVcIiwgd2lkdGg6IHNuaXBwZXRXaWR0aCB9KVxuICAgIC5yZW1vdmVDbGFzcyhkb2NDbGFzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIC5hZGRDbGFzcyhkb2NDbGFzcy5kcmFnZ2VkUGxhY2Vob2xkZXIpXG5cbiAgIyBzZXQgd2hpdGUgYmFja2dyb3VuZCBvbiB0cmFuc3BhcmVudCBlbGVtZW50c1xuICBiYWNrZ3JvdW5kQ29sb3IgPSAkb3JpZ2luLmNzcyhcImJhY2tncm91bmQtY29sb3JcIilcbiAgaGFzQmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yICE9IFwidHJhbnNwYXJlbnRcIiAmJiBiYWNrZ3JvdW5kQ29sb3IgIT0gXCJyZ2JhKDAsIDAsIDAsIDApXCJcbiAgIyBiYWNrZ3JvdW5kU2V0dGluZyA9IEAkb3JpZ2luLmNzcyhcImJhY2tncm91bmRcIikgfHwgQCRvcmlnaW4uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKVxuXG4gIGlmICFoYXNCYWNrZ3JvdW5kQ29sb3JcbiAgICBkcmFnZ2VkQ29weS5jc3MoeyBcImJhY2tncm91bmQtY29sb3JcIjogXCIjZmZmXCJ9KVxuXG4gIHJldHVybiBkcmFnZ2VkQ29weVxuXG5cbkRyYWdEcm9wLnBsYWNlaG9sZGVyID0gKGRyYWcpIC0+XG4gIHNuaXBwZXRXaWR0aCA9IGRyYWcud2lkdGhcbiAgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgPSAxXG4gIGlmICFkcmFnLm1vdXNlVG9TbmlwcGV0XG4gICAgZHJhZy5tb3VzZVRvU25pcHBldCA9XG4gICAgICBsZWZ0OiAyXG4gICAgICB0b3A6IC0xNVxuXG4gIHRlbXBsYXRlID1cbiAgICBcIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwiZG9jLWRyYWctcGxhY2Vob2xkZXItaXRlbVwiPlxuICAgICAgPHNwYW4gY2xhc3M9XCJkb2MtZHJhZy1jb3VudGVyXCI+I3sgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgfTwvc3Bhbj5cbiAgICAgIFNlbGVjdGVkIEl0ZW1cbiAgICA8L2Rpdj5cbiAgICBcIlwiXCJcblxuICAkcGxhY2Vob2xkZXIgPSAkKHRlbXBsYXRlKVxuICAkcGxhY2Vob2xkZXIuY3NzKHdpZHRoOiBzbmlwcGV0V2lkdGgpIGlmIHNuaXBwZXRXaWR0aFxuICAkcGxhY2Vob2xkZXIuY3NzKHBvc2l0aW9uOiBcImFic29sdXRlXCIpXG5cblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuIyBFZGl0YWJsZUpTIENvbnRyb2xsZXJcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEludGVncmF0ZSBFZGl0YWJsZUpTIGludG8gTGl2aW5nZG9jc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0YWJsZUNvbnRyb2xsZXJcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlKSAtPlxuICAgICMgY29uZmlndXJlIGVkaXRhYmxlSlNcbiAgICBFZGl0YWJsZS5pbml0XG4gICAgICBsb2c6IGZhbHNlXG5cbiAgICBAZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgQHNlbGVjdGlvbiA9ICQuQ2FsbGJhY2tzKClcblxuICAgIEVkaXRhYmxlXG4gICAgICAuZm9jdXMoQHdpdGhDb250ZXh0KEBmb2N1cykpXG4gICAgICAuYmx1cihAd2l0aENvbnRleHQoQGJsdXIpKVxuICAgICAgLmluc2VydChAd2l0aENvbnRleHQoQGluc2VydCkpXG4gICAgICAubWVyZ2UoQHdpdGhDb250ZXh0KEBtZXJnZSkpXG4gICAgICAuc3BsaXQoQHdpdGhDb250ZXh0KEBzcGxpdCkpXG4gICAgICAuc2VsZWN0aW9uKEB3aXRoQ29udGV4dChAc2VsZWN0aW9uQ2hhbmdlZCkpXG4gICAgICAubmV3bGluZShAd2l0aENvbnRleHQoQG5ld2xpbmUpKVxuXG5cbiAgIyBSZWdpc3RlciBET00gbm9kZXMgd2l0aCBFZGl0YWJsZUpTLlxuICAjIEFmdGVyIHRoYXQgRWRpdGFibGUgd2lsbCBmaXJlIGV2ZW50cyBmb3IgdGhhdCBub2RlLlxuICBhZGQ6IChub2RlcykgLT5cbiAgICBFZGl0YWJsZS5hZGQobm9kZXMpXG5cblxuICBkaXNhYmxlQWxsOiAtPlxuICAgICQoJ1tjb250ZW50ZWRpdGFibGVdJykuYXR0cignY29udGVudGVkaXRhYmxlJywgJ2ZhbHNlJylcblxuXG4gIHJlZW5hYmxlQWxsOiAtPlxuICAgICQoJ1tjb250ZW50ZWRpdGFibGVdJykuYXR0cignY29udGVudGVkaXRhYmxlJywgJ3RydWUnKVxuXG5cbiAgIyBHZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lIGZyb20gdGhlIERPTSBlbGVtZW50IHBhc3NlZCBieSBFZGl0YWJsZUpTXG4gICNcbiAgIyBBbGwgbGlzdGVuZXJzIHBhcmFtcyBnZXQgdHJhbnNmb3JtZWQgc28gdGhleSBnZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lXG4gICMgaW5zdGVhZCBvZiBlbGVtZW50OlxuICAjXG4gICMgRXhhbXBsZTogbGlzdGVuZXIodmlldywgZWRpdGFibGVOYW1lLCBvdGhlclBhcmFtcy4uLilcbiAgd2l0aENvbnRleHQ6IChmdW5jKSAtPlxuICAgIChlbGVtZW50LCBhcmdzLi4uKSA9PlxuICAgICAgdmlldyA9IGRvbS5maW5kU25pcHBldFZpZXcoZWxlbWVudClcbiAgICAgIGVkaXRhYmxlTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKEBlZGl0YWJsZUF0dHIpXG4gICAgICBhcmdzLnVuc2hpZnQodmlldywgZWRpdGFibGVOYW1lKVxuICAgICAgZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiAgdXBkYXRlTW9kZWw6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmFsdWUgPSB2aWV3LmdldChlZGl0YWJsZU5hbWUpXG4gICAgaWYgY29uZmlnLnNpbmdsZUxpbmVCcmVhay50ZXN0KHZhbHVlKSB8fCB2YWx1ZSA9PSAnJ1xuICAgICAgdmFsdWUgPSB1bmRlZmluZWRcblxuICAgIHZpZXcubW9kZWwuc2V0KGVkaXRhYmxlTmFtZSwgdmFsdWUpXG5cblxuICBmb2N1czogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICB2aWV3LmZvY3VzRWRpdGFibGUoZWRpdGFibGVOYW1lKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHBhZ2UuZm9jdXMuZWRpdGFibGVGb2N1c2VkKGVsZW1lbnQsIHZpZXcpXG4gICAgdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBibHVyOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZpZXcuYmx1ckVkaXRhYmxlKGVkaXRhYmxlTmFtZSlcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlQmx1cnJlZChlbGVtZW50LCB2aWV3KVxuICAgIEB1cGRhdGVNb2RlbCh2aWV3LCBlZGl0YWJsZU5hbWUpXG4gICAgdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBpbnNlcnQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuXG4gICAgICBzbmlwcGV0TmFtZSA9IGNvbmZpZy5lZGl0YWJsZS5pbnNlcnRTbmlwcGV0XG4gICAgICB0ZW1wbGF0ZSA9IEBwYWdlLmRlc2lnbi5nZXQoc25pcHBldE5hbWUpXG4gICAgICBjb3B5ID0gdGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuXG4gICAgICBuZXdWaWV3ID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnXG4gICAgICAgIHZpZXcubW9kZWwuYmVmb3JlKGNvcHkpXG4gICAgICAgIHZpZXcucHJldigpXG4gICAgICBlbHNlXG4gICAgICAgIHZpZXcubW9kZWwuYWZ0ZXIoY29weSlcbiAgICAgICAgdmlldy5uZXh0KClcblxuICAgICAgbmV3Vmlldy5mb2N1cygpIGlmIG5ld1ZpZXdcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBtZXJnZTogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBtZXJnZWRWaWV3ID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gdmlldy5wcmV2KCkgZWxzZSB2aWV3Lm5leHQoKVxuXG4gICAgICBpZiBtZXJnZWRWaWV3ICYmIG1lcmdlZFZpZXcudGVtcGxhdGUgPT0gdmlldy50ZW1wbGF0ZVxuXG4gICAgICAgICMgY3JlYXRlIGRvY3VtZW50IGZyYWdtZW50XG4gICAgICAgIGNvbnRlbnRzID0gdmlldy5kaXJlY3RpdmVzLiRnZXRFbGVtKGVkaXRhYmxlTmFtZSkuY29udGVudHMoKVxuICAgICAgICBmcmFnID0gQHBhZ2UuZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gICAgICAgIGZvciBlbCBpbiBjb250ZW50c1xuICAgICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQoZWwpXG5cbiAgICAgICAgbWVyZ2VkVmlldy5mb2N1cygpXG4gICAgICAgIGVsZW0gPSBtZXJnZWRWaWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgICBjdXJzb3IgPSBFZGl0YWJsZS5jcmVhdGVDdXJzb3IoZWxlbSwgaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gJ2VuZCcgZWxzZSAnYmVnaW5uaW5nJylcbiAgICAgICAgY3Vyc29yWyBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZScgdGhlbiAnaW5zZXJ0QWZ0ZXInIGVsc2UgJ2luc2VydEJlZm9yZScgXShmcmFnKVxuXG4gICAgICAgICMgTWFrZSBzdXJlIHRoZSBtb2RlbCBvZiB0aGUgbWVyZ2VkVmlldyBpcyB1cCB0byBkYXRlXG4gICAgICAgICMgb3RoZXJ3aXNlIGJ1Z3MgbGlrZSBpbiBpc3N1ZSAjNTYgY2FuIG9jY3VyLlxuICAgICAgICBjdXJzb3Iuc2F2ZSgpXG4gICAgICAgIEB1cGRhdGVNb2RlbChtZXJnZWRWaWV3LCBlZGl0YWJsZU5hbWUpXG4gICAgICAgIGN1cnNvci5yZXN0b3JlKClcblxuICAgICAgICB2aWV3Lm1vZGVsLnJlbW92ZSgpXG4gICAgICAgIGN1cnNvci5zZXRTZWxlY3Rpb24oKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIHNwbGl0OiAodmlldywgZWRpdGFibGVOYW1lLCBiZWZvcmUsIGFmdGVyLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBjb3B5ID0gdmlldy50ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cbiAgICAgICMgZ2V0IGNvbnRlbnQgb3V0IG9mICdiZWZvcmUnIGFuZCAnYWZ0ZXInXG4gICAgICBiZWZvcmVDb250ZW50ID0gYmVmb3JlLnF1ZXJ5U2VsZWN0b3IoJyonKS5pbm5lckhUTUxcbiAgICAgIGFmdGVyQ29udGVudCA9IGFmdGVyLnF1ZXJ5U2VsZWN0b3IoJyonKS5pbm5lckhUTUxcblxuICAgICAgIyBzZXQgZWRpdGFibGUgb2Ygc25pcHBldHMgdG8gaW5uZXJIVE1MIG9mIGZyYWdtZW50c1xuICAgICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCBiZWZvcmVDb250ZW50KVxuICAgICAgY29weS5zZXQoZWRpdGFibGVOYW1lLCBhZnRlckNvbnRlbnQpXG5cbiAgICAgICMgYXBwZW5kIGFuZCBmb2N1cyBjb3B5IG9mIHNuaXBwZXRcbiAgICAgIHZpZXcubW9kZWwuYWZ0ZXIoY29weSlcbiAgICAgIHZpZXcubmV4dCgpLmZvY3VzKClcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBzZWxlY3Rpb25DaGFuZ2VkOiAodmlldywgZWRpdGFibGVOYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHNlbGVjdGlvbi5maXJlKHZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbilcblxuXG4gIG5ld2xpbmU6ICh2aWV3LCBlZGl0YWJsZSwgY3Vyc29yKSAtPlxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBoYXNTaW5nbGVFZGl0YWJsZTogKHZpZXcpIC0+XG4gICAgdmlldy5kaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIHZpZXcuZGlyZWN0aXZlc1swXS50eXBlID09ICdlZGl0YWJsZSdcbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcblxuIyBEb2N1bWVudCBGb2N1c1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBNYW5hZ2UgdGhlIHNuaXBwZXQgb3IgZWRpdGFibGUgdGhhdCBpcyBjdXJyZW50bHkgZm9jdXNlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGb2N1c1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcbiAgICBAc25pcHBldFZpZXcgPSB1bmRlZmluZWRcblxuICAgIEBzbmlwcGV0Rm9jdXMgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRCbHVyID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgc2V0Rm9jdXM6IChzbmlwcGV0VmlldywgZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIGVkaXRhYmxlTm9kZSAhPSBAZWRpdGFibGVOb2RlXG4gICAgICBAcmVzZXRFZGl0YWJsZSgpXG4gICAgICBAZWRpdGFibGVOb2RlID0gZWRpdGFibGVOb2RlXG5cbiAgICBpZiBzbmlwcGV0VmlldyAhPSBAc25pcHBldFZpZXdcbiAgICAgIEByZXNldFNuaXBwZXRWaWV3KClcbiAgICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICAgIEBzbmlwcGV0VmlldyA9IHNuaXBwZXRWaWV3XG4gICAgICAgIEBzbmlwcGV0Rm9jdXMuZmlyZShAc25pcHBldFZpZXcpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVGb2N1c2VkOiAoZWRpdGFibGVOb2RlLCBzbmlwcGV0VmlldykgLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlICE9IGVkaXRhYmxlTm9kZVxuICAgICAgc25pcHBldFZpZXcgfHw9IGRvbS5maW5kU25pcHBldFZpZXcoZWRpdGFibGVOb2RlKVxuICAgICAgQHNldEZvY3VzKHNuaXBwZXRWaWV3LCBlZGl0YWJsZU5vZGUpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVCbHVycmVkOiAoZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgPT0gZWRpdGFibGVOb2RlXG4gICAgICBAc2V0Rm9jdXMoQHNuaXBwZXRWaWV3LCB1bmRlZmluZWQpXG5cblxuICAjIGNhbGwgYWZ0ZXIgY2xpY2tcbiAgc25pcHBldEZvY3VzZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBpZiBAc25pcHBldFZpZXcgIT0gc25pcHBldFZpZXdcbiAgICAgIEBzZXRGb2N1cyhzbmlwcGV0VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgYmx1cjogLT5cbiAgICBAc2V0Rm9jdXModW5kZWZpbmVkLCB1bmRlZmluZWQpXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgcmVzZXRFZGl0YWJsZTogLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlXG4gICAgICBAZWRpdGFibGVOb2RlID0gdW5kZWZpbmVkXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldFNuaXBwZXRWaWV3OiAtPlxuICAgIGlmIEBzbmlwcGV0Vmlld1xuICAgICAgcHJldmlvdXMgPSBAc25pcHBldFZpZXdcbiAgICAgIEBzbmlwcGV0VmlldyA9IHVuZGVmaW5lZFxuICAgICAgQHNuaXBwZXRCbHVyLmZpcmUocHJldmlvdXMpXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5kb2NDbGFzcyA9IGNvbmZpZy5odG1sLmNzc1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXREcmFnXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgc25pcHBldCwgcGFnZSB9KSAtPlxuICAgIEBzbmlwcGV0ID0gc25pcHBldFxuICAgIEBwYWdlID0gcGFnZVxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuICAgIEBvblN0YXJ0ID0gJC5wcm94eShAb25TdGFydCwgdGhpcylcbiAgICBAb25EcmFnID0gJC5wcm94eShAb25EcmFnLCB0aGlzKVxuICAgIEBvbkRyb3AgPSAkLnByb3h5KEBvbkRyb3AsIHRoaXMpXG4gICAgQGNsYXNzQWRkZWQgPSBbXVxuXG5cbiAgb25TdGFydDogKCkgLT5cbiAgICBAcGFnZS5zbmlwcGV0V2lsbEJlRHJhZ2dlZC5maXJlKEBzbmlwcGV0KVxuXG4gICAgQCRpbnNlcnRQcmV2aWV3ID0gJChcIjxkaXYgY2xhc3M9J2RvYy1kcmFnLXByZXZpZXcnPlwiKVxuICAgIEBwYWdlLiRib2R5XG4gICAgICAuYXBwZW5kKEAkaW5zZXJ0UHJldmlldylcbiAgICAgIC5jc3MoJ2N1cnNvcicsICdwb2ludGVyJylcblxuICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5kaXNhYmxlQWxsKClcbiAgICBAcGFnZS5ibHVyRm9jdXNlZEVsZW1lbnQoKVxuXG4gICAgI3RvZG8gZ2V0IGFsbCB2YWxpZCBjb250YWluZXJzXG5cblxuICAjIHJlbWV2ZSBjbGFzc2VzIGFkZGVkIHdoaWxlIGRyYWdnaW5nIGZyb20gdHJhY2tlZCBlbGVtZW50c1xuICByZW1vdmVDc3NDbGFzc2VzOiAtPlxuICAgIGZvciAkaHRtbCBpbiBAY2xhc3NBZGRlZFxuICAgICAgJGh0bWxcbiAgICAgICAgLnJlbW92ZUNsYXNzKGRvY0NsYXNzLmFmdGVyRHJvcClcbiAgICAgICAgLnJlbW92ZUNsYXNzKGRvY0NsYXNzLmJlZm9yZURyb3ApXG4gICAgQGNsYXNzQWRkZWQgPSBbXVxuXG5cbiAgaXNWYWxpZFRhcmdldDogKHRhcmdldCkgLT5cbiAgICBpZiB0YXJnZXQuc25pcHBldFZpZXcgJiYgdGFyZ2V0LnNuaXBwZXRWaWV3Lm1vZGVsICE9IEBzbmlwcGV0XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGVsc2UgaWYgdGFyZ2V0LmNvbnRhaW5lck5hbWVcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICBmYWxzZVxuXG5cbiAgb25EcmFnOiAodGFyZ2V0LCBkcmFnLCBjdXJzb3IpIC0+XG4gICAgaWYgbm90IEBpc1ZhbGlkVGFyZ2V0KHRhcmdldClcbiAgICAgICRjb250YWluZXIgPSB0YXJnZXQgPSB7fVxuXG4gICAgaWYgdGFyZ2V0LmNvbnRhaW5lck5hbWVcbiAgICAgIGRvbS5tYXhpbWl6ZUNvbnRhaW5lckhlaWdodCh0YXJnZXQucGFyZW50KVxuICAgICAgJGNvbnRhaW5lciA9ICQodGFyZ2V0Lm5vZGUpXG4gICAgZWxzZSBpZiB0YXJnZXQuc25pcHBldFZpZXdcbiAgICAgIGRvbS5tYXhpbWl6ZUNvbnRhaW5lckhlaWdodCh0YXJnZXQuc25pcHBldFZpZXcpXG4gICAgICAkY29udGFpbmVyID0gdGFyZ2V0LnNuaXBwZXRWaWV3LmdldCRjb250YWluZXIoKVxuICAgICAgJGNvbnRhaW5lci5hZGRDbGFzcyhkb2NDbGFzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgZWxzZVxuICAgICAgJGNvbnRhaW5lciA9IHRhcmdldCA9IHt9XG5cbiAgICAjIGhpZ2hsaWdodGluZ1xuICAgIGlmICRjb250YWluZXJbMF0gIT0gQCRoaWdobGlnaHRlZENvbnRhaW5lclswXVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oZG9jQ2xhc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9ICRjb250YWluZXJcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIuYWRkQ2xhc3M/KGRvY0NsYXNzLmNvbnRhaW5lckhpZ2hsaWdodClcblxuICAgICMgc2hvdyBkcm9wIHRhcmdldFxuICAgIGlmIHRhcmdldC5jb29yZHNcbiAgICAgIGNvb3JkcyA9IHRhcmdldC5jb29yZHNcbiAgICAgIEAkaW5zZXJ0UHJldmlld1xuICAgICAgICAuY3NzKHsgbGVmdDpcIiN7IGNvb3Jkcy5sZWZ0IH1weFwiLCB0b3A6XCIjeyBjb29yZHMudG9wIC0gNX1weFwiLCB3aWR0aDpcIiN7IGNvb3Jkcy53aWR0aCB9cHhcIiB9KVxuICAgICAgICAuc2hvdygpXG4gICAgZWxzZVxuICAgICAgQCRpbnNlcnRQcmV2aWV3LmhpZGUoKVxuXG5cbiAgb25Ecm9wOiAoZHJhZykgLT5cbiAgICAjIEByZW1vdmVDc3NDbGFzc2VzKClcbiAgICBAcGFnZS4kYm9keS5jc3MoJ2N1cnNvcicsICcnKVxuICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5yZWVuYWJsZUFsbCgpXG4gICAgQCRpbnNlcnRQcmV2aWV3LnJlbW92ZSgpXG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oZG9jQ2xhc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgIGRvbS5yZXN0b3JlQ29udGFpbmVySGVpZ2h0KClcbiAgICB0YXJnZXQgPSBkcmFnLnRhcmdldFxuXG4gICAgaWYgdGFyZ2V0IGFuZCBAaXNWYWxpZFRhcmdldCh0YXJnZXQpXG4gICAgICBpZiBzbmlwcGV0VmlldyA9IHRhcmdldC5zbmlwcGV0Vmlld1xuICAgICAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBzbmlwcGV0Vmlldy5tb2RlbC5iZWZvcmUoQHNuaXBwZXQpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzbmlwcGV0Vmlldy5tb2RlbC5hZnRlcihAc25pcHBldClcbiAgICAgIGVsc2UgaWYgdGFyZ2V0LmNvbnRhaW5lck5hbWVcbiAgICAgICAgdGFyZ2V0LnBhcmVudC5tb2RlbC5hcHBlbmQodGFyZ2V0LmNvbnRhaW5lck5hbWUsIEBzbmlwcGV0KVxuXG4gICAgICBAcGFnZS5zbmlwcGV0V2FzRHJvcHBlZC5maXJlKEBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgICNjb25zaWRlcjogbWF5YmUgYWRkIGEgJ2Ryb3AgZmFpbGVkJyBlZmZlY3RcblxuIiwiIyBDYW4gcmVwbGFjZSB4bWxkb20gaW4gdGhlIGJyb3dzZXIuXG4jIE1vcmUgYWJvdXQgeG1sZG9tOiBodHRwczovL2dpdGh1Yi5jb20vamluZHcveG1sZG9tXG4jXG4jIE9uIG5vZGUgeG1sZG9tIGlzIHJlcXVpcmVkLiBJbiB0aGUgYnJvd3NlclxuIyBET01QYXJzZXIgYW5kIFhNTFNlcmlhbGl6ZXIgYXJlIGFscmVhZHkgbmF0aXZlIG9iamVjdHMuXG5cbiMgRE9NUGFyc2VyXG5leHBvcnRzLkRPTVBhcnNlciA9IGNsYXNzIERPTVBhcnNlclNoaW1cblxuICBwYXJzZUZyb21TdHJpbmc6ICh4bWxUZW1wbGF0ZSkgLT5cbiAgICAjIG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoeG1sVGVtcGxhdGUpIGRvZXMgbm90IHdvcmsgdGhlIHNhbWVcbiAgICAjIGluIHRoZSBicm93c2VyIGFzIHdpdGggeG1sZG9tLiBTbyB3ZSB1c2UgalF1ZXJ5IHRvIG1ha2UgdGhpbmdzIHdvcmsuXG4gICAgJC5wYXJzZVhNTCh4bWxUZW1wbGF0ZSlcblxuXG4jIFhNTFNlcmlhbGl6ZXJcbmV4cG9ydHMuWE1MU2VyaWFsaXplciA9IFhNTFNlcmlhbGl6ZXJcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG53b3JkcyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvd29yZHMnKVxuXG5EZXNpZ24gPSByZXF1aXJlKCcuLi9kZXNpZ24vZGVzaWduJylcblNuaXBwZXRUcmVlID0gcmVxdWlyZSgnLi4vc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZScpXG5cbkRPTVBhcnNlciA9IHJlcXVpcmUoJ3htbGRvbScpLkRPTVBhcnNlclxuWE1MU2VyaWFsaXplciA9IHJlcXVpcmUoJ3htbGRvbScpLlhNTFNlcmlhbGl6ZXJcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBLaWNrc3RhcnRcblxuICBjb25zdHJ1Y3RvcjogKHsgeG1sVGVtcGxhdGUsIHNjcmlwdE5vZGUsIGRlc3RpbmF0aW9uLCBkZXNpZ259ID0ge30pIC0+XG4gICAgdW5sZXNzIHRoaXMgaW5zdGFuY2VvZiBLaWNrc3RhcnRcbiAgICAgIHJldHVybiBuZXcgS2lja3N0YXJ0KHsgeG1sVGVtcGxhdGUsIHNjcmlwdE5vZGUsIGRlc3RpbmF0aW9uLCBkZXNpZ24gfSlcblxuICAgIGFzc2VydCBzY3JpcHROb2RlIHx8IHhtbFRlbXBsYXRlLCAnUGxlYXNlIHByb3ZpZGUgcGFyYW1ldGVyIFwieG1sVGVtcGxhdGVcIiBvciBcInNjcmlwdE5vZGVcIidcblxuICAgIGlmIHNjcmlwdE5vZGVcbiAgICAgIHhtbFRlbXBsYXRlID0gXCI8cm9vdD5cIiArICQoc2NyaXB0Tm9kZSkudGV4dCgpICsgXCI8L3Jvb3Q+XCJcblxuICAgIEB0ZW1wbGF0ZSA9IEtpY2tzdGFydC5wYXJzZVhNTCh4bWxUZW1wbGF0ZSlcbiAgICBAZGVzaWduID0gbmV3IERlc2lnbihkZXNpZ24pXG4gICAgQHNuaXBwZXRUcmVlID0gbmV3IFNuaXBwZXRUcmVlKClcblxuICAgIEBhZGRSb290U25pcHBldHMoJChAdGVtcGxhdGUpLmNoaWxkcmVuKCkpXG5cblxuICAjIFBhcnNlIFhNTCBhbmQgcmV0dXJuIHRoZSByb290IG5vZGVcbiAgI1xuICAjIE9uIG5vZGUgeG1sZG9tIGlzIHJlcXVpcmVkLiBJbiB0aGUgYnJvd3NlclxuICAjIERPTVBhcnNlciBhbmQgWE1MU2VyaWFsaXplciBhcmUgYWxyZWFkeSBuYXRpdmUgb2JqZWN0cy5cbiAgQHBhcnNlWE1MOiAoeG1sVGVtcGxhdGUpIC0+XG4gICAgIyB4bWxEb2MgPSAkLnBhcnNlWE1MKHhtbFRlbXBsYXRlKVxuICAgIHhtbERvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoeG1sVGVtcGxhdGUpXG4gICAgeG1sRG9jLmZpcnN0Q2hpbGRcblxuXG4gIGFkZFJvb3RTbmlwcGV0czogKHhtbEVsZW1lbnRzKSAtPlxuICAgIGZvciB4bWxFbGVtZW50LCBpbmRleCBpbiB4bWxFbGVtZW50c1xuICAgICAgc25pcHBldE1vZGVsID0gQGNyZWF0ZVNuaXBwZXQoeG1sRWxlbWVudClcbiAgICAgIEBzZXRDaGlsZHJlbihzbmlwcGV0TW9kZWwsIHhtbEVsZW1lbnQpXG4gICAgICByb3cgPSBAc25pcHBldFRyZWUuYXBwZW5kKHNuaXBwZXRNb2RlbClcblxuXG4gIHNldENoaWxkcmVuOiAoc25pcHBldE1vZGVsLCBzbmlwcGV0WE1MKSAtPlxuICAgIEBwb3B1bGF0ZVNuaXBwZXRDb250YWluZXJzKHNuaXBwZXRNb2RlbCwgc25pcHBldFhNTClcbiAgICBAc2V0RWRpdGFibGVzKHNuaXBwZXRNb2RlbCwgc25pcHBldFhNTClcbiAgICBAc2V0RWRpdGFibGVTdHlsZXMoc25pcHBldE1vZGVsLCBzbmlwcGV0WE1MKVxuXG5cbiAgcG9wdWxhdGVTbmlwcGV0Q29udGFpbmVyczogKHNuaXBwZXRNb2RlbCwgc25pcHBldFhNTCkgLT5cbiAgICBkaXJlY3RpdmVzID0gc25pcHBldE1vZGVsLnRlbXBsYXRlLmRpcmVjdGl2ZXNcbiAgICBpZiBkaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIGRpcmVjdGl2ZXMuY29udGFpbmVyXG4gICAgICBoYXNPbmx5T25lQ29udGFpbmVyID0gdHJ1ZVxuICAgICAgY29udGFpbmVyRGlyZWN0aXZlID0gZGlyZWN0aXZlcy5jb250YWluZXJbMF1cblxuICAgICMgYWRkIHNuaXBwZXRzIHRvIGRlZmF1bHQgY29udGFpbmVyIGlmIG5vIG90aGVyIGNvbnRhaW5lcnMgZXhpc3RzXG4gICAgaWYgaGFzT25seU9uZUNvbnRhaW5lciAmJiAhQGRlc2NlbmRhbnRzKHNuaXBwZXRYTUwsIGNvbnRhaW5lckRpcmVjdGl2ZS5uYW1lKS5sZW5ndGhcbiAgICAgIGZvciBjaGlsZCBpbiBAZGVzY2VuZGFudHMoc25pcHBldFhNTClcbiAgICAgICAgQGFwcGVuZFNuaXBwZXRUb0NvbnRhaW5lcihzbmlwcGV0TW9kZWwsIGNoaWxkLCBjb250YWluZXJEaXJlY3RpdmUubmFtZSlcblxuICAgIGVsc2VcbiAgICAgIGNvbnRhaW5lcnMgPSBpZiBzbmlwcGV0TW9kZWwuY29udGFpbmVycyB0aGVuIE9iamVjdC5rZXlzKHNuaXBwZXRNb2RlbC5jb250YWluZXJzKSBlbHNlIFtdXG4gICAgICBmb3IgY29udGFpbmVyIGluIGNvbnRhaW5lcnNcbiAgICAgICAgZm9yIGVkaXRhYmxlQ29udGFpbmVyIGluIEBkZXNjZW5kYW50cyhzbmlwcGV0WE1MLCBjb250YWluZXIpXG4gICAgICAgICAgZm9yIGNoaWxkIGluIEBkZXNjZW5kYW50cyhlZGl0YWJsZUNvbnRhaW5lcilcbiAgICAgICAgICAgIEBhcHBlbmRTbmlwcGV0VG9Db250YWluZXIoc25pcHBldE1vZGVsLCBjaGlsZCwgQG5vZGVOYW1lVG9DYW1lbENhc2UoZWRpdGFibGVDb250YWluZXIpKVxuXG5cbiAgYXBwZW5kU25pcHBldFRvQ29udGFpbmVyOiAoc25pcHBldE1vZGVsLCBzbmlwcGV0WE1MLCByZWdpb24pIC0+XG4gICAgc25pcHBldCA9IEBjcmVhdGVTbmlwcGV0KHNuaXBwZXRYTUwpXG4gICAgc25pcHBldE1vZGVsLmFwcGVuZChyZWdpb24sIHNuaXBwZXQpXG4gICAgQHNldENoaWxkcmVuKHNuaXBwZXQsIHNuaXBwZXRYTUwpXG5cblxuICBzZXRFZGl0YWJsZXM6IChzbmlwcGV0TW9kZWwsIHNuaXBwZXRYTUwpIC0+XG4gICAgZm9yIGVkaXRhYmxlTmFtZSBvZiBzbmlwcGV0TW9kZWwuY29udGVudFxuICAgICAgdmFsdWUgPSBAZ2V0VmFsdWVGb3JFZGl0YWJsZShlZGl0YWJsZU5hbWUsIHNuaXBwZXRYTUwsIHNuaXBwZXRNb2RlbC50ZW1wbGF0ZS5kaXJlY3RpdmVzLmxlbmd0aClcbiAgICAgIHNuaXBwZXRNb2RlbC5zZXQoZWRpdGFibGVOYW1lLCB2YWx1ZSkgaWYgdmFsdWVcblxuXG4gIGdldFZhbHVlRm9yRWRpdGFibGU6IChlZGl0YWJsZU5hbWUsIHNuaXBwZXRYTUwsIGRpcmVjdGl2ZXNRdWFudGl0eSkgLT5cbiAgICBjaGlsZCA9IEBkZXNjZW5kYW50cyhzbmlwcGV0WE1MLCBlZGl0YWJsZU5hbWUpWzBdXG4gICAgdmFsdWUgPSBAZ2V0WG1sVmFsdWUoY2hpbGQpXG5cbiAgICBpZiAhdmFsdWUgJiYgZGlyZWN0aXZlc1F1YW50aXR5ID09IDFcbiAgICAgIGxvZy53YXJuKFwiVGhlIGVkaXRhYmxlICcje2VkaXRhYmxlTmFtZX0nIG9mICcje0Bub2RlVG9TbmlwcGV0TmFtZShzbmlwcGV0WE1MKX0nIGhhcyBubyBjb250ZW50LiBEaXNwbGF5IHBhcmVudCBIVE1MIGluc3RlYWQuXCIpXG4gICAgICB2YWx1ZSA9IEBnZXRYbWxWYWx1ZShzbmlwcGV0WE1MKVxuXG4gICAgdmFsdWVcblxuXG4gIG5vZGVOYW1lVG9DYW1lbENhc2U6IChlbGVtZW50KSAtPlxuICAgIHdvcmRzLmNhbWVsaXplKGVsZW1lbnQubm9kZU5hbWUpXG5cblxuICBzZXRFZGl0YWJsZVN0eWxlczogKHNuaXBwZXRNb2RlbCwgc25pcHBldFhNTCkgLT5cbiAgICBzdHlsZXMgPSAkKHNuaXBwZXRYTUwpLmF0dHIoY29uZmlnLmtpY2tzdGFydC5hdHRyLnN0eWxlcylcbiAgICBpZiBzdHlsZXNcbiAgICAgIHN0eWxlcyA9IHN0eWxlcy5zcGxpdCgvXFxzKjtcXHMqLylcbiAgICAgIGZvciBzdHlsZSBpbiBzdHlsZXNcbiAgICAgICAgc3R5bGUgPSBzdHlsZS5zcGxpdCgvXFxzKjpcXHMqLylcbiAgICAgICAgc25pcHBldE1vZGVsLnNldFN0eWxlKHN0eWxlWzBdLCBzdHlsZVsxXSkgaWYgc3R5bGUubGVuZ3RoID4gMVxuXG5cbiAgIyBDb252ZXJ0IGEgZG9tIGVsZW1lbnQgaW50byBhIGNhbWVsQ2FzZSBzbmlwcGV0TmFtZVxuICBub2RlVG9TbmlwcGV0TmFtZTogKGVsZW1lbnQpIC0+XG4gICAgc25pcHBldE5hbWUgPSBAbm9kZU5hbWVUb0NhbWVsQ2FzZShlbGVtZW50KVxuICAgIHNuaXBwZXQgPSBAZGVzaWduLmdldChzbmlwcGV0TmFtZSlcblxuICAgIGFzc2VydCBzbmlwcGV0LFxuICAgICAgXCJUaGUgVGVtcGxhdGUgbmFtZWQgJyN7c25pcHBldE5hbWV9JyBkb2VzIG5vdCBleGlzdC5cIlxuXG4gICAgc25pcHBldE5hbWVcblxuXG4gIGNyZWF0ZVNuaXBwZXQ6ICh4bWwpIC0+XG4gICAgQGRlc2lnbi5nZXQoQG5vZGVUb1NuaXBwZXROYW1lKHhtbCkpLmNyZWF0ZU1vZGVsKClcblxuXG4gIGRlc2NlbmRhbnRzOiAoeG1sLCBub2RlTmFtZSkgLT5cbiAgICB0YWdMaW1pdGVyID0gd29yZHMuc25ha2VDYXNlKG5vZGVOYW1lKSBpZiBub2RlTmFtZVxuICAgICQoeG1sKS5jaGlsZHJlbih0YWdMaW1pdGVyKVxuXG5cbiAgZ2V0WG1sVmFsdWU6IChub2RlKSAtPlxuICAgIGlmIG5vZGVcbiAgICAgIHN0cmluZyA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcobm9kZSlcbiAgICAgIHN0YXJ0ID0gc3RyaW5nLmluZGV4T2YoJz4nKSArIDFcbiAgICAgIGVuZCA9IHN0cmluZy5sYXN0SW5kZXhPZignPCcpXG4gICAgICBpZiBlbmQgPiBzdGFydFxuICAgICAgICBzdHJpbmcuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpXG5cblxuICBnZXRTbmlwcGV0VHJlZTogLT5cbiAgICBAc25pcHBldFRyZWVcblxuXG4gIHRvSHRtbDogLT5cbiAgICByZW5kZXJlciA9IG5ldyBSZW5kZXJlclxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBuZXcgUmVuZGVyaW5nQ29udGFpbmVyKClcblxuICAgIHJlbmRlcmVyLmh0bWwoKVxuXG4iLCIjIEhlbHBlciBtZXRob2QgdG8gY3JlYXRlIGNoYWluYWJsZSBwcm94aWVzLlxuI1xuIyBSZXR1cm5zIGEgbWV0aG9kIHRoYXQgd29ya3MgdGhlIHNhbWUgYXMgJC5wcm94eSgpIGJ1dCBhbHdheXMgcmV0dXJucyB0aGUgY2hhaW5lZE9ialxuIyAqaXRzIG1vc3RseSB0aGUgc2FtZSBjb2RlIGFzICQucHJveHkgOykqXG5tb2R1bGUuZXhwb3J0cyA9IChjaGFpbmVkT2JqKSAtPlxuXG4gIChmbiwgY29udGV4dCkgLT5cbiAgICBpZiB0eXBlb2YgY29udGV4dCA9PSAnc3RyaW5nJ1xuICAgICAgdG1wID0gZm5bIGNvbnRleHQgXVxuICAgICAgY29udGV4dCA9IGZuXG4gICAgICBmbiA9IHRtcFxuXG4gICAgIyBTaW11bGF0ZWQgYmluZFxuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAyIClcbiAgICBwcm94eSA9IC0+XG4gICAgICBmbi5hcHBseSggY29udGV4dCB8fCB0aGlzLCBhcmdzLmNvbmNhdCggQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cyApICkgKVxuICAgICAgY2hhaW5lZE9ialxuXG4gICAgcHJveHlcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEFkZCBhbiBldmVudCBsaXN0ZW5lciB0byBhICQuQ2FsbGJhY2tzIG9iamVjdCB0aGF0IHdpbGxcbiAgIyByZW1vdmUgaXRzZWxmIGZyb20gaXRzICQuQ2FsbGJhY2tzIGFmdGVyIHRoZSBmaXJzdCBjYWxsLlxuICBjYWxsT25jZTogKGNhbGxiYWNrcywgbGlzdGVuZXIpIC0+XG4gICAgc2VsZlJlbW92aW5nRnVuYyA9IChhcmdzLi4uKSAtPlxuICAgICAgY2FsbGJhY2tzLnJlbW92ZShzZWxmUmVtb3ZpbmdGdW5jKVxuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncylcblxuICAgIGNhbGxiYWNrcy5hZGQoc2VsZlJlbW92aW5nRnVuYylcbiAgICBzZWxmUmVtb3ZpbmdGdW5jXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaWRDb3VudGVyID0gbGFzdElkID0gdW5kZWZpbmVkXG5cbiAgIyBHZW5lcmF0ZSBhIHVuaXF1ZSBpZC5cbiAgIyBHdWFyYW50ZWVzIGEgdW5pcXVlIGlkIGluIHRoaXMgcnVudGltZS5cbiAgIyBBY3Jvc3MgcnVudGltZXMgaXRzIGxpa2VseSBidXQgbm90IGd1YXJhbnRlZWQgdG8gYmUgdW5pcXVlXG4gICMgVXNlIHRoZSB1c2VyIHByZWZpeCB0byBhbG1vc3QgZ3VhcmFudGVlIHVuaXF1ZW5lc3MsXG4gICMgYXNzdW1pbmcgdGhlIHNhbWUgdXNlciBjYW5ub3QgZ2VuZXJhdGUgc25pcHBldHMgaW5cbiAgIyBtdWx0aXBsZSBydW50aW1lcyBhdCB0aGUgc2FtZSB0aW1lIChhbmQgdGhhdCBjbG9ja3MgYXJlIGluIHN5bmMpXG4gIG5leHQ6ICh1c2VyID0gJ2RvYycpIC0+XG5cbiAgICAjIGdlbmVyYXRlIDktZGlnaXQgdGltZXN0YW1wXG4gICAgbmV4dElkID0gRGF0ZS5ub3coKS50b1N0cmluZygzMilcblxuICAgICMgYWRkIGNvdW50ZXIgaWYgbXVsdGlwbGUgdHJlZXMgbmVlZCBpZHMgaW4gdGhlIHNhbWUgbWlsbGlzZWNvbmRcbiAgICBpZiBsYXN0SWQgPT0gbmV4dElkXG4gICAgICBpZENvdW50ZXIgKz0gMVxuICAgIGVsc2VcbiAgICAgIGlkQ291bnRlciA9IDBcbiAgICAgIGxhc3RJZCA9IG5leHRJZFxuXG4gICAgXCIjeyB1c2VyIH0tI3sgbmV4dElkIH0jeyBpZENvdW50ZXIgfVwiXG4iLCJsb2NhbHN0b3JlID0gcmVxdWlyZSgnLi9sb2NhbHN0b3JlJylcblxuIyBMaW1pdGVkTG9jYWxzdG9yZSBpcyBhIHdyYXBwZXIgYXJvdW5kIGxvY2Fsc3RvcmUgdGhhdFxuIyBzYXZlcyBvbmx5IGEgbGltaXRlZCBudW1iZXIgb2YgZW50cmllcyBhbmQgZGlzY2FyZHNcbiMgdGhlIG9sZGVzdCBvbmVzIGFmdGVyIHRoYXQuXG4jXG4jIFlvdSBzaG91bGQgb25seSBldmVyIGNyZWF0ZSBvbmUgaW5zdGFuY2UgYnkgYGtleWAuXG4jIFRoZSBsaW1pdCBjYW4gY2hhbmdlIGJldHdlZW4gc2Vzc2lvbnMsXG4jIGl0IHdpbGwganVzdCBkaXNjYXJkIGFsbCBlbnRyaWVzIHVudGlsIHRoZSBsaW1pdCBpcyBtZXRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTGltaXRlZExvY2Fsc3RvcmVcblxuICBjb25zdHJ1Y3RvcjogKEBrZXksIEBsaW1pdCkgLT5cbiAgICBAbGltaXQgfHw9IDEwXG4gICAgQGluZGV4ID0gdW5kZWZpbmVkXG5cblxuICBwdXNoOiAob2JqKSAtPlxuICAgIHJlZmVyZW5jZSA9XG4gICAgICBrZXk6IEBuZXh0S2V5KClcbiAgICAgIGRhdGU6IERhdGUubm93KClcblxuICAgIGluZGV4ID0gQGdldEluZGV4KClcbiAgICBpbmRleC5wdXNoKHJlZmVyZW5jZSlcblxuICAgIHdoaWxlIGluZGV4Lmxlbmd0aCA+IEBsaW1pdFxuICAgICAgcmVtb3ZlUmVmID0gaW5kZXhbMF1cbiAgICAgIGluZGV4LnNwbGljZSgwLCAxKVxuICAgICAgbG9jYWxzdG9yZS5yZW1vdmUocmVtb3ZlUmVmLmtleSlcblxuICAgIGxvY2Fsc3RvcmUuc2V0KHJlZmVyZW5jZS5rZXksIG9iailcbiAgICBsb2NhbHN0b3JlLnNldChcIiN7IEBrZXkgfS0taW5kZXhcIiwgaW5kZXgpXG5cblxuICBwb3A6IC0+XG4gICAgaW5kZXggPSBAZ2V0SW5kZXgoKVxuICAgIGlmIGluZGV4ICYmIGluZGV4Lmxlbmd0aFxuICAgICAgcmVmZXJlbmNlID0gaW5kZXgucG9wKClcbiAgICAgIHZhbHVlID0gbG9jYWxzdG9yZS5nZXQocmVmZXJlbmNlLmtleSlcbiAgICAgIGxvY2Fsc3RvcmUucmVtb3ZlKHJlZmVyZW5jZS5rZXkpXG4gICAgICBAc2V0SW5kZXgoKVxuICAgICAgdmFsdWVcbiAgICBlbHNlXG4gICAgICB1bmRlZmluZWRcblxuXG4gIGdldDogKG51bSkgLT5cbiAgICBpbmRleCA9IEBnZXRJbmRleCgpXG4gICAgaWYgaW5kZXggJiYgaW5kZXgubGVuZ3RoXG4gICAgICBudW0gfHw9IGluZGV4Lmxlbmd0aCAtIDFcbiAgICAgIHJlZmVyZW5jZSA9IGluZGV4W251bV1cbiAgICAgIHZhbHVlID0gbG9jYWxzdG9yZS5nZXQocmVmZXJlbmNlLmtleSlcbiAgICBlbHNlXG4gICAgICB1bmRlZmluZWRcblxuXG4gIGNsZWFyOiAtPlxuICAgIGluZGV4ID0gQGdldEluZGV4KClcbiAgICB3aGlsZSByZWZlcmVuY2UgPSBpbmRleC5wb3AoKVxuICAgICAgbG9jYWxzdG9yZS5yZW1vdmUocmVmZXJlbmNlLmtleSlcblxuICAgIEBzZXRJbmRleCgpXG5cblxuICBnZXRJbmRleDogLT5cbiAgICBAaW5kZXggfHw9IGxvY2Fsc3RvcmUuZ2V0KFwiI3sgQGtleSB9LS1pbmRleFwiKSB8fCBbXVxuICAgIEBpbmRleFxuXG5cbiAgc2V0SW5kZXg6IC0+XG4gICAgaWYgQGluZGV4XG4gICAgICBsb2NhbHN0b3JlLnNldChcIiN7IEBrZXkgfS0taW5kZXhcIiwgQGluZGV4KVxuXG5cbiAgbmV4dEtleTogLT5cbiAgICAjIGp1c3QgYSByYW5kb20ga2V5XG4gICAgYWRkZW5kdW0gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxZTE2KS50b1N0cmluZygzMilcbiAgICBcIiN7IEBrZXkgfS0jeyBhZGRlbmR1bSB9XCJcblxuXG5cblxuXG5cbiIsIiMgQWNjZXNzIHRvIGxvY2Fsc3RvcmFnZVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFNpbXBsaWZpZWQgdmVyc2lvbiBvZiBbaHR0cHM6Ly9naXRodWIuY29tL21hcmN1c3dlc3Rpbi9zdG9yZS5qc10oKVxubW9kdWxlLmV4cG9ydHMgPSAoICh3aW4pIC0+XG5cbiAgYXZhaWxhYmxlID0gdW5kZWZpbmVkXG4gIHN0b3JhZ2VOYW1lID0gJ2xvY2FsU3RvcmFnZSdcbiAgc3RvcmFnZSA9IHdpbltzdG9yYWdlTmFtZV1cblxuXG4gIHNldDogKGtleSwgdmFsdWUpIC0+XG4gICAgcmV0dXJuIEByZW1vdmUoa2V5KSB1bmxlc3MgdmFsdWU/XG4gICAgc3RvcmFnZS5zZXRJdGVtKGtleSwgQHNlcmlhbGl6ZSh2YWx1ZSkpXG4gICAgdmFsdWVcblxuXG4gIGdldDogKGtleSkgLT5cbiAgICBAZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRJdGVtKGtleSkpXG5cblxuICByZW1vdmU6IChrZXkpIC0+XG4gICAgc3RvcmFnZS5yZW1vdmVJdGVtKGtleSlcblxuXG4gIGNsZWFyOiAtPlxuICAgIHN0b3JhZ2UuY2xlYXIoKVxuXG5cbiAgaXNTdXBwb3J0ZWQ6IC0+XG4gICAgcmV0dXJuIGF2YWlsYWJsZSBpZiBhdmFpbGFibGU/XG4gICAgYXZhaWxhYmxlID0gQGRldGVjdExvY2Fsc3RvcmUoKVxuXG5cbiAgIyBJbnRlcm5hbFxuICAjIC0tLS0tLS0tXG5cbiAgc2VyaWFsaXplOiAodmFsdWUpIC0+XG4gICAgSlNPTi5zdHJpbmdpZnkodmFsdWUpXG5cblxuICBkZXNlcmlhbGl6ZTogKHZhbHVlKSAtPlxuICAgIHJldHVybiB1bmRlZmluZWQgaWYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnXG4gICAgdHJ5XG4gICAgICBKU09OLnBhcnNlKHZhbHVlKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICB2YWx1ZSB8fCB1bmRlZmluZWRcblxuXG4gIGRldGVjdExvY2Fsc3RvcmU6IC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyB3aW5bc3RvcmFnZU5hbWVdP1xuICAgIHRlc3RLZXkgPSAnX19sb2NhbHN0b3JlLWZlYXR1cmUtZGV0ZWN0aW9uX18nXG4gICAgdHJ5XG4gICAgICBAc2V0KHRlc3RLZXksIHRlc3RLZXkpXG4gICAgICByZXRyaWV2ZWRWYWx1ZSA9IEBnZXQodGVzdEtleSlcbiAgICAgIEByZW1vdmUodGVzdEtleSlcbiAgICAgIHJldHJpZXZlZFZhbHVlID09IHRlc3RLZXlcbiAgICBjYXRjaCBlcnJvclxuICAgICAgZmFsc2VcblxuXG4pKHdpbmRvdylcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9sb2dnaW5nL2Fzc2VydCcpXG5MaW1pdGVkTG9jYWxzdG9yZSA9IHJlcXVpcmUoJy4vbGltaXRlZF9sb2NhbHN0b3JlJylcbndvcmRzID0gcmVxdWlyZSgnLi93b3JkcycpXG5kb2N1bWVudCA9IHJlcXVpcmUoJy4uL2RvY3VtZW50JylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuICBpbml0aWFsaXplZCA9IGZhbHNlXG5cblxuICBpbml0OiAtPlxuICAgIGlmIG5vdCBpbml0aWFsaXplZFxuICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlXG5cbiAgICAgICMgc3RvcmUgdXAgdG8gdGVuIHZlcnNpb25zXG4gICAgICBAc3RvcmUgPSBuZXcgTGltaXRlZExvY2Fsc3RvcmUoJ3N0YXNoJywgMTApXG5cblxuICBzbmFwc2hvdDogLT5cbiAgICBAc3RvcmUucHVzaChkb2N1bWVudC50b0pzb24oKSlcblxuXG4gIHN0YXNoOiAtPlxuICAgIEBzbmFwc2hvdCgpXG4gICAgZG9jdW1lbnQucmVzZXQoKVxuXG5cbiAgZGVsZXRlOiAtPlxuICAgIEBzdG9yZS5wb3AoKVxuXG5cbiAgZ2V0OiAtPlxuICAgIEBzdG9yZS5nZXQoKVxuXG5cbiAgcmVzdG9yZTogLT5cbiAgICBqc29uID0gQHN0b3JlLmdldCgpXG5cbiAgICBhc3NlcnQganNvbiwgJ3N0YXNoIGlzIGVtcHR5J1xuICAgIGRvY3VtZW50LnJlc3RvcmUoanNvbilcblxuXG4gIGxpc3Q6IC0+XG4gICAgZW50cmllcyA9IGZvciBvYmogaW4gQHN0b3JlLmdldEluZGV4KClcbiAgICAgIHsga2V5OiBvYmoua2V5LCBkYXRlOiBuZXcgRGF0ZShvYmouZGF0ZSkudG9TdHJpbmcoKSB9XG5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oZW50cmllcylcbiIsIiMgU3RyaW5nIEhlbHBlcnNcbiMgLS0tLS0tLS0tLS0tLS1cbiMgaW5zcGlyZWQgYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9lcGVsaS91bmRlcnNjb3JlLnN0cmluZ10oKVxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdDYW1lbCBDYXNlJ1xuICBodW1hbml6ZTogKHN0cikgLT5cbiAgICB1bmNhbWVsaXplZCA9ICQudHJpbShzdHIpLnJlcGxhY2UoLyhbYS16XFxkXSkoW0EtWl0rKS9nLCAnJDEgJDInKS50b0xvd2VyQ2FzZSgpXG4gICAgQHRpdGxlaXplKCB1bmNhbWVsaXplZCApXG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciB0byB1cHBlcmNhc2VcbiAgY2FwaXRhbGl6ZSA6IChzdHIpIC0+XG4gICAgICBzdHIgPSBpZiAhc3RyPyB0aGVuICcnIGVsc2UgU3RyaW5nKHN0cilcbiAgICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciBvZiBldmVyeSB3b3JkIHRvIHVwcGVyY2FzZVxuICB0aXRsZWl6ZTogKHN0cikgLT5cbiAgICBpZiAhc3RyP1xuICAgICAgJydcbiAgICBlbHNlXG4gICAgICBTdHJpbmcoc3RyKS5yZXBsYWNlIC8oPzpefFxccylcXFMvZywgKGMpIC0+XG4gICAgICAgIGMudG9VcHBlckNhc2UoKVxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdjYW1lbC1jYXNlJ1xuICBzbmFrZUNhc2U6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJykucmVwbGFjZSgvWy1fXFxzXSsvZywgJy0nKS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIHByZXBlbmQgYSBwcmVmaXggdG8gYSBzdHJpbmcgaWYgaXQgaXMgbm90IGFscmVhZHkgcHJlc2VudFxuICBwcmVmaXg6IChwcmVmaXgsIHN0cmluZykgLT5cbiAgICBpZiBzdHJpbmcuaW5kZXhPZihwcmVmaXgpID09IDBcbiAgICAgIHN0cmluZ1xuICAgIGVsc2VcbiAgICAgIFwiXCIgKyBwcmVmaXggKyBzdHJpbmdcblxuXG4gICMgSlNPTi5zdHJpbmdpZnkgd2l0aCByZWFkYWJpbGl0eSBpbiBtaW5kXG4gICMgQHBhcmFtIG9iamVjdDogamF2YXNjcmlwdCBvYmplY3RcbiAgcmVhZGFibGVKc29uOiAob2JqKSAtPlxuICAgIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgMikgIyBcIlxcdFwiXG5cbiAgY2FtZWxpemU6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvWy1fXFxzXSsoLik/L2csIChtYXRjaCwgYykgLT5cbiAgICAgIGMudG9VcHBlckNhc2UoKVxuICAgIClcblxuICB0cmltOiAoc3RyKSAtPlxuICAgIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcblxuXG4gICMgY2FtZWxpemU6IChzdHIpIC0+XG4gICMgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAjICAgICBjLnRvVXBwZXJDYXNlKClcblxuICAjIGNsYXNzaWZ5OiAoc3RyKSAtPlxuICAjICAgJC50aXRsZWl6ZShTdHJpbmcoc3RyKS5yZXBsYWNlKC9bXFxXX10vZywgJyAnKSkucmVwbGFjZSgvXFxzL2csICcnKVxuXG5cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJlclxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAc25pcHBldFRyZWUsIEByZW5kZXJpbmdDb250YWluZXIgfSkgLT5cbiAgICBhc3NlcnQgQHNuaXBwZXRUcmVlLCAnbm8gc25pcHBldCB0cmVlIHNwZWNpZmllZCdcbiAgICBhc3NlcnQgQHJlbmRlcmluZ0NvbnRhaW5lciwgJ25vIHJlbmRlcmluZyBjb250YWluZXIgc3BlY2lmaWVkJ1xuXG4gICAgQCRyb290ID0gJChAcmVuZGVyaW5nQ29udGFpbmVyLnJlbmRlck5vZGUpXG4gICAgQHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnMoKVxuICAgIEBzbmlwcGV0Vmlld3MgPSB7fVxuXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQHJlbmRlck9uY2VQYWdlUmVhZHkoKVxuICAgIEByZWFkeVNlbWFwaG9yZS5zdGFydCgpXG5cblxuICByZW5kZXJPbmNlUGFnZVJlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pbmNyZW1lbnQoKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIucmVhZHkgPT5cbiAgICAgIEByZW5kZXIoKVxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmlzUmVhZHkoKVxuXG5cbiAgaHRtbDogLT5cbiAgICBhc3NlcnQgQGlzUmVhZHkoKSwgJ0Nhbm5vdCBnZW5lcmF0ZSBodG1sLiBSZW5kZXJlciBpcyBub3QgcmVhZHkuJ1xuICAgIEByZW5kZXJpbmdDb250YWluZXIuaHRtbCgpXG5cblxuICAjIFNuaXBwZXQgVHJlZSBFdmVudCBIYW5kbGluZ1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnM6IC0+XG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRBZGRlZC5hZGQoICQucHJveHkoQHNuaXBwZXRBZGRlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0UmVtb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRSZW1vdmVkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRNb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRNb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0Q29udGVudENoYW5nZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0Q29udGVudENoYW5nZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldEh0bWxDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldEh0bWxDaGFuZ2VkLCB0aGlzKSApXG5cblxuICBzbmlwcGV0QWRkZWQ6IChtb2RlbCkgLT5cbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRSZW1vdmVkOiAobW9kZWwpIC0+XG4gICAgQHJlbW92ZVNuaXBwZXQobW9kZWwpXG4gICAgQGRlbGV0ZUNhY2hlZFNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRNb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBpbnNlcnRTbmlwcGV0KG1vZGVsKVxuXG5cbiAgc25pcHBldENvbnRlbnRDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlQ29udGVudCgpXG5cblxuICBzbmlwcGV0SHRtbENoYW5nZWQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS51cGRhdGVIdG1sKClcblxuXG4gICMgUmVuZGVyaW5nXG4gICMgLS0tLS0tLS0tXG5cblxuICBzbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdzW21vZGVsLmlkXSB8fD0gbW9kZWwuY3JlYXRlVmlldyhAcmVuZGVyaW5nQ29udGFpbmVyLmlzUmVhZE9ubHkpXG5cblxuICBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBkZWxldGUgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF1cblxuXG4gIHJlbmRlcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIGNsZWFyOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5lYWNoIChtb2RlbCkgPT5cbiAgICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG5cbiAgICBAJHJvb3QuZW1wdHkoKVxuXG5cbiAgcmVkcmF3OiAtPlxuICAgIEBjbGVhcigpXG4gICAgQHJlbmRlcigpXG5cblxuICBpbnNlcnRTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgcmV0dXJuIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbClcblxuICAgIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5wcmV2aW91cylcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLnByZXZpb3VzLCBtb2RlbClcbiAgICBlbHNlIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5uZXh0KVxuICAgICAgQGluc2VydFNuaXBwZXRBc1NpYmxpbmcobW9kZWwubmV4dCwgbW9kZWwpXG4gICAgZWxzZSBpZiBtb2RlbC5wYXJlbnRDb250YWluZXJcbiAgICAgIEBhcHBlbmRTbmlwcGV0VG9QYXJlbnRDb250YWluZXIobW9kZWwpXG4gICAgZWxzZVxuICAgICAgbG9nLmVycm9yKCdTbmlwcGV0IGNvdWxkIG5vdCBiZSBpbnNlcnRlZCBieSByZW5kZXJlci4nKVxuXG4gICAgc25pcHBldFZpZXcgPSBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKVxuICAgIHNuaXBwZXRWaWV3LnNldEF0dGFjaGVkVG9Eb20odHJ1ZSlcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQoc25pcHBldFZpZXcpXG4gICAgQGF0dGFjaENoaWxkU25pcHBldHMobW9kZWwpXG5cblxuICBpc1NuaXBwZXRBdHRhY2hlZDogKG1vZGVsKSAtPlxuICAgIG1vZGVsICYmIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLmlzQXR0YWNoZWRUb0RvbVxuXG5cbiAgYXR0YWNoQ2hpbGRTbmlwcGV0czogKG1vZGVsKSAtPlxuICAgIG1vZGVsLmNoaWxkcmVuIChjaGlsZE1vZGVsKSA9PlxuICAgICAgaWYgbm90IEBpc1NuaXBwZXRBdHRhY2hlZChjaGlsZE1vZGVsKVxuICAgICAgICBAaW5zZXJ0U25pcHBldChjaGlsZE1vZGVsKVxuXG5cbiAgaW5zZXJ0U25pcHBldEFzU2libGluZzogKHNpYmxpbmcsIG1vZGVsKSAtPlxuICAgIG1ldGhvZCA9IGlmIHNpYmxpbmcgPT0gbW9kZWwucHJldmlvdXMgdGhlbiAnYWZ0ZXInIGVsc2UgJ2JlZm9yZSdcbiAgICBAJG5vZGVGb3JTbmlwcGV0KHNpYmxpbmcpW21ldGhvZF0oQCRub2RlRm9yU25pcHBldChtb2RlbCkpXG5cblxuICBhcHBlbmRTbmlwcGV0VG9QYXJlbnRDb250YWluZXI6IChtb2RlbCkgLT5cbiAgICBAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKS5hcHBlbmRUbyhAJG5vZGVGb3JDb250YWluZXIobW9kZWwucGFyZW50Q29udGFpbmVyKSlcblxuXG4gICRub2RlRm9yU25pcHBldDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLiRodG1sXG5cblxuICAkbm9kZUZvckNvbnRhaW5lcjogKGNvbnRhaW5lcikgLT5cbiAgICBpZiBjb250YWluZXIuaXNSb290XG4gICAgICBAJHJvb3RcbiAgICBlbHNlXG4gICAgICBwYXJlbnRWaWV3ID0gQHNuaXBwZXRWaWV3Rm9yU25pcHBldChjb250YWluZXIucGFyZW50U25pcHBldClcbiAgICAgICQocGFyZW50Vmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGNvbnRhaW5lci5uYW1lKSlcblxuXG4gIHJlbW92ZVNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuICAgIEAkbm9kZUZvclNuaXBwZXQobW9kZWwpLmRldGFjaCgpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRGlyZWN0aXZlSXRlcmF0b3IgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS9kaXJlY3RpdmVfaXRlcmF0b3InKVxuZXZlbnRpbmcgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2V2ZW50aW5nJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKHsgQG1vZGVsLCBAJGh0bWwsIEBkaXJlY3RpdmVzLCBAaXNSZWFkT25seSB9KSAtPlxuICAgIEB0ZW1wbGF0ZSA9IEBtb2RlbC50ZW1wbGF0ZVxuICAgIEBpc0F0dGFjaGVkVG9Eb20gPSBmYWxzZVxuICAgIEB3YXNBdHRhY2hlZFRvRG9tID0gJC5DYWxsYmFja3MoKTtcblxuICAgIHVubGVzcyBAaXNSZWFkT25seVxuICAgICAgIyBhZGQgYXR0cmlidXRlcyBhbmQgcmVmZXJlbmNlcyB0byB0aGUgaHRtbFxuICAgICAgQCRodG1sXG4gICAgICAgIC5kYXRhKCdzbmlwcGV0JywgdGhpcylcbiAgICAgICAgLmFkZENsYXNzKGNvbmZpZy5odG1sLmNzc1snc25pcHBldCddKVxuICAgICAgICAuYXR0cihjb25maWcuaHRtbC5hdHRyWyd0ZW1wbGF0ZSddLCBAdGVtcGxhdGUuaWRlbnRpZmllcilcblxuICAgIEByZW5kZXIoKVxuXG5cbiAgcmVuZGVyOiAobW9kZSkgLT5cbiAgICBAdXBkYXRlQ29udGVudCgpXG4gICAgQHVwZGF0ZUh0bWwoKVxuXG5cbiAgdXBkYXRlQ29udGVudDogLT5cbiAgICBAY29udGVudChAbW9kZWwuY29udGVudClcblxuICAgIGlmIG5vdCBAaGFzRm9jdXMoKVxuICAgICAgQGRpc3BsYXlPcHRpb25hbHMoKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgdXBkYXRlSHRtbDogLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgQG1vZGVsLnN0eWxlc1xuICAgICAgQHN0eWxlKG5hbWUsIHZhbHVlKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgZGlzcGxheU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgJGVsZW0gPSAkKGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICBpZiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnJylcblxuXG4gICMgU2hvdyBhbGwgZG9jLW9wdGlvbmFscyB3aGV0aGVyIHRoZXkgYXJlIGVtcHR5IG9yIG5vdC5cbiAgIyBVc2Ugb24gZm9jdXMuXG4gIHNob3dPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5zaG93KCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgIyBIaWRlIGFsbCBlbXB0eSBkb2Mtb3B0aW9uYWxzXG4gICMgVXNlIG9uIGJsdXIuXG4gIGhpZGVFbXB0eU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWwgJiYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5oaWRlKCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgbmV4dDogLT5cbiAgICBAJGh0bWwubmV4dCgpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgcHJldjogLT5cbiAgICBAJGh0bWwucHJldigpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgYWZ0ZXJGb2N1c2VkOiAoKSAtPlxuICAgIEAkaHRtbC5hZGRDbGFzcyhjb25maWcuaHRtbC5jc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAc2hvd09wdGlvbmFscygpXG5cblxuICBhZnRlckJsdXJyZWQ6ICgpIC0+XG4gICAgQCRodG1sLnJlbW92ZUNsYXNzKGNvbmZpZy5odG1sLmNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY29uZmlnLmh0bWwuY3NzLnNuaXBwZXRIaWdobGlnaHQpXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgZG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdChAJGh0bWxbMF0pXG5cblxuICBjb250ZW50OiAoY29udGVudCkgLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgY29udGVudFxuICAgICAgQHNldChuYW1lLCB2YWx1ZSlcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQHNldEVkaXRhYmxlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQHNldEltYWdlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAc2V0SHRtbChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAZ2V0RWRpdGFibGUobmFtZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBnZXRJbWFnZShuYW1lKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAZ2V0SHRtbChuYW1lKVxuXG5cbiAgZ2V0RWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEVkaXRhYmxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIHBsYWNlaG9sZGVyID0gaWYgdmFsdWVcbiAgICAgIGNvbmZpZy56ZXJvV2lkdGhDaGFyYWN0ZXJcbiAgICBlbHNlXG4gICAgICBAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV1cblxuICAgICRlbGVtLmF0dHIoY29uZmlnLmh0bWwuYXR0ci5wbGFjZWhvbGRlciwgcGxhY2Vob2xkZXIpXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuXG4gIGZvY3VzRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hdHRyKGNvbmZpZy5odG1sLmF0dHIucGxhY2Vob2xkZXIsIGNvbmZpZy56ZXJvV2lkdGhDaGFyYWN0ZXIpXG5cblxuICBibHVyRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICBpZiBAbW9kZWwuaXNFbXB0eShuYW1lKVxuICAgICAgJGVsZW0uYXR0cihjb25maWcuaHRtbC5hdHRyLnBsYWNlaG9sZGVyLCBAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG5cblxuICBnZXRIdG1sOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRIdG1sOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgICRlbGVtLmh0bWwoQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgIGVsc2UgaWYgdmFsdWUgYW5kIG5vdCBAaXNSZWFkT25seVxuICAgICAgQGJsb2NrSW50ZXJhY3Rpb24oJGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXQgfHw9IHt9XG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0W25hbWVdID0gbmFtZVxuXG5cbiAgZ2V0RGlyZWN0aXZlRWxlbWVudDogKGRpcmVjdGl2ZU5hbWUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuZ2V0KGRpcmVjdGl2ZU5hbWUpPy5lbGVtXG5cblxuICAjIFJlc2V0IGRpcmVjdGl2ZXMgdGhhdCBjb250YWluIGFyYml0cmFyeSBodG1sIGFmdGVyIHRoZSB2aWV3IGlzIG1vdmVkIGluXG4gICMgdGhlIERPTSB0byByZWNyZWF0ZSBpZnJhbWVzLiBJbiB0aGUgY2FzZSBvZiB0d2l0dGVyIHdoZXJlIHRoZSBpZnJhbWVzXG4gICMgZG9uJ3QgaGF2ZSBhIHNyYyB0aGUgcmVsb2FkaW5nIHRoYXQgaGFwcGVucyB3aGVuIG9uZSBtb3ZlcyBhbiBpZnJhbWUgY2xlYXJzXG4gICMgYWxsIGNvbnRlbnQgKE1heWJlIHdlIGNvdWxkIGxpbWl0IHJlc2V0dGluZyB0byBpZnJhbWVzIHdpdGhvdXQgYSBzcmMpLlxuICAjXG4gICMgU29tZSBtb3JlIGluZm8gYWJvdXQgdGhlIGlzc3VlIG9uIHN0YWNrb3ZlcmZsb3c6XG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MzE4MjY0L2hvdy10by1tb3ZlLWFuLWlmcmFtZS1pbi10aGUtZG9tLXdpdGhvdXQtbG9zaW5nLWl0cy1zdGF0ZVxuICByZXNldERpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIG5hbWUgb2YgQGRpcmVjdGl2ZXNUb1Jlc2V0XG4gICAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgICBpZiAkZWxlbS5maW5kKCdpZnJhbWUnKS5sZW5ndGhcbiAgICAgICAgQHNldChuYW1lLCBAbW9kZWwuY29udGVudFtuYW1lXSlcblxuXG4gIGdldEltYWdlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYXR0cignc3JjJylcblxuXG4gIHNldEltYWdlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuXG4gICAgaWYgdmFsdWVcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG4gICAgICBAc2V0SW1hZ2VBdHRyaWJ1dGUoJGVsZW0sIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gJC5wcm94eShAc2V0UGxhY2Vob2xkZXJJbWFnZSwgdGhpcywgJGVsZW0pXG4gICAgICBAZGVsYXlVbnRpbEF0dGFjaGVkKG5hbWUsIHNldFBsYWNlaG9sZGVyKVxuXG5cbiAgc2V0SW1hZ2VBdHRyaWJ1dGU6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgaWYgJGVsZW1bMF0ubm9kZU5hbWUgPT0gJ0lNRydcbiAgICAgICRlbGVtLmF0dHIoJ3NyYycsIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgICRlbGVtLmF0dHIoJ3N0eWxlJywgXCJiYWNrZ3JvdW5kLWltYWdlOnVybCgje3ZhbHVlfSlcIilcblxuXG4gIHNldFBsYWNlaG9sZGVySW1hZ2U6ICgkZWxlbSkgLT5cbiAgICBpZiAkZWxlbVswXS5ub2RlTmFtZSA9PSAnSU1HJ1xuICAgICAgd2lkdGggPSAkZWxlbS53aWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoID0gJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgdmFsdWUgPSBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvI3t3aWR0aH14I3toZWlnaHR9L0JFRjU2Ri9CMkU2NjhcIlxuICAgIEBzZXRJbWFnZUF0dHJpYnV0ZSgkZWxlbSwgdmFsdWUpXG5cblxuICBzdHlsZTogKG5hbWUsIGNsYXNzTmFtZSkgLT5cbiAgICBjaGFuZ2VzID0gQHRlbXBsYXRlLnN0eWxlc1tuYW1lXS5jc3NDbGFzc0NoYW5nZXMoY2xhc3NOYW1lKVxuICAgIGlmIGNoYW5nZXMucmVtb3ZlXG4gICAgICBmb3IgcmVtb3ZlQ2xhc3MgaW4gY2hhbmdlcy5yZW1vdmVcbiAgICAgICAgQCRodG1sLnJlbW92ZUNsYXNzKHJlbW92ZUNsYXNzKVxuXG4gICAgQCRodG1sLmFkZENsYXNzKGNoYW5nZXMuYWRkKVxuXG5cbiAgIyBEaXNhYmxlIHRhYmJpbmcgZm9yIHRoZSBjaGlsZHJlbiBvZiBhbiBlbGVtZW50LlxuICAjIFRoaXMgaXMgdXNlZCBmb3IgaHRtbCBjb250ZW50IHNvIGl0IGRvZXMgbm90IGRpc3J1cHQgdGhlIHVzZXJcbiAgIyBleHBlcmllbmNlLiBUaGUgdGltZW91dCBpcyB1c2VkIGZvciBjYXNlcyBsaWtlIHR3ZWV0cyB3aGVyZSB0aGVcbiAgIyBpZnJhbWUgaXMgZ2VuZXJhdGVkIGJ5IGEgc2NyaXB0IHdpdGggYSBkZWxheS5cbiAgZGlzYWJsZVRhYmJpbmc6ICgkZWxlbSkgLT5cbiAgICBzZXRUaW1lb3V0KCA9PlxuICAgICAgJGVsZW0uZmluZCgnaWZyYW1lJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKVxuICAgICwgNDAwKVxuXG5cbiAgIyBBcHBlbmQgYSBjaGlsZCB0byB0aGUgZWxlbWVudCB3aGljaCB3aWxsIGJsb2NrIHVzZXIgaW50ZXJhY3Rpb25cbiAgIyBsaWtlIGNsaWNrIG9yIHRvdWNoIGV2ZW50cy4gQWxzbyB0cnkgdG8gcHJldmVudCB0aGUgdXNlciBmcm9tIGdldHRpbmdcbiAgIyBmb2N1cyBvbiBhIGNoaWxkIGVsZW1udCB0aHJvdWdoIHRhYmJpbmcuXG4gIGJsb2NrSW50ZXJhY3Rpb246ICgkZWxlbSkgLT5cbiAgICBAZW5zdXJlUmVsYXRpdmVQb3NpdGlvbigkZWxlbSlcbiAgICAkYmxvY2tlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjb25maWcuaHRtbC5jc3MuaW50ZXJhY3Rpb25CbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgJGVsZW0uYXBwZW5kKCRibG9ja2VyKVxuXG4gICAgQGRpc2FibGVUYWJiaW5nKCRlbGVtKVxuXG5cbiAgIyBNYWtlIHN1cmUgdGhhdCBhbGwgYWJzb2x1dGUgcG9zaXRpb25lZCBjaGlsZHJlbiBhcmUgcG9zaXRpb25lZFxuICAjIHJlbGF0aXZlIHRvICRlbGVtLlxuICBlbnN1cmVSZWxhdGl2ZVBvc2l0aW9uOiAoJGVsZW0pIC0+XG4gICAgcG9zaXRpb24gPSAkZWxlbS5jc3MoJ3Bvc2l0aW9uJylcbiAgICBpZiBwb3NpdGlvbiAhPSAnYWJzb2x1dGUnICYmIHBvc2l0aW9uICE9ICdmaXhlZCcgJiYgcG9zaXRpb24gIT0gJ3JlbGF0aXZlJ1xuICAgICAgJGVsZW0uY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpXG5cblxuICBnZXQkY29udGFpbmVyOiAtPlxuICAgICQoZG9tLmZpbmRDb250YWluZXIoQCRodG1sWzBdKS5ub2RlKVxuXG5cbiAgZGVsYXlVbnRpbEF0dGFjaGVkOiAobmFtZSwgZnVuYykgLT5cbiAgICBpZiBAaXNBdHRhY2hlZFRvRG9tXG4gICAgICBmdW5jKClcbiAgICBlbHNlXG4gICAgICBAY2FuY2VsRGVsYXllZChuYW1lKVxuICAgICAgQGRlbGF5ZWQgfHw9IHt9XG4gICAgICBAZGVsYXllZFtuYW1lXSA9IGV2ZW50aW5nLmNhbGxPbmNlIEB3YXNBdHRhY2hlZFRvRG9tLCA9PlxuICAgICAgICBAZGVsYXllZFtuYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgICBmdW5jKClcblxuXG4gIGNhbmNlbERlbGF5ZWQ6IChuYW1lKSAtPlxuICAgIGlmIEBkZWxheWVkP1tuYW1lXVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20ucmVtb3ZlKEBkZWxheWVkW25hbWVdKVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcblxuXG4gIHN0cmlwSHRtbElmUmVhZE9ubHk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAaXNSZWFkT25seVxuXG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoQCRodG1sWzBdKVxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBAc3RyaXBEb2NDbGFzc2VzKGVsZW0pXG4gICAgICBAc3RyaXBEb2NBdHRyaWJ1dGVzKGVsZW0pXG4gICAgICBAc3RyaXBFbXB0eUF0dHJpYnV0ZXMoZWxlbSlcblxuXG4gIHN0cmlwRG9jQ2xhc3NlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGtsYXNzIGluIGVsZW0uY2xhc3NOYW1lLnNwbGl0KC9cXHMrLylcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGtsYXNzKSBpZiAvZG9jXFwtLiovaS50ZXN0KGtsYXNzKVxuXG5cbiAgc3RyaXBEb2NBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBuYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICAgICRlbGVtLnJlbW92ZUF0dHIobmFtZSkgaWYgL2RhdGFcXC1kb2NcXC0uKi9pLnRlc3QobmFtZSlcblxuXG4gIHN0cmlwRW1wdHlBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBzdHJpcHBhYmxlQXR0cmlidXRlcyA9IFsnc3R5bGUnLCAnY2xhc3MnXVxuICAgIGZvciBhdHRyaWJ1dGUgaW4gQXJyYXk6OnNsaWNlLmFwcGx5KGVsZW0uYXR0cmlidXRlcylcbiAgICAgIGlzU3RyaXBwYWJsZUF0dHJpYnV0ZSA9IHN0cmlwcGFibGVBdHRyaWJ1dGVzLmluZGV4T2YoYXR0cmlidXRlLm5hbWUpID49IDBcbiAgICAgIGlzRW1wdHlBdHRyaWJ1dGUgPSBhdHRyaWJ1dGUudmFsdWUudHJpbSgpID09ICcnXG4gICAgICBpZiBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgYW5kIGlzRW1wdHlBdHRyaWJ1dGVcbiAgICAgICAgJGVsZW0ucmVtb3ZlQXR0cihhdHRyaWJ1dGUubmFtZSlcblxuXG4gIHNldEF0dGFjaGVkVG9Eb206IChuZXdWYWwpIC0+XG4gICAgcmV0dXJuIGlmIG5ld1ZhbCA9PSBAaXNBdHRhY2hlZFRvRG9tXG5cbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gbmV3VmFsXG5cbiAgICBpZiBuZXdWYWxcbiAgICAgIEByZXNldERpcmVjdGl2ZXMoKVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20uZmlyZSgpXG4iLCJTZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ3NzTG9hZGVyXG5cbiAgY29uc3RydWN0b3I6IChAd2luZG93KSAtPlxuICAgIEBsb2FkZWRVcmxzID0gW11cblxuXG4gIGxvYWQ6ICh1cmxzLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgdXJscyA9IFt1cmxzXSB1bmxlc3MgJC5pc0FycmF5KHVybHMpXG4gICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuICAgIEBsb2FkU2luZ2xlVXJsKHVybCwgc2VtYXBob3JlLndhaXQoKSkgZm9yIHVybCBpbiB1cmxzXG4gICAgc2VtYXBob3JlLnN0YXJ0KClcblxuXG4gICMgQHByaXZhdGVcbiAgbG9hZFNpbmdsZVVybDogKHVybCwgY2FsbGJhY2s9JC5ub29wKSAtPlxuICAgIGlmIEBpc1VybExvYWRlZCh1cmwpXG4gICAgICBjYWxsYmFjaygpXG4gICAgZWxzZVxuICAgICAgbGluayA9ICQoJzxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiAvPicpWzBdXG4gICAgICBsaW5rLm9ubG9hZCA9IGNhbGxiYWNrXG4gICAgICBsaW5rLmhyZWYgPSB1cmxcbiAgICAgIEB3aW5kb3cuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rKVxuICAgICAgQG1hcmtVcmxBc0xvYWRlZCh1cmwpXG5cblxuICAjIEBwcml2YXRlXG4gIGlzVXJsTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLmluZGV4T2YodXJsKSA+PSAwXG5cblxuICAjIEBwcml2YXRlXG4gIG1hcmtVcmxBc0xvYWRlZDogKHVybCkgLT5cbiAgICBAbG9hZGVkVXJscy5wdXNoKHVybClcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuRm9jdXMgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9mb2N1cycpXG5FZGl0YWJsZUNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyJylcbkRyYWdEcm9wID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZHJhZ19kcm9wJylcblNuaXBwZXREcmFnID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vc25pcHBldF9kcmFnJylcblxuIyBBbiBJbnRlcmFjdGl2ZVBhZ2UgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFsbG93cyBmb3IgbWFuaXB1bGF0aW9uIG9mIHRoZVxuIyByZW5kZXJlZCBTbmlwcGV0VHJlZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW50ZXJhY3RpdmVQYWdlIGV4dGVuZHMgUGFnZVxuXG4gIExFRlRfTU9VU0VfQlVUVE9OID0gMVxuXG4gIGlzUmVhZE9ubHk6IGZhbHNlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgcmVuZGVyTm9kZSwgaG9zdFdpbmRvdyB9PXt9KSAtPlxuICAgIHN1cGVyXG5cbiAgICBAZm9jdXMgPSBuZXcgRm9jdXMoKVxuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPSBuZXcgRWRpdGFibGVDb250cm9sbGVyKHRoaXMpXG5cbiAgICAjIGV2ZW50c1xuICAgIEBpbWFnZUNsaWNrID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAaHRtbEVsZW1lbnRDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQHNuaXBwZXRXaWxsQmVEcmFnZ2VkID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0TW9kZWwpIC0+XG4gICAgQHNuaXBwZXRXYXNEcm9wcGVkID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0TW9kZWwpIC0+XG5cbiAgICBAc25pcHBldERyYWdEcm9wID0gbmV3IERyYWdEcm9wXG4gICAgICBsb25ncHJlc3NEZWxheTogNDAwXG4gICAgICBsb25ncHJlc3NEaXN0YW5jZUxpbWl0OiAxMFxuICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG5cbiAgICBAZm9jdXMuc25pcHBldEZvY3VzLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Rm9jdXNlZCwgdGhpcykgKVxuICAgIEBmb2N1cy5zbmlwcGV0Qmx1ci5hZGQoICQucHJveHkoQGFmdGVyU25pcHBldEJsdXJyZWQsIHRoaXMpIClcblxuICAgIEAkZG9jdW1lbnRcbiAgICAgIC5vbignY2xpY2subGl2aW5nZG9jcycsICQucHJveHkoQGNsaWNrLCB0aGlzKSlcbiAgICAgIC5vbignbW91c2Vkb3duLmxpdmluZ2RvY3MnLCAkLnByb3h5KEBtb3VzZWRvd24sIHRoaXMpKVxuICAgICAgLm9uKCd0b3VjaHN0YXJ0LmxpdmluZ2RvY3MnLCAkLnByb3h5KEBtb3VzZWRvd24sIHRoaXMpKVxuICAgICAgLm9uKCdkcmFnc3RhcnQnLCAkLnByb3h5KEBicm93c2VyRHJhZ1N0YXJ0LCB0aGlzKSlcblxuXG4gICMgcHJldmVudCB0aGUgYnJvd3NlciBEcmFnJkRyb3AgZnJvbSBpbnRlcmZlcmluZ1xuICBicm93c2VyRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cblxuICByZW1vdmVMaXN0ZW5lcnM6IC0+XG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzJylcbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG5cblxuICBtb3VzZWRvd246IChldmVudCkgLT5cbiAgICByZXR1cm4gaWYgZXZlbnQud2hpY2ggIT0gTEVGVF9NT1VTRV9CVVRUT04gJiYgZXZlbnQudHlwZSA9PSAnbW91c2Vkb3duJyAjIG9ubHkgcmVzcG9uZCB0byBsZWZ0IG1vdXNlIGJ1dHRvblxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG5cbiAgICBpZiBzbmlwcGV0Vmlld1xuICAgICAgQHN0YXJ0RHJhZ1xuICAgICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcbiAgICAgICAgZHJhZ0Ryb3A6IEBzbmlwcGV0RHJhZ0Ryb3BcbiAgICAgICAgZXZlbnQ6IGV2ZW50XG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgaW5pdGlhbGl6ZWQgaW1tZWRpYXRlbHkgdG8gYWxsb3cgYSBsb25nLXByZXNzIGZpbmlzaFxuICByZWdpc3RlckRyYWdTdG9wRXZlbnRzOiAoZHJhZ0Ryb3AsIGV2ZW50KSAtPlxuICAgIGV2ZW50TmFtZXMgPVxuICAgICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgICAgJ3RvdWNoZW5kLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGNhbmNlbC5saXZpbmdkb2NzLWRyYWcgdG91Y2hsZWF2ZS5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlXG4gICAgICAgICdtb3VzZXVwLmxpdmluZ2RvY3MtZHJhZydcbiAgICBAJGRvY3VtZW50Lm9uIGV2ZW50TmFtZXMsID0+XG4gICAgICBkcmFnRHJvcC5kcm9wKClcbiAgICAgIEAkZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBwb3NzaWJseSBpbml0aWFsaXplZCB3aXRoIGEgZGVsYXkgaW4gc25pcHBldERyYWcjb25TdGFydFxuICByZWdpc3RlckRyYWdNb3ZlRXZlbnRzOiAoZHJhZ0Ryb3AsIGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICBAJGRvY3VtZW50Lm9uICd0b3VjaG1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSAtPlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIGRyYWdEcm9wLm1vdmUoZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCwgZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSwgZXZlbnQpXG5cbiAgICBlbHNlICMgYWxsIG90aGVyIGlucHV0IGRldmljZXMgYmVoYXZlIGxpa2UgYSBtb3VzZVxuICAgICAgQCRkb2N1bWVudC5vbiAnbW91c2Vtb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgLT5cbiAgICAgICAgZHJhZ0Ryb3AubW92ZShldmVudC5wYWdlWCwgZXZlbnQucGFnZVksIGV2ZW50KVxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0LCBzbmlwcGV0VmlldywgZHJhZ0Ryb3AsIGV2ZW50IH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0IHx8IHNuaXBwZXRWaWV3XG4gICAgc25pcHBldCA9IHNuaXBwZXRWaWV3Lm1vZGVsIGlmIHNuaXBwZXRWaWV3XG5cbiAgICBAcmVnaXN0ZXJEcmFnTW92ZUV2ZW50cyhkcmFnRHJvcCwgZXZlbnQpXG4gICAgQHJlZ2lzdGVyRHJhZ1N0b3BFdmVudHMoZHJhZ0Ryb3AsIGV2ZW50KVxuICAgIHNuaXBwZXREcmFnID0gbmV3IFNuaXBwZXREcmFnKHsgc25pcHBldDogc25pcHBldCwgcGFnZTogdGhpcyB9KVxuXG4gICAgJHNuaXBwZXQgPSBzbmlwcGV0Vmlldy4kaHRtbCBpZiBzbmlwcGV0Vmlld1xuICAgIGRyYWdEcm9wLm1vdXNlZG93biAkc25pcHBldCwgZXZlbnQsXG4gICAgICBvbkRyYWdTdGFydDogc25pcHBldERyYWcub25TdGFydFxuICAgICAgb25EcmFnOiBzbmlwcGV0RHJhZy5vbkRyYWdcbiAgICAgIG9uRHJvcDogc25pcHBldERyYWcub25Ecm9wXG5cblxuICBjbGljazogKGV2ZW50KSAtPlxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG4gICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcblxuICAgICMgdG9kbzogaWYgYSB1c2VyIGNsaWNrZWQgb24gYSBtYXJnaW4gb2YgYSBzbmlwcGV0IGl0IHNob3VsZFxuICAgICMgc3RpbGwgZ2V0IHNlbGVjdGVkLiAoaWYgYSBzbmlwcGV0IGlzIGZvdW5kIGJ5IHBhcmVudFNuaXBwZXRcbiAgICAjIGFuZCB0aGF0IHNuaXBwZXQgaGFzIG5vIGNoaWxkcmVuIHdlIGRvIG5vdCBuZWVkIHRvIHNlYXJjaClcblxuICAgICMgaWYgc25pcHBldCBoYXNDaGlsZHJlbiwgbWFrZSBzdXJlIHdlIGRpZG4ndCB3YW50IHRvIHNlbGVjdFxuICAgICMgYSBjaGlsZFxuXG4gICAgIyBpZiBubyBzbmlwcGV0IHdhcyBzZWxlY3RlZCBjaGVjayBpZiB0aGUgdXNlciB3YXMgbm90IGNsaWNraW5nXG4gICAgIyBvbiBhIG1hcmdpbiBvZiBhIHNuaXBwZXRcblxuICAgICMgdG9kbzogY2hlY2sgaWYgdGhlIGNsaWNrIHdhcyBtZWFudCBmb3IgYSBzbmlwcGV0IGNvbnRhaW5lclxuICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICBAZm9jdXMuc25pcHBldEZvY3VzZWQoc25pcHBldFZpZXcpXG5cbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGh0bWxFbGVtZW50Q2xpY2suZmlyZShzbmlwcGV0Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cblxuICBibHVyRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQGZvY3VzLnNldEZvY3VzKHVuZGVmaW5lZClcbiAgICBmb2N1c2VkRWxlbWVudCA9IEBnZXRGb2N1c2VkRWxlbWVudCgpXG4gICAgJChmb2N1c2VkRWxlbWVudCkuYmx1cigpIGlmIGZvY3VzZWRFbGVtZW50XG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoc25pcHBldFZpZXcpXG5cblxuICBpbml0aWFsaXplRWRpdGFibGVzOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgICBkaXJlY3RpdmUuZWxlbVxuXG4gICAgICBAZWRpdGFibGVDb250cm9sbGVyLmFkZChlZGl0YWJsZU5vZGVzKVxuXG5cbiAgYWZ0ZXJTbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIHNuaXBwZXRWaWV3LmFmdGVyRm9jdXNlZCgpXG5cblxuICBhZnRlclNuaXBwZXRCbHVycmVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJCbHVycmVkKClcbiIsIlJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgQSBQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUmVuZGVyaW5nQ29udGFpbmVyIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHNob3duIHRvXG4jIHRoZSB1c2VyLiBJdCBoYXMgYSBMb2FkZXIgd2hpY2ggYWxsb3dzIHlvdSB0byBpbmplY3QgQ1NTIGFuZCBKUyBmaWxlcyBpbnRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYWdlIGV4dGVuZHMgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIHJlYWRPbmx5LCBob3N0V2luZG93LCBAZGVzaWduIH09e30pIC0+XG4gICAgQGlzUmVhZE9ubHkgPSByZWFkT25seSBpZiByZWFkT25seT9cbiAgICBAc2V0V2luZG93KGhvc3RXaW5kb3cpXG5cbiAgICBzdXBlcigpXG5cbiAgICByZW5kZXJOb2RlID0gcmVuZGVyTm9kZSB8fCAkKFwiLiN7IGNvbmZpZy5odG1sLmNzcy5zZWN0aW9uIH1cIiwgQCRib2R5KVxuICAgIGlmIHJlbmRlck5vZGUuanF1ZXJ5XG4gICAgICBAcmVuZGVyTm9kZSA9IHJlbmRlck5vZGVbMF1cbiAgICBlbHNlXG4gICAgICBAcmVuZGVyTm9kZSA9IHJlbmRlck5vZGVcblxuXG4gIGJlZm9yZVJlYWR5OiAtPlxuICAgIEBjc3NMb2FkZXIgPSBuZXcgQ3NzTG9hZGVyKEB3aW5kb3cpXG4gICAgQGNzc0xvYWRlci5sb2FkKEBkZXNpZ24uY3NzLCBAcmVhZHlTZW1hcGhvcmUud2FpdCgpKSBpZiBAZGVzaWduPy5jc3NcblxuXG4gIHNldFdpbmRvdzogKGhvc3RXaW5kb3cpIC0+XG4gICAgQHdpbmRvdyA9IGhvc3RXaW5kb3cgfHwgd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG4jIEEgUmVuZGVyaW5nQ29udGFpbmVyIGlzIHVzZWQgYnkgdGhlIFJlbmRlcmVyIHRvIGdlbmVyYXRlIEhUTUwuXG4jXG4jIFRoZSBSZW5kZXJlciBpbnNlcnRzIFNuaXBwZXRWaWV3cyBpbnRvIHRoZSBSZW5kZXJpbmdDb250YWluZXIgYW5kIG5vdGlmaWVzIGl0XG4jIG9mIHRoZSBpbnNlcnRpb24uXG4jXG4jIFRoZSBSZW5kZXJpbmdDb250YWluZXIgaXMgaW50ZW5kZWQgZm9yIGdlbmVyYXRpbmcgSFRNTC4gUGFnZSBpcyBhIHN1YmNsYXNzIG9mXG4jIHRoaXMgYmFzZSBjbGFzcyB0aGF0IGlzIGludGVuZGVkIGZvciBkaXNwbGF5aW5nIHRvIHRoZSB1c2VyLiBJbnRlcmFjdGl2ZVBhZ2VcbiMgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFkZHMgaW50ZXJhY3Rpdml0eSwgYW5kIHRodXMgZWRpdGFiaWxpdHksIHRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJpbmdDb250YWluZXJcblxuICBpc1JlYWRPbmx5OiB0cnVlXG5cblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAcmVuZGVyTm9kZSA9ICQoJzxkaXYvPicpWzBdXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQGJlZm9yZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgaHRtbDogLT5cbiAgICAkKEByZW5kZXJOb2RlKS5odG1sKClcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cblxuXG4gICMgVGhpcyBpcyBjYWxsZWQgYmVmb3JlIHRoZSBzZW1hcGhvcmUgaXMgc3RhcnRlZCB0byBnaXZlIHN1YmNsYXNzZXMgYSBjaGFuY2VcbiAgIyB0byBpbmNyZW1lbnQgdGhlIHNlbWFwaG9yZSBzbyBpdCBkb2VzIG5vdCBmaXJlIGltbWVkaWF0ZWx5LlxuICBiZWZvcmVSZWFkeTogLT5cblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuIiwiIyBqUXVlcnkgbGlrZSByZXN1bHRzIHdoZW4gc2VhcmNoaW5nIGZvciBzbmlwcGV0cy5cbiMgYGRvYyhcImhlcm9cIilgIHdpbGwgcmV0dXJuIGEgU25pcHBldEFycmF5IHRoYXQgd29ya3Mgc2ltaWxhciB0byBhIGpRdWVyeSBvYmplY3QuXG4jIEZvciBleHRlbnNpYmlsaXR5IHZpYSBwbHVnaW5zIHdlIGV4cG9zZSB0aGUgcHJvdG90eXBlIG9mIFNuaXBwZXRBcnJheSB2aWEgYGRvYy5mbmAuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRBcnJheVxuXG5cbiAgIyBAcGFyYW0gc25pcHBldHM6IGFycmF5IG9mIHNuaXBwZXRzXG4gIGNvbnN0cnVjdG9yOiAoQHNuaXBwZXRzKSAtPlxuICAgIEBzbmlwcGV0cyA9IFtdIHVubGVzcyBAc25pcHBldHM/XG4gICAgQGNyZWF0ZVBzZXVkb0FycmF5KClcblxuXG4gIGNyZWF0ZVBzZXVkb0FycmF5OiAoKSAtPlxuICAgIGZvciByZXN1bHQsIGluZGV4IGluIEBzbmlwcGV0c1xuICAgICAgQFtpbmRleF0gPSByZXN1bHRcblxuICAgIEBsZW5ndGggPSBAc25pcHBldHMubGVuZ3RoXG4gICAgaWYgQHNuaXBwZXRzLmxlbmd0aFxuICAgICAgQGZpcnN0ID0gQFswXVxuICAgICAgQGxhc3QgPSBAW0BzbmlwcGV0cy5sZW5ndGggLSAxXVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBzbmlwcGV0IGluIEBzbmlwcGV0c1xuICAgICAgY2FsbGJhY2soc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIHJlbW92ZTogKCkgLT5cbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIHNuaXBwZXQucmVtb3ZlKClcblxuICAgIHRoaXNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFNuaXBwZXRDb250YWluZXJcbiMgLS0tLS0tLS0tLS0tLS0tLVxuIyBBIFNuaXBwZXRDb250YWluZXIgY29udGFpbnMgYW5kIG1hbmFnZXMgYSBsaW5rZWQgbGlzdFxuIyBvZiBzbmlwcGV0cy5cbiNcbiMgVGhlIHNuaXBwZXRDb250YWluZXIgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgaXRzIHNuaXBwZXRUcmVlXG4jIGluZm9ybWVkIGFib3V0IGNoYW5nZXMgKG9ubHkgaWYgdGhleSBhcmUgYXR0YWNoZWQgdG8gb25lKS5cbiNcbiMgQHByb3AgZmlyc3Q6IGZpcnN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBsYXN0OiBsYXN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBwYXJlbnRTbmlwcGV0OiBwYXJlbnQgU25pcHBldE1vZGVsXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRDb250YWluZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAcGFyZW50U25pcHBldCwgQG5hbWUsIGlzUm9vdCB9KSAtPlxuICAgIEBpc1Jvb3QgPSBpc1Jvb3Q/XG4gICAgQGZpcnN0ID0gQGxhc3QgPSB1bmRlZmluZWRcblxuXG4gIHByZXBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBmaXJzdFxuICAgICAgQGluc2VydEJlZm9yZShAZmlyc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGFwcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgaWYgQHBhcmVudFNuaXBwZXRcbiAgICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgQHBhcmVudFNuaXBwZXQsICdjYW5ub3QgYXBwZW5kIHNuaXBwZXQgdG8gaXRzZWxmJ1xuXG4gICAgaWYgQGxhc3RcbiAgICAgIEBpbnNlcnRBZnRlcihAbGFzdCwgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgdGhpc1xuXG5cbiAgaW5zZXJ0QmVmb3JlOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0LnByZXZpb3VzID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGJlZm9yZSBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogc25pcHBldC5wcmV2aW91c1xuICAgICAgbmV4dDogc25pcHBldFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIGluc2VydEFmdGVyOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0Lm5leHQgPT0gaW5zZXJ0ZWRTbmlwcGV0XG4gICAgYXNzZXJ0IHNuaXBwZXQgaXNudCBpbnNlcnRlZFNuaXBwZXQsICdjYW5ub3QgaW5zZXJ0IHNuaXBwZXQgYWZ0ZXIgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXRcbiAgICAgIG5leHQ6IHNuaXBwZXQubmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIHVwOiAoc25pcHBldCkgLT5cbiAgICBpZiBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgQGluc2VydEJlZm9yZShzbmlwcGV0LnByZXZpb3VzLCBzbmlwcGV0KVxuXG5cbiAgZG93bjogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5uZXh0P1xuICAgICAgQGluc2VydEFmdGVyKHNuaXBwZXQubmV4dCwgc25pcHBldClcblxuXG4gIGdldFNuaXBwZXRUcmVlOiAtPlxuICAgIEBzbmlwcGV0VHJlZSB8fCBAcGFyZW50U25pcHBldD8uc25pcHBldFRyZWVcblxuXG4gICMgVHJhdmVyc2UgYWxsIHNuaXBwZXRzXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBzbmlwcGV0ID0gQGZpcnN0XG4gICAgd2hpbGUgKHNuaXBwZXQpXG4gICAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZihjYWxsYmFjaylcbiAgICAgIHNuaXBwZXQgPSBzbmlwcGV0Lm5leHRcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0cyBhbmQgY29udGFpbmVyc1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgY2FsbGJhY2soc25pcHBldClcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgcmVtb3ZlOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0LmRlc3Ryb3koKVxuICAgIEBfZGV0YWNoU25pcHBldChzbmlwcGV0KVxuXG5cbiAgdWk6IC0+XG4gICAgaWYgbm90IEB1aUluamVjdG9yXG4gICAgICBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5yZW5kZXJlci5jcmVhdGVJbnRlcmZhY2VJbmplY3Rvcih0aGlzKVxuICAgIEB1aUluamVjdG9yXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBFdmVyeSBzbmlwcGV0IGFkZGVkIG9yIG1vdmVkIG1vc3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIHNuaXBwZXRUcmVlIGlmIHRoZSBwYXJlbnQgc25pcHBldCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXR0YWNoU25pcHBldDogKHNuaXBwZXQsIHBvc2l0aW9uID0ge30pIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAbGluayhzbmlwcGV0LCBwb3NpdGlvbilcblxuICAgIGlmIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLmF0dGFjaGluZ1NuaXBwZXQoc25pcHBldCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgRXZlcnkgc25pcHBldCB0aGF0IGlzIHJlbW92ZWQgbXVzdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgc25pcHBldFRyZWUgaWYgdGhlIHBhcmVudCBzbmlwcGV0IGlzXG4gICMgYXR0YWNoZWQgdG8gb25lLlxuICAjIFNuaXBwZXRzIHRoYXQgYXJlIG1vdmVkIGluc2lkZSBhIHNuaXBwZXRUcmVlIHNob3VsZCBub3RcbiAgIyBjYWxsIF9kZXRhY2hTbmlwcGV0IHNpbmNlIHdlIGRvbid0IHdhbnQgdG8gZmlyZVxuICAjIFNuaXBwZXRSZW1vdmVkIGV2ZW50cyBvbiB0aGUgc25pcHBldCB0cmVlLCBpbiB0aGVzZVxuICAjIGNhc2VzIHVubGluayBjYW4gYmUgdXNlZFxuICAjIEBhcGkgcHJpdmF0ZVxuICBfZGV0YWNoU25pcHBldDogKHNuaXBwZXQpIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAdW5saW5rKHNuaXBwZXQpXG5cbiAgICBpZiBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5kZXRhY2hpbmdTbmlwcGV0KHNuaXBwZXQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBsaW5rOiAoc25pcHBldCwgcG9zaXRpb24pIC0+XG4gICAgQHVubGluayhzbmlwcGV0KSBpZiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgcG9zaXRpb24ucGFyZW50Q29udGFpbmVyIHx8PSB0aGlzXG4gICAgQHNldFNuaXBwZXRQb3NpdGlvbihzbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHVubGluazogKHNuaXBwZXQpIC0+XG4gICAgY29udGFpbmVyID0gc25pcHBldC5wYXJlbnRDb250YWluZXJcbiAgICBpZiBjb250YWluZXJcblxuICAgICAgIyB1cGRhdGUgcGFyZW50Q29udGFpbmVyIGxpbmtzXG4gICAgICBjb250YWluZXIuZmlyc3QgPSBzbmlwcGV0Lm5leHQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBjb250YWluZXIubGFzdCA9IHNuaXBwZXQucHJldmlvdXMgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuICAgICAgIyB1cGRhdGUgcHJldmlvdXMgYW5kIG5leHQgbm9kZXNcbiAgICAgIHNuaXBwZXQubmV4dD8ucHJldmlvdXMgPSBzbmlwcGV0LnByZXZpb3VzXG4gICAgICBzbmlwcGV0LnByZXZpb3VzPy5uZXh0ID0gc25pcHBldC5uZXh0XG5cbiAgICAgIEBzZXRTbmlwcGV0UG9zaXRpb24oc25pcHBldCwge30pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBzZXRTbmlwcGV0UG9zaXRpb246IChzbmlwcGV0LCB7IHBhcmVudENvbnRhaW5lciwgcHJldmlvdXMsIG5leHQgfSkgLT5cbiAgICBzbmlwcGV0LnBhcmVudENvbnRhaW5lciA9IHBhcmVudENvbnRhaW5lclxuICAgIHNuaXBwZXQucHJldmlvdXMgPSBwcmV2aW91c1xuICAgIHNuaXBwZXQubmV4dCA9IG5leHRcblxuICAgIGlmIHBhcmVudENvbnRhaW5lclxuICAgICAgcHJldmlvdXMubmV4dCA9IHNuaXBwZXQgaWYgcHJldmlvdXNcbiAgICAgIG5leHQucHJldmlvdXMgPSBzbmlwcGV0IGlmIG5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lci5maXJzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBwYXJlbnRDb250YWluZXIubGFzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuXG4iLCJTbmlwcGV0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X2NvbnRhaW5lcicpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5zZXJpYWxpemF0aW9uID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZXJpYWxpemF0aW9uJylcblxuIyBTbmlwcGV0TW9kZWxcbiMgLS0tLS0tLS0tLS0tXG4jIEVhY2ggU25pcHBldE1vZGVsIGhhcyBhIHRlbXBsYXRlIHdoaWNoIGFsbG93cyB0byBnZW5lcmF0ZSBhIHNuaXBwZXRWaWV3XG4jIGZyb20gYSBzbmlwcGV0TW9kZWxcbiNcbiMgUmVwcmVzZW50cyBhIG5vZGUgaW4gYSBTbmlwcGV0VHJlZS5cbiMgRXZlcnkgU25pcHBldE1vZGVsIGNhbiBoYXZlIGEgcGFyZW50IChTbmlwcGV0Q29udGFpbmVyKSxcbiMgc2libGluZ3MgKG90aGVyIHNuaXBwZXRzKSBhbmQgbXVsdGlwbGUgY29udGFpbmVycyAoU25pcHBldENvbnRhaW5lcnMpLlxuI1xuIyBUaGUgY29udGFpbmVycyBhcmUgdGhlIHBhcmVudHMgb2YgdGhlIGNoaWxkIFNuaXBwZXRNb2RlbHMuXG4jIEUuZy4gYSBncmlkIHJvdyB3b3VsZCBoYXZlIGFzIG1hbnkgY29udGFpbmVycyBhcyBpdCBoYXNcbiMgY29sdW1uc1xuI1xuIyAjIEBwcm9wIHBhcmVudENvbnRhaW5lcjogcGFyZW50IFNuaXBwZXRDb250YWluZXJcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldE1vZGVsXG5cbiAgY29uc3RydWN0b3I6ICh7IEB0ZW1wbGF0ZSwgaWQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAdGVtcGxhdGUsICdjYW5ub3QgaW5zdGFudGlhdGUgc25pcHBldCB3aXRob3V0IHRlbXBsYXRlIHJlZmVyZW5jZSdcblxuICAgIEBpbml0aWFsaXplRGlyZWN0aXZlcygpXG4gICAgQHN0eWxlcyA9IHt9XG4gICAgQGlkID0gaWQgfHwgZ3VpZC5uZXh0KClcbiAgICBAaWRlbnRpZmllciA9IEB0ZW1wbGF0ZS5pZGVudGlmaWVyXG5cbiAgICBAbmV4dCA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0Q29udGFpbmVyXG4gICAgQHByZXZpb3VzID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAc25pcHBldFRyZWUgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldFRyZWVcblxuXG4gIGluaXRpYWxpemVEaXJlY3RpdmVzOiAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gQHRlbXBsYXRlLmRpcmVjdGl2ZXNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgICAgQGNvbnRhaW5lcnMgfHw9IHt9XG4gICAgICAgICAgQGNvbnRhaW5lcnNbZGlyZWN0aXZlLm5hbWVdID0gbmV3IFNuaXBwZXRDb250YWluZXJcbiAgICAgICAgICAgIG5hbWU6IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgICAgICBwYXJlbnRTbmlwcGV0OiB0aGlzXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgICAgICAgQGNvbnRlbnQgfHw9IHt9XG4gICAgICAgICAgQGNvbnRlbnRbZGlyZWN0aXZlLm5hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZSBkaXJlY3RpdmUgdHlwZSAnI3sgZGlyZWN0aXZlLnR5cGUgfScgbm90IGltcGxlbWVudGVkIGluIFNuaXBwZXRNb2RlbFwiXG5cblxuICBjcmVhdGVWaWV3OiAoaXNSZWFkT25seSkgLT5cbiAgICBAdGVtcGxhdGUuY3JlYXRlVmlldyh0aGlzLCBpc1JlYWRPbmx5KVxuXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICBiZWZvcmU6IChzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgc25pcHBldE1vZGVsXG4gICAgICBAcGFyZW50Q29udGFpbmVyLmluc2VydEJlZm9yZSh0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQHByZXZpb3VzXG5cblxuICBhZnRlcjogKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBzbmlwcGV0TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QWZ0ZXIodGhpcywgc25pcHBldE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBuZXh0XG5cblxuICBhcHBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5hcHBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gIHByZXBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKHNuaXBwZXRNb2RlbClcbiAgICB0aGlzXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJzZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIGlmIEBjb250ZW50W25hbWVdICE9IHZhbHVlXG4gICAgICBAY29udGVudFtuYW1lXSA9IHZhbHVlXG4gICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBjb250ZW50W25hbWVdXG5cblxuICBpc0VtcHR5OiAobmFtZSkgLT5cbiAgICB2YWx1ZSA9IEBnZXQobmFtZSlcbiAgICB2YWx1ZSA9PSB1bmRlZmluZWQgfHwgdmFsdWUgPT0gJydcblxuXG4gIHN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBAc3R5bGVzW25hbWVdXG4gICAgZWxzZVxuICAgICAgQHNldFN0eWxlKG5hbWUsIHZhbHVlKVxuXG5cbiAgc2V0U3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBzdHlsZSA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV1cbiAgICBpZiBub3Qgc3R5bGVcbiAgICAgIGxvZy53YXJuIFwiVW5rbm93biBzdHlsZSAnI3sgbmFtZSB9JyBpbiBTbmlwcGV0TW9kZWwgI3sgQGlkZW50aWZpZXIgfVwiXG4gICAgZWxzZSBpZiBub3Qgc3R5bGUudmFsaWRhdGVWYWx1ZSh2YWx1ZSlcbiAgICAgIGxvZy53YXJuIFwiSW52YWxpZCB2YWx1ZSAnI3sgdmFsdWUgfScgZm9yIHN0eWxlICcjeyBuYW1lIH0nIGluIFNuaXBwZXRNb2RlbCAjeyBAaWRlbnRpZmllciB9XCJcbiAgICBlbHNlXG4gICAgICBpZiBAc3R5bGVzW25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBzdHlsZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgICBpZiBAc25pcHBldFRyZWVcbiAgICAgICAgICBAc25pcHBldFRyZWUuaHRtbENoYW5naW5nKHRoaXMsICdzdHlsZScsIHsgbmFtZSwgdmFsdWUgfSlcblxuXG4gIGNvcHk6IC0+XG4gICAgbG9nLndhcm4oXCJTbmlwcGV0TW9kZWwjY29weSgpIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpXG5cbiAgICAjIHNlcmlhbGl6aW5nL2Rlc2VyaWFsaXppbmcgc2hvdWxkIHdvcmsgYnV0IG5lZWRzIHRvIGdldCBzb21lIHRlc3RzIGZpcnN0XG4gICAgIyBqc29uID0gQHRvSnNvbigpXG4gICAgIyBqc29uLmlkID0gZ3VpZC5uZXh0KClcbiAgICAjIFNuaXBwZXRNb2RlbC5mcm9tSnNvbihqc29uKVxuXG5cbiAgY29weVdpdGhvdXRDb250ZW50OiAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cblxuICAjIG1vdmUgdXAgKHByZXZpb3VzKVxuICB1cDogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLnVwKHRoaXMpXG4gICAgdGhpc1xuXG5cbiAgIyBtb3ZlIGRvd24gKG5leHQpXG4gIGRvd246IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci5kb3duKHRoaXMpXG4gICAgdGhpc1xuXG5cbiAgIyByZW1vdmUgVHJlZU5vZGUgZnJvbSBpdHMgY29udGFpbmVyIGFuZCBTbmlwcGV0VHJlZVxuICByZW1vdmU6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci5yZW1vdmUodGhpcylcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyB0b2RvOiBtb3ZlIGludG8gdG8gcmVuZGVyZXJcblxuICAgICMgcmVtb3ZlIHVzZXIgaW50ZXJmYWNlIGVsZW1lbnRzXG4gICAgQHVpSW5qZWN0b3IucmVtb3ZlKCkgaWYgQHVpSW5qZWN0b3JcblxuXG4gIGdldFBhcmVudDogLT5cbiAgICAgQHBhcmVudENvbnRhaW5lcj8ucGFyZW50U25pcHBldFxuXG5cbiAgdWk6IC0+XG4gICAgaWYgbm90IEB1aUluamVjdG9yXG4gICAgICBAc25pcHBldFRyZWUucmVuZGVyZXIuY3JlYXRlSW50ZXJmYWNlSW5qZWN0b3IodGhpcylcbiAgICBAdWlJbmplY3RvclxuXG5cbiAgIyBJdGVyYXRvcnNcbiAgIyAtLS0tLS0tLS1cblxuICBwYXJlbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldE1vZGVsID0gdGhpc1xuICAgIHdoaWxlIChzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwuZ2V0UGFyZW50KCkpXG4gICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG5cblxuICBjaGlsZHJlbjogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLm5leHRcblxuXG4gIGRlc2NlbmRhbnRzQW5kU2VsZjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGRlc2NlbmRhbnRzKGNhbGxiYWNrKVxuXG5cbiAgIyByZXR1cm4gYWxsIGRlc2NlbmRhbnQgY29udGFpbmVycyAoaW5jbHVkaW5nIHRob3NlIG9mIHRoaXMgc25pcHBldE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIHJldHVybiBhbGwgZGVzY2VuZGFudCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGxEZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbCkgaWYgc25pcHBldE1vZGVsICE9IHRoaXNcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICBjaGlsZHJlbkFuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBjaGlsZHJlbihjYWxsYmFjaylcblxuXG4gICMgU2VyaWFsaXphdGlvblxuICAjIC0tLS0tLS0tLS0tLS1cblxuICB0b0pzb246IC0+XG5cbiAgICBqc29uID1cbiAgICAgIGlkOiBAaWRcbiAgICAgIGlkZW50aWZpZXI6IEBpZGVudGlmaWVyXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KEBjb250ZW50KVxuICAgICAganNvbi5jb250ZW50ID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShAY29udGVudClcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoQHN0eWxlcylcbiAgICAgIGpzb24uc3R5bGVzID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShAc3R5bGVzKVxuXG4gICAgIyBjcmVhdGUgYW4gYXJyYXkgZm9yIGV2ZXJ5IGNvbnRhaW5lclxuICAgIGZvciBuYW1lIG9mIEBjb250YWluZXJzXG4gICAgICBqc29uLmNvbnRhaW5lcnMgfHw9IHt9XG4gICAgICBqc29uLmNvbnRhaW5lcnNbbmFtZV0gPSBbXVxuXG4gICAganNvblxuXG5cblNuaXBwZXRNb2RlbC5mcm9tSnNvbiA9IChqc29uLCBkZXNpZ24pIC0+XG4gIHRlbXBsYXRlID0gZGVzaWduLmdldChqc29uLmlkZW50aWZpZXIpXG5cbiAgYXNzZXJ0IHRlbXBsYXRlLFxuICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIHRlbXBsYXRlIGlkZW50aWZpZXIgJyN7IGpzb24uaWRlbnRpZmllciB9J1wiXG5cbiAgbW9kZWwgPSBuZXcgU25pcHBldE1vZGVsKHsgdGVtcGxhdGUsIGlkOiBqc29uLmlkIH0pXG5cbiAgZm9yIG5hbWUsIHZhbHVlIG9mIGpzb24uY29udGVudFxuICAgIGFzc2VydCBtb2RlbC5jb250ZW50Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gY29udGVudCAnI3sgbmFtZSB9J1wiXG4gICAgbW9kZWwuY29udGVudFtuYW1lXSA9IHZhbHVlXG5cbiAgZm9yIHN0eWxlTmFtZSwgdmFsdWUgb2YganNvbi5zdHlsZXNcbiAgICBtb2RlbC5zdHlsZShzdHlsZU5hbWUsIHZhbHVlKVxuXG4gIGZvciBjb250YWluZXJOYW1lLCBzbmlwcGV0QXJyYXkgb2YganNvbi5jb250YWluZXJzXG4gICAgYXNzZXJ0IG1vZGVsLmNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoY29udGFpbmVyTmFtZSksXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250YWluZXIgI3sgY29udGFpbmVyTmFtZSB9XCJcblxuICAgIGlmIHNuaXBwZXRBcnJheVxuICAgICAgYXNzZXJ0ICQuaXNBcnJheShzbmlwcGV0QXJyYXkpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogY29udGFpbmVyIGlzIG5vdCBhcnJheSAjeyBjb250YWluZXJOYW1lIH1cIlxuICAgICAgZm9yIGNoaWxkIGluIHNuaXBwZXRBcnJheVxuICAgICAgICBtb2RlbC5hcHBlbmQoIGNvbnRhaW5lck5hbWUsIFNuaXBwZXRNb2RlbC5mcm9tSnNvbihjaGlsZCwgZGVzaWduKSApXG5cbiAgbW9kZWxcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuU25pcHBldEFycmF5ID0gcmVxdWlyZSgnLi9zbmlwcGV0X2FycmF5JylcblNuaXBwZXRNb2RlbCA9IHJlcXVpcmUoJy4vc25pcHBldF9tb2RlbCcpXG5cbiMgU25pcHBldFRyZWVcbiMgLS0tLS0tLS0tLS1cbiMgTGl2aW5nZG9jcyBlcXVpdmFsZW50IHRvIHRoZSBET00gdHJlZS5cbiMgQSBzbmlwcGV0IHRyZWUgY29udGFpbmVzIGFsbCB0aGUgc25pcHBldHMgb2YgYSBwYWdlIGluIGhpZXJhcmNoaWNhbCBvcmRlci5cbiNcbiMgVGhlIHJvb3Qgb2YgdGhlIFNuaXBwZXRUcmVlIGlzIGEgU25pcHBldENvbnRhaW5lci4gQSBTbmlwcGV0Q29udGFpbmVyXG4jIGNvbnRhaW5zIGEgbGlzdCBvZiBzbmlwcGV0cy5cbiNcbiMgc25pcHBldHMgY2FuIGhhdmUgbXVsdGlibGUgU25pcHBldENvbnRhaW5lcnMgdGhlbXNlbHZlcy5cbiNcbiMgIyMjIEV4YW1wbGU6XG4jICAgICAtIFNuaXBwZXRDb250YWluZXIgKHJvb3QpXG4jICAgICAgIC0gU25pcHBldCAnSGVybydcbiMgICAgICAgLSBTbmlwcGV0ICcyIENvbHVtbnMnXG4jICAgICAgICAgLSBTbmlwcGV0Q29udGFpbmVyICdtYWluJ1xuIyAgICAgICAgICAgLSBTbmlwcGV0ICdUaXRsZSdcbiMgICAgICAgICAtIFNuaXBwZXRDb250YWluZXIgJ3NpZGViYXInXG4jICAgICAgICAgICAtIFNuaXBwZXQgJ0luZm8tQm94JydcbiNcbiMgIyMjIEV2ZW50czpcbiMgVGhlIGZpcnN0IHNldCBvZiBTbmlwcGV0VHJlZSBFdmVudHMgYXJlIGNvbmNlcm5lZCB3aXRoIGxheW91dCBjaGFuZ2VzIGxpa2VcbiMgYWRkaW5nLCByZW1vdmluZyBvciBtb3Zpbmcgc25pcHBldHMuXG4jXG4jIENvbnNpZGVyOiBIYXZlIGEgZG9jdW1lbnRGcmFnbWVudCBhcyB0aGUgcm9vdE5vZGUgaWYgbm8gcm9vdE5vZGUgaXMgZ2l2ZW5cbiMgbWF5YmUgdGhpcyB3b3VsZCBoZWxwIHNpbXBsaWZ5IHNvbWUgY29kZSAoc2luY2Ugc25pcHBldHMgYXJlIGFsd2F5c1xuIyBhdHRhY2hlZCB0byB0aGUgRE9NKS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldFRyZWVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb250ZW50LCBkZXNpZ24gfSA9IHt9KSAtPlxuICAgIEByb290ID0gbmV3IFNuaXBwZXRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgIyBpbml0aWFsaXplIGNvbnRlbnQgYmVmb3JlIHdlIHNldCB0aGUgc25pcHBldCB0cmVlIHRvIHRoZSByb290XG4gICAgIyBvdGhlcndpc2UgYWxsIHRoZSBldmVudHMgd2lsbCBiZSB0cmlnZ2VyZWQgd2hpbGUgYnVpbGRpbmcgdGhlIHRyZWVcbiAgICBpZiBjb250ZW50PyBhbmQgZGVzaWduP1xuICAgICAgQGZyb21Kc29uKGNvbnRlbnQsIGRlc2lnbilcblxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdGhpc1xuICAgIEBpbml0aWFsaXplRXZlbnRzKClcblxuXG4gICMgaW5zZXJ0IHNuaXBwZXQgYXQgdGhlIGJlZ2lubmluZ1xuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBAcm9vdC5wcmVwZW5kKHNuaXBwZXQpXG4gICAgdGhpc1xuXG5cbiAgIyBpbnNlcnQgc25pcHBldCBhdCB0aGUgZW5kXG4gIGFwcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgQHJvb3QuYXBwZW5kKHNuaXBwZXQpXG4gICAgdGhpc1xuXG5cbiAgaW5pdGlhbGl6ZUV2ZW50czogKCkgLT5cblxuICAgICMgbGF5b3V0IGNoYW5nZXNcbiAgICBAc25pcHBldEFkZGVkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0UmVtb3ZlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldE1vdmVkID0gJC5DYWxsYmFja3MoKVxuXG4gICAgIyBjb250ZW50IGNoYW5nZXNcbiAgICBAc25pcHBldENvbnRlbnRDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0SHRtbENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRTZXR0aW5nc0NoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIHNuaXBwZXQgdHJlZS5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2goY2FsbGJhY2spXG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaENvbnRhaW5lcihjYWxsYmFjaylcblxuXG4gICMgVHJhdmVyc2UgYWxsIGNvbnRhaW5lcnMgYW5kIHNuaXBwZXRzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmFsbChjYWxsYmFjaylcblxuXG4gIGZpbmQ6IChzZWFyY2gpIC0+XG4gICAgaWYgdHlwZW9mIHNlYXJjaCA9PSAnc3RyaW5nJ1xuICAgICAgcmVzID0gW11cbiAgICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgICBpZiBzbmlwcGV0LmlkZW50aWZpZXIgPT0gc2VhcmNoIHx8IHNuaXBwZXQudGVtcGxhdGUuaWQgPT0gc2VhcmNoXG4gICAgICAgICAgcmVzLnB1c2goc25pcHBldClcblxuICAgICAgbmV3IFNuaXBwZXRBcnJheShyZXMpXG4gICAgZWxzZVxuICAgICAgbmV3IFNuaXBwZXRBcnJheSgpXG5cblxuICBkZXRhY2g6IC0+XG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB1bmRlZmluZWRcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIHNuaXBwZXQuc25pcHBldFRyZWUgPSB1bmRlZmluZWRcblxuICAgIG9sZFJvb3QgPSBAcm9vdFxuICAgIEByb290ID0gbmV3IFNuaXBwZXRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgb2xkUm9vdFxuXG5cbiAgIyBlYWNoV2l0aFBhcmVudHM6IChzbmlwcGV0LCBwYXJlbnRzKSAtPlxuICAjICAgcGFyZW50cyB8fD0gW11cblxuICAjICAgIyB0cmF2ZXJzZVxuICAjICAgcGFyZW50cyA9IHBhcmVudHMucHVzaChzbmlwcGV0KVxuICAjICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICMgICAgIHNuaXBwZXQgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgIyAgICAgd2hpbGUgKHNuaXBwZXQpXG4gICMgICAgICAgQGVhY2hXaXRoUGFyZW50cyhzbmlwcGV0LCBwYXJlbnRzKVxuICAjICAgICAgIHNuaXBwZXQgPSBzbmlwcGV0Lm5leHRcblxuICAjICAgcGFyZW50cy5zcGxpY2UoLTEpXG5cblxuICAjIHJldHVybnMgYSByZWFkYWJsZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHdob2xlIHRyZWVcbiAgcHJpbnQ6ICgpIC0+XG4gICAgb3V0cHV0ID0gJ1NuaXBwZXRUcmVlXFxuLS0tLS0tLS0tLS1cXG4nXG5cbiAgICBhZGRMaW5lID0gKHRleHQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIG91dHB1dCArPSBcIiN7IEFycmF5KGluZGVudGF0aW9uICsgMSkuam9pbihcIiBcIikgfSN7IHRleHQgfVxcblwiXG5cbiAgICB3YWxrZXIgPSAoc25pcHBldCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgdGVtcGxhdGUgPSBzbmlwcGV0LnRlbXBsYXRlXG4gICAgICBhZGRMaW5lKFwiLSAjeyB0ZW1wbGF0ZS50aXRsZSB9ICgjeyB0ZW1wbGF0ZS5pZGVudGlmaWVyIH0pXCIsIGluZGVudGF0aW9uKVxuXG4gICAgICAjIHRyYXZlcnNlIGNoaWxkcmVuXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgYWRkTGluZShcIiN7IG5hbWUgfTpcIiwgaW5kZW50YXRpb24gKyAyKVxuICAgICAgICB3YWxrZXIoc25pcHBldENvbnRhaW5lci5maXJzdCwgaW5kZW50YXRpb24gKyA0KSBpZiBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihzbmlwcGV0Lm5leHQsIGluZGVudGF0aW9uKSBpZiBzbmlwcGV0Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCkgaWYgQHJvb3QuZmlyc3RcbiAgICByZXR1cm4gb3V0cHV0XG5cblxuICAjIFRyZWUgQ2hhbmdlIEV2ZW50c1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIFJhaXNlIGV2ZW50cyBmb3IgQWRkLCBSZW1vdmUgYW5kIE1vdmUgb2Ygc25pcHBldHNcbiAgIyBUaGVzZSBmdW5jdGlvbnMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIGJ5IHNuaXBwZXRDb250YWluZXJzXG5cbiAgYXR0YWNoaW5nU25pcHBldDogKHNuaXBwZXQsIGF0dGFjaFNuaXBwZXRGdW5jKSAtPlxuICAgIGlmIHNuaXBwZXQuc25pcHBldFRyZWUgPT0gdGhpc1xuICAgICAgIyBtb3ZlIHNuaXBwZXRcbiAgICAgIGF0dGFjaFNuaXBwZXRGdW5jKClcbiAgICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRNb3ZlZCcsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgaWYgc25pcHBldC5zbmlwcGV0VHJlZT9cbiAgICAgICAgIyByZW1vdmUgZnJvbSBvdGhlciBzbmlwcGV0IHRyZWVcbiAgICAgICAgc25pcHBldC5zbmlwcGV0Q29udGFpbmVyLmRldGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnQpID0+XG4gICAgICAgIGRlc2NlbmRhbnQuc25pcHBldFRyZWUgPSB0aGlzXG5cbiAgICAgIGF0dGFjaFNuaXBwZXRGdW5jKClcbiAgICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRBZGRlZCcsIHNuaXBwZXQpXG5cblxuICBmaXJlRXZlbnQ6IChldmVudCwgYXJncy4uLikgLT5cbiAgICB0aGlzW2V2ZW50XS5maXJlLmFwcGx5KGV2ZW50LCBhcmdzKVxuICAgIEBjaGFuZ2VkLmZpcmUoKVxuXG5cbiAgZGV0YWNoaW5nU25pcHBldDogKHNuaXBwZXQsIGRldGFjaFNuaXBwZXRGdW5jKSAtPlxuICAgIGFzc2VydCBzbmlwcGV0LnNuaXBwZXRUcmVlIGlzIHRoaXMsXG4gICAgICAnY2Fubm90IHJlbW92ZSBzbmlwcGV0IGZyb20gYW5vdGhlciBTbmlwcGV0VHJlZSdcblxuICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50cykgLT5cbiAgICAgIGRlc2NlbmRhbnRzLnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBkZXRhY2hTbmlwcGV0RnVuYygpXG4gICAgQGZpcmVFdmVudCgnc25pcHBldFJlbW92ZWQnLCBzbmlwcGV0KVxuXG5cbiAgY29udGVudENoYW5naW5nOiAoc25pcHBldCkgLT5cbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0Q29udGVudENoYW5nZWQnLCBzbmlwcGV0KVxuXG5cbiAgaHRtbENoYW5naW5nOiAoc25pcHBldCkgLT5cbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0SHRtbENoYW5nZWQnLCBzbmlwcGV0KVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHByaW50SnNvbjogLT5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oQHRvSnNvbigpKVxuXG5cbiAgIyByZXR1cm5zIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICB0b0pzb246IC0+XG4gICAganNvbiA9IHt9XG4gICAganNvblsnY29udGVudCddID0gW11cblxuICAgIHNuaXBwZXRUb0pzb24gPSAoc25pcHBldCwgbGV2ZWwsIGNvbnRhaW5lckFycmF5KSAtPlxuICAgICAgc25pcHBldEpzb24gPSBzbmlwcGV0LnRvSnNvbigpXG4gICAgICBjb250YWluZXJBcnJheS5wdXNoIHNuaXBwZXRKc29uXG5cbiAgICAgIHNuaXBwZXRKc29uXG5cbiAgICB3YWxrZXIgPSAoc25pcHBldCwgbGV2ZWwsIGpzb25PYmopIC0+XG4gICAgICBzbmlwcGV0SnNvbiA9IHNuaXBwZXRUb0pzb24oc25pcHBldCwgbGV2ZWwsIGpzb25PYmopXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjb250YWluZXJBcnJheSA9IHNuaXBwZXRKc29uLmNvbnRhaW5lcnNbc25pcHBldENvbnRhaW5lci5uYW1lXSA9IFtdXG4gICAgICAgIHdhbGtlcihzbmlwcGV0Q29udGFpbmVyLmZpcnN0LCBsZXZlbCArIDEsIGNvbnRhaW5lckFycmF5KSBpZiBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihzbmlwcGV0Lm5leHQsIGxldmVsLCBqc29uT2JqKSBpZiBzbmlwcGV0Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCwgMCwganNvblsnY29udGVudCddKSBpZiBAcm9vdC5maXJzdFxuXG4gICAganNvblxuXG5cbiAgZnJvbUpzb246IChqc29uLCBkZXNpZ24pIC0+XG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB1bmRlZmluZWRcbiAgICBpZiBqc29uLmNvbnRlbnRcbiAgICAgIGZvciBzbmlwcGV0SnNvbiBpbiBqc29uLmNvbnRlbnRcbiAgICAgICAgc25pcHBldCA9IFNuaXBwZXRNb2RlbC5mcm9tSnNvbihzbmlwcGV0SnNvbiwgZGVzaWduKVxuICAgICAgICBAcm9vdC5hcHBlbmQoc25pcHBldClcblxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdGhpc1xuICAgIEByb290LmVhY2ggKHNuaXBwZXQpID0+XG4gICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdGhpc1xuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IG5hbWUsIEB0eXBlLCBAZWxlbSB9KSAtPlxuICAgIEBuYW1lID0gbmFtZSB8fCBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV0uZGVmYXVsdE5hbWVcbiAgICBAY29uZmlnID0gY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdXG4gICAgQG9wdGlvbmFsID0gZmFsc2VcblxuXG4gIHJlbmRlcmVkQXR0cjogLT5cbiAgICBAY29uZmlnLnJlbmRlcmVkQXR0clxuXG5cbiAgaXNFbGVtZW50RGlyZWN0aXZlOiAtPlxuICAgIEBjb25maWcuZWxlbWVudERpcmVjdGl2ZVxuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWQgZnJvbSB0aGVcbiAgIyB0ZW1wbGF0ZSBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3XG4gIGNsb25lOiAtPlxuICAgIG5ld0RpcmVjdGl2ZSA9IG5ldyBEaXJlY3RpdmUobmFtZTogQG5hbWUsIHR5cGU6IEB0eXBlKVxuICAgIG5ld0RpcmVjdGl2ZS5vcHRpb25hbCA9IEBvcHRpb25hbFxuICAgIG5ld0RpcmVjdGl2ZVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxuIyBBIGxpc3Qgb2YgYWxsIGRpcmVjdGl2ZXMgb2YgYSB0ZW1wbGF0ZVxuIyBFdmVyeSBub2RlIHdpdGggYW4gZG9jLSBhdHRyaWJ1dGUgd2lsbCBiZSBzdG9yZWQgYnkgaXRzIHR5cGVcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlQ29sbGVjdGlvblxuXG4gIGNvbnN0cnVjdG9yOiAoQGFsbD17fSkgLT5cbiAgICBAbGVuZ3RoID0gMFxuXG5cbiAgYWRkOiAoZGlyZWN0aXZlKSAtPlxuICAgIEBhc3NlcnROYW1lTm90VXNlZChkaXJlY3RpdmUpXG5cbiAgICAjIGNyZWF0ZSBwc2V1ZG8gYXJyYXlcbiAgICB0aGlzW0BsZW5ndGhdID0gZGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlLmluZGV4ID0gQGxlbmd0aFxuICAgIEBsZW5ndGggKz0gMVxuXG4gICAgIyBpbmRleCBieSBuYW1lXG4gICAgQGFsbFtkaXJlY3RpdmUubmFtZV0gPSBkaXJlY3RpdmVcblxuICAgICMgaW5kZXggYnkgdHlwZVxuICAgICMgZGlyZWN0aXZlLnR5cGUgaXMgb25lIG9mIHRob3NlICdjb250YWluZXInLCAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXSB8fD0gW11cbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXS5wdXNoKGRpcmVjdGl2ZSlcblxuXG4gIG5leHQ6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSB8fD0gQGFsbFtuYW1lXVxuICAgIHRoaXNbZGlyZWN0aXZlLmluZGV4ICs9IDFdXG5cblxuICBuZXh0T2ZUeXBlOiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgfHw9IEBhbGxbbmFtZV1cblxuICAgIHJlcXVpcmVkVHlwZSA9IGRpcmVjdGl2ZS50eXBlXG4gICAgd2hpbGUgZGlyZWN0aXZlID0gQG5leHQoZGlyZWN0aXZlKVxuICAgICAgcmV0dXJuIGRpcmVjdGl2ZSBpZiBkaXJlY3RpdmUudHlwZSBpcyByZXF1aXJlZFR5cGVcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgQGFsbFtuYW1lXVxuXG5cbiAgIyBoZWxwZXIgdG8gZGlyZWN0bHkgZ2V0IGVsZW1lbnQgd3JhcHBlZCBpbiBhIGpRdWVyeSBvYmplY3RcbiAgJGdldEVsZW06IChuYW1lKSAtPlxuICAgICQoQGFsbFtuYW1lXS5lbGVtKVxuXG5cbiAgY291bnQ6ICh0eXBlKSAtPlxuICAgIGlmIHR5cGVcbiAgICAgIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGVsc2VcbiAgICAgIEBsZW5ndGhcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNcbiAgICAgIGNhbGxiYWNrKGRpcmVjdGl2ZSlcblxuXG4gIGNsb25lOiAtPlxuICAgIG5ld0NvbGxlY3Rpb24gPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIG5ld0NvbGxlY3Rpb24uYWRkKGRpcmVjdGl2ZS5jbG9uZSgpKVxuXG4gICAgbmV3Q29sbGVjdGlvblxuXG5cbiAgYXNzZXJ0QWxsTGlua2VkOiAtPlxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGRpcmVjdGl2ZS5lbGVtXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXNzZXJ0TmFtZU5vdFVzZWQ6IChkaXJlY3RpdmUpIC0+XG4gICAgYXNzZXJ0IGRpcmVjdGl2ZSAmJiBub3QgQGFsbFtkaXJlY3RpdmUubmFtZV0sXG4gICAgICBcIlwiXCJcbiAgICAgICN7ZGlyZWN0aXZlLnR5cGV9IFRlbXBsYXRlIHBhcnNpbmcgZXJyb3I6XG4gICAgICAjeyBjb25maWcuZGlyZWN0aXZlc1tkaXJlY3RpdmUudHlwZV0ucmVuZGVyZWRBdHRyIH09XCIjeyBkaXJlY3RpdmUubmFtZSB9XCIuXG4gICAgICBcIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIiBpcyBhIGR1cGxpY2F0ZSBuYW1lLlxuICAgICAgXCJcIlwiXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBwYXJzZTogKGVsZW0pIC0+XG4gICAgZWxlbURpcmVjdGl2ZSA9IHVuZGVmaW5lZFxuICAgIG1vZGlmaWNhdGlvbnMgPSBbXVxuICAgIEBwYXJzZURpcmVjdGl2ZXMgZWxlbSwgKGRpcmVjdGl2ZSkgLT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgICBlbGVtRGlyZWN0aXZlID0gZGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIG1vZGlmaWNhdGlvbnMucHVzaChkaXJlY3RpdmUpXG5cbiAgICBAYXBwbHlNb2RpZmljYXRpb25zKGVsZW1EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIGlmIGVsZW1EaXJlY3RpdmVcbiAgICByZXR1cm4gZWxlbURpcmVjdGl2ZVxuXG5cbiAgcGFyc2VEaXJlY3RpdmVzOiAoZWxlbSwgZnVuYykgLT5cbiAgICBkaXJlY3RpdmVEYXRhID0gW11cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIGF0dHJpYnV0ZU5hbWUgPSBhdHRyLm5hbWVcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0cmlidXRlTmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlRGF0YS5wdXNoXG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogYXR0cmlidXRlTmFtZVxuICAgICAgICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVxuICAgICAgICAgICAgbmFtZTogYXR0ci52YWx1ZVxuICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgICAgZWxlbTogZWxlbVxuXG4gICAgIyBTaW5jZSB3ZSBtb2RpZnkgdGhlIGF0dHJpYnV0ZXMgd2UgaGF2ZSB0byBzcGxpdFxuICAgICMgdGhpcyBpbnRvIHR3byBsb29wc1xuICAgIGZvciBkYXRhIGluIGRpcmVjdGl2ZURhdGFcbiAgICAgIGRpcmVjdGl2ZSA9IGRhdGEuZGlyZWN0aXZlXG4gICAgICBAcmV3cml0ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGRhdGEuYXR0cmlidXRlTmFtZSlcbiAgICAgIGZ1bmMoZGlyZWN0aXZlKVxuXG5cbiAgYXBwbHlNb2RpZmljYXRpb25zOiAobWFpbkRpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIG1vZGlmaWNhdGlvbnNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdvcHRpb25hbCdcbiAgICAgICAgICBtYWluRGlyZWN0aXZlLm9wdGlvbmFsID0gdHJ1ZVxuXG5cbiAgIyBOb3JtYWxpemUgb3IgcmVtb3ZlIHRoZSBhdHRyaWJ1dGVcbiAgIyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICByZXdyaXRlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgaWYgYXR0cmlidXRlTmFtZSAhPSBkaXJlY3RpdmUucmVuZGVyZWRBdHRyKClcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgICBlbHNlIGlmIG5vdCBkaXJlY3RpdmUubmFtZVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSlcbiAgICBlbHNlXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcblxuXG4gICMgZm9yY2UgYXR0cmlidXRlIHN0eWxlIGFzIHNwZWNpZmllZCBpbiBjb25maWdcbiAgIyBlLmcuIGF0dHJpYnV0ZSAnZG9jLWNvbnRhaW5lcicgYmVjb21lcyAnZGF0YS1kb2MtY29udGFpbmVyJ1xuICBub3JtYWxpemVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZWxlbSA9IGRpcmVjdGl2ZS5lbGVtXG4gICAgaWYgYXR0cmlidXRlTmFtZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgZWxlbS5zZXRBdHRyaWJ1dGUoZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpLCBkaXJlY3RpdmUubmFtZSlcblxuXG4gIHJlbW92ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBkaXJlY3RpdmUuZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSlcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gZGlyZWN0aXZlRmluZGVyID0gZG8gLT5cblxuICBhdHRyaWJ1dGVQcmVmaXggPSAvXih4LXxkYXRhLSkvXG5cbiAgbGluazogKGVsZW0sIGRpcmVjdGl2ZUNvbGxlY3Rpb24pIC0+XG4gICAgZm9yIGF0dHIgaW4gZWxlbS5hdHRyaWJ1dGVzXG4gICAgICBub3JtYWxpemVkTmFtZSA9IGF0dHIubmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlID0gZGlyZWN0aXZlQ29sbGVjdGlvbi5nZXQoYXR0ci52YWx1ZSlcbiAgICAgICAgZGlyZWN0aXZlLmVsZW0gPSBlbGVtXG5cbiAgICB1bmRlZmluZWRcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG4jIERpcmVjdGl2ZSBJdGVyYXRvclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgQ29kZSBpcyBwb3J0ZWQgZnJvbSByYW5neSBOb2RlSXRlcmF0b3IgYW5kIGFkYXB0ZWQgZm9yIHNuaXBwZXQgdGVtcGxhdGVzXG4jIHNvIGl0IGRvZXMgbm90IHRyYXZlcnNlIGludG8gY29udGFpbmVycy5cbiNcbiMgVXNlIHRvIHRyYXZlcnNlIGFsbCBub2RlcyBvZiBhIHRlbXBsYXRlLiBUaGUgaXRlcmF0b3IgZG9lcyBub3QgZ28gaW50b1xuIyBjb250YWluZXJzIGFuZCBpcyBzYWZlIHRvIHVzZSBldmVuIGlmIHRoZXJlIGlzIGNvbnRlbnQgaW4gdGhlc2UgY29udGFpbmVycy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlSXRlcmF0b3JcblxuICBjb25zdHJ1Y3RvcjogKHJvb3QpIC0+XG4gICAgQHJvb3QgPSBAX25leHQgPSByb290XG4gICAgQGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cblxuICBjdXJyZW50OiBudWxsXG5cblxuICBoYXNOZXh0OiAtPlxuICAgICEhQF9uZXh0XG5cblxuICBuZXh0OiAoKSAtPlxuICAgIG4gPSBAY3VycmVudCA9IEBfbmV4dFxuICAgIGNoaWxkID0gbmV4dCA9IHVuZGVmaW5lZFxuICAgIGlmIEBjdXJyZW50XG4gICAgICBjaGlsZCA9IG4uZmlyc3RDaGlsZFxuICAgICAgaWYgY2hpbGQgJiYgbi5ub2RlVHlwZSA9PSAxICYmICFuLmhhc0F0dHJpYnV0ZShAY29udGFpbmVyQXR0cilcbiAgICAgICAgQF9uZXh0ID0gY2hpbGRcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dCA9IG51bGxcbiAgICAgICAgd2hpbGUgKG4gIT0gQHJvb3QpICYmICEobmV4dCA9IG4ubmV4dFNpYmxpbmcpXG4gICAgICAgICAgbiA9IG4ucGFyZW50Tm9kZVxuXG4gICAgICAgIEBfbmV4dCA9IG5leHRcblxuICAgIEBjdXJyZW50XG5cblxuICAjIG9ubHkgaXRlcmF0ZSBvdmVyIGVsZW1lbnQgbm9kZXMgKE5vZGUuRUxFTUVOVF9OT0RFID09IDEpXG4gIG5leHRFbGVtZW50OiAoKSAtPlxuICAgIHdoaWxlIEBuZXh0KClcbiAgICAgIGJyZWFrIGlmIEBjdXJyZW50Lm5vZGVUeXBlID09IDFcblxuICAgIEBjdXJyZW50XG5cblxuICBkZXRhY2g6ICgpIC0+XG4gICAgQGN1cnJlbnQgPSBAX25leHQgPSBAcm9vdCA9IG51bGxcblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5cbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG5EaXJlY3RpdmVJdGVyYXRvciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2l0ZXJhdG9yJylcbkRpcmVjdGl2ZUNvbGxlY3Rpb24gPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb2xsZWN0aW9uJylcbmRpcmVjdGl2ZUNvbXBpbGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfY29tcGlsZXInKVxuZGlyZWN0aXZlRmluZGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfZmluZGVyJylcblxuU25pcHBldE1vZGVsID0gcmVxdWlyZSgnLi4vc25pcHBldF90cmVlL3NuaXBwZXRfbW9kZWwnKVxuU25pcHBldFZpZXcgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmcvc25pcHBldF92aWV3JylcblxuIyBUZW1wbGF0ZVxuIyAtLS0tLS0tLVxuIyBQYXJzZXMgc25pcHBldCB0ZW1wbGF0ZXMgYW5kIGNyZWF0ZXMgU25pcHBldE1vZGVscyBhbmQgU25pcHBldFZpZXdzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUZW1wbGF0ZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGh0bWwsIEBuYW1lc3BhY2UsIEBpZCwgaWRlbnRpZmllciwgdGl0bGUsIHN0eWxlcywgd2VpZ2h0IH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgaHRtbCwgJ1RlbXBsYXRlOiBwYXJhbSBodG1sIG1pc3NpbmcnXG5cbiAgICBpZiBpZGVudGlmaWVyXG4gICAgICB7IEBuYW1lc3BhY2UsIEBpZCB9ID0gVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyKGlkZW50aWZpZXIpXG5cbiAgICBAaWRlbnRpZmllciA9IGlmIEBuYW1lc3BhY2UgJiYgQGlkXG4gICAgICBcIiN7IEBuYW1lc3BhY2UgfS4jeyBAaWQgfVwiXG5cbiAgICBAJHRlbXBsYXRlID0gJCggQHBydW5lSHRtbChodG1sKSApLndyYXAoJzxkaXY+JylcbiAgICBAJHdyYXAgPSBAJHRlbXBsYXRlLnBhcmVudCgpXG5cbiAgICBAdGl0bGUgPSB0aXRsZSB8fCB3b3Jkcy5odW1hbml6ZSggQGlkIClcbiAgICBAc3R5bGVzID0gc3R5bGVzIHx8IHt9XG4gICAgQHdlaWdodCA9IHdlaWdodFxuICAgIEBkZWZhdWx0cyA9IHt9XG5cbiAgICBAcGFyc2VUZW1wbGF0ZSgpXG5cblxuICAjIGNyZWF0ZSBhIG5ldyBTbmlwcGV0TW9kZWwgaW5zdGFuY2UgZnJvbSB0aGlzIHRlbXBsYXRlXG4gIGNyZWF0ZU1vZGVsOiAoKSAtPlxuICAgIG5ldyBTbmlwcGV0TW9kZWwodGVtcGxhdGU6IHRoaXMpXG5cblxuICBjcmVhdGVWaWV3OiAoc25pcHBldE1vZGVsLCBpc1JlYWRPbmx5KSAtPlxuICAgIHNuaXBwZXRNb2RlbCB8fD0gQGNyZWF0ZU1vZGVsKClcbiAgICAkZWxlbSA9IEAkdGVtcGxhdGUuY2xvbmUoKVxuICAgIGRpcmVjdGl2ZXMgPSBAbGlua0RpcmVjdGl2ZXMoJGVsZW1bMF0pXG5cbiAgICBzbmlwcGV0VmlldyA9IG5ldyBTbmlwcGV0Vmlld1xuICAgICAgbW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgJGh0bWw6ICRlbGVtXG4gICAgICBkaXJlY3RpdmVzOiBkaXJlY3RpdmVzXG4gICAgICBpc1JlYWRPbmx5OiBpc1JlYWRPbmx5XG5cblxuICBwcnVuZUh0bWw6IChodG1sKSAtPlxuXG4gICAgIyByZW1vdmUgYWxsIGNvbW1lbnRzXG4gICAgaHRtbCA9ICQoaHRtbCkuZmlsdGVyIChpbmRleCkgLT5cbiAgICAgIEBub2RlVHlwZSAhPThcblxuICAgICMgb25seSBhbGxvdyBvbmUgcm9vdCBlbGVtZW50XG4gICAgYXNzZXJ0IGh0bWwubGVuZ3RoID09IDEsIFwiVGVtcGxhdGVzIG11c3QgY29udGFpbiBvbmUgcm9vdCBlbGVtZW50LiBUaGUgVGVtcGxhdGUgXFxcIiN7QGlkZW50aWZpZXJ9XFxcIiBjb250YWlucyAjeyBodG1sLmxlbmd0aCB9XCJcblxuICAgIGh0bWxcblxuICBwYXJzZVRlbXBsYXRlOiAoKSAtPlxuICAgIGVsZW0gPSBAJHRlbXBsYXRlWzBdXG4gICAgQGRpcmVjdGl2ZXMgPSBAY29tcGlsZURpcmVjdGl2ZXMoZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdlZGl0YWJsZSdcbiAgICAgICAgICBAZm9ybWF0RWRpdGFibGUoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgICAgQGZvcm1hdENvbnRhaW5lcihkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2h0bWwnXG4gICAgICAgICAgQGZvcm1hdEh0bWwoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuXG5cbiAgIyBJbiB0aGUgaHRtbCBvZiB0aGUgdGVtcGxhdGUgZmluZCBhbmQgc3RvcmUgYWxsIERPTSBub2Rlc1xuICAjIHdoaWNoIGFyZSBkaXJlY3RpdmVzIChlLmcuIGVkaXRhYmxlcyBvciBjb250YWluZXJzKS5cbiAgY29tcGlsZURpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgZGlyZWN0aXZlcyA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb21waWxlci5wYXJzZShlbGVtKVxuICAgICAgZGlyZWN0aXZlcy5hZGQoZGlyZWN0aXZlKSBpZiBkaXJlY3RpdmVcblxuICAgIGRpcmVjdGl2ZXNcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBTbmlwcGV0VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkXG4gICMgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlldy5cbiAgbGlua0RpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgc25pcHBldERpcmVjdGl2ZXMgPSBAZGlyZWN0aXZlcy5jbG9uZSgpXG5cbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgZGlyZWN0aXZlRmluZGVyLmxpbmsoZWxlbSwgc25pcHBldERpcmVjdGl2ZXMpXG5cbiAgICBzbmlwcGV0RGlyZWN0aXZlc1xuXG5cbiAgZm9ybWF0RWRpdGFibGU6IChuYW1lLCBlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5odG1sLmNzcy5lZGl0YWJsZSlcblxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gZGVmYXVsdFZhbHVlIGlmIGRlZmF1bHRWYWx1ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdENvbnRhaW5lcjogKG5hbWUsIGVsZW0pIC0+XG4gICAgIyByZW1vdmUgYWxsIGNvbnRlbnQgZnJvbiBhIGNvbnRhaW5lciBmcm9tIHRoZSB0ZW1wbGF0ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdEh0bWw6IChuYW1lLCBlbGVtKSAtPlxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gZGVmYXVsdFZhbHVlIGlmIGRlZmF1bHRWYWx1ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gICMgb3V0cHV0IHRoZSBhY2NlcHRlZCBjb250ZW50IG9mIHRoZSBzbmlwcGV0XG4gICMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGNyZWF0ZVxuICAjIGUuZzogeyB0aXRsZTogXCJJdGNoeSBhbmQgU2NyYXRjaHlcIiB9XG4gIHByaW50RG9jOiAoKSAtPlxuICAgIGRvYyA9XG4gICAgICBpZGVudGlmaWVyOiBAaWRlbnRpZmllclxuICAgICAgIyBlZGl0YWJsZXM6IE9iamVjdC5rZXlzIEBlZGl0YWJsZXMgaWYgQGVkaXRhYmxlc1xuICAgICAgIyBjb250YWluZXJzOiBPYmplY3Qua2V5cyBAY29udGFpbmVycyBpZiBAY29udGFpbmVyc1xuXG4gICAgd29yZHMucmVhZGFibGVKc29uKGRvYylcblxuXG4jIFN0YXRpYyBmdW5jdGlvbnNcbiMgLS0tLS0tLS0tLS0tLS0tLVxuXG5UZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIgPSAoaWRlbnRpZmllcikgLT5cbiAgcmV0dXJuIHVubGVzcyBpZGVudGlmaWVyICMgc2lsZW50bHkgZmFpbCBvbiB1bmRlZmluZWQgb3IgZW1wdHkgc3RyaW5nc1xuXG4gIHBhcnRzID0gaWRlbnRpZmllci5zcGxpdCgnLicpXG4gIGlmIHBhcnRzLmxlbmd0aCA9PSAxXG4gICAgeyBuYW1lc3BhY2U6IHVuZGVmaW5lZCwgaWQ6IHBhcnRzWzBdIH1cbiAgZWxzZSBpZiBwYXJ0cy5sZW5ndGggPT0gMlxuICAgIHsgbmFtZXNwYWNlOiBwYXJ0c1swXSwgaWQ6IHBhcnRzWzFdIH1cbiAgZWxzZVxuICAgIGxvZy5lcnJvcihcImNvdWxkIG5vdCBwYXJzZSBzbmlwcGV0IHRlbXBsYXRlIGlkZW50aWZpZXI6ICN7IGlkZW50aWZpZXIgfVwiKVxuIl19
