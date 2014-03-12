require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Kickstart, SnippetArray, chainable, chainableProxy, document, pageReady, setupApi, stash, words;

chainableProxy = require('./modules/chainable_proxy');

words = require('./modules/words');

stash = require('./modules/stash');

document = require('./document');

Kickstart = require('./kickstart/kickstart');

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


},{"./document":5,"./kickstart/kickstart":13,"./modules/chainable_proxy":14,"./modules/stash":23,"./modules/words":24,"./snippet_tree/snippet_array":31}],2:[function(require,module,exports){
var config, enrichConfig;

module.exports = config = (function() {
  return {
    wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?",
    singleLineBreak: /^<br\s*\/?>\s*$/,
    zeroWidthCharacter: '\ufeff',
    attributePrefix: 'data',
    css: {
      section: 'doc-section',
      snippet: 'doc-snippet',
      editable: 'doc-editable',
      emptyImage: 'doc-image-empty',
      "interface": 'doc-ui',
      snippetHighlight: 'doc-snippet-highlight',
      containerHighlight: 'doc-container-highlight',
      dragged: 'doc-dragged',
      draggedPlaceholder: 'doc-dragged-placeholder',
      draggedPlaceholderCounter: 'doc-drag-counter',
      dropMarker: 'doc-drop-marker',
      beforeDrop: 'doc-before-drop',
      noDrop: 'doc-drag-no-drop',
      afterDrop: 'doc-after-drop',
      longpressIndicator: 'doc-longpress-indicator',
      preventSelection: 'doc-no-selection',
      maximizedContainer: 'doc-js-maximized-container',
      interactionBlocker: 'doc-interaction-blocker'
    },
    attr: {
      template: 'data-doc-template',
      placeholder: 'data-doc-placeholder'
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
    }
  };
})();

enrichConfig = function() {
  var name, prefix, value, _ref, _results;
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
    this.paragraphSnippet = (config != null ? config.paragraph : void 0) || 'text';
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
        design: this.design,
        snippetTree: this.snippetTree
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
var config, css;

config = require('../configuration/defaults');

css = config.css;

module.exports = (function() {
  var sectionRegex, snippetRegex;
  snippetRegex = new RegExp("(?: |^)" + css.snippet + "(?: |$)");
  sectionRegex = new RegExp("(?: |^)" + css.section + "(?: |$)");
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
      var closestSnippetData, containerAttr, left, top;
      top = _arg.top, left = _arg.left;
      node = this.getElementNode(node);
      containerAttr = config.directives.container.renderedAttr;
      while (node && node.nodeType === 1) {
        if (node.hasAttribute(containerAttr)) {
          closestSnippetData = this.getClosestSnippet(node, {
            top: top,
            left: left
          });
          if (closestSnippetData != null) {
            return this.getClosestSnippetTarget(closestSnippetData);
          } else {
            return this.getContainerTarget(node);
          }
        } else if (snippetRegex.test(node.className)) {
          return this.getSnippetTarget(node, {
            top: top,
            left: left
          });
        } else if (sectionRegex.test(node.className)) {
          closestSnippetData = this.getClosestSnippet(node, {
            top: top,
            left: left
          });
          if (closestSnippetData != null) {
            return this.getClosestSnippetTarget(closestSnippetData);
          } else {
            return this.getRootTarget(node);
          }
        }
        node = node.parentNode;
      }
    },
    getSnippetTarget: function(elem, _arg) {
      var left, position, top;
      top = _arg.top, left = _arg.left, position = _arg.position;
      return {
        target: 'snippet',
        snippetView: this.getSnippetView(elem),
        position: position || this.getPositionOnSnippet(elem, {
          top: top,
          left: left
        })
      };
    },
    getClosestSnippetTarget: function(closestSnippetData) {
      var elem, position;
      elem = closestSnippetData.$elem[0];
      position = closestSnippetData.position;
      return this.getSnippetTarget(elem, {
        position: position
      });
    },
    getContainerTarget: function(node) {
      var containerAttr, containerName;
      containerAttr = config.directives.container.renderedAttr;
      containerName = node.getAttribute(containerAttr);
      return {
        target: 'container',
        node: node,
        snippetView: this.findSnippetView(node),
        containerName: containerName
      };
    },
    getRootTarget: function(node) {
      var snippetTree;
      snippetTree = $(node).data('snippetTree');
      return {
        target: 'root',
        node: node,
        snippetTree: snippetTree
      };
    },
    getPositionOnSnippet: function(elem, _arg) {
      var $elem, elemBottom, elemHeight, elemTop, left, top;
      top = _arg.top, left = _arg.left;
      $elem = $(elem);
      elemTop = $elem.offset().top;
      elemHeight = $elem.outerHeight();
      elemBottom = elemTop + elemHeight;
      if (this.distance(top, elemTop) < this.distance(top, elemBottom)) {
        return 'before';
      } else {
        return 'after';
      }
    },
    getClosestSnippet: function(container, _arg) {
      var $snippets, closest, closestSnippet, left, top;
      top = _arg.top, left = _arg.left;
      $snippets = $(container).find("." + css.snippet);
      closest = void 0;
      closestSnippet = void 0;
      $snippets.each((function(_this) {
        return function(index, elem) {
          var $elem, elemBottom, elemHeight, elemTop;
          $elem = $(elem);
          elemTop = $elem.offset().top;
          elemHeight = $elem.outerHeight();
          elemBottom = elemTop + elemHeight;
          if ((closest == null) || _this.distance(top, elemTop) < closest) {
            closest = _this.distance(top, elemTop);
            closestSnippet = {
              $elem: $elem,
              position: 'before'
            };
          }
          if ((closest == null) || _this.distance(top, elemBottom) < closest) {
            closest = _this.distance(top, elemBottom);
            return closestSnippet = {
              $elem: $elem,
              position: 'after'
            };
          }
        };
      })(this));
      return closestSnippet;
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
          if ($elem.hasClass(css.maximizedContainer)) {
            continue;
          }
          $parent = $elem.parent();
          parentHeight = $parent.height();
          outer = $elem.outerHeight(true) - $elem.height();
          $elem.height(parentHeight - outer);
          _results.push($elem.addClass(css.maximizedContainer));
        }
        return _results;
      }
    },
    restoreContainerHeight: function() {
      return $("." + css.maximizedContainer).css('height', '').removeClass(css.maximizedContainer);
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
var DragBase, config;

config = require('../configuration/defaults');

module.exports = DragBase = (function() {
  function DragBase(page, options) {
    var defaultConfig;
    this.page = page;
    this.modes = ['direct', 'longpress', 'move'];
    defaultConfig = {
      preventDefault: false,
      onDragStart: void 0,
      scrollArea: 50,
      longpress: {
        showIndicator: true,
        delay: 400,
        tolerance: 3
      },
      move: {
        distance: 0
      }
    };
    this.defaultConfig = $.extend(true, defaultConfig, options);
    this.startPoint = void 0;
    this.dragHandler = void 0;
    this.initialized = false;
    this.started = false;
  }

  DragBase.prototype.setOptions = function(options) {
    this.options = $.extend(true, {}, this.defaultConfig, options);
    return this.mode = options.direct != null ? 'direct' : options.longpress != null ? 'longpress' : options.move != null ? 'move' : 'longpress';
  };

  DragBase.prototype.setDragHandler = function(dragHandler) {
    this.dragHandler = dragHandler;
    return this.dragHandler.page = this.page;
  };

  DragBase.prototype.init = function(dragHandler, event, options) {
    this.reset();
    this.initialized = true;
    this.setOptions(options);
    this.setDragHandler(dragHandler);
    this.startPoint = this.getTopLeft(event);
    this.addStopListeners(event);
    this.addMoveListeners(event);
    if (this.mode === 'longpress') {
      this.addLongpressIndicator(this.startPoint);
      this.timeout = setTimeout((function(_this) {
        return function() {
          _this.removeLongpressIndicator();
          return _this.start(_this.startPoint);
        };
      })(this), this.options.longpress.delay);
    } else if (this.mode === 'direct') {
      this.start(this.startPoint);
    }
    if (this.options.preventDefault) {
      return event.preventDefault();
    }
  };

  DragBase.prototype.move = function(topLeft) {
    if (this.mode === 'longpress') {
      if (this.distance(topLeft, this.startPoint) > this.options.longpress.tolerance) {
        return this.reset();
      }
    } else if (this.mode === 'move') {
      if (this.distance(topLeft, this.startPoint) > this.options.move.distance) {
        return this.start(topLeft);
      }
    }
  };

  DragBase.prototype.start = function(topLeft) {
    this.started = true;
    this.page.$body.addClass(config.css.preventSelection);
    return this.dragHandler.start(topLeft);
  };

  DragBase.prototype.drop = function() {
    if (this.started) {
      this.dragHandler.drop();
    }
    return this.reset();
  };

  DragBase.prototype.reset = function() {
    if (this.started) {
      this.started = false;
      this.page.$body.removeClass(config.css.preventSelection);
    }
    if (this.initialized) {
      this.initialized = false;
      this.startPoint = void 0;
      this.dragHandler.reset();
      this.dragHandler = void 0;
      if (this.timeout != null) {
        clearTimeout(this.timeout);
        this.timeout = void 0;
      }
      this.page.$document.off('.livingdocs-drag');
      return this.removeLongpressIndicator();
    }
  };

  DragBase.prototype.addLongpressIndicator = function(_arg) {
    var $indicator, left, top;
    top = _arg.top, left = _arg.left;
    if (!this.options.longpress.showIndicator) {
      return;
    }
    $indicator = $("<div class=\"" + config.css.longpressIndicator + "\"><div></div></div>");
    $indicator.css({
      top: top,
      left: left
    });
    return this.page.$body.append($indicator);
  };

  DragBase.prototype.removeLongpressIndicator = function() {
    return this.page.$body.find("." + config.css.longpressIndicator).remove();
  };

  DragBase.prototype.addStopListeners = function(event) {
    var eventNames;
    eventNames = event.type === 'touchstart' ? 'touchend.livingdocs-drag touchcancel.livingdocs-drag touchleave.livingdocs-drag' : 'mouseup.livingdocs-drag';
    return this.page.$document.on(eventNames, (function(_this) {
      return function() {
        return _this.drop();
      };
    })(this));
  };

  DragBase.prototype.addMoveListeners = function(event) {
    if (event.type === 'touchstart') {
      return this.page.$document.on('touchmove.livingdocs-drag', (function(_this) {
        return function(event) {
          event.preventDefault();
          if (_this.started) {
            return _this.dragHandler.move(_this.getTopLeft(event), event);
          } else {
            return _this.move(_this.getTopLeft(event));
          }
        };
      })(this));
    } else {
      return this.page.$document.on('mousemove.livingdocs-drag', (function(_this) {
        return function(event) {
          if (_this.started) {
            return _this.dragHandler.move(_this.getTopLeft(event), event);
          } else {
            return _this.move(_this.getTopLeft(event));
          }
        };
      })(this));
    }
  };

  DragBase.prototype.getTopLeft = function(event) {
    if (event.type === 'touchstart' || event.type === 'touchmove') {
      return {
        'top': event.originalEvent.changedTouches[0].pageY,
        'left': event.originalEvent.changedTouches[0].pageX
      };
    } else {
      return {
        'top': event.pageY,
        'left': event.pageX
      };
    }
  };

  DragBase.prototype.getTopLeftFixed = function(event) {
    if (event.type === 'touchstart' || event.type === 'touchmove') {
      return {
        'top': event.originalEvent.changedTouches[0].clientY,
        'left': event.originalEvent.changedTouches[0].clientX
      };
    } else {
      return {
        'top': event.clientY,
        'left': event.clientX
      };
    }
  };

  DragBase.prototype.distance = function(pointA, pointB) {
    var distX, distY;
    if (!pointA || !pointB) {
      return void 0;
    }
    distX = pointA.left - pointB.left;
    distY = pointA.top - pointB.top;
    return Math.sqrt((distX * distX) + (distY * distY));
  };

  return DragBase;

})();


},{"../configuration/defaults":2}],8:[function(require,module,exports){
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
      snippetName = this.page.design.paragraphSnippet;
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
var SnippetDrag, config, css, dom;

dom = require('./dom');

config = require('../configuration/defaults');

css = config.css;

module.exports = SnippetDrag = (function() {
  var startAndEndOffset, wiggleSpace;

  wiggleSpace = 0;

  startAndEndOffset = 0;

  function SnippetDrag(_arg) {
    var snippetView;
    this.snippetModel = _arg.snippetModel, snippetView = _arg.snippetView;
    if (snippetView) {
      this.$view = snippetView.$html;
    }
    this.$highlightedContainer = {};
  }

  SnippetDrag.prototype.start = function(_arg) {
    var left, top;
    top = _arg.top, left = _arg.left;
    this.started = true;
    this.page.editableController.disableAll();
    this.page.blurFocusedElement();
    this.$placeholder = this.createPlaceholder();
    this.$dropMarker = $("<div class='" + css.dropMarker + "'>");
    this.page.$body.append(this.$dropMarker).append(this.$placeholder).css('cursor', 'pointer');
    if (this.$view != null) {
      this.$view.addClass(css.dragged);
    }
    return this.move({
      top: top,
      left: left
    });
  };

  SnippetDrag.prototype.move = function(_arg) {
    var left, top;
    top = _arg.top, left = _arg.left;
    if (left < 2) {
      left = 2;
    }
    if (top < 2) {
      top = 2;
    }
    this.$placeholder.css({
      top: "" + top + "px",
      left: "" + left + "px"
    });
    return this.target = this.findDropTarget({
      top: top,
      left: left,
      event: event
    });
  };

  SnippetDrag.prototype.findDropTarget = function(_arg) {
    var elem, event, left, target, top, _ref;
    top = _arg.top, left = _arg.left, event = _arg.event;
    elem = this.getElemUnderCursor(top, left);
    if (elem === this.$dropMarker[0]) {
      return this.target;
    }
    if (elem != null) {
      target = dom.dropTarget(elem, {
        top: top,
        left: left
      });
    }
    this.undoMakeSpace();
    if ((target != null) && ((_ref = target.snippetView) != null ? _ref.model : void 0) !== this.snippetModel) {
      this.$placeholder.removeClass(css.noDrop);
      this.markDropPosition(target);
      return target;
    } else {
      this.$dropMarker.hide();
      this.removeContainerHighlight();
      if (target == null) {
        this.$placeholder.addClass(css.noDrop);
      } else {
        this.$placeholder.removeClass(css.noDrop);
      }
      return void 0;
    }
  };

  SnippetDrag.prototype.markDropPosition = function(target) {
    switch (target.target) {
      case 'snippet':
        this.snippetPosition(target);
        return this.removeContainerHighlight();
      case 'container':
        this.showMarkerAtBeginningOfContainer(target.node);
        return this.highlighContainer($(target.node));
      case 'root':
        this.showMarkerAtBeginningOfContainer(target.node);
        return this.highlighContainer($(target.node));
    }
  };

  SnippetDrag.prototype.snippetPosition = function(target) {
    var before, next;
    if (target.position === 'before') {
      before = target.snippetView.prev();
      if (before != null) {
        if (before.model === this.snippetModel) {
          target.position = 'after';
          return this.snippetPosition(target);
        }
        return this.showMarkerBetweenSnippets(before, target.snippetView);
      } else {
        return this.showMarkerAtBeginningOfContainer(target.snippetView.$elem[0].parentNode);
      }
    } else {
      next = target.snippetView.next();
      if (next != null) {
        if (next.model === this.snippetModel) {
          target.position = 'before';
          return this.snippetPosition(target);
        }
        return this.showMarkerBetweenSnippets(target.snippetView, next);
      } else {
        return this.showMarkerAtEndOfContainer(target.snippetView.$elem[0].parentNode);
      }
    }
  };

  SnippetDrag.prototype.showMarkerBetweenSnippets = function(viewA, viewB) {
    var boxA, boxB, halfGap;
    boxA = dom.getBoundingClientRect(viewA.$elem[0]);
    boxB = dom.getBoundingClientRect(viewB.$elem[0]);
    halfGap = boxB.top > boxA.bottom ? (boxB.top - boxA.bottom) / 2 : 0;
    return this.showMarker({
      left: boxA.left,
      top: boxA.bottom + halfGap,
      width: boxA.width
    });
  };

  SnippetDrag.prototype.showMarkerAtBeginningOfContainer = function(elem) {
    var box;
    if (elem == null) {
      return;
    }
    this.makeSpace(elem.firstChild, 'top');
    box = dom.getBoundingClientRect(elem);
    return this.showMarker({
      left: box.left,
      top: box.top + startAndEndOffset,
      width: box.width
    });
  };

  SnippetDrag.prototype.showMarkerAtEndOfContainer = function(elem) {
    var box;
    if (elem == null) {
      return;
    }
    this.makeSpace(elem.lastChild, 'bottom');
    box = dom.getBoundingClientRect(elem);
    return this.showMarker({
      left: box.left,
      top: box.bottom - startAndEndOffset,
      width: box.width
    });
  };

  SnippetDrag.prototype.showMarker = function(_arg) {
    var left, top, width;
    top = _arg.top, left = _arg.left, width = _arg.width;
    return this.$dropMarker.css({
      left: "" + left + "px",
      top: "" + top + "px",
      width: "" + width + "px"
    }).show();
  };

  SnippetDrag.prototype.makeSpace = function(node, position) {
    var $node;
    if (!((node != null) && wiggleSpace)) {
      return;
    }
    $node = $(node);
    this.lastTransform = $node;
    if (position === 'top') {
      return $node.css({
        transform: "translate(0, " + wiggleSpace + "px)"
      });
    } else {
      return $node.css({
        transform: "translate(0, -" + wiggleSpace + "px)"
      });
    }
  };

  SnippetDrag.prototype.undoMakeSpace = function(node) {
    if (this.lastTransform != null) {
      this.lastTransform.css({
        transform: ''
      });
      return this.lastTransform = void 0;
    }
  };

  SnippetDrag.prototype.highlighContainer = function($container) {
    var _base, _base1;
    if ($container[0] !== this.$highlightedContainer[0]) {
      if (typeof (_base = this.$highlightedContainer).removeClass === "function") {
        _base.removeClass(css.containerHighlight);
      }
      this.$highlightedContainer = $container;
      return typeof (_base1 = this.$highlightedContainer).addClass === "function" ? _base1.addClass(css.containerHighlight) : void 0;
    }
  };

  SnippetDrag.prototype.removeContainerHighlight = function() {
    var _base;
    if (typeof (_base = this.$highlightedContainer).removeClass === "function") {
      _base.removeClass(css.containerHighlight);
    }
    return this.$highlightedContainer = {};
  };

  SnippetDrag.prototype.getElemUnderCursor = function(top, left) {
    var elem;
    top = top - this.page.$body.scrollTop();
    left = left - this.page.$body.scrollLeft();
    this.$placeholder.hide();
    elem = this.page.document.elementFromPoint(left, top);
    this.$placeholder.show();
    return elem;
  };

  SnippetDrag.prototype.drop = function() {
    if (this.target != null) {
      this.moveToTarget(this.target);
      return this.page.snippetWasDropped.fire(this.snippetModel);
    } else {

    }
  };

  SnippetDrag.prototype.moveToTarget = function(target) {
    var snippetModel, snippetTree, snippetView;
    switch (target.target) {
      case 'snippet':
        snippetView = target.snippetView;
        if (target.position === 'before') {
          return snippetView.model.before(this.snippetModel);
        } else {
          return snippetView.model.after(this.snippetModel);
        }
        break;
      case 'container':
        snippetModel = target.snippetView.model;
        return snippetModel.append(target.containerName, this.snippetModel);
      case 'root':
        snippetTree = target.snippetTree;
        return snippetTree.prepend(this.snippetModel);
    }
  };

  SnippetDrag.prototype.reset = function() {
    if (this.started) {
      this.undoMakeSpace();
      this.removeContainerHighlight();
      this.page.$body.css('cursor', '');
      this.page.editableController.reenableAll();
      if (this.$view != null) {
        this.$view.removeClass(css.dragged);
      }
      dom.restoreContainerHeight();
      this.$placeholder.remove();
      return this.$dropMarker.remove();
    }
  };

  SnippetDrag.prototype.createPlaceholder = function() {
    var $placeholder, numberOfDraggedElems, template;
    numberOfDraggedElems = 1;
    template = "<div class=\"" + css.draggedPlaceholder + "\">\n  <span class=\"" + css.draggedPlaceholderCounter + "\">\n    " + numberOfDraggedElems + "\n  </span>\n  Selected Item\n</div>";
    return $placeholder = $(template).css({
      position: "absolute"
    });
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
var DirectiveIterator, SnippetView, attr, config, css, dom, eventing;

config = require('../configuration/defaults');

css = config.css;

attr = config.attr;

DirectiveIterator = require('../template/directive_iterator');

eventing = require('../modules/eventing');

dom = require('../interaction/dom');

module.exports = SnippetView = (function() {
  function SnippetView(_arg) {
    this.model = _arg.model, this.$html = _arg.$html, this.directives = _arg.directives, this.isReadOnly = _arg.isReadOnly;
    this.$elem = this.$html;
    this.template = this.model.template;
    this.isAttachedToDom = false;
    this.wasAttachedToDom = $.Callbacks();
    if (!this.isReadOnly) {
      this.$html.data('snippet', this).addClass(css.snippet).attr(attr.template, this.template.identifier);
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
    this.$html.addClass(css.snippetHighlight);
    return this.showOptionals();
  };

  SnippetView.prototype.afterBlurred = function() {
    this.$html.removeClass(css.snippetHighlight);
    return this.hideEmptyOptionals();
  };

  SnippetView.prototype.focus = function(cursor) {
    var first, _ref;
    first = (_ref = this.directives.editable) != null ? _ref[0].elem : void 0;
    return $(first).focus();
  };

  SnippetView.prototype.hasFocus = function() {
    return this.$html.hasClass(css.snippetHighlight);
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
    $elem.attr(attr.placeholder, placeholder);
    return $elem.html(value || '');
  };

  SnippetView.prototype.focusEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.attr(attr.placeholder, config.zeroWidthCharacter);
  };

  SnippetView.prototype.blurEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    if (this.model.isEmpty(name)) {
      return $elem.attr(attr.placeholder, this.template.defaults[name]);
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
      this.setImageAttribute($elem, value);
      return $elem.removeClass(config.css.emptyImage);
    } else {
      setPlaceholder = $.proxy(this.setPlaceholderImage, this, $elem);
      return this.delayUntilAttached(name, setPlaceholder);
    }
  };

  SnippetView.prototype.setImageAttribute = function($elem, value) {
    if ($elem[0].nodeName === 'IMG') {
      return $elem.attr('src', value);
    } else {
      return $elem.css('background-image', "url(" + (this.escapeCssUri(value)) + ")");
    }
  };

  SnippetView.prototype.escapeCssUri = function(uri) {
    if (/[()]/.test(uri)) {
      return "'" + uri + "'";
    } else {
      return uri;
    }
  };

  SnippetView.prototype.setPlaceholderImage = function($elem) {
    var height, value, width;
    $elem.addClass(config.css.emptyImage);
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
    $blocker = $("<div class='" + css.interactionBlocker + "'>").attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;');
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
var DragBase, EditableController, Focus, InteractivePage, Page, SnippetDrag, config, dom,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

config = require('../configuration/defaults');

Page = require('./page');

dom = require('../interaction/dom');

Focus = require('../interaction/focus');

EditableController = require('../interaction/editable_controller');

DragBase = require('../interaction/drag_base');

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
    this.dragBase = new DragBase(this);
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
    if (!snippetView) {
      return;
    }
    return this.startDrag({
      snippetView: snippetView,
      event: event
    });
  };

  InteractivePage.prototype.startDrag = function(_arg) {
    var config, event, snippetDrag, snippetModel, snippetView;
    snippetModel = _arg.snippetModel, snippetView = _arg.snippetView, event = _arg.event, config = _arg.config;
    if (!(snippetModel || snippetView)) {
      return;
    }
    if (snippetView) {
      snippetModel = snippetView.model;
    }
    snippetDrag = new SnippetDrag({
      snippetModel: snippetModel,
      snippetView: snippetView
    });
    if (config == null) {
      config = {
        longpress: {
          showIndicator: true,
          delay: 400,
          tolerance: 3
        }
      };
    }
    return this.dragBase.init(snippetDrag, event, config);
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


},{"../configuration/defaults":2,"../interaction/dom":6,"../interaction/drag_base":7,"../interaction/editable_controller":8,"../interaction/focus":9,"../interaction/snippet_drag":10,"./page":29}],29:[function(require,module,exports){
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
    _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, readOnly = _ref.readOnly, hostWindow = _ref.hostWindow, this.design = _ref.design, this.snippetTree = _ref.snippetTree;
    if (readOnly != null) {
      this.isReadOnly = readOnly;
    }
    this.setWindow(hostWindow);
    Page.__super__.constructor.call(this);
    if (renderNode == null) {
      renderNode = $("." + config.css.section, this.$body);
    }
    if (renderNode.jquery) {
      this.renderNode = renderNode[0];
    } else {
      this.renderNode = renderNode;
    }
    $(this.renderNode).data('snippetTree', this.snippetTree);
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
    $elem.addClass(config.css.editable);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9icm93c2VyX2FwaS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2RlZmF1bHRzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbl9zdHlsZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kb2N1bWVudC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kb20uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZHJhZ19iYXNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZm9jdXMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vc25pcHBldF9kcmFnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2tpY2tzdGFydC9icm93c2VyX3htbGRvbS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9raWNrc3RhcnQva2lja3N0YXJ0LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvY2hhaW5hYmxlX3Byb3h5LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZXZlbnRpbmcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ndWlkLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbGltaXRlZF9sb2NhbHN0b3JlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9jYWxzdG9yZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZW1hcGhvcmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZXJpYWxpemF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc3Rhc2guY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy93b3Jkcy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvcmVuZGVyZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3NuaXBwZXRfdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfYXJyYXkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X3RyZWUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb21waWxlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfZmluZGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS90ZW1wbGF0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBLCtGQUFBOztBQUFBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLDJCQUFSLENBQWpCLENBQUE7O0FBQUEsS0FDQSxHQUFRLE9BQUEsQ0FBUSxpQkFBUixDQURSLENBQUE7O0FBQUEsS0FFQSxHQUFRLE9BQUEsQ0FBUSxpQkFBUixDQUZSLENBQUE7O0FBQUEsUUFJQSxHQUFXLE9BQUEsQ0FBUSxZQUFSLENBSlgsQ0FBQTs7QUFBQSxTQUtBLEdBQVksT0FBQSxDQUFRLHVCQUFSLENBTFosQ0FBQTs7QUFBQSxZQU1BLEdBQWUsT0FBQSxDQUFRLDhCQUFSLENBTmYsQ0FBQTs7QUFBQSxNQWVNLENBQUMsR0FBUCxHQUFhLFNBQUMsTUFBRCxHQUFBO1NBQ1gsUUFBUSxDQUFDLElBQVQsQ0FBYyxNQUFkLEVBRFc7QUFBQSxDQWZiLENBQUE7O0FBQUEsU0FrQkEsR0FBWSxjQUFBLENBQWUsR0FBZixDQWxCWixDQUFBOztBQUFBLFFBb0JBLEdBQVcsU0FBQSxHQUFBO0FBR1QsRUFBQSxJQUFDLENBQUEsU0FBRCxHQUFhLFNBQUEsQ0FBVSxRQUFWLEVBQW9CLFdBQXBCLENBQWIsQ0FBQTtBQUFBLEVBQ0EsSUFBQyxDQUFBLFNBQUQsR0FBYSxTQURiLENBQUE7QUFBQSxFQUlBLElBQUMsQ0FBQSxJQUFELEdBQVEsU0FBQSxDQUFVLFFBQVYsRUFBb0IsTUFBcEIsQ0FKUixDQUFBO0FBQUEsRUFLQSxJQUFDLENBQUEsS0FBRCxHQUFTLFNBQUEsQ0FB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WCxDQUFpQixHQUFqQixDQUZSLENBQUE7QUFHQSxFQUFBLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7V0FDRTtBQUFBLE1BQUUsU0FBQSxFQUFXLE1BQWI7QUFBQSxNQUF3QixFQUFBLEVBQUksS0FBTSxDQUFBLENBQUEsQ0FBbEM7TUFERjtHQUFBLE1BRUssSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtXQUNIO0FBQUEsTUFBRSxTQUFBLEVBQVcsS0FBTSxDQUFBLENBQUEsQ0FBbkI7QUFBQSxNQUF1QixFQUFBLEVBQUksS0FBTSxDQUFBLENBQUEsQ0FBakM7TUFERztHQUFBLE1BQUE7V0FHSCxHQUFHLENBQUMsS0FBSixDQUFXLCtDQUFBLEdBQWQsVUFBRyxFQUhHO0dBTm9CO0FBQUEsQ0E5STNCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNoYWluYWJsZVByb3h5ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NoYWluYWJsZV9wcm94eScpXG53b3JkcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy93b3JkcycpXG5zdGFzaCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9zdGFzaCcpXG5cbmRvY3VtZW50ID0gcmVxdWlyZSgnLi9kb2N1bWVudCcpXG5LaWNrc3RhcnQgPSByZXF1aXJlKCcuL2tpY2tzdGFydC9raWNrc3RhcnQnKVxuU25pcHBldEFycmF5ID0gcmVxdWlyZSgnLi9zbmlwcGV0X3RyZWUvc25pcHBldF9hcnJheScpXG5cbiMgUHVibGljIEFQSVxuIyAtLS0tLS0tLS0tXG4jIFNpbmNlIHRoZSBsaXZpbmdkb2NzLWVuZ2luZSBjb2RlIGlzIGNvbnRhaW5lZCBpbiBpdHMgb3duIGZ1bmN0aW9uIGNsb3N1cmVcbiMgd2UgZXhwb3NlIG91ciBwdWJsaWMgQVBJIGhlcmUgZXhwbGljaXRseS5cbiNcbiMgYGRvYygpYDogcHJpbWFyeSBmdW5jdGlvbiBpbnRlcmZhY2Ugc2ltaWxhciB0byBqcXVlcnlcbiMgd2l0aCBzbmlwcGV0IHNlbGVjdG9ycyBhbmQgc3R1ZmYuLi5cbndpbmRvdy5kb2MgPSAoc2VhcmNoKSAtPlxuICBkb2N1bWVudC5maW5kKHNlYXJjaClcblxuY2hhaW5hYmxlID0gY2hhaW5hYmxlUHJveHkoZG9jKVxuXG5zZXR1cEFwaSA9IC0+XG5cbiAgIyBraWNrc3RhcnQgdGhlIGRvY3VtZW50XG4gIEBraWNrc3RhcnQgPSBjaGFpbmFibGUoZG9jdW1lbnQsICdraWNrc3RhcnQnKVxuICBAS2lja3N0YXJ0ID0gS2lja3N0YXJ0XG5cbiAgICAjIEluaXRpYWxpemUgdGhlIGRvY3VtZW50XG4gIEBpbml0ID0gY2hhaW5hYmxlKGRvY3VtZW50LCAnaW5pdCcpXG4gIEByZWFkeSA9IGNoYWluYWJsZShkb2N1bWVudC5yZWFkeSwgJ2FkZCcpXG5cbiAgQGNyZWF0ZVZpZXcgPSAkLnByb3h5KGRvY3VtZW50LCAnY3JlYXRlVmlldycpXG5cbiAgIyBBZGQgVGVtcGxhdGVzIHRvIHRoZSBkb2N1bWVudHNcbiAgQGdldERlc2lnbiA9IC0+IGRvY3VtZW50LmRlc2lnblxuXG4gICMgQXBwZW5kIGEgc25pcHBldCB0byB0aGUgZG9jdW1lbnRcbiAgIyBAcGFyYW0gaW5wdXQ6IChTdHJpbmcpIHNuaXBwZXQgaWRlbnRpZmllciBlLmcuIFwiYm9vdHN0cmFwLnRpdGxlXCIgb3IgKFNuaXBwZXQpXG4gICMgQHJldHVybiBTbmlwcGV0TW9kZWxcbiAgQGFkZCA9ICQucHJveHkoZG9jdW1lbnQsICdhZGQnKVxuXG4gICMgQ3JlYXRlIGEgbmV3IHNuaXBwZXQgaW5zdGFuY2UgKG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBkb2N1bWVudClcbiAgIyBAcGFyYW0gaWRlbnRpZmllcjogKFN0cmluZykgc25pcHBldCBpZGVudGlmaWVyIGUuZy4gXCJib290c3RyYXAudGl0bGVcIlxuICAjIEByZXR1cm4gU25pcHBldE1vZGVsXG4gIEBjcmVhdGUgPSAkLnByb3h5KGRvY3VtZW50LCAnY3JlYXRlTW9kZWwnKVxuXG4gICMgSnNvbiB0aGF0IGNhbiBiZSB1c2VkIGZvciBzYXZpbmcgb2YgdGhlIGRvY3VtZW50XG4gIEB0b0pzb24gPSAkLnByb3h5KGRvY3VtZW50LCAndG9Kc29uJylcbiAgQHRvSHRtbCA9ICQucHJveHkoZG9jdW1lbnQsICd0b0h0bWwnKVxuICBAcmVhZGFibGVKc29uID0gLT4gd29yZHMucmVhZGFibGVKc29uKCBkb2N1bWVudC50b0pzb24oKSApXG5cbiAgIyBQcmludCB0aGUgY29udGVudCBvZiB0aGUgc25pcHBldFRyZWUgaW4gYSByZWFkYWJsZSBzdHJpbmdcbiAgQHByaW50VHJlZSA9ICQucHJveHkoZG9jdW1lbnQsICdwcmludFRyZWUnKVxuXG4gIEBlYWNoQ29udGFpbmVyID0gY2hhaW5hYmxlKGRvY3VtZW50LCAnZWFjaENvbnRhaW5lcicpXG4gIEBkb2N1bWVudCA9IGRvY3VtZW50XG5cbiAgQGNoYW5nZWQgPSBjaGFpbmFibGUoZG9jdW1lbnQuY2hhbmdlZCwgJ2FkZCcpXG5cbiAgIyBTdGFzaFxuICAjIC0tLS0tXG5cbiAgc3Rhc2guaW5pdCgpXG4gIEBzdGFzaCA9ICQucHJveHkoc3Rhc2gsICdzdGFzaCcpXG4gIEBzdGFzaC5zbmFwc2hvdCA9ICQucHJveHkoc3Rhc2gsICdzbmFwc2hvdCcpXG4gIEBzdGFzaC5kZWxldGUgPSAkLnByb3h5KHN0YXNoLCAnZGVsZXRlJylcbiAgQHN0YXNoLnJlc3RvcmUgPSAkLnByb3h5KHN0YXNoLCAncmVzdG9yZScpXG4gIEBzdGFzaC5nZXQgPSAkLnByb3h5KHN0YXNoLCAnZ2V0JylcbiAgQHN0YXNoLmxpc3QgPSAkLnByb3h5KHN0YXNoLCAnbGlzdCcpXG5cblxuICAjIFV0aWxzXG4gICMgLS0tLS1cblxuICAjIEV4cG9zZSBzdHJpbmcgdXRpbCAnd29yZHMnXG4gIEB3b3JkcyA9IHdvcmRzXG5cblxuICAjIEZvciBQbHVnaW5zICYgRXh0ZW5zaW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICMgZW5hYmxlIHNuaXBwZXQgZmluZGVyIHBsdWdpbnMgKGpxdWVyeSBsaWtlKVxuICBAZm4gPSBTbmlwcGV0QXJyYXk6OlxuXG5cbiMgQVBJIG1ldGhvZHMgdGhhdCBhcmUgb25seSBhdmFpbGFibGUgYWZ0ZXIgdGhlIHBhZ2UgaGFzIGluaXRpYWxpemVkXG5wYWdlUmVhZHkgPSAtPlxuICBwYWdlID0gZG9jdW1lbnQucGFnZVxuXG4gIEByZXN0b3JlID0gY2hhaW5hYmxlKGRvY3VtZW50LCAncmVzdG9yZScpXG5cbiAgIyBFdmVudHNcbiAgIyAtLS0tLS1cblxuICAjIEZpcmVkIHdoZW4gYSBzbmlwcGV0IGlzIGZvY3VzZWRcbiAgIyBjYWxsYmFjazogKHNuaXBwZXRWaWV3KSAtPlxuICBAc25pcHBldEZvY3VzZWQgPSBjaGFpbmFibGUocGFnZS5mb2N1cy5zbmlwcGV0Rm9jdXMsICdhZGQnKVxuXG4gICMgRmlyZWQgd2hlbiBhIHNuaXBwZXQgaXMgYmx1cnJlZFxuICAjIChhbHdheXMgZmlyZSBiZWZvcmUgdGhlIG5leHQgZm9jdXMgZXZlbnQpXG4gICMgY2FsbGJhY2s6IChzbmlwcGV0VmlldykgLT5cbiAgQHNuaXBwZXRCbHVycmVkID0gY2hhaW5hYmxlKHBhZ2UuZm9jdXMuc25pcHBldEJsdXIsICdhZGQnKVxuXG4gICMgQ2FsbCB0byBzdGFydCBhIGRyYWcgb3BlcmF0aW9uXG4gIEBzdGFydERyYWcgPSAkLnByb3h5KHBhZ2UsICdzdGFydERyYWcnKVxuXG4gICMgU25pcHBldCBEcmFnICYgRHJvcCBldmVudHNcbiAgQHNuaXBwZXRXaWxsQmVEcmFnZ2VkID0gJC5wcm94eShwYWdlLnNuaXBwZXRXaWxsQmVEcmFnZ2VkLCAnYWRkJylcbiAgQHNuaXBwZXRXaWxsQmVEcmFnZ2VkLnJlbW92ZSA9ICQucHJveHkocGFnZS5zbmlwcGV0V2lsbEJlRHJhZ2dlZCwgJ3JlbW92ZScpXG4gIEBzbmlwcGV0V2FzRHJvcHBlZCA9ICQucHJveHkocGFnZS5zbmlwcGV0V2FzRHJvcHBlZCwgJ2FkZCcpXG4gIEBzbmlwcGV0V2FzRHJvcHBlZC5yZW1vdmUgPSAkLnByb3h5KHBhZ2Uuc25pcHBldFdhc0Ryb3BwZWQsICdyZW1vdmUnKVxuXG4gICMgRmlyZWQgd2hlbiBhIHVzZXIgY2xpY2tzIG9uIGFuIGVkaXRhYmxlIGltYWdlXG4gICMgZXhhbXBsZSBjYWxsYmFjayBtZXRob2Q6XG4gICMgKHNuaXBwZXRWaWV3LCBpbWFnZU5hbWUpIC0+IHNuaXBwZXRWaWV3Lm1vZGVsLnNldChpbWFnZU5hbWUsIGltYWdlU3JjKVxuICBAaW1hZ2VDbGljayA9IGNoYWluYWJsZShwYWdlLmltYWdlQ2xpY2ssICdhZGQnKVxuXG5cbiAgIyBGaXJlZCB3aGVuIGEgdXNlciBjbGljayBvbiBhbiBlZGl0YWJsZSBodG1sIGVsZW1lbnQgb3Igb25lIG9mIGl0cyBjaGlsZHJlblxuICAjIGV4YW1wbGUgY2FsbGJhY2sgbWV0aG9kczpcbiAgIyAoc25pcHBldFZpZXcsIGh0bWxFbGVtZW50TmFtZSwgZXZlbnQpIC0+ICMgeW91ciBjb2RlIGhlcmVcbiAgQGh0bWxFbGVtZW50Q2xpY2sgPSBjaGFpbmFibGUocGFnZS5odG1sRWxlbWVudENsaWNrLCAnYWRkJylcblxuICAjIFRleHQgRXZlbnRzXG4gICMgLS0tLS0tLS0tLS1cblxuICAjIEZpcmVkIHdoZW4gZWRpdGFibGUgdGV4dCBpcyBzZWxlY3RlZFxuICAjIGNhbGxiYWNrOiAoc25pcHBldFZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbikgLT5cbiAgIyBAY2FsbGJhY2tQYXJhbSBzbmlwcGV0VmlldyAtIHNuaXBwZXRWaWV3IGluc3RhbmNlXG4gICMgQGNhbGxiYWNrUGFyYW0gZWxlbWVudCAtIERPTSBub2RlIHdpdGggY29udGVudGVkaXRhYmxlXG4gICMgQGNhbGxiYWNrUGFyYW0gc2VsZWN0aW9uIC0gc2VsZWN0aW9uIG9iamVjdCBmcm9tIGVkaXRhYmxlSlNcbiAgQHRleHRTZWxlY3Rpb24gPSBjaGFpbmFibGUocGFnZS5lZGl0YWJsZUNvbnRyb2xsZXIuc2VsZWN0aW9uLCAnYWRkJylcblxuXG4jIGV4ZWN1dGUgQVBJIHNldHVwXG5zZXR1cEFwaS5jYWxsKGRvYylcbmRvYy5yZWFkeSAtPlxuICBwYWdlUmVhZHkuY2FsbChkb2MpXG5cblxuXG4iLCIjIENvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLVxubW9kdWxlLmV4cG9ydHMgPSBjb25maWcgPSBkbyAtPlxuXG4gIHdvcmRTZXBhcmF0b3JzOiBcIi4vXFxcXCgpXFxcIic6LC47PD5+ISMlXiYqfCs9W117fWB+P1wiXG5cbiAgIyBzdHJpbmcgY29udGFpbm5nIG9ubHkgYSA8YnI+IGZvbGxvd2VkIGJ5IHdoaXRlc3BhY2VzXG4gIHNpbmdsZUxpbmVCcmVhazogL148YnJcXHMqXFwvPz5cXHMqJC9cblxuICAjIChVK0ZFRkYpIHplcm8gd2lkdGggbm8tYnJlYWsgc3BhY2VcbiAgemVyb1dpZHRoQ2hhcmFjdGVyOiAnXFx1ZmVmZidcblxuICBhdHRyaWJ1dGVQcmVmaXg6ICdkYXRhJ1xuXG4gICMgSW4gY3NzIGFuZCBhdHRyIHlvdSBmaW5kIGV2ZXJ5dGhpbmcgdGhhdCBjYW4gZW5kIHVwIGluIHRoZSBodG1sXG4gICMgdGhlIGVuZ2luZSBzcGl0cyBvdXQgb3Igd29ya3Mgd2l0aC5cblxuICAjIGNzcyBjbGFzc2VzIGluamVjdGVkIGJ5IHRoZSBlbmdpbmVcbiAgY3NzOlxuICAgICMgZG9jdW1lbnQgY2xhc3Nlc1xuICAgIHNlY3Rpb246ICdkb2Mtc2VjdGlvbidcblxuICAgICMgc25pcHBldCBjbGFzc2VzXG4gICAgc25pcHBldDogJ2RvYy1zbmlwcGV0J1xuICAgIGVkaXRhYmxlOiAnZG9jLWVkaXRhYmxlJ1xuICAgIGVtcHR5SW1hZ2U6ICdkb2MtaW1hZ2UtZW1wdHknXG4gICAgaW50ZXJmYWNlOiAnZG9jLXVpJ1xuXG4gICAgIyBoaWdobGlnaHQgY2xhc3Nlc1xuICAgIHNuaXBwZXRIaWdobGlnaHQ6ICdkb2Mtc25pcHBldC1oaWdobGlnaHQnXG4gICAgY29udGFpbmVySGlnaGxpZ2h0OiAnZG9jLWNvbnRhaW5lci1oaWdobGlnaHQnXG5cbiAgICAjIGRyYWcgJiBkcm9wXG4gICAgZHJhZ2dlZDogJ2RvYy1kcmFnZ2VkJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlcjogJ2RvYy1kcmFnZ2VkLXBsYWNlaG9sZGVyJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlckNvdW50ZXI6ICdkb2MtZHJhZy1jb3VudGVyJ1xuICAgIGRyb3BNYXJrZXI6ICdkb2MtZHJvcC1tYXJrZXInXG4gICAgYmVmb3JlRHJvcDogJ2RvYy1iZWZvcmUtZHJvcCdcbiAgICBub0Ryb3A6ICdkb2MtZHJhZy1uby1kcm9wJ1xuICAgIGFmdGVyRHJvcDogJ2RvYy1hZnRlci1kcm9wJ1xuICAgIGxvbmdwcmVzc0luZGljYXRvcjogJ2RvYy1sb25ncHJlc3MtaW5kaWNhdG9yJ1xuXG4gICAgIyB1dGlsaXR5IGNsYXNzZXNcbiAgICBwcmV2ZW50U2VsZWN0aW9uOiAnZG9jLW5vLXNlbGVjdGlvbidcbiAgICBtYXhpbWl6ZWRDb250YWluZXI6ICdkb2MtanMtbWF4aW1pemVkLWNvbnRhaW5lcidcbiAgICBpbnRlcmFjdGlvbkJsb2NrZXI6ICdkb2MtaW50ZXJhY3Rpb24tYmxvY2tlcidcblxuICAjIGF0dHJpYnV0ZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBhdHRyOlxuICAgIHRlbXBsYXRlOiAnZGF0YS1kb2MtdGVtcGxhdGUnXG4gICAgcGxhY2Vob2xkZXI6ICdkYXRhLWRvYy1wbGFjZWhvbGRlcidcblxuXG4gICMgS2lja3N0YXJ0IGNvbmZpZ1xuICBraWNrc3RhcnQ6XG4gICAgYXR0cjpcbiAgICAgIHN0eWxlczogJ2RvYy1zdHlsZXMnXG5cbiAgIyBEaXJlY3RpdmUgZGVmaW5pdGlvbnNcbiAgI1xuICAjIGF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIHRlbXBsYXRlcyB0byBkZWZpbmUgdGhlIGRpcmVjdGl2ZVxuICAjIHJlbmRlcmVkQXR0cjogYXR0cmlidXRlIHVzZWQgaW4gb3V0cHV0IGh0bWxcbiAgIyBlbGVtZW50RGlyZWN0aXZlOiBkaXJlY3RpdmUgdGhhdCB0YWtlcyBjb250cm9sIG92ZXIgdGhlIGVsZW1lbnRcbiAgIyAgICh0aGVyZSBjYW4gb25seSBiZSBvbmUgcGVyIGVsZW1lbnQpXG4gICMgZGVmYXVsdE5hbWU6IGRlZmF1bHQgbmFtZSBpZiBub25lIHdhcyBzcGVjaWZpZWQgaW4gdGhlIHRlbXBsYXRlXG4gIGRpcmVjdGl2ZXM6XG4gICAgY29udGFpbmVyOlxuICAgICAgYXR0cjogJ2RvYy1jb250YWluZXInXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGVkaXRhYmxlOlxuICAgICAgYXR0cjogJ2RvYy1lZGl0YWJsZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgaW1hZ2U6XG4gICAgICBhdHRyOiAnZG9jLWltYWdlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnaW1hZ2UnXG4gICAgaHRtbDpcbiAgICAgIGF0dHI6ICdkb2MtaHRtbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgb3B0aW9uYWw6XG4gICAgICBhdHRyOiAnZG9jLW9wdGlvbmFsJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IGZhbHNlXG5cblxuICBhbmltYXRpb25zOlxuICAgIG9wdGlvbmFsczpcbiAgICAgIHNob3c6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVEb3duKDI1MClcblxuICAgICAgaGlkZTogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZVVwKDI1MClcblxuXG4jIEVucmljaCB0aGUgY29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiNcbiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uIHdpdGggc2hvcnRoYW5kcyBhbmQgY29tcHV0ZWQgdmFsdWVzLlxuZW5yaWNoQ29uZmlnID0gLT5cblxuICAjIFNob3J0aGFuZHMgZm9yIHN0dWZmIHRoYXQgaXMgdXNlZCBhbGwgb3ZlciB0aGUgcGxhY2UgdG8gbWFrZVxuICAjIGNvZGUgYW5kIHNwZWNzIG1vcmUgcmVhZGFibGUuXG4gIEBkb2NEaXJlY3RpdmUgPSB7fVxuICBAdGVtcGxhdGVBdHRyTG9va3VwID0ge31cblxuICBmb3IgbmFtZSwgdmFsdWUgb2YgQGRpcmVjdGl2ZXNcblxuICAgICMgQ3JlYXRlIHRoZSByZW5kZXJlZEF0dHJzIGZvciB0aGUgZGlyZWN0aXZlc1xuICAgICMgKHByZXBlbmQgZGlyZWN0aXZlIGF0dHJpYnV0ZXMgd2l0aCB0aGUgY29uZmlndXJlZCBwcmVmaXgpXG4gICAgcHJlZml4ID0gXCIjeyBAYXR0cmlidXRlUHJlZml4IH0tXCIgaWYgQGF0dHJpYnV0ZVByZWZpeFxuICAgIHZhbHVlLnJlbmRlcmVkQXR0ciA9IFwiI3sgcHJlZml4IHx8ICcnIH0jeyB2YWx1ZS5hdHRyIH1cIlxuXG4gICAgQGRvY0RpcmVjdGl2ZVtuYW1lXSA9IHZhbHVlLnJlbmRlcmVkQXR0clxuICAgIEB0ZW1wbGF0ZUF0dHJMb29rdXBbdmFsdWUuYXR0cl0gPSBuYW1lXG5cblxuZW5yaWNoQ29uZmlnLmNhbGwoY29uZmlnKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvdGVtcGxhdGUnKVxuRGVzaWduU3R5bGUgPSByZXF1aXJlKCcuL2Rlc2lnbl9zdHlsZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVzaWduXG5cbiAgY29uc3RydWN0b3I6IChkZXNpZ24pIC0+XG4gICAgdGVtcGxhdGVzID0gZGVzaWduLnRlbXBsYXRlcyB8fCBkZXNpZ24uc25pcHBldHNcbiAgICBjb25maWcgPSBkZXNpZ24uY29uZmlnXG4gICAgZ3JvdXBzID0gZGVzaWduLmNvbmZpZy5ncm91cHMgfHwgZGVzaWduLmdyb3Vwc1xuXG4gICAgQG5hbWVzcGFjZSA9IGNvbmZpZz8ubmFtZXNwYWNlIHx8ICdsaXZpbmdkb2NzLXRlbXBsYXRlcydcbiAgICBAcGFyYWdyYXBoU25pcHBldCA9IGNvbmZpZz8ucGFyYWdyYXBoIHx8ICd0ZXh0J1xuICAgIEBjc3MgPSBjb25maWcuY3NzXG4gICAgQGpzID0gY29uZmlnLmpzXG4gICAgQGZvbnRzID0gY29uZmlnLmZvbnRzXG4gICAgQHRlbXBsYXRlcyA9IFtdXG4gICAgQGdyb3VwcyA9IHt9XG4gICAgQHN0eWxlcyA9IHt9XG5cbiAgICBAc3RvcmVUZW1wbGF0ZURlZmluaXRpb25zKHRlbXBsYXRlcylcbiAgICBAZ2xvYmFsU3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbihkZXNpZ24uY29uZmlnLnN0eWxlcylcbiAgICBAYWRkR3JvdXBzKGdyb3VwcylcbiAgICBAYWRkVGVtcGxhdGVzTm90SW5Hcm91cHMoKVxuXG5cbiAgc3RvcmVUZW1wbGF0ZURlZmluaXRpb25zOiAodGVtcGxhdGVzKSAtPlxuICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zID0ge31cbiAgICBmb3IgdGVtcGxhdGUgaW4gdGVtcGxhdGVzXG4gICAgICBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZS5pZF0gPSB0ZW1wbGF0ZVxuXG5cbiAgIyBwYXNzIHRoZSB0ZW1wbGF0ZSBhcyBvYmplY3RcbiAgIyBlLmcgYWRkKHtpZDogXCJ0aXRsZVwiLCBuYW1lOlwiVGl0bGVcIiwgaHRtbDogXCI8aDEgZG9jLWVkaXRhYmxlPlRpdGxlPC9oMT5cIn0pXG4gIGFkZDogKHRlbXBsYXRlRGVmaW5pdGlvbiwgc3R5bGVzKSAtPlxuICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlRGVmaW5pdGlvbi5pZF0gPSB1bmRlZmluZWRcbiAgICB0ZW1wbGF0ZU9ubHlTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKHRlbXBsYXRlRGVmaW5pdGlvbi5zdHlsZXMpXG4gICAgdGVtcGxhdGVTdHlsZXMgPSAkLmV4dGVuZCh7fSwgc3R5bGVzLCB0ZW1wbGF0ZU9ubHlTdHlsZXMpXG5cbiAgICB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZVxuICAgICAgbmFtZXNwYWNlOiBAbmFtZXNwYWNlXG4gICAgICBpZDogdGVtcGxhdGVEZWZpbml0aW9uLmlkXG4gICAgICB0aXRsZTogdGVtcGxhdGVEZWZpbml0aW9uLnRpdGxlXG4gICAgICBzdHlsZXM6IHRlbXBsYXRlU3R5bGVzXG4gICAgICBodG1sOiB0ZW1wbGF0ZURlZmluaXRpb24uaHRtbFxuICAgICAgd2VpZ2h0OiB0ZW1wbGF0ZURlZmluaXRpb24uc29ydE9yZGVyIHx8IDBcblxuICAgIEB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZSlcbiAgICB0ZW1wbGF0ZVxuXG5cbiAgYWRkR3JvdXBzOiAoY29sbGVjdGlvbikgLT5cbiAgICBmb3IgZ3JvdXBOYW1lLCBncm91cCBvZiBjb2xsZWN0aW9uXG4gICAgICBncm91cE9ubHlTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKGdyb3VwLnN0eWxlcylcbiAgICAgIGdyb3VwU3R5bGVzID0gJC5leHRlbmQoe30sIEBnbG9iYWxTdHlsZXMsIGdyb3VwT25seVN0eWxlcylcblxuICAgICAgdGVtcGxhdGVzID0ge31cbiAgICAgIGZvciB0ZW1wbGF0ZUlkIGluIGdyb3VwLnRlbXBsYXRlc1xuICAgICAgICB0ZW1wbGF0ZURlZmluaXRpb24gPSBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZUlkXVxuICAgICAgICBpZiB0ZW1wbGF0ZURlZmluaXRpb25cbiAgICAgICAgICB0ZW1wbGF0ZSA9IEBhZGQodGVtcGxhdGVEZWZpbml0aW9uLCBncm91cFN0eWxlcylcbiAgICAgICAgICB0ZW1wbGF0ZXNbdGVtcGxhdGUuaWRdID0gdGVtcGxhdGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy53YXJuKFwiVGhlIHRlbXBsYXRlICcje3RlbXBsYXRlSWR9JyByZWZlcmVuY2VkIGluIHRoZSBncm91cCAnI3tncm91cE5hbWV9JyBkb2VzIG5vdCBleGlzdC5cIilcblxuICAgICAgQGFkZEdyb3VwKGdyb3VwTmFtZSwgZ3JvdXAsIHRlbXBsYXRlcylcblxuXG4gIGFkZFRlbXBsYXRlc05vdEluR3JvdXBzOiAoZ2xvYmFsU3R5bGVzKSAtPlxuICAgIGZvciB0ZW1wbGF0ZUlkLCB0ZW1wbGF0ZURlZmluaXRpb24gb2YgQHRlbXBsYXRlRGVmaW5pdGlvbnNcbiAgICAgIGlmIHRlbXBsYXRlRGVmaW5pdGlvblxuICAgICAgICBAYWRkKHRlbXBsYXRlRGVmaW5pdGlvbiwgQGdsb2JhbFN0eWxlcylcblxuXG4gIGFkZEdyb3VwOiAobmFtZSwgZ3JvdXAsIHRlbXBsYXRlcykgLT5cbiAgICBAZ3JvdXBzW25hbWVdID1cbiAgICAgIHRpdGxlOiBncm91cC50aXRsZVxuICAgICAgdGVtcGxhdGVzOiB0ZW1wbGF0ZXNcblxuXG4gIGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbjogKHN0eWxlcykgLT5cbiAgICBkZXNpZ25TdHlsZXMgPSB7fVxuICAgIGlmIHN0eWxlc1xuICAgICAgZm9yIHN0eWxlRGVmaW5pdGlvbiBpbiBzdHlsZXNcbiAgICAgICAgZGVzaWduU3R5bGUgPSBAY3JlYXRlRGVzaWduU3R5bGUoc3R5bGVEZWZpbml0aW9uKVxuICAgICAgICBkZXNpZ25TdHlsZXNbZGVzaWduU3R5bGUubmFtZV0gPSBkZXNpZ25TdHlsZSBpZiBkZXNpZ25TdHlsZVxuXG4gICAgZGVzaWduU3R5bGVzXG5cblxuICBjcmVhdGVEZXNpZ25TdHlsZTogKHN0eWxlRGVmaW5pdGlvbikgLT5cbiAgICBpZiBzdHlsZURlZmluaXRpb24gJiYgc3R5bGVEZWZpbml0aW9uLm5hbWVcbiAgICAgIG5ldyBEZXNpZ25TdHlsZVxuICAgICAgICBuYW1lOiBzdHlsZURlZmluaXRpb24ubmFtZVxuICAgICAgICB0eXBlOiBzdHlsZURlZmluaXRpb24udHlwZVxuICAgICAgICBvcHRpb25zOiBzdHlsZURlZmluaXRpb24ub3B0aW9uc1xuICAgICAgICB2YWx1ZTogc3R5bGVEZWZpbml0aW9uLnZhbHVlXG5cblxuICByZW1vdmU6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICBAdGVtcGxhdGVzLnNwbGljZShAZ2V0SW5kZXgoaWQpLCAxKVxuXG5cbiAgZ2V0OiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgdGVtcGxhdGUgPSB1bmRlZmluZWRcbiAgICAgIEBlYWNoICh0LCBpbmRleCkgLT5cbiAgICAgICAgaWYgdC5pZCA9PSBpZFxuICAgICAgICAgIHRlbXBsYXRlID0gdFxuXG4gICAgICB0ZW1wbGF0ZVxuXG5cbiAgZ2V0SW5kZXg6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICBpbmRleCA9IHVuZGVmaW5lZFxuICAgICAgQGVhY2ggKHQsIGkpIC0+XG4gICAgICAgIGlmIHQuaWQgPT0gaWRcbiAgICAgICAgICBpbmRleCA9IGlcblxuICAgICAgaW5kZXhcblxuXG4gIGNoZWNrTmFtZXNwYWNlOiAoaWRlbnRpZmllciwgY2FsbGJhY2spIC0+XG4gICAgeyBuYW1lc3BhY2UsIGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIGFzc2VydCBub3QgbmFtZXNwYWNlIG9yIEBuYW1lc3BhY2UgaXMgbmFtZXNwYWNlLFxuICAgICAgXCJkZXNpZ24gI3sgQG5hbWVzcGFjZSB9OiBjYW5ub3QgZ2V0IHRlbXBsYXRlIHdpdGggZGlmZmVyZW50IG5hbWVzcGFjZSAjeyBuYW1lc3BhY2UgfSBcIlxuXG4gICAgY2FsbGJhY2soaWQpXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIHRlbXBsYXRlLCBpbmRleCBpbiBAdGVtcGxhdGVzXG4gICAgICBjYWxsYmFjayh0ZW1wbGF0ZSwgaW5kZXgpXG5cblxuICAjIGxpc3QgYXZhaWxhYmxlIFRlbXBsYXRlc1xuICBsaXN0OiAtPlxuICAgIHRlbXBsYXRlcyA9IFtdXG4gICAgQGVhY2ggKHRlbXBsYXRlKSAtPlxuICAgICAgdGVtcGxhdGVzLnB1c2godGVtcGxhdGUuaWRlbnRpZmllcilcblxuICAgIHRlbXBsYXRlc1xuXG5cbiAgIyBwcmludCBkb2N1bWVudGF0aW9uIGZvciBhIHRlbXBsYXRlXG4gIGluZm86IChpZGVudGlmaWVyKSAtPlxuICAgIHRlbXBsYXRlID0gQGdldChpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLnByaW50RG9jKClcbiIsImxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVzaWduU3R5bGVcblxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIEB0eXBlLCB2YWx1ZSwgb3B0aW9ucyB9KSAtPlxuICAgIHN3aXRjaCBAdHlwZVxuICAgICAgd2hlbiAnb3B0aW9uJ1xuICAgICAgICBhc3NlcnQgdmFsdWUsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ3ZhbHVlJyBwcm92aWRlZFwiXG4gICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICB3aGVuICdzZWxlY3QnXG4gICAgICAgIGFzc2VydCBvcHRpb25zLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICdvcHRpb25zJyBwcm92aWRlZFwiXG4gICAgICAgIEBvcHRpb25zID0gb3B0aW9uc1xuICAgICAgZWxzZVxuICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiB1bmtub3duIHR5cGUgJyN7IEB0eXBlIH0nXCJcblxuXG4gICMgR2V0IGluc3RydWN0aW9ucyB3aGljaCBjc3MgY2xhc3NlcyB0byBhZGQgYW5kIHJlbW92ZS5cbiAgIyBXZSBkbyBub3QgY29udHJvbCB0aGUgY2xhc3MgYXR0cmlidXRlIG9mIGEgc25pcHBldCBET00gZWxlbWVudFxuICAjIHNpbmNlIHRoZSBVSSBvciBvdGhlciBzY3JpcHRzIGNhbiBtZXNzIHdpdGggaXQgYW55IHRpbWUuIFNvIHRoZVxuICAjIGluc3RydWN0aW9ucyBhcmUgZGVzaWduZWQgbm90IHRvIGludGVyZmVyZSB3aXRoIG90aGVyIGNzcyBjbGFzc2VzXG4gICMgcHJlc2VudCBpbiBhbiBlbGVtZW50cyBjbGFzcyBhdHRyaWJ1dGUuXG4gIGNzc0NsYXNzQ2hhbmdlczogKHZhbHVlKSAtPlxuICAgIGlmIEB2YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBpZiBub3QgdmFsdWUgdGhlbiBbQHZhbHVlXSBlbHNlIHVuZGVmaW5lZFxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh2YWx1ZSlcbiAgICAgICAgYWRkOiB2YWx1ZVxuICAgIGVsc2VcbiAgICAgIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICAgIHJlbW92ZTogY3VycmVudFZhbHVlXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh1bmRlZmluZWQpXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG5cblxuICB2YWxpZGF0ZVZhbHVlOiAodmFsdWUpIC0+XG4gICAgaWYgbm90IHZhbHVlXG4gICAgICB0cnVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgdmFsdWUgPT0gQHZhbHVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgQGNvbnRhaW5zT3B0aW9uKHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIGxvZy53YXJuIFwiTm90IGltcGxlbWVudGVkOiBEZXNpZ25TdHlsZSN2YWxpZGF0ZVZhbHVlKCkgZm9yIHR5cGUgI3sgQHR5cGUgfVwiXG5cblxuICBjb250YWluc09wdGlvbjogKHZhbHVlKSAtPlxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIHJldHVybiB0cnVlIGlmIHZhbHVlIGlzIG9wdGlvbi52YWx1ZVxuXG4gICAgZmFsc2VcblxuXG4gIG90aGVyT3B0aW9uczogKHZhbHVlKSAtPlxuICAgIG90aGVycyA9IFtdXG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgb3RoZXJzLnB1c2ggb3B0aW9uIGlmIG9wdGlvbi52YWx1ZSBpc250IHZhbHVlXG5cbiAgICBvdGhlcnNcblxuXG4gIG90aGVyQ2xhc3NlczogKHZhbHVlKSAtPlxuICAgIG90aGVycyA9IFtdXG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgb3RoZXJzLnB1c2ggb3B0aW9uLnZhbHVlIGlmIG9wdGlvbi52YWx1ZSBpc250IHZhbHVlXG5cbiAgICBvdGhlcnNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ24nKVxuU25pcHBldFRyZWUgPSByZXF1aXJlKCcuL3NuaXBwZXRfdHJlZS9zbmlwcGV0X3RyZWUnKVxuS2lja3N0YXJ0ID0gcmVxdWlyZSgnLi9raWNrc3RhcnQva2lja3N0YXJ0JylcblxuUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlJylcbkludGVyYWN0aXZlUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvcmVuZGVyZXInKVxuXG4jIERvY3VtZW50XG4jIC0tLS0tLS0tXG4jIE1hbmFnZSB0aGUgZG9jdW1lbnQgYW5kIGl0cyBkZXBlbmRlbmNpZXMuXG4jIEluaXRpYWx6ZSBldmVyeXRpbmcuXG4jXG4jICMjIyBEZXNpZ246XG4jIE1hbmFnZSBhdmFpbGFibGUgVGVtcGxhdGVzXG4jXG4jICMjIyBBc3NldHM6XG4jIExvYWQgYW5kIG1hbmFnZSBDU1MgYW5kIEphdmFzY3JpcHQgZGVwZW5kZW5jaWVzXG4jIG9mIHRoZSBkZXNpZ25zXG4jXG4jICMjIyBDb250ZW50OlxuIyBJbml0aWFsaXplIHRoZSBTbmlwcGV0VHJlZS5cbiNcbiMgIyMjIFBhZ2U6XG4jIEluaXRpYWxpemUgZXZlbnQgbGlzdGVuZXJzLlxuIyBMaW5rIHRoZSBTbmlwcGV0VHJlZSB3aXRoIHRoZSBEb21UcmVlLlxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgRG9jdW1lbnQgb2JqZWN0XG4gICMgLS0tLS0tLS0tLS0tLS0tXG5cbiAgaW5pdGlhbGl6ZWQ6IGZhbHNlXG4gIHVuaXF1ZUlkOiAwXG4gIHJlYWR5OiAkLkNhbGxiYWNrcygnbWVtb3J5IG9uY2UnKVxuICBjaGFuZ2VkOiAkLkNhbGxiYWNrcygpXG5cblxuICAjICpQdWJsaWMgQVBJKlxuICBpbml0OiAoeyBkZXNpZ24sIGpzb24sIHJvb3ROb2RlIH09e30pIC0+XG4gICAgYXNzZXJ0IG5vdCBAaW5pdGlhbGl6ZWQsICdkb2N1bWVudCBpcyBhbHJlYWR5IGluaXRpYWxpemVkJ1xuICAgIEBpbml0aWFsaXplZCA9IHRydWVcbiAgICBAZGVzaWduID0gbmV3IERlc2lnbihkZXNpZ24pXG5cbiAgICBAc25pcHBldFRyZWUgPSBpZiBqc29uICYmIEBkZXNpZ25cbiAgICAgIG5ldyBTbmlwcGV0VHJlZShjb250ZW50OiBqc29uLCBkZXNpZ246IEBkZXNpZ24pXG4gICAgZWxzZVxuICAgICAgbmV3IFNuaXBwZXRUcmVlKClcblxuICAgICMgZm9yd2FyZCBjaGFuZ2VkIGV2ZW50XG4gICAgQHNuaXBwZXRUcmVlLmNoYW5nZWQuYWRkID0+XG4gICAgICBAY2hhbmdlZC5maXJlKClcblxuICAgICMgUGFnZSBpbml0aWFsaXphdGlvblxuICAgIEBwYWdlID0gbmV3IEludGVyYWN0aXZlUGFnZVxuICAgICAgcmVuZGVyTm9kZTogcm9vdE5vZGVcbiAgICAgIGRlc2lnbjogQGRlc2lnblxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuXG4gICAgIyByZW5kZXIgZG9jdW1lbnRcbiAgICBAcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogQHBhZ2VcblxuICAgIEByZW5kZXJlci5yZWFkeSA9PiBAcmVhZHkuZmlyZSgpXG5cblxuICBjcmVhdGVWaWV3OiAocGFyZW50PXdpbmRvdy5kb2N1bWVudC5ib2R5KSAtPlxuICAgIGNyZWF0ZVJlbmRlcmVyQW5kUmVzb2x2ZVByb21pc2UgPSA9PlxuICAgICAgcGFnZSA9IG5ldyBQYWdlXG4gICAgICAgIHJlbmRlck5vZGU6IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuYm9keVxuICAgICAgICBob3N0V2luZG93OiBpZnJhbWUuY29udGVudFdpbmRvd1xuICAgICAgICBkZXNpZ246IEBkZXNpZ25cbiAgICAgIHJlbmRlcmVyID0gbmV3IFJlbmRlcmVyXG4gICAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogcGFnZVxuICAgICAgICBzbmlwcGV0VHJlZTogQHNuaXBwZXRUcmVlXG4gICAgICBkZWZlcnJlZC5yZXNvbHZlXG4gICAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICAgIHJlbmRlcmVyOiByZW5kZXJlclxuXG4gICAgZGVmZXJyZWQgPSAkLkRlZmVycmVkKClcbiAgICAkcGFyZW50ID0gJChwYXJlbnQpLmZpcnN0KClcbiAgICBpZnJhbWUgPSAkcGFyZW50WzBdLm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJylcbiAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJ1xuICAgIGlmcmFtZS5vbmxvYWQgPSBjcmVhdGVSZW5kZXJlckFuZFJlc29sdmVQcm9taXNlXG4gICAgJHBhcmVudC5hcHBlbmQoaWZyYW1lKVxuXG4gICAgZGVmZXJyZWQucHJvbWlzZSgpXG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgQHNuaXBwZXRUcmVlLmVhY2hDb250YWluZXIoY2FsbGJhY2spXG5cblxuICAjICpQdWJsaWMgQVBJKlxuICBhZGQ6IChpbnB1dCkgLT5cbiAgICBpZiBqUXVlcnkudHlwZShpbnB1dCkgPT0gJ3N0cmluZydcbiAgICAgIHNuaXBwZXQgPSBAY3JlYXRlTW9kZWwoaW5wdXQpXG4gICAgZWxzZVxuICAgICAgc25pcHBldCA9IGlucHV0XG5cbiAgICBAc25pcHBldFRyZWUuYXBwZW5kKHNuaXBwZXQpIGlmIHNuaXBwZXRcbiAgICBzbmlwcGV0XG5cblxuICAjICpQdWJsaWMgQVBJKlxuICBjcmVhdGVNb2RlbDogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0VGVtcGxhdGUoaWRlbnRpZmllcilcbiAgICB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpIGlmIHRlbXBsYXRlXG5cblxuICAjIGZpbmQgYWxsIGluc3RhbmNlcyBvZiBhIGNlcnRhaW4gVGVtcGxhdGVcbiAgIyBlLmcuIHNlYXJjaCBcImJvb3RzdHJhcC5oZXJvXCIgb3IganVzdCBcImhlcm9cIlxuICBmaW5kOiAoc2VhcmNoKSAtPlxuICAgIEBzbmlwcGV0VHJlZS5maW5kKHNlYXJjaClcblxuXG4gICMgcHJpbnQgdGhlIFNuaXBwZXRUcmVlXG4gIHByaW50VHJlZTogKCkgLT5cbiAgICBAc25pcHBldFRyZWUucHJpbnQoKVxuXG5cbiAgdG9Kc29uOiAtPlxuICAgIGpzb24gPSBAc25pcHBldFRyZWUudG9Kc29uKClcbiAgICBqc29uWydtZXRhJ10gPVxuICAgICAgdGl0bGU6IHVuZGVmaW5lZFxuICAgICAgYXV0aG9yOiB1bmRlZmluZWRcbiAgICAgIGNyZWF0ZWQ6IHVuZGVmaW5lZFxuICAgICAgcHVibGlzaGVkOiB1bmRlZmluZWRcblxuICAgIGpzb25cblxuXG4gIHRvSHRtbDogLT5cbiAgICBuZXcgUmVuZGVyZXIoXG4gICAgICBzbmlwcGV0VHJlZTogQHNuaXBwZXRUcmVlXG4gICAgICByZW5kZXJpbmdDb250YWluZXI6IG5ldyBSZW5kZXJpbmdDb250YWluZXIoKVxuICAgICkuaHRtbCgpXG5cblxuICByZXN0b3JlOiAoY29udGVudEpzb24sIHJlc2V0Rmlyc3QgPSB0cnVlKSAtPlxuICAgIEByZXNldCgpIGlmIHJlc2V0Rmlyc3RcbiAgICBAc25pcHBldFRyZWUuZnJvbUpzb24oY29udGVudEpzb24sIEBkZXNpZ24pXG4gICAgQHJlbmRlcmVyLnJlbmRlcigpXG5cblxuICByZXNldDogLT5cbiAgICBAcmVuZGVyZXIuY2xlYXIoKVxuICAgIEBzbmlwcGV0VHJlZS5kZXRhY2goKVxuXG5cbiAgZ2V0VGVtcGxhdGU6IChpZGVudGlmaWVyKSAtPlxuICAgIHRlbXBsYXRlID0gQGRlc2lnbj8uZ2V0KGlkZW50aWZpZXIpXG5cbiAgICBhc3NlcnQgdGVtcGxhdGUsIFwiY291bGQgbm90IGZpbmQgdGVtcGxhdGUgI3sgaWRlbnRpZmllciB9XCJcblxuICAgIHRlbXBsYXRlXG5cbiAga2lja3N0YXJ0OiAoeyB4bWxUZW1wbGF0ZSwgc2NyaXB0Tm9kZSwgZGVzdGluYXRpb24sIGRlc2lnbn0pIC0+XG4gICAganNvbiA9IG5ldyBLaWNrc3RhcnQoe3htbFRlbXBsYXRlLCBzY3JpcHROb2RlLCBkZXNpZ259KS5nZXRTbmlwcGV0VHJlZSgpLnRvSnNvbigpXG4gICAgQGluaXQoeyBkZXNpZ24sIGpzb24sIHJvb3ROb2RlOiBkZXN0aW5hdGlvbiB9KVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5cbiMgRE9NIGhlbHBlciBtZXRob2RzXG4jIC0tLS0tLS0tLS0tLS0tLS0tLVxuIyBNZXRob2RzIHRvIHBhcnNlIGFuZCB1cGRhdGUgdGhlIERvbSB0cmVlIGluIGFjY29yZGFuY2UgdG9cbiMgdGhlIFNuaXBwZXRUcmVlIGFuZCBMaXZpbmdkb2NzIGNsYXNzZXMgYW5kIGF0dHJpYnV0ZXNcbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cbiAgc25pcHBldFJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBjc3Muc25pcHBldCB9KD86IHwkKVwiKVxuICBzZWN0aW9uUmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zZWN0aW9uIH0oPzogfCQpXCIpXG5cbiAgIyBGaW5kIHRoZSBzbmlwcGV0IHRoaXMgbm9kZSBpcyBjb250YWluZWQgd2l0aGluLlxuICAjIFNuaXBwZXRzIGFyZSBtYXJrZWQgYnkgYSBjbGFzcyBhdCB0aGUgbW9tZW50LlxuICBmaW5kU25pcHBldFZpZXc6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgc25pcHBldFJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIHZpZXcgPSBAZ2V0U25pcHBldFZpZXcobm9kZSlcbiAgICAgICAgcmV0dXJuIHZpZXdcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgZmluZE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIG5vZGVDb250ZXh0ID0gQGdldE5vZGVDb250ZXh0KG5vZGUpXG4gICAgICByZXR1cm4gbm9kZUNvbnRleHQgaWYgbm9kZUNvbnRleHRcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgZ2V0Tm9kZUNvbnRleHQ6IChub2RlKSAtPlxuICAgIGZvciBkaXJlY3RpdmVUeXBlLCBvYmogb2YgY29uZmlnLmRpcmVjdGl2ZXNcbiAgICAgIGNvbnRpbnVlIGlmIG5vdCBvYmouZWxlbWVudERpcmVjdGl2ZVxuXG4gICAgICBkaXJlY3RpdmVBdHRyID0gb2JqLnJlbmRlcmVkQXR0clxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb250ZXh0QXR0cjogZGlyZWN0aXZlQXR0clxuICAgICAgICAgIGF0dHJOYW1lOiBub2RlLmdldEF0dHJpYnV0ZShkaXJlY3RpdmVBdHRyKVxuICAgICAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICAjIEZpbmQgdGhlIGNvbnRhaW5lciB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgZmluZENvbnRhaW5lcjogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGNvbnRhaW5lck5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBpZiBub3Qgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgICAgdmlldyA9IEBmaW5kU25pcHBldFZpZXcobm9kZSlcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IG5vZGVcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG4gICAgICAgICAgc25pcHBldFZpZXc6IHZpZXdcbiAgICAgICAgfVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICB7fVxuXG5cbiAgZ2V0SW1hZ2VOYW1lOiAobm9kZSkgLT5cbiAgICBpbWFnZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShpbWFnZUF0dHIpXG4gICAgICBpbWFnZU5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShpbWFnZUF0dHIpXG4gICAgICByZXR1cm4gaW1hZ2VOYW1lXG5cblxuICBnZXRIdG1sRWxlbWVudE5hbWU6IChub2RlKSAtPlxuICAgIGh0bWxBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaHRtbC5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIGh0bWxFbGVtZW50TmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgcmV0dXJuIGh0bWxFbGVtZW50TmFtZVxuXG5cbiAgZ2V0RWRpdGFibGVOYW1lOiAobm9kZSkgLT5cbiAgICBlZGl0YWJsZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5lZGl0YWJsZS5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShlZGl0YWJsZUF0dHIpXG4gICAgICBpbWFnZU5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShlZGl0YWJsZUF0dHIpXG4gICAgICByZXR1cm4gZWRpdGFibGVOYW1lXG5cblxuICBkcm9wVGFyZ2V0OiAobm9kZSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgIyBhYm92ZSBjb250YWluZXJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0RGF0YSA9IEBnZXRDbG9zZXN0U25pcHBldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0U25pcHBldERhdGE/XG4gICAgICAgICAgcmV0dXJuIEBnZXRDbG9zZXN0U25pcHBldFRhcmdldChjbG9zZXN0U25pcHBldERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldENvbnRhaW5lclRhcmdldChub2RlKVxuXG4gICAgICAjIGFib3ZlIHNuaXBwZXRcbiAgICAgIGVsc2UgaWYgc25pcHBldFJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIHJldHVybiBAZ2V0U25pcHBldFRhcmdldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuXG4gICAgICAjIGFib3ZlIHJvb3QgY29udGFpbmVyXG4gICAgICBlbHNlIGlmIHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICBjbG9zZXN0U25pcHBldERhdGEgPSBAZ2V0Q2xvc2VzdFNuaXBwZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgaWYgY2xvc2VzdFNuaXBwZXREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQoY2xvc2VzdFNuaXBwZXREYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIEBnZXRSb290VGFyZ2V0KG5vZGUpXG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuXG4gIGdldFNuaXBwZXRUYXJnZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCwgcG9zaXRpb24gfSkgLT5cbiAgICB0YXJnZXQ6ICdzbmlwcGV0J1xuICAgIHNuaXBwZXRWaWV3OiBAZ2V0U25pcHBldFZpZXcoZWxlbSlcbiAgICBwb3NpdGlvbjogcG9zaXRpb24gfHwgQGdldFBvc2l0aW9uT25TbmlwcGV0KGVsZW0sIHsgdG9wLCBsZWZ0IH0pXG5cblxuICBnZXRDbG9zZXN0U25pcHBldFRhcmdldDogKGNsb3Nlc3RTbmlwcGV0RGF0YSkgLT5cbiAgICBlbGVtID0gY2xvc2VzdFNuaXBwZXREYXRhLiRlbGVtWzBdXG4gICAgcG9zaXRpb24gPSBjbG9zZXN0U25pcHBldERhdGEucG9zaXRpb25cbiAgICBAZ2V0U25pcHBldFRhcmdldChlbGVtLCB7IHBvc2l0aW9uIH0pXG5cblxuICBnZXRDb250YWluZXJUYXJnZXQ6IChub2RlKSAtPlxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG4gICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG5cbiAgICB0YXJnZXQ6ICdjb250YWluZXInXG4gICAgbm9kZTogbm9kZVxuICAgIHNuaXBwZXRWaWV3OiBAZmluZFNuaXBwZXRWaWV3KG5vZGUpXG4gICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuXG5cbiAgZ2V0Um9vdFRhcmdldDogKG5vZGUpIC0+XG4gICAgc25pcHBldFRyZWUgPSAkKG5vZGUpLmRhdGEoJ3NuaXBwZXRUcmVlJylcblxuICAgIHRhcmdldDogJ3Jvb3QnXG4gICAgbm9kZTogbm9kZVxuICAgIHNuaXBwZXRUcmVlOiBzbmlwcGV0VHJlZVxuXG5cbiAgIyBGaWd1cmUgb3V0IGlmIHdlIHNob3VsZCBpbnNlcnQgYmVmb3JlIG9yIGFmdGVyIGEgc25pcHBldFxuICAjIGJhc2VkIG9uIHRoZSBjdXJzb3IgcG9zaXRpb24uXG4gIGdldFBvc2l0aW9uT25TbmlwcGV0OiAoZWxlbSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgIGlmIEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApIDwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgICdiZWZvcmUnXG4gICAgZWxzZVxuICAgICAgJ2FmdGVyJ1xuXG5cbiAgIyBHZXQgdGhlIGNsb3Nlc3Qgc25pcHBldCBpbiBhIGNvbnRhaW5lciBmb3IgYSB0b3AgbGVmdCBwb3NpdGlvblxuICBnZXRDbG9zZXN0U25pcHBldDogKGNvbnRhaW5lciwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICAkc25pcHBldHMgPSAkKGNvbnRhaW5lcikuZmluZChcIi4jeyBjc3Muc25pcHBldCB9XCIpXG4gICAgY2xvc2VzdCA9IHVuZGVmaW5lZFxuICAgIGNsb3Nlc3RTbmlwcGV0ID0gdW5kZWZpbmVkXG5cbiAgICAkc25pcHBldHMuZWFjaCAoaW5kZXgsIGVsZW0pID0+XG4gICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgICAgaWYgbm90IGNsb3Nlc3Q/IHx8IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApIDwgY2xvc2VzdFxuICAgICAgICBjbG9zZXN0ID0gQGRpc3RhbmNlKHRvcCwgZWxlbVRvcClcbiAgICAgICAgY2xvc2VzdFNuaXBwZXQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2JlZm9yZSd9XG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgICBjbG9zZXN0U25pcHBldCA9IHsgJGVsZW0sIHBvc2l0aW9uOiAnYWZ0ZXInfVxuXG4gICAgY2xvc2VzdFNuaXBwZXRcblxuXG4gIGRpc3RhbmNlOiAoYSwgYikgLT5cbiAgICBpZiBhID4gYiB0aGVuIGEtYiBlbHNlIGItYVxuXG5cbiAgIyBmb3JjZSBhbGwgY29udGFpbmVycyBvZiBhIHNuaXBwZXQgdG8gYmUgYXMgaGlnaCBhcyB0aGV5IGNhbiBiZVxuICAjIHNldHMgY3NzIHN0eWxlIGhlaWdodFxuICBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodDogKHZpZXcpIC0+XG4gICAgaWYgdmlldy50ZW1wbGF0ZS5jb250YWluZXJDb3VudCA+IDFcbiAgICAgIGZvciBuYW1lLCBlbGVtIG9mIHZpZXcuY29udGFpbmVyc1xuICAgICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgICAgY29udGludWUgaWYgJGVsZW0uaGFzQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcbiAgICAgICAgJHBhcmVudCA9ICRlbGVtLnBhcmVudCgpXG4gICAgICAgIHBhcmVudEhlaWdodCA9ICRwYXJlbnQuaGVpZ2h0KClcbiAgICAgICAgb3V0ZXIgPSAkZWxlbS5vdXRlckhlaWdodCh0cnVlKSAtICRlbGVtLmhlaWdodCgpXG4gICAgICAgICRlbGVtLmhlaWdodChwYXJlbnRIZWlnaHQgLSBvdXRlcilcbiAgICAgICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gICMgcmVtb3ZlIGFsbCBjc3Mgc3R5bGUgaGVpZ2h0IGRlY2xhcmF0aW9ucyBhZGRlZCBieVxuICAjIG1heGltaXplQ29udGFpbmVySGVpZ2h0KClcbiAgcmVzdG9yZUNvbnRhaW5lckhlaWdodDogKCkgLT5cbiAgICAkKFwiLiN7IGNzcy5tYXhpbWl6ZWRDb250YWluZXIgfVwiKVxuICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAucmVtb3ZlQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gIGdldEVsZW1lbnROb2RlOiAobm9kZSkgLT5cbiAgICBpZiBub2RlPy5qcXVlcnlcbiAgICAgIG5vZGVbMF1cbiAgICBlbHNlIGlmIG5vZGU/Lm5vZGVUeXBlID09IDMgIyBOb2RlLlRFWFRfTk9ERSA9PSAzXG4gICAgICBub2RlLnBhcmVudE5vZGVcbiAgICBlbHNlXG4gICAgICBub2RlXG5cblxuICAjIFNuaXBwZXRzIHN0b3JlIGEgcmVmZXJlbmNlIG9mIHRoZW1zZWx2ZXMgaW4gdGhlaXIgRG9tIG5vZGVcbiAgIyBjb25zaWRlcjogc3RvcmUgcmVmZXJlbmNlIGRpcmVjdGx5IHdpdGhvdXQgalF1ZXJ5XG4gIGdldFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICAkKG5vZGUpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgIyBHZXRCb3VuZGluZ0NsaWVudFJlY3Qgd2l0aCB0b3AgYW5kIGxlZnQgcmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50XG4gICMgKGlkZWFsIGZvciBhYnNvbHV0ZSBwb3NpdGlvbmVkIGVsZW1lbnRzKVxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IChub2RlKSAtPlxuICAgIGNvb3JkcyA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuICAgICMgY29kZSBmcm9tIG1kbjogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL3dpbmRvdy5zY3JvbGxYXG4gICAgc2Nyb2xsWCA9IGlmICh3aW5kb3cucGFnZVhPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbmRvdy5wYWdlWE9mZnNldCBlbHNlIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luZG93LmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW5kb3cuZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdFxuICAgIHNjcm9sbFkgPSBpZiAod2luZG93LnBhZ2VZT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW5kb3cucGFnZVlPZmZzZXQgZWxzZSAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbmRvdy5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luZG93LmRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcFxuXG4gICAgIyB0cmFuc2xhdGUgaW50byBhYnNvbHV0ZSBwb3NpdGlvbnNcbiAgICBjb29yZHMgPVxuICAgICAgdG9wOiBjb29yZHMudG9wICsgc2Nyb2xsWVxuICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tICsgc2Nyb2xsWVxuICAgICAgbGVmdDogY29vcmRzLmxlZnQgKyBzY3JvbGxYXG4gICAgICByaWdodDogY29vcmRzLnJpZ2h0ICsgc2Nyb2xsWFxuXG4gICAgY29vcmRzLmhlaWdodCA9IGNvb3Jkcy5ib3R0b20gLSBjb29yZHMudG9wXG4gICAgY29vcmRzLndpZHRoID0gY29vcmRzLnJpZ2h0IC0gY29vcmRzLmxlZnRcblxuICAgIGNvb3Jkc1xuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG4jIERyYWdCYXNlXG4jXG4jIFN1cHBvcnRlZCBkcmFnIG1vZGVzOlxuIyAtIERpcmVjdCAoc3RhcnQgaW1tZWRpYXRlbHkpXG4jIC0gTG9uZ3ByZXNzIChzdGFydCBhZnRlciBhIGRlbGF5IGlmIHRoZSBjdXJzb3IgZG9lcyBub3QgbW92ZSB0b28gbXVjaClcbiMgLSBNb3ZlIChzdGFydCBhZnRlciB0aGUgY3Vyc29yIG1vdmVkIGEgbWludW11bSBkaXN0YW5jZSlcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJhZ0Jhc2VcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlLCBvcHRpb25zKSAtPlxuICAgIEBtb2RlcyA9IFsnZGlyZWN0JywgJ2xvbmdwcmVzcycsICdtb3ZlJ11cblxuICAgIGRlZmF1bHRDb25maWcgPVxuICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG4gICAgICBvbkRyYWdTdGFydDogdW5kZWZpbmVkXG4gICAgICBzY3JvbGxBcmVhOiA1MFxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG4gICAgICBtb3ZlOlxuICAgICAgICBkaXN0YW5jZTogMFxuXG4gICAgQGRlZmF1bHRDb25maWcgPSAkLmV4dGVuZCh0cnVlLCBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuXG4gICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIEBzdGFydGVkID0gZmFsc2VcblxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIEBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuICAgIEBtb2RlID0gaWYgb3B0aW9ucy5kaXJlY3Q/XG4gICAgICAnZGlyZWN0J1xuICAgIGVsc2UgaWYgb3B0aW9ucy5sb25ncHJlc3M/XG4gICAgICAnbG9uZ3ByZXNzJ1xuICAgIGVsc2UgaWYgb3B0aW9ucy5tb3ZlP1xuICAgICAgJ21vdmUnXG4gICAgZWxzZVxuICAgICAgJ2xvbmdwcmVzcydcblxuXG4gIHNldERyYWdIYW5kbGVyOiAoZHJhZ0hhbmRsZXIpIC0+XG4gICAgQGRyYWdIYW5kbGVyID0gZHJhZ0hhbmRsZXJcbiAgICBAZHJhZ0hhbmRsZXIucGFnZSA9IEBwYWdlXG5cblxuICAjIHN0YXJ0IGEgcG9zc2libGUgZHJhZ1xuICAjIHRoZSBkcmFnIGlzIG9ubHkgcmVhbGx5IHN0YXJ0ZWQgaWYgY29uc3RyYWludHMgYXJlIG5vdCB2aW9sYXRlZCAobG9uZ3ByZXNzRGVsYXkgYW5kIGxvbmdwcmVzc0Rpc3RhbmNlTGltaXQgb3IgbWluRGlzdGFuY2UpXG4gIGluaXQ6IChkcmFnSGFuZGxlciwgZXZlbnQsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcbiAgICBAaW5pdGlhbGl6ZWQgPSB0cnVlXG4gICAgQHNldE9wdGlvbnMob3B0aW9ucylcbiAgICBAc2V0RHJhZ0hhbmRsZXIoZHJhZ0hhbmRsZXIpXG4gICAgQHN0YXJ0UG9pbnQgPSBAZ2V0VG9wTGVmdChldmVudClcblxuICAgIEBhZGRTdG9wTGlzdGVuZXJzKGV2ZW50KVxuICAgIEBhZGRNb3ZlTGlzdGVuZXJzKGV2ZW50KVxuXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIEBhZGRMb25ncHJlc3NJbmRpY2F0b3IoQHN0YXJ0UG9pbnQpXG4gICAgICBAdGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgICAgICBAc3RhcnQoQHN0YXJ0UG9pbnQpXG4gICAgICAgICwgQG9wdGlvbnMubG9uZ3ByZXNzLmRlbGF5XG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnZGlyZWN0J1xuICAgICAgQHN0YXJ0KEBzdGFydFBvaW50KVxuXG4gICAgIyBwcmV2ZW50IGJyb3dzZXIgRHJhZyAmIERyb3BcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpIGlmIEBvcHRpb25zLnByZXZlbnREZWZhdWx0XG5cblxuICBtb3ZlOiAodG9wTGVmdCkgLT5cbiAgICBpZiBAbW9kZSA9PSAnbG9uZ3ByZXNzJ1xuICAgICAgaWYgQGRpc3RhbmNlKHRvcExlZnQsIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLmxvbmdwcmVzcy50b2xlcmFuY2VcbiAgICAgICAgQHJlc2V0KClcbiAgICBlbHNlIGlmIEBtb2RlID09ICdtb3ZlJ1xuICAgICAgaWYgQGRpc3RhbmNlKHRvcExlZnQsIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLm1vdmUuZGlzdGFuY2VcbiAgICAgICAgQHN0YXJ0KHRvcExlZnQpXG5cblxuICAjIHN0YXJ0IHRoZSBkcmFnIHByb2Nlc3NcbiAgc3RhcnQ6ICh0b3BMZWZ0KSAtPlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuXG4gICAgIyBwcmV2ZW50IHRleHQtc2VsZWN0aW9ucyB3aGlsZSBkcmFnZ2luZ1xuICAgIEBwYWdlLiRib2R5LmFkZENsYXNzKGNvbmZpZy5jc3MucHJldmVudFNlbGVjdGlvbilcbiAgICBAZHJhZ0hhbmRsZXIuc3RhcnQodG9wTGVmdClcblxuXG4gIGRyb3A6IC0+XG4gICAgQGRyYWdIYW5kbGVyLmRyb3AoKSBpZiBAc3RhcnRlZFxuICAgIEByZXNldCgpXG5cblxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuICAgICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgQHBhZ2UuJGJvZHkucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuXG5cbiAgICBpZiBAaW5pdGlhbGl6ZWRcbiAgICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgICAgQGRyYWdIYW5kbGVyLnJlc2V0KClcbiAgICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgICAgaWYgQHRpbWVvdXQ/XG4gICAgICAgIGNsZWFyVGltZW91dChAdGltZW91dClcbiAgICAgICAgQHRpbWVvdXQgPSB1bmRlZmluZWRcblxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG4gICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcblxuXG4gIGFkZExvbmdwcmVzc0luZGljYXRvcjogKHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAb3B0aW9ucy5sb25ncHJlc3Muc2hvd0luZGljYXRvclxuICAgICRpbmRpY2F0b3IgPSAkKFwiPGRpdiBjbGFzcz1cXFwiI3sgY29uZmlnLmNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVxcXCI+PGRpdj48L2Rpdj48L2Rpdj5cIilcbiAgICAkaW5kaWNhdG9yLmNzcyh0b3A6IHRvcCwgbGVmdDogbGVmdClcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGluZGljYXRvcilcblxuXG4gIHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNvbmZpZy5jc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cIikucmVtb3ZlKClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBpbml0aWFsaXplZCBpbW1lZGlhdGVseSB0byBhbGxvdyBhIGxvbmctcHJlc3MgZmluaXNoXG4gIGFkZFN0b3BMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBldmVudE5hbWVzID1cbiAgICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICAgICd0b3VjaGVuZC5saXZpbmdkb2NzLWRyYWcgdG91Y2hjYW5jZWwubGl2aW5nZG9jcy1kcmFnIHRvdWNobGVhdmUubGl2aW5nZG9jcy1kcmFnJ1xuICAgICAgZWxzZVxuICAgICAgICAnbW91c2V1cC5saXZpbmdkb2NzLWRyYWcnXG5cbiAgICBAcGFnZS4kZG9jdW1lbnQub24gZXZlbnROYW1lcywgPT5cbiAgICAgIEBkcm9wKClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBwb3NzaWJseSBpbml0aWFsaXplZCB3aXRoIGEgZGVsYXkgaW4gc25pcHBldERyYWcjb25TdGFydFxuICBhZGRNb3ZlTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAndG91Y2htb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRUb3BMZWZ0KGV2ZW50KSwgZXZlbnQpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShAZ2V0VG9wTGVmdChldmVudCkpXG5cbiAgICBlbHNlICMgYWxsIG90aGVyIGlucHV0IGRldmljZXMgYmVoYXZlIGxpa2UgYSBtb3VzZVxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICdtb3VzZW1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRUb3BMZWZ0KGV2ZW50KSwgZXZlbnQpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShAZ2V0VG9wTGVmdChldmVudCkpXG5cblxuICAjIEdldCBUb3AgTGVmdCByZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQgKGFic29sdXRlKVxuICBnZXRUb3BMZWZ0OiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgfHwgZXZlbnQudHlwZSA9PSAndG91Y2htb3ZlJ1xuICAgICAgJ3RvcCc6IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVlcbiAgICAgICdsZWZ0JzogZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWFxuICAgIGVsc2VcbiAgICAgICd0b3AnOiBldmVudC5wYWdlWVxuICAgICAgJ2xlZnQnOiBldmVudC5wYWdlWFxuXG5cbiAgIyBHZXQgVG9wIExlZnQgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IChmaXhlZClcbiAgZ2V0VG9wTGVmdEZpeGVkOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgfHwgZXZlbnQudHlwZSA9PSAndG91Y2htb3ZlJ1xuICAgICAgJ3RvcCc6IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WVxuICAgICAgJ2xlZnQnOiBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFhcbiAgICBlbHNlXG4gICAgICAndG9wJzogZXZlbnQuY2xpZW50WVxuICAgICAgJ2xlZnQnOiBldmVudC5jbGllbnRYXG5cblxuICBkaXN0YW5jZTogKHBvaW50QSwgcG9pbnRCKSAtPlxuICAgIHJldHVybiB1bmRlZmluZWQgaWYgIXBvaW50QSB8fCAhcG9pbnRCXG5cbiAgICBkaXN0WCA9IHBvaW50QS5sZWZ0IC0gcG9pbnRCLmxlZnRcbiAgICBkaXN0WSA9IHBvaW50QS50b3AgLSBwb2ludEIudG9wXG4gICAgTWF0aC5zcXJ0KCAoZGlzdFggKiBkaXN0WCkgKyAoZGlzdFkgKiBkaXN0WSkgKVxuXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgRWRpdGFibGVKUyBDb250cm9sbGVyXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBJbnRlZ3JhdGUgRWRpdGFibGVKUyBpbnRvIExpdmluZ2RvY3Ncbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVDb250cm9sbGVyXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSkgLT5cbiAgICAjIGNvbmZpZ3VyZSBlZGl0YWJsZUpTXG4gICAgRWRpdGFibGUuaW5pdFxuICAgICAgbG9nOiBmYWxzZVxuXG4gICAgQGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIEBzZWxlY3Rpb24gPSAkLkNhbGxiYWNrcygpXG5cbiAgICBFZGl0YWJsZVxuICAgICAgLmZvY3VzKEB3aXRoQ29udGV4dChAZm9jdXMpKVxuICAgICAgLmJsdXIoQHdpdGhDb250ZXh0KEBibHVyKSlcbiAgICAgIC5pbnNlcnQoQHdpdGhDb250ZXh0KEBpbnNlcnQpKVxuICAgICAgLm1lcmdlKEB3aXRoQ29udGV4dChAbWVyZ2UpKVxuICAgICAgLnNwbGl0KEB3aXRoQ29udGV4dChAc3BsaXQpKVxuICAgICAgLnNlbGVjdGlvbihAd2l0aENvbnRleHQoQHNlbGVjdGlvbkNoYW5nZWQpKVxuICAgICAgLm5ld2xpbmUoQHdpdGhDb250ZXh0KEBuZXdsaW5lKSlcblxuXG4gICMgUmVnaXN0ZXIgRE9NIG5vZGVzIHdpdGggRWRpdGFibGVKUy5cbiAgIyBBZnRlciB0aGF0IEVkaXRhYmxlIHdpbGwgZmlyZSBldmVudHMgZm9yIHRoYXQgbm9kZS5cbiAgYWRkOiAobm9kZXMpIC0+XG4gICAgRWRpdGFibGUuYWRkKG5vZGVzKVxuXG5cbiAgZGlzYWJsZUFsbDogLT5cbiAgICAkKCdbY29udGVudGVkaXRhYmxlXScpLmF0dHIoJ2NvbnRlbnRlZGl0YWJsZScsICdmYWxzZScpXG5cblxuICByZWVuYWJsZUFsbDogLT5cbiAgICAkKCdbY29udGVudGVkaXRhYmxlXScpLmF0dHIoJ2NvbnRlbnRlZGl0YWJsZScsICd0cnVlJylcblxuXG4gICMgR2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZSBmcm9tIHRoZSBET00gZWxlbWVudCBwYXNzZWQgYnkgRWRpdGFibGVKU1xuICAjXG4gICMgQWxsIGxpc3RlbmVycyBwYXJhbXMgZ2V0IHRyYW5zZm9ybWVkIHNvIHRoZXkgZ2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZVxuICAjIGluc3RlYWQgb2YgZWxlbWVudDpcbiAgI1xuICAjIEV4YW1wbGU6IGxpc3RlbmVyKHZpZXcsIGVkaXRhYmxlTmFtZSwgb3RoZXJQYXJhbXMuLi4pXG4gIHdpdGhDb250ZXh0OiAoZnVuYykgLT5cbiAgICAoZWxlbWVudCwgYXJncy4uLikgPT5cbiAgICAgIHZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGVsZW1lbnQpXG4gICAgICBlZGl0YWJsZU5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShAZWRpdGFibGVBdHRyKVxuICAgICAgYXJncy51bnNoaWZ0KHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgIGZ1bmMuYXBwbHkodGhpcywgYXJncylcblxuXG4gIHVwZGF0ZU1vZGVsOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZhbHVlID0gdmlldy5nZXQoZWRpdGFibGVOYW1lKVxuICAgIGlmIGNvbmZpZy5zaW5nbGVMaW5lQnJlYWsudGVzdCh2YWx1ZSkgfHwgdmFsdWUgPT0gJydcbiAgICAgIHZhbHVlID0gdW5kZWZpbmVkXG5cbiAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIHZhbHVlKVxuXG5cbiAgZm9jdXM6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmlldy5mb2N1c0VkaXRhYmxlKGVkaXRhYmxlTmFtZSlcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlRm9jdXNlZChlbGVtZW50LCB2aWV3KVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgYmx1cjogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICB2aWV3LmJsdXJFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUJsdXJyZWQoZWxlbWVudCwgdmlldylcbiAgICBAdXBkYXRlTW9kZWwodmlldywgZWRpdGFibGVOYW1lKVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgaW5zZXJ0OiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgc25pcHBldE5hbWUgPSBAcGFnZS5kZXNpZ24ucGFyYWdyYXBoU25pcHBldFxuICAgICAgdGVtcGxhdGUgPSBAcGFnZS5kZXNpZ24uZ2V0KHNuaXBwZXROYW1lKVxuICAgICAgY29weSA9IHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuICAgICAgbmV3VmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICB2aWV3Lm1vZGVsLmJlZm9yZShjb3B5KVxuICAgICAgICB2aWV3LnByZXYoKVxuICAgICAgZWxzZVxuICAgICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICAgIHZpZXcubmV4dCgpXG5cbiAgICAgIG5ld1ZpZXcuZm9jdXMoKSBpZiBuZXdWaWV3XG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgbWVyZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgbWVyZ2VkVmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuIHZpZXcucHJldigpIGVsc2Ugdmlldy5uZXh0KClcblxuICAgICAgaWYgbWVyZ2VkVmlldyAmJiBtZXJnZWRWaWV3LnRlbXBsYXRlID09IHZpZXcudGVtcGxhdGVcblxuICAgICAgICAjIGNyZWF0ZSBkb2N1bWVudCBmcmFnbWVudFxuICAgICAgICBjb250ZW50cyA9IHZpZXcuZGlyZWN0aXZlcy4kZ2V0RWxlbShlZGl0YWJsZU5hbWUpLmNvbnRlbnRzKClcbiAgICAgICAgZnJhZyA9IEBwYWdlLmRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICAgICAgICBmb3IgZWwgaW4gY29udGVudHNcbiAgICAgICAgICBmcmFnLmFwcGVuZENoaWxkKGVsKVxuXG4gICAgICAgIG1lcmdlZFZpZXcuZm9jdXMoKVxuICAgICAgICBlbGVtID0gbWVyZ2VkVmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICAgICAgY3Vyc29yID0gRWRpdGFibGUuY3JlYXRlQ3Vyc29yKGVsZW0sIGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuICdlbmQnIGVsc2UgJ2JlZ2lubmluZycpXG4gICAgICAgIGN1cnNvclsgaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gJ2luc2VydEFmdGVyJyBlbHNlICdpbnNlcnRCZWZvcmUnIF0oZnJhZylcblxuICAgICAgICAjIE1ha2Ugc3VyZSB0aGUgbW9kZWwgb2YgdGhlIG1lcmdlZFZpZXcgaXMgdXAgdG8gZGF0ZVxuICAgICAgICAjIG90aGVyd2lzZSBidWdzIGxpa2UgaW4gaXNzdWUgIzU2IGNhbiBvY2N1ci5cbiAgICAgICAgY3Vyc29yLnNhdmUoKVxuICAgICAgICBAdXBkYXRlTW9kZWwobWVyZ2VkVmlldywgZWRpdGFibGVOYW1lKVxuICAgICAgICBjdXJzb3IucmVzdG9yZSgpXG5cbiAgICAgICAgdmlldy5tb2RlbC5yZW1vdmUoKVxuICAgICAgICBjdXJzb3Iuc2V0U2VsZWN0aW9uKClcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBzcGxpdDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgYmVmb3JlLCBhZnRlciwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgY29weSA9IHZpZXcudGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuXG4gICAgICAjIGdldCBjb250ZW50IG91dCBvZiAnYmVmb3JlJyBhbmQgJ2FmdGVyJ1xuICAgICAgYmVmb3JlQ29udGVudCA9IGJlZm9yZS5xdWVyeVNlbGVjdG9yKCcqJykuaW5uZXJIVE1MXG4gICAgICBhZnRlckNvbnRlbnQgPSBhZnRlci5xdWVyeVNlbGVjdG9yKCcqJykuaW5uZXJIVE1MXG5cbiAgICAgICMgc2V0IGVkaXRhYmxlIG9mIHNuaXBwZXRzIHRvIGlubmVySFRNTCBvZiBmcmFnbWVudHNcbiAgICAgIHZpZXcubW9kZWwuc2V0KGVkaXRhYmxlTmFtZSwgYmVmb3JlQ29udGVudClcbiAgICAgIGNvcHkuc2V0KGVkaXRhYmxlTmFtZSwgYWZ0ZXJDb250ZW50KVxuXG4gICAgICAjIGFwcGVuZCBhbmQgZm9jdXMgY29weSBvZiBzbmlwcGV0XG4gICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICB2aWV3Lm5leHQoKS5mb2N1cygpXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgc2VsZWN0aW9uQ2hhbmdlZDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgc2VsZWN0aW9uKSAtPlxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBzZWxlY3Rpb24uZmlyZSh2aWV3LCBlbGVtZW50LCBzZWxlY3Rpb24pXG5cblxuICBuZXdsaW5lOiAodmlldywgZWRpdGFibGUsIGN1cnNvcikgLT5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgaGFzU2luZ2xlRWRpdGFibGU6ICh2aWV3KSAtPlxuICAgIHZpZXcuZGlyZWN0aXZlcy5sZW5ndGggPT0gMSAmJiB2aWV3LmRpcmVjdGl2ZXNbMF0udHlwZSA9PSAnZWRpdGFibGUnXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5cbiMgRG9jdW1lbnQgRm9jdXNcbiMgLS0tLS0tLS0tLS0tLS1cbiMgTWFuYWdlIHRoZSBzbmlwcGV0IG9yIGVkaXRhYmxlIHRoYXQgaXMgY3VycmVudGx5IGZvY3VzZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRm9jdXNcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAZWRpdGFibGVOb2RlID0gdW5kZWZpbmVkXG4gICAgQHNuaXBwZXRWaWV3ID0gdW5kZWZpbmVkXG5cbiAgICBAc25pcHBldEZvY3VzID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0Qmx1ciA9ICQuQ2FsbGJhY2tzKClcblxuXG4gIHNldEZvY3VzOiAoc25pcHBldFZpZXcsIGVkaXRhYmxlTm9kZSkgLT5cbiAgICBpZiBlZGl0YWJsZU5vZGUgIT0gQGVkaXRhYmxlTm9kZVxuICAgICAgQHJlc2V0RWRpdGFibGUoKVxuICAgICAgQGVkaXRhYmxlTm9kZSA9IGVkaXRhYmxlTm9kZVxuXG4gICAgaWYgc25pcHBldFZpZXcgIT0gQHNuaXBwZXRWaWV3XG4gICAgICBAcmVzZXRTbmlwcGV0VmlldygpXG4gICAgICBpZiBzbmlwcGV0Vmlld1xuICAgICAgICBAc25pcHBldFZpZXcgPSBzbmlwcGV0Vmlld1xuICAgICAgICBAc25pcHBldEZvY3VzLmZpcmUoQHNuaXBwZXRWaWV3KVxuXG5cbiAgIyBjYWxsIGFmdGVyIGJyb3dzZXIgZm9jdXMgY2hhbmdlXG4gIGVkaXRhYmxlRm9jdXNlZDogKGVkaXRhYmxlTm9kZSwgc25pcHBldFZpZXcpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSAhPSBlZGl0YWJsZU5vZGVcbiAgICAgIHNuaXBwZXRWaWV3IHx8PSBkb20uZmluZFNuaXBwZXRWaWV3KGVkaXRhYmxlTm9kZSlcbiAgICAgIEBzZXRGb2N1cyhzbmlwcGV0VmlldywgZWRpdGFibGVOb2RlKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGJyb3dzZXIgZm9jdXMgY2hhbmdlXG4gIGVkaXRhYmxlQmx1cnJlZDogKGVkaXRhYmxlTm9kZSkgLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlID09IGVkaXRhYmxlTm9kZVxuICAgICAgQHNldEZvY3VzKEBzbmlwcGV0VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGNsaWNrXG4gIHNuaXBwZXRGb2N1c2VkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgQHNuaXBwZXRWaWV3ICE9IHNuaXBwZXRWaWV3XG4gICAgICBAc2V0Rm9jdXMoc25pcHBldFZpZXcsIHVuZGVmaW5lZClcblxuXG4gIGJsdXI6IC0+XG4gICAgQHNldEZvY3VzKHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxuXG5cbiAgIyBQcml2YXRlXG4gICMgLS0tLS0tLVxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0RWRpdGFibGU6IC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZVxuICAgICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgcmVzZXRTbmlwcGV0VmlldzogLT5cbiAgICBpZiBAc25pcHBldFZpZXdcbiAgICAgIHByZXZpb3VzID0gQHNuaXBwZXRWaWV3XG4gICAgICBAc25pcHBldFZpZXcgPSB1bmRlZmluZWRcbiAgICAgIEBzbmlwcGV0Qmx1ci5maXJlKHByZXZpb3VzKVxuXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuY3NzID0gY29uZmlnLmNzc1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXREcmFnXG5cbiAgd2lnZ2xlU3BhY2UgPSAwXG4gIHN0YXJ0QW5kRW5kT2Zmc2V0ID0gMFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldyB9KSAtPlxuICAgIEAkdmlldyA9IHNuaXBwZXRWaWV3LiRodG1sIGlmIHNuaXBwZXRWaWV3XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICBzdGFydDogKHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG4gICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLmRpc2FibGVBbGwoKVxuICAgIEBwYWdlLmJsdXJGb2N1c2VkRWxlbWVudCgpXG5cbiAgICAjIHBsYWNlaG9sZGVyIGJlbG93IGN1cnNvclxuICAgIEAkcGxhY2Vob2xkZXIgPSBAY3JlYXRlUGxhY2Vob2xkZXIoKVxuXG4gICAgIyBkcm9wIG1hcmtlclxuICAgIEAkZHJvcE1hcmtlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuZHJvcE1hcmtlciB9Jz5cIilcblxuICAgIEBwYWdlLiRib2R5XG4gICAgICAuYXBwZW5kKEAkZHJvcE1hcmtlcilcbiAgICAgIC5hcHBlbmQoQCRwbGFjZWhvbGRlcilcbiAgICAgIC5jc3MoJ2N1cnNvcicsICdwb2ludGVyJylcblxuICAgICMgbWFyayBkcmFnZ2VkIHNuaXBwZXRcbiAgICBAJHZpZXcuYWRkQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cblxuICAgICMgcG9zaXRpb24gdGhlIHBsYWNlaG9sZGVyXG4gICAgQG1vdmUoeyB0b3AsIGxlZnQgfSlcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIG1vdmU6ICh7IHRvcCwgbGVmdCB9KSAtPlxuICAgIGxlZnQgPSAyIGlmIGxlZnQgPCAyXG4gICAgdG9wID0gMiBpZiB0b3AgPCAyXG5cbiAgICBAJHBsYWNlaG9sZGVyLmNzcyh0b3A6IFwiI3sgdG9wIH1weFwiLCBsZWZ0OiBcIiN7IGxlZnQgfXB4XCIpXG4gICAgQHRhcmdldCA9IEBmaW5kRHJvcFRhcmdldCh7IHRvcCwgbGVmdCwgZXZlbnQgfSlcblxuICAgICMgQHNjcm9sbEludG9WaWV3KHRvcCwgZXZlbnQpXG5cblxuICBmaW5kRHJvcFRhcmdldDogKHsgdG9wLCBsZWZ0LCBldmVudCB9KSAtPlxuICAgIGVsZW0gPSBAZ2V0RWxlbVVuZGVyQ3Vyc29yKHRvcCwgbGVmdClcblxuICAgICMgcmV0dXJuIHRoZSBzYW1lIGFzIGxhc3QgdGltZSBpZiB0aGUgY3Vyc29yIGlzIGFib3ZlIHRoZSBkcm9wTWFya2VyXG4gICAgcmV0dXJuIEB0YXJnZXQgaWYgZWxlbSA9PSBAJGRyb3BNYXJrZXJbMF1cblxuICAgIHRhcmdldCA9IGRvbS5kcm9wVGFyZ2V0KGVsZW0sIHsgdG9wLCBsZWZ0IH0pIGlmIGVsZW0/XG4gICAgQHVuZG9NYWtlU3BhY2UoKVxuXG4gICAgaWYgdGFyZ2V0PyAmJiB0YXJnZXQuc25pcHBldFZpZXc/Lm1vZGVsICE9IEBzbmlwcGV0TW9kZWxcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIEBtYXJrRHJvcFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgIyBpZiB0YXJnZXQuY29udGFpbmVyTmFtZVxuICAgICAgIyAgIGRvbS5tYXhpbWl6ZUNvbnRhaW5lckhlaWdodCh0YXJnZXQucGFyZW50KVxuICAgICAgIyAgICRjb250YWluZXIgPSAkKHRhcmdldC5ub2RlKVxuICAgICAgIyBlbHNlIGlmIHRhcmdldC5zbmlwcGV0Vmlld1xuICAgICAgIyAgIGRvbS5tYXhpbWl6ZUNvbnRhaW5lckhlaWdodCh0YXJnZXQuc25pcHBldFZpZXcpXG4gICAgICAjICAgJGNvbnRhaW5lciA9IHRhcmdldC5zbmlwcGV0Vmlldy5nZXQkY29udGFpbmVyKClcblxuICAgICAgcmV0dXJuIHRhcmdldFxuICAgIGVsc2VcbiAgICAgIEAkZHJvcE1hcmtlci5oaWRlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuXG4gICAgICBpZiBub3QgdGFyZ2V0P1xuICAgICAgICBAJHBsYWNlaG9sZGVyLmFkZENsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBlbHNlXG4gICAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlQ2xhc3MoY3NzLm5vRHJvcClcblxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgbWFya0Ryb3BQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBzd2l0Y2ggdGFyZ2V0LnRhcmdldFxuICAgICAgd2hlbiAnc25pcHBldCdcbiAgICAgICAgQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG4gICAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcbiAgICAgIHdoZW4gJ3Jvb3QnXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQubm9kZSlcbiAgICAgICAgQGhpZ2hsaWdoQ29udGFpbmVyKCQodGFyZ2V0Lm5vZGUpKVxuXG5cbiAgc25pcHBldFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgYmVmb3JlID0gdGFyZ2V0LnNuaXBwZXRWaWV3LnByZXYoKVxuXG4gICAgICBpZiBiZWZvcmU/XG4gICAgICAgIGlmIGJlZm9yZS5tb2RlbCA9PSBAc25pcHBldE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2FmdGVyJ1xuICAgICAgICAgIHJldHVybiBAc25pcHBldFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgICBAc2hvd01hcmtlckJldHdlZW5TbmlwcGV0cyhiZWZvcmUsIHRhcmdldC5zbmlwcGV0VmlldylcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5zbmlwcGV0Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuICAgIGVsc2VcbiAgICAgIG5leHQgPSB0YXJnZXQuc25pcHBldFZpZXcubmV4dCgpXG4gICAgICBpZiBuZXh0P1xuICAgICAgICBpZiBuZXh0Lm1vZGVsID09IEBzbmlwcGV0TW9kZWxcbiAgICAgICAgICB0YXJnZXQucG9zaXRpb24gPSAnYmVmb3JlJ1xuICAgICAgICAgIHJldHVybiBAc25pcHBldFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgICBAc2hvd01hcmtlckJldHdlZW5TbmlwcGV0cyh0YXJnZXQuc25pcHBldFZpZXcsIG5leHQpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcih0YXJnZXQuc25pcHBldFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcblxuXG4gIHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHM6ICh2aWV3QSwgdmlld0IpIC0+XG4gICAgYm94QSA9IGRvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3Qodmlld0EuJGVsZW1bMF0pXG4gICAgYm94QiA9IGRvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3Qodmlld0IuJGVsZW1bMF0pXG5cbiAgICBoYWxmR2FwID0gaWYgYm94Qi50b3AgPiBib3hBLmJvdHRvbVxuICAgICAgKGJveEIudG9wIC0gYm94QS5ib3R0b20pIC8gMlxuICAgIGVsc2VcbiAgICAgIDBcblxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3hBLmxlZnRcbiAgICAgIHRvcDogYm94QS5ib3R0b20gKyBoYWxmR2FwXG4gICAgICB3aWR0aDogYm94QS53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5maXJzdENoaWxkLCAndG9wJylcbiAgICBib3ggPSBkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC50b3AgKyBzdGFydEFuZEVuZE9mZnNldFxuICAgICAgd2lkdGg6IGJveC53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5sYXN0Q2hpbGQsICdib3R0b20nKVxuICAgIGJveCA9IGRvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LmJvdHRvbSAtIHN0YXJ0QW5kRW5kT2Zmc2V0XG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyOiAoeyB0b3AsIGxlZnQsIHdpZHRoIH0pIC0+XG4gICAgQCRkcm9wTWFya2VyXG4gICAgICAuY3NzXG4gICAgICAgIGxlZnQ6ICBcIiN7IGxlZnQgfXB4XCJcbiAgICAgICAgdG9wOiAgIFwiI3sgdG9wIH1weFwiXG4gICAgICAgIHdpZHRoOiBcIiN7IHdpZHRoIH1weFwiXG4gICAgICAuc2hvdygpXG5cblxuICBtYWtlU3BhY2U6IChub2RlLCBwb3NpdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIG5vZGU/ICYmIHdpZ2dsZVNwYWNlXG4gICAgJG5vZGUgPSAkKG5vZGUpXG4gICAgQGxhc3RUcmFuc2Zvcm0gPSAkbm9kZVxuXG4gICAgaWYgcG9zaXRpb24gPT0gJ3RvcCdcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsICN7IHdpZ2dsZVNwYWNlIH1weClcIilcbiAgICBlbHNlXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAtI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuXG5cbiAgdW5kb01ha2VTcGFjZTogKG5vZGUpIC0+XG4gICAgaWYgQGxhc3RUcmFuc2Zvcm0/XG4gICAgICBAbGFzdFRyYW5zZm9ybS5jc3ModHJhbnNmb3JtOiAnJylcbiAgICAgIEBsYXN0VHJhbnNmb3JtID0gdW5kZWZpbmVkXG5cblxuICBoaWdobGlnaENvbnRhaW5lcjogKCRjb250YWluZXIpIC0+XG4gICAgaWYgJGNvbnRhaW5lclswXSAhPSBAJGhpZ2hsaWdodGVkQ29udGFpbmVyWzBdXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9ICRjb250YWluZXJcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIuYWRkQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG5cblxuICByZW1vdmVDb250YWluZXJIaWdobGlnaHQ6IC0+XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gIGdldEVsZW1VbmRlckN1cnNvcjogKHRvcCwgbGVmdCkgLT5cbiAgICB0b3AgPSB0b3AgLSBAcGFnZS4kYm9keS5zY3JvbGxUb3AoKVxuICAgIGxlZnQgPSBsZWZ0IC0gQHBhZ2UuJGJvZHkuc2Nyb2xsTGVmdCgpXG5cbiAgICBAJHBsYWNlaG9sZGVyLmhpZGUoKVxuICAgIGVsZW0gPSBAcGFnZS5kb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGxlZnQsIHRvcClcbiAgICBAJHBsYWNlaG9sZGVyLnNob3coKVxuICAgIGVsZW1cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIGRyb3A6IC0+XG4gICAgaWYgQHRhcmdldD9cbiAgICAgIEBtb3ZlVG9UYXJnZXQoQHRhcmdldClcbiAgICAgIEBwYWdlLnNuaXBwZXRXYXNEcm9wcGVkLmZpcmUoQHNuaXBwZXRNb2RlbClcbiAgICBlbHNlXG4gICAgICAjY29uc2lkZXI6IG1heWJlIGFkZCBhICdkcm9wIGZhaWxlZCcgZWZmZWN0XG5cblxuICAjIE1vdmUgdGhlIHNuaXBwZXQgYWZ0ZXIgYSBzdWNjZXNzZnVsIGRyb3BcbiAgbW92ZVRvVGFyZ2V0OiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdzbmlwcGV0J1xuICAgICAgICBzbmlwcGV0VmlldyA9IHRhcmdldC5zbmlwcGV0Vmlld1xuICAgICAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBzbmlwcGV0Vmlldy5tb2RlbC5iZWZvcmUoQHNuaXBwZXRNb2RlbClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmFmdGVyKEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHRhcmdldC5zbmlwcGV0Vmlldy5tb2RlbFxuICAgICAgICBzbmlwcGV0TW9kZWwuYXBwZW5kKHRhcmdldC5jb250YWluZXJOYW1lLCBAc25pcHBldE1vZGVsKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgc25pcHBldFRyZWUgPSB0YXJnZXQuc25pcHBldFRyZWVcbiAgICAgICAgc25pcHBldFRyZWUucHJlcGVuZChAc25pcHBldE1vZGVsKVxuXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICAjIFJlc2V0IGlzIGFsd2F5cyBjYWxsZWQgYWZ0ZXIgYSBkcmFnIGVuZGVkLlxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuXG4gICAgICAjIHVuZG8gRE9NIGNoYW5nZXNcbiAgICAgIEB1bmRvTWFrZVNwYWNlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgQHBhZ2UuJGJvZHkuY3NzKCdjdXJzb3InLCAnJylcbiAgICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5yZWVuYWJsZUFsbCgpXG4gICAgICBAJHZpZXcucmVtb3ZlQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cbiAgICAgIGRvbS5yZXN0b3JlQ29udGFpbmVySGVpZ2h0KClcblxuICAgICAgIyByZW1vdmUgZWxlbWVudHNcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlKClcbiAgICAgIEAkZHJvcE1hcmtlci5yZW1vdmUoKVxuXG5cbiAgY3JlYXRlUGxhY2Vob2xkZXI6IC0+XG4gICAgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgPSAxXG4gICAgdGVtcGxhdGUgPSBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyIH1cIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlciB9XCI+XG4gICAgICAgICAgI3sgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgfVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIFNlbGVjdGVkIEl0ZW1cbiAgICAgIDwvZGl2PlxuICAgICAgXCJcIlwiXG5cbiAgICAkcGxhY2Vob2xkZXIgPSAkKHRlbXBsYXRlKVxuICAgICAgLmNzcyhwb3NpdGlvbjogXCJhYnNvbHV0ZVwiKVxuIiwiIyBDYW4gcmVwbGFjZSB4bWxkb20gaW4gdGhlIGJyb3dzZXIuXG4jIE1vcmUgYWJvdXQgeG1sZG9tOiBodHRwczovL2dpdGh1Yi5jb20vamluZHcveG1sZG9tXG4jXG4jIE9uIG5vZGUgeG1sZG9tIGlzIHJlcXVpcmVkLiBJbiB0aGUgYnJvd3NlclxuIyBET01QYXJzZXIgYW5kIFhNTFNlcmlhbGl6ZXIgYXJlIGFscmVhZHkgbmF0aXZlIG9iamVjdHMuXG5cbiMgRE9NUGFyc2VyXG5leHBvcnRzLkRPTVBhcnNlciA9IGNsYXNzIERPTVBhcnNlclNoaW1cblxuICBwYXJzZUZyb21TdHJpbmc6ICh4bWxUZW1wbGF0ZSkgLT5cbiAgICAjIG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoeG1sVGVtcGxhdGUpIGRvZXMgbm90IHdvcmsgdGhlIHNhbWVcbiAgICAjIGluIHRoZSBicm93c2VyIGFzIHdpdGggeG1sZG9tLiBTbyB3ZSB1c2UgalF1ZXJ5IHRvIG1ha2UgdGhpbmdzIHdvcmsuXG4gICAgJC5wYXJzZVhNTCh4bWxUZW1wbGF0ZSlcblxuXG4jIFhNTFNlcmlhbGl6ZXJcbmV4cG9ydHMuWE1MU2VyaWFsaXplciA9IFhNTFNlcmlhbGl6ZXJcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG53b3JkcyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvd29yZHMnKVxuXG5EZXNpZ24gPSByZXF1aXJlKCcuLi9kZXNpZ24vZGVzaWduJylcblNuaXBwZXRUcmVlID0gcmVxdWlyZSgnLi4vc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZScpXG5cbkRPTVBhcnNlciA9IHJlcXVpcmUoJ3htbGRvbScpLkRPTVBhcnNlclxuWE1MU2VyaWFsaXplciA9IHJlcXVpcmUoJ3htbGRvbScpLlhNTFNlcmlhbGl6ZXJcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBLaWNrc3RhcnRcblxuICBjb25zdHJ1Y3RvcjogKHsgeG1sVGVtcGxhdGUsIHNjcmlwdE5vZGUsIGRlc3RpbmF0aW9uLCBkZXNpZ259ID0ge30pIC0+XG4gICAgdW5sZXNzIHRoaXMgaW5zdGFuY2VvZiBLaWNrc3RhcnRcbiAgICAgIHJldHVybiBuZXcgS2lja3N0YXJ0KHsgeG1sVGVtcGxhdGUsIHNjcmlwdE5vZGUsIGRlc3RpbmF0aW9uLCBkZXNpZ24gfSlcblxuICAgIGFzc2VydCBzY3JpcHROb2RlIHx8IHhtbFRlbXBsYXRlLCAnUGxlYXNlIHByb3ZpZGUgcGFyYW1ldGVyIFwieG1sVGVtcGxhdGVcIiBvciBcInNjcmlwdE5vZGVcIidcblxuICAgIGlmIHNjcmlwdE5vZGVcbiAgICAgIHhtbFRlbXBsYXRlID0gXCI8cm9vdD5cIiArICQoc2NyaXB0Tm9kZSkudGV4dCgpICsgXCI8L3Jvb3Q+XCJcblxuICAgIEB0ZW1wbGF0ZSA9IEtpY2tzdGFydC5wYXJzZVhNTCh4bWxUZW1wbGF0ZSlcbiAgICBAZGVzaWduID0gbmV3IERlc2lnbihkZXNpZ24pXG4gICAgQHNuaXBwZXRUcmVlID0gbmV3IFNuaXBwZXRUcmVlKClcblxuICAgIEBhZGRSb290U25pcHBldHMoJChAdGVtcGxhdGUpLmNoaWxkcmVuKCkpXG5cblxuICAjIFBhcnNlIFhNTCBhbmQgcmV0dXJuIHRoZSByb290IG5vZGVcbiAgI1xuICAjIE9uIG5vZGUgeG1sZG9tIGlzIHJlcXVpcmVkLiBJbiB0aGUgYnJvd3NlclxuICAjIERPTVBhcnNlciBhbmQgWE1MU2VyaWFsaXplciBhcmUgYWxyZWFkeSBuYXRpdmUgb2JqZWN0cy5cbiAgQHBhcnNlWE1MOiAoeG1sVGVtcGxhdGUpIC0+XG4gICAgIyB4bWxEb2MgPSAkLnBhcnNlWE1MKHhtbFRlbXBsYXRlKVxuICAgIHhtbERvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoeG1sVGVtcGxhdGUpXG4gICAgeG1sRG9jLmZpcnN0Q2hpbGRcblxuXG4gIGFkZFJvb3RTbmlwcGV0czogKHhtbEVsZW1lbnRzKSAtPlxuICAgIGZvciB4bWxFbGVtZW50LCBpbmRleCBpbiB4bWxFbGVtZW50c1xuICAgICAgc25pcHBldE1vZGVsID0gQGNyZWF0ZVNuaXBwZXQoeG1sRWxlbWVudClcbiAgICAgIEBzZXRDaGlsZHJlbihzbmlwcGV0TW9kZWwsIHhtbEVsZW1lbnQpXG4gICAgICByb3cgPSBAc25pcHBldFRyZWUuYXBwZW5kKHNuaXBwZXRNb2RlbClcblxuXG4gIHNldENoaWxkcmVuOiAoc25pcHBldE1vZGVsLCBzbmlwcGV0WE1MKSAtPlxuICAgIEBwb3B1bGF0ZVNuaXBwZXRDb250YWluZXJzKHNuaXBwZXRNb2RlbCwgc25pcHBldFhNTClcbiAgICBAc2V0RWRpdGFibGVzKHNuaXBwZXRNb2RlbCwgc25pcHBldFhNTClcbiAgICBAc2V0RWRpdGFibGVTdHlsZXMoc25pcHBldE1vZGVsLCBzbmlwcGV0WE1MKVxuXG5cbiAgcG9wdWxhdGVTbmlwcGV0Q29udGFpbmVyczogKHNuaXBwZXRNb2RlbCwgc25pcHBldFhNTCkgLT5cbiAgICBkaXJlY3RpdmVzID0gc25pcHBldE1vZGVsLnRlbXBsYXRlLmRpcmVjdGl2ZXNcbiAgICBpZiBkaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIGRpcmVjdGl2ZXMuY29udGFpbmVyXG4gICAgICBoYXNPbmx5T25lQ29udGFpbmVyID0gdHJ1ZVxuICAgICAgY29udGFpbmVyRGlyZWN0aXZlID0gZGlyZWN0aXZlcy5jb250YWluZXJbMF1cblxuICAgICMgYWRkIHNuaXBwZXRzIHRvIGRlZmF1bHQgY29udGFpbmVyIGlmIG5vIG90aGVyIGNvbnRhaW5lcnMgZXhpc3RzXG4gICAgaWYgaGFzT25seU9uZUNvbnRhaW5lciAmJiAhQGRlc2NlbmRhbnRzKHNuaXBwZXRYTUwsIGNvbnRhaW5lckRpcmVjdGl2ZS5uYW1lKS5sZW5ndGhcbiAgICAgIGZvciBjaGlsZCBpbiBAZGVzY2VuZGFudHMoc25pcHBldFhNTClcbiAgICAgICAgQGFwcGVuZFNuaXBwZXRUb0NvbnRhaW5lcihzbmlwcGV0TW9kZWwsIGNoaWxkLCBjb250YWluZXJEaXJlY3RpdmUubmFtZSlcblxuICAgIGVsc2VcbiAgICAgIGNvbnRhaW5lcnMgPSBpZiBzbmlwcGV0TW9kZWwuY29udGFpbmVycyB0aGVuIE9iamVjdC5rZXlzKHNuaXBwZXRNb2RlbC5jb250YWluZXJzKSBlbHNlIFtdXG4gICAgICBmb3IgY29udGFpbmVyIGluIGNvbnRhaW5lcnNcbiAgICAgICAgZm9yIGVkaXRhYmxlQ29udGFpbmVyIGluIEBkZXNjZW5kYW50cyhzbmlwcGV0WE1MLCBjb250YWluZXIpXG4gICAgICAgICAgZm9yIGNoaWxkIGluIEBkZXNjZW5kYW50cyhlZGl0YWJsZUNvbnRhaW5lcilcbiAgICAgICAgICAgIEBhcHBlbmRTbmlwcGV0VG9Db250YWluZXIoc25pcHBldE1vZGVsLCBjaGlsZCwgQG5vZGVOYW1lVG9DYW1lbENhc2UoZWRpdGFibGVDb250YWluZXIpKVxuXG5cbiAgYXBwZW5kU25pcHBldFRvQ29udGFpbmVyOiAoc25pcHBldE1vZGVsLCBzbmlwcGV0WE1MLCByZWdpb24pIC0+XG4gICAgc25pcHBldCA9IEBjcmVhdGVTbmlwcGV0KHNuaXBwZXRYTUwpXG4gICAgc25pcHBldE1vZGVsLmFwcGVuZChyZWdpb24sIHNuaXBwZXQpXG4gICAgQHNldENoaWxkcmVuKHNuaXBwZXQsIHNuaXBwZXRYTUwpXG5cblxuICBzZXRFZGl0YWJsZXM6IChzbmlwcGV0TW9kZWwsIHNuaXBwZXRYTUwpIC0+XG4gICAgZm9yIGVkaXRhYmxlTmFtZSBvZiBzbmlwcGV0TW9kZWwuY29udGVudFxuICAgICAgdmFsdWUgPSBAZ2V0VmFsdWVGb3JFZGl0YWJsZShlZGl0YWJsZU5hbWUsIHNuaXBwZXRYTUwsIHNuaXBwZXRNb2RlbC50ZW1wbGF0ZS5kaXJlY3RpdmVzLmxlbmd0aClcbiAgICAgIHNuaXBwZXRNb2RlbC5zZXQoZWRpdGFibGVOYW1lLCB2YWx1ZSkgaWYgdmFsdWVcblxuXG4gIGdldFZhbHVlRm9yRWRpdGFibGU6IChlZGl0YWJsZU5hbWUsIHNuaXBwZXRYTUwsIGRpcmVjdGl2ZXNRdWFudGl0eSkgLT5cbiAgICBjaGlsZCA9IEBkZXNjZW5kYW50cyhzbmlwcGV0WE1MLCBlZGl0YWJsZU5hbWUpWzBdXG4gICAgdmFsdWUgPSBAZ2V0WG1sVmFsdWUoY2hpbGQpXG5cbiAgICBpZiAhdmFsdWUgJiYgZGlyZWN0aXZlc1F1YW50aXR5ID09IDFcbiAgICAgIGxvZy53YXJuKFwiVGhlIGVkaXRhYmxlICcje2VkaXRhYmxlTmFtZX0nIG9mICcje0Bub2RlVG9TbmlwcGV0TmFtZShzbmlwcGV0WE1MKX0nIGhhcyBubyBjb250ZW50LiBEaXNwbGF5IHBhcmVudCBIVE1MIGluc3RlYWQuXCIpXG4gICAgICB2YWx1ZSA9IEBnZXRYbWxWYWx1ZShzbmlwcGV0WE1MKVxuXG4gICAgdmFsdWVcblxuXG4gIG5vZGVOYW1lVG9DYW1lbENhc2U6IChlbGVtZW50KSAtPlxuICAgIHdvcmRzLmNhbWVsaXplKGVsZW1lbnQubm9kZU5hbWUpXG5cblxuICBzZXRFZGl0YWJsZVN0eWxlczogKHNuaXBwZXRNb2RlbCwgc25pcHBldFhNTCkgLT5cbiAgICBzdHlsZXMgPSAkKHNuaXBwZXRYTUwpLmF0dHIoY29uZmlnLmtpY2tzdGFydC5hdHRyLnN0eWxlcylcbiAgICBpZiBzdHlsZXNcbiAgICAgIHN0eWxlcyA9IHN0eWxlcy5zcGxpdCgvXFxzKjtcXHMqLylcbiAgICAgIGZvciBzdHlsZSBpbiBzdHlsZXNcbiAgICAgICAgc3R5bGUgPSBzdHlsZS5zcGxpdCgvXFxzKjpcXHMqLylcbiAgICAgICAgc25pcHBldE1vZGVsLnNldFN0eWxlKHN0eWxlWzBdLCBzdHlsZVsxXSkgaWYgc3R5bGUubGVuZ3RoID4gMVxuXG5cbiAgIyBDb252ZXJ0IGEgZG9tIGVsZW1lbnQgaW50byBhIGNhbWVsQ2FzZSBzbmlwcGV0TmFtZVxuICBub2RlVG9TbmlwcGV0TmFtZTogKGVsZW1lbnQpIC0+XG4gICAgc25pcHBldE5hbWUgPSBAbm9kZU5hbWVUb0NhbWVsQ2FzZShlbGVtZW50KVxuICAgIHNuaXBwZXQgPSBAZGVzaWduLmdldChzbmlwcGV0TmFtZSlcblxuICAgIGFzc2VydCBzbmlwcGV0LFxuICAgICAgXCJUaGUgVGVtcGxhdGUgbmFtZWQgJyN7c25pcHBldE5hbWV9JyBkb2VzIG5vdCBleGlzdC5cIlxuXG4gICAgc25pcHBldE5hbWVcblxuXG4gIGNyZWF0ZVNuaXBwZXQ6ICh4bWwpIC0+XG4gICAgQGRlc2lnbi5nZXQoQG5vZGVUb1NuaXBwZXROYW1lKHhtbCkpLmNyZWF0ZU1vZGVsKClcblxuXG4gIGRlc2NlbmRhbnRzOiAoeG1sLCBub2RlTmFtZSkgLT5cbiAgICB0YWdMaW1pdGVyID0gd29yZHMuc25ha2VDYXNlKG5vZGVOYW1lKSBpZiBub2RlTmFtZVxuICAgICQoeG1sKS5jaGlsZHJlbih0YWdMaW1pdGVyKVxuXG5cbiAgZ2V0WG1sVmFsdWU6IChub2RlKSAtPlxuICAgIGlmIG5vZGVcbiAgICAgIHN0cmluZyA9IG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcobm9kZSlcbiAgICAgIHN0YXJ0ID0gc3RyaW5nLmluZGV4T2YoJz4nKSArIDFcbiAgICAgIGVuZCA9IHN0cmluZy5sYXN0SW5kZXhPZignPCcpXG4gICAgICBpZiBlbmQgPiBzdGFydFxuICAgICAgICBzdHJpbmcuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpXG5cblxuICBnZXRTbmlwcGV0VHJlZTogLT5cbiAgICBAc25pcHBldFRyZWVcblxuXG4gIHRvSHRtbDogLT5cbiAgICByZW5kZXJlciA9IG5ldyBSZW5kZXJlclxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBuZXcgUmVuZGVyaW5nQ29udGFpbmVyKClcblxuICAgIHJlbmRlcmVyLmh0bWwoKVxuXG4iLCIjIEhlbHBlciBtZXRob2QgdG8gY3JlYXRlIGNoYWluYWJsZSBwcm94aWVzLlxuI1xuIyBSZXR1cm5zIGEgbWV0aG9kIHRoYXQgd29ya3MgdGhlIHNhbWUgYXMgJC5wcm94eSgpIGJ1dCBhbHdheXMgcmV0dXJucyB0aGUgY2hhaW5lZE9ialxuIyAqaXRzIG1vc3RseSB0aGUgc2FtZSBjb2RlIGFzICQucHJveHkgOykqXG5tb2R1bGUuZXhwb3J0cyA9IChjaGFpbmVkT2JqKSAtPlxuXG4gIChmbiwgY29udGV4dCkgLT5cbiAgICBpZiB0eXBlb2YgY29udGV4dCA9PSAnc3RyaW5nJ1xuICAgICAgdG1wID0gZm5bIGNvbnRleHQgXVxuICAgICAgY29udGV4dCA9IGZuXG4gICAgICBmbiA9IHRtcFxuXG4gICAgIyBTaW11bGF0ZWQgYmluZFxuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAyIClcbiAgICBwcm94eSA9IC0+XG4gICAgICBmbi5hcHBseSggY29udGV4dCB8fCB0aGlzLCBhcmdzLmNvbmNhdCggQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cyApICkgKVxuICAgICAgY2hhaW5lZE9ialxuXG4gICAgcHJveHlcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEFkZCBhbiBldmVudCBsaXN0ZW5lciB0byBhICQuQ2FsbGJhY2tzIG9iamVjdCB0aGF0IHdpbGxcbiAgIyByZW1vdmUgaXRzZWxmIGZyb20gaXRzICQuQ2FsbGJhY2tzIGFmdGVyIHRoZSBmaXJzdCBjYWxsLlxuICBjYWxsT25jZTogKGNhbGxiYWNrcywgbGlzdGVuZXIpIC0+XG4gICAgc2VsZlJlbW92aW5nRnVuYyA9IChhcmdzLi4uKSAtPlxuICAgICAgY2FsbGJhY2tzLnJlbW92ZShzZWxmUmVtb3ZpbmdGdW5jKVxuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncylcblxuICAgIGNhbGxiYWNrcy5hZGQoc2VsZlJlbW92aW5nRnVuYylcbiAgICBzZWxmUmVtb3ZpbmdGdW5jXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaWRDb3VudGVyID0gbGFzdElkID0gdW5kZWZpbmVkXG5cbiAgIyBHZW5lcmF0ZSBhIHVuaXF1ZSBpZC5cbiAgIyBHdWFyYW50ZWVzIGEgdW5pcXVlIGlkIGluIHRoaXMgcnVudGltZS5cbiAgIyBBY3Jvc3MgcnVudGltZXMgaXRzIGxpa2VseSBidXQgbm90IGd1YXJhbnRlZWQgdG8gYmUgdW5pcXVlXG4gICMgVXNlIHRoZSB1c2VyIHByZWZpeCB0byBhbG1vc3QgZ3VhcmFudGVlIHVuaXF1ZW5lc3MsXG4gICMgYXNzdW1pbmcgdGhlIHNhbWUgdXNlciBjYW5ub3QgZ2VuZXJhdGUgc25pcHBldHMgaW5cbiAgIyBtdWx0aXBsZSBydW50aW1lcyBhdCB0aGUgc2FtZSB0aW1lIChhbmQgdGhhdCBjbG9ja3MgYXJlIGluIHN5bmMpXG4gIG5leHQ6ICh1c2VyID0gJ2RvYycpIC0+XG5cbiAgICAjIGdlbmVyYXRlIDktZGlnaXQgdGltZXN0YW1wXG4gICAgbmV4dElkID0gRGF0ZS5ub3coKS50b1N0cmluZygzMilcblxuICAgICMgYWRkIGNvdW50ZXIgaWYgbXVsdGlwbGUgdHJlZXMgbmVlZCBpZHMgaW4gdGhlIHNhbWUgbWlsbGlzZWNvbmRcbiAgICBpZiBsYXN0SWQgPT0gbmV4dElkXG4gICAgICBpZENvdW50ZXIgKz0gMVxuICAgIGVsc2VcbiAgICAgIGlkQ291bnRlciA9IDBcbiAgICAgIGxhc3RJZCA9IG5leHRJZFxuXG4gICAgXCIjeyB1c2VyIH0tI3sgbmV4dElkIH0jeyBpZENvdW50ZXIgfVwiXG4iLCJsb2NhbHN0b3JlID0gcmVxdWlyZSgnLi9sb2NhbHN0b3JlJylcblxuIyBMaW1pdGVkTG9jYWxzdG9yZSBpcyBhIHdyYXBwZXIgYXJvdW5kIGxvY2Fsc3RvcmUgdGhhdFxuIyBzYXZlcyBvbmx5IGEgbGltaXRlZCBudW1iZXIgb2YgZW50cmllcyBhbmQgZGlzY2FyZHNcbiMgdGhlIG9sZGVzdCBvbmVzIGFmdGVyIHRoYXQuXG4jXG4jIFlvdSBzaG91bGQgb25seSBldmVyIGNyZWF0ZSBvbmUgaW5zdGFuY2UgYnkgYGtleWAuXG4jIFRoZSBsaW1pdCBjYW4gY2hhbmdlIGJldHdlZW4gc2Vzc2lvbnMsXG4jIGl0IHdpbGwganVzdCBkaXNjYXJkIGFsbCBlbnRyaWVzIHVudGlsIHRoZSBsaW1pdCBpcyBtZXRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTGltaXRlZExvY2Fsc3RvcmVcblxuICBjb25zdHJ1Y3RvcjogKEBrZXksIEBsaW1pdCkgLT5cbiAgICBAbGltaXQgfHw9IDEwXG4gICAgQGluZGV4ID0gdW5kZWZpbmVkXG5cblxuICBwdXNoOiAob2JqKSAtPlxuICAgIHJlZmVyZW5jZSA9XG4gICAgICBrZXk6IEBuZXh0S2V5KClcbiAgICAgIGRhdGU6IERhdGUubm93KClcblxuICAgIGluZGV4ID0gQGdldEluZGV4KClcbiAgICBpbmRleC5wdXNoKHJlZmVyZW5jZSlcblxuICAgIHdoaWxlIGluZGV4Lmxlbmd0aCA+IEBsaW1pdFxuICAgICAgcmVtb3ZlUmVmID0gaW5kZXhbMF1cbiAgICAgIGluZGV4LnNwbGljZSgwLCAxKVxuICAgICAgbG9jYWxzdG9yZS5yZW1vdmUocmVtb3ZlUmVmLmtleSlcblxuICAgIGxvY2Fsc3RvcmUuc2V0KHJlZmVyZW5jZS5rZXksIG9iailcbiAgICBsb2NhbHN0b3JlLnNldChcIiN7IEBrZXkgfS0taW5kZXhcIiwgaW5kZXgpXG5cblxuICBwb3A6IC0+XG4gICAgaW5kZXggPSBAZ2V0SW5kZXgoKVxuICAgIGlmIGluZGV4ICYmIGluZGV4Lmxlbmd0aFxuICAgICAgcmVmZXJlbmNlID0gaW5kZXgucG9wKClcbiAgICAgIHZhbHVlID0gbG9jYWxzdG9yZS5nZXQocmVmZXJlbmNlLmtleSlcbiAgICAgIGxvY2Fsc3RvcmUucmVtb3ZlKHJlZmVyZW5jZS5rZXkpXG4gICAgICBAc2V0SW5kZXgoKVxuICAgICAgdmFsdWVcbiAgICBlbHNlXG4gICAgICB1bmRlZmluZWRcblxuXG4gIGdldDogKG51bSkgLT5cbiAgICBpbmRleCA9IEBnZXRJbmRleCgpXG4gICAgaWYgaW5kZXggJiYgaW5kZXgubGVuZ3RoXG4gICAgICBudW0gfHw9IGluZGV4Lmxlbmd0aCAtIDFcbiAgICAgIHJlZmVyZW5jZSA9IGluZGV4W251bV1cbiAgICAgIHZhbHVlID0gbG9jYWxzdG9yZS5nZXQocmVmZXJlbmNlLmtleSlcbiAgICBlbHNlXG4gICAgICB1bmRlZmluZWRcblxuXG4gIGNsZWFyOiAtPlxuICAgIGluZGV4ID0gQGdldEluZGV4KClcbiAgICB3aGlsZSByZWZlcmVuY2UgPSBpbmRleC5wb3AoKVxuICAgICAgbG9jYWxzdG9yZS5yZW1vdmUocmVmZXJlbmNlLmtleSlcblxuICAgIEBzZXRJbmRleCgpXG5cblxuICBnZXRJbmRleDogLT5cbiAgICBAaW5kZXggfHw9IGxvY2Fsc3RvcmUuZ2V0KFwiI3sgQGtleSB9LS1pbmRleFwiKSB8fCBbXVxuICAgIEBpbmRleFxuXG5cbiAgc2V0SW5kZXg6IC0+XG4gICAgaWYgQGluZGV4XG4gICAgICBsb2NhbHN0b3JlLnNldChcIiN7IEBrZXkgfS0taW5kZXhcIiwgQGluZGV4KVxuXG5cbiAgbmV4dEtleTogLT5cbiAgICAjIGp1c3QgYSByYW5kb20ga2V5XG4gICAgYWRkZW5kdW0gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxZTE2KS50b1N0cmluZygzMilcbiAgICBcIiN7IEBrZXkgfS0jeyBhZGRlbmR1bSB9XCJcblxuXG5cblxuXG5cbiIsIiMgQWNjZXNzIHRvIGxvY2Fsc3RvcmFnZVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFNpbXBsaWZpZWQgdmVyc2lvbiBvZiBbaHR0cHM6Ly9naXRodWIuY29tL21hcmN1c3dlc3Rpbi9zdG9yZS5qc10oKVxubW9kdWxlLmV4cG9ydHMgPSAoICh3aW4pIC0+XG5cbiAgYXZhaWxhYmxlID0gdW5kZWZpbmVkXG4gIHN0b3JhZ2VOYW1lID0gJ2xvY2FsU3RvcmFnZSdcbiAgc3RvcmFnZSA9IHdpbltzdG9yYWdlTmFtZV1cblxuXG4gIHNldDogKGtleSwgdmFsdWUpIC0+XG4gICAgcmV0dXJuIEByZW1vdmUoa2V5KSB1bmxlc3MgdmFsdWU/XG4gICAgc3RvcmFnZS5zZXRJdGVtKGtleSwgQHNlcmlhbGl6ZSh2YWx1ZSkpXG4gICAgdmFsdWVcblxuXG4gIGdldDogKGtleSkgLT5cbiAgICBAZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRJdGVtKGtleSkpXG5cblxuICByZW1vdmU6IChrZXkpIC0+XG4gICAgc3RvcmFnZS5yZW1vdmVJdGVtKGtleSlcblxuXG4gIGNsZWFyOiAtPlxuICAgIHN0b3JhZ2UuY2xlYXIoKVxuXG5cbiAgaXNTdXBwb3J0ZWQ6IC0+XG4gICAgcmV0dXJuIGF2YWlsYWJsZSBpZiBhdmFpbGFibGU/XG4gICAgYXZhaWxhYmxlID0gQGRldGVjdExvY2Fsc3RvcmUoKVxuXG5cbiAgIyBJbnRlcm5hbFxuICAjIC0tLS0tLS0tXG5cbiAgc2VyaWFsaXplOiAodmFsdWUpIC0+XG4gICAgSlNPTi5zdHJpbmdpZnkodmFsdWUpXG5cblxuICBkZXNlcmlhbGl6ZTogKHZhbHVlKSAtPlxuICAgIHJldHVybiB1bmRlZmluZWQgaWYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnXG4gICAgdHJ5XG4gICAgICBKU09OLnBhcnNlKHZhbHVlKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICB2YWx1ZSB8fCB1bmRlZmluZWRcblxuXG4gIGRldGVjdExvY2Fsc3RvcmU6IC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyB3aW5bc3RvcmFnZU5hbWVdP1xuICAgIHRlc3RLZXkgPSAnX19sb2NhbHN0b3JlLWZlYXR1cmUtZGV0ZWN0aW9uX18nXG4gICAgdHJ5XG4gICAgICBAc2V0KHRlc3RLZXksIHRlc3RLZXkpXG4gICAgICByZXRyaWV2ZWRWYWx1ZSA9IEBnZXQodGVzdEtleSlcbiAgICAgIEByZW1vdmUodGVzdEtleSlcbiAgICAgIHJldHJpZXZlZFZhbHVlID09IHRlc3RLZXlcbiAgICBjYXRjaCBlcnJvclxuICAgICAgZmFsc2VcblxuXG4pKHdpbmRvdylcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9sb2dnaW5nL2Fzc2VydCcpXG5MaW1pdGVkTG9jYWxzdG9yZSA9IHJlcXVpcmUoJy4vbGltaXRlZF9sb2NhbHN0b3JlJylcbndvcmRzID0gcmVxdWlyZSgnLi93b3JkcycpXG5kb2N1bWVudCA9IHJlcXVpcmUoJy4uL2RvY3VtZW50JylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuICBpbml0aWFsaXplZCA9IGZhbHNlXG5cblxuICBpbml0OiAtPlxuICAgIGlmIG5vdCBpbml0aWFsaXplZFxuICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlXG5cbiAgICAgICMgc3RvcmUgdXAgdG8gdGVuIHZlcnNpb25zXG4gICAgICBAc3RvcmUgPSBuZXcgTGltaXRlZExvY2Fsc3RvcmUoJ3N0YXNoJywgMTApXG5cblxuICBzbmFwc2hvdDogLT5cbiAgICBAc3RvcmUucHVzaChkb2N1bWVudC50b0pzb24oKSlcblxuXG4gIHN0YXNoOiAtPlxuICAgIEBzbmFwc2hvdCgpXG4gICAgZG9jdW1lbnQucmVzZXQoKVxuXG5cbiAgZGVsZXRlOiAtPlxuICAgIEBzdG9yZS5wb3AoKVxuXG5cbiAgZ2V0OiAtPlxuICAgIEBzdG9yZS5nZXQoKVxuXG5cbiAgcmVzdG9yZTogLT5cbiAgICBqc29uID0gQHN0b3JlLmdldCgpXG5cbiAgICBhc3NlcnQganNvbiwgJ3N0YXNoIGlzIGVtcHR5J1xuICAgIGRvY3VtZW50LnJlc3RvcmUoanNvbilcblxuXG4gIGxpc3Q6IC0+XG4gICAgZW50cmllcyA9IGZvciBvYmogaW4gQHN0b3JlLmdldEluZGV4KClcbiAgICAgIHsga2V5OiBvYmoua2V5LCBkYXRlOiBuZXcgRGF0ZShvYmouZGF0ZSkudG9TdHJpbmcoKSB9XG5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oZW50cmllcylcbiIsIiMgU3RyaW5nIEhlbHBlcnNcbiMgLS0tLS0tLS0tLS0tLS1cbiMgaW5zcGlyZWQgYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9lcGVsaS91bmRlcnNjb3JlLnN0cmluZ10oKVxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdDYW1lbCBDYXNlJ1xuICBodW1hbml6ZTogKHN0cikgLT5cbiAgICB1bmNhbWVsaXplZCA9ICQudHJpbShzdHIpLnJlcGxhY2UoLyhbYS16XFxkXSkoW0EtWl0rKS9nLCAnJDEgJDInKS50b0xvd2VyQ2FzZSgpXG4gICAgQHRpdGxlaXplKCB1bmNhbWVsaXplZCApXG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciB0byB1cHBlcmNhc2VcbiAgY2FwaXRhbGl6ZSA6IChzdHIpIC0+XG4gICAgICBzdHIgPSBpZiAhc3RyPyB0aGVuICcnIGVsc2UgU3RyaW5nKHN0cilcbiAgICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciBvZiBldmVyeSB3b3JkIHRvIHVwcGVyY2FzZVxuICB0aXRsZWl6ZTogKHN0cikgLT5cbiAgICBpZiAhc3RyP1xuICAgICAgJydcbiAgICBlbHNlXG4gICAgICBTdHJpbmcoc3RyKS5yZXBsYWNlIC8oPzpefFxccylcXFMvZywgKGMpIC0+XG4gICAgICAgIGMudG9VcHBlckNhc2UoKVxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdjYW1lbC1jYXNlJ1xuICBzbmFrZUNhc2U6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJykucmVwbGFjZSgvWy1fXFxzXSsvZywgJy0nKS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIHByZXBlbmQgYSBwcmVmaXggdG8gYSBzdHJpbmcgaWYgaXQgaXMgbm90IGFscmVhZHkgcHJlc2VudFxuICBwcmVmaXg6IChwcmVmaXgsIHN0cmluZykgLT5cbiAgICBpZiBzdHJpbmcuaW5kZXhPZihwcmVmaXgpID09IDBcbiAgICAgIHN0cmluZ1xuICAgIGVsc2VcbiAgICAgIFwiXCIgKyBwcmVmaXggKyBzdHJpbmdcblxuXG4gICMgSlNPTi5zdHJpbmdpZnkgd2l0aCByZWFkYWJpbGl0eSBpbiBtaW5kXG4gICMgQHBhcmFtIG9iamVjdDogamF2YXNjcmlwdCBvYmplY3RcbiAgcmVhZGFibGVKc29uOiAob2JqKSAtPlxuICAgIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgMikgIyBcIlxcdFwiXG5cbiAgY2FtZWxpemU6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvWy1fXFxzXSsoLik/L2csIChtYXRjaCwgYykgLT5cbiAgICAgIGMudG9VcHBlckNhc2UoKVxuICAgIClcblxuICB0cmltOiAoc3RyKSAtPlxuICAgIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcblxuXG4gICMgY2FtZWxpemU6IChzdHIpIC0+XG4gICMgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAjICAgICBjLnRvVXBwZXJDYXNlKClcblxuICAjIGNsYXNzaWZ5OiAoc3RyKSAtPlxuICAjICAgJC50aXRsZWl6ZShTdHJpbmcoc3RyKS5yZXBsYWNlKC9bXFxXX10vZywgJyAnKSkucmVwbGFjZSgvXFxzL2csICcnKVxuXG5cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJlclxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAc25pcHBldFRyZWUsIEByZW5kZXJpbmdDb250YWluZXIgfSkgLT5cbiAgICBhc3NlcnQgQHNuaXBwZXRUcmVlLCAnbm8gc25pcHBldCB0cmVlIHNwZWNpZmllZCdcbiAgICBhc3NlcnQgQHJlbmRlcmluZ0NvbnRhaW5lciwgJ25vIHJlbmRlcmluZyBjb250YWluZXIgc3BlY2lmaWVkJ1xuXG4gICAgQCRyb290ID0gJChAcmVuZGVyaW5nQ29udGFpbmVyLnJlbmRlck5vZGUpXG4gICAgQHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnMoKVxuICAgIEBzbmlwcGV0Vmlld3MgPSB7fVxuXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQHJlbmRlck9uY2VQYWdlUmVhZHkoKVxuICAgIEByZWFkeVNlbWFwaG9yZS5zdGFydCgpXG5cblxuICByZW5kZXJPbmNlUGFnZVJlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pbmNyZW1lbnQoKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIucmVhZHkgPT5cbiAgICAgIEByZW5kZXIoKVxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmlzUmVhZHkoKVxuXG5cbiAgaHRtbDogLT5cbiAgICBhc3NlcnQgQGlzUmVhZHkoKSwgJ0Nhbm5vdCBnZW5lcmF0ZSBodG1sLiBSZW5kZXJlciBpcyBub3QgcmVhZHkuJ1xuICAgIEByZW5kZXJpbmdDb250YWluZXIuaHRtbCgpXG5cblxuICAjIFNuaXBwZXQgVHJlZSBFdmVudCBIYW5kbGluZ1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnM6IC0+XG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRBZGRlZC5hZGQoICQucHJveHkoQHNuaXBwZXRBZGRlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0UmVtb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRSZW1vdmVkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRNb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRNb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0Q29udGVudENoYW5nZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0Q29udGVudENoYW5nZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldEh0bWxDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldEh0bWxDaGFuZ2VkLCB0aGlzKSApXG5cblxuICBzbmlwcGV0QWRkZWQ6IChtb2RlbCkgLT5cbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRSZW1vdmVkOiAobW9kZWwpIC0+XG4gICAgQHJlbW92ZVNuaXBwZXQobW9kZWwpXG4gICAgQGRlbGV0ZUNhY2hlZFNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRNb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBpbnNlcnRTbmlwcGV0KG1vZGVsKVxuXG5cbiAgc25pcHBldENvbnRlbnRDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlQ29udGVudCgpXG5cblxuICBzbmlwcGV0SHRtbENoYW5nZWQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS51cGRhdGVIdG1sKClcblxuXG4gICMgUmVuZGVyaW5nXG4gICMgLS0tLS0tLS0tXG5cblxuICBzbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdzW21vZGVsLmlkXSB8fD0gbW9kZWwuY3JlYXRlVmlldyhAcmVuZGVyaW5nQ29udGFpbmVyLmlzUmVhZE9ubHkpXG5cblxuICBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBkZWxldGUgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF1cblxuXG4gIHJlbmRlcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIGNsZWFyOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5lYWNoIChtb2RlbCkgPT5cbiAgICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG5cbiAgICBAJHJvb3QuZW1wdHkoKVxuXG5cbiAgcmVkcmF3OiAtPlxuICAgIEBjbGVhcigpXG4gICAgQHJlbmRlcigpXG5cblxuICBpbnNlcnRTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgcmV0dXJuIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbClcblxuICAgIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5wcmV2aW91cylcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLnByZXZpb3VzLCBtb2RlbClcbiAgICBlbHNlIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5uZXh0KVxuICAgICAgQGluc2VydFNuaXBwZXRBc1NpYmxpbmcobW9kZWwubmV4dCwgbW9kZWwpXG4gICAgZWxzZSBpZiBtb2RlbC5wYXJlbnRDb250YWluZXJcbiAgICAgIEBhcHBlbmRTbmlwcGV0VG9QYXJlbnRDb250YWluZXIobW9kZWwpXG4gICAgZWxzZVxuICAgICAgbG9nLmVycm9yKCdTbmlwcGV0IGNvdWxkIG5vdCBiZSBpbnNlcnRlZCBieSByZW5kZXJlci4nKVxuXG4gICAgc25pcHBldFZpZXcgPSBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKVxuICAgIHNuaXBwZXRWaWV3LnNldEF0dGFjaGVkVG9Eb20odHJ1ZSlcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQoc25pcHBldFZpZXcpXG4gICAgQGF0dGFjaENoaWxkU25pcHBldHMobW9kZWwpXG5cblxuICBpc1NuaXBwZXRBdHRhY2hlZDogKG1vZGVsKSAtPlxuICAgIG1vZGVsICYmIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLmlzQXR0YWNoZWRUb0RvbVxuXG5cbiAgYXR0YWNoQ2hpbGRTbmlwcGV0czogKG1vZGVsKSAtPlxuICAgIG1vZGVsLmNoaWxkcmVuIChjaGlsZE1vZGVsKSA9PlxuICAgICAgaWYgbm90IEBpc1NuaXBwZXRBdHRhY2hlZChjaGlsZE1vZGVsKVxuICAgICAgICBAaW5zZXJ0U25pcHBldChjaGlsZE1vZGVsKVxuXG5cbiAgaW5zZXJ0U25pcHBldEFzU2libGluZzogKHNpYmxpbmcsIG1vZGVsKSAtPlxuICAgIG1ldGhvZCA9IGlmIHNpYmxpbmcgPT0gbW9kZWwucHJldmlvdXMgdGhlbiAnYWZ0ZXInIGVsc2UgJ2JlZm9yZSdcbiAgICBAJG5vZGVGb3JTbmlwcGV0KHNpYmxpbmcpW21ldGhvZF0oQCRub2RlRm9yU25pcHBldChtb2RlbCkpXG5cblxuICBhcHBlbmRTbmlwcGV0VG9QYXJlbnRDb250YWluZXI6IChtb2RlbCkgLT5cbiAgICBAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKS5hcHBlbmRUbyhAJG5vZGVGb3JDb250YWluZXIobW9kZWwucGFyZW50Q29udGFpbmVyKSlcblxuXG4gICRub2RlRm9yU25pcHBldDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLiRodG1sXG5cblxuICAkbm9kZUZvckNvbnRhaW5lcjogKGNvbnRhaW5lcikgLT5cbiAgICBpZiBjb250YWluZXIuaXNSb290XG4gICAgICBAJHJvb3RcbiAgICBlbHNlXG4gICAgICBwYXJlbnRWaWV3ID0gQHNuaXBwZXRWaWV3Rm9yU25pcHBldChjb250YWluZXIucGFyZW50U25pcHBldClcbiAgICAgICQocGFyZW50Vmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGNvbnRhaW5lci5uYW1lKSlcblxuXG4gIHJlbW92ZVNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuICAgIEAkbm9kZUZvclNuaXBwZXQobW9kZWwpLmRldGFjaCgpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuY3NzID0gY29uZmlnLmNzc1xuYXR0ciA9IGNvbmZpZy5hdHRyXG5EaXJlY3RpdmVJdGVyYXRvciA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvcicpXG5ldmVudGluZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZXZlbnRpbmcnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Vmlld1xuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbW9kZWwsIEAkaHRtbCwgQGRpcmVjdGl2ZXMsIEBpc1JlYWRPbmx5IH0pIC0+XG4gICAgQCRlbGVtID0gQCRodG1sXG4gICAgQHRlbXBsYXRlID0gQG1vZGVsLnRlbXBsYXRlXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IGZhbHNlXG4gICAgQHdhc0F0dGFjaGVkVG9Eb20gPSAkLkNhbGxiYWNrcygpO1xuXG4gICAgdW5sZXNzIEBpc1JlYWRPbmx5XG4gICAgICAjIGFkZCBhdHRyaWJ1dGVzIGFuZCByZWZlcmVuY2VzIHRvIHRoZSBodG1sXG4gICAgICBAJGh0bWxcbiAgICAgICAgLmRhdGEoJ3NuaXBwZXQnLCB0aGlzKVxuICAgICAgICAuYWRkQ2xhc3MoY3NzLnNuaXBwZXQpXG4gICAgICAgIC5hdHRyKGF0dHIudGVtcGxhdGUsIEB0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgQHJlbmRlcigpXG5cblxuICByZW5kZXI6IChtb2RlKSAtPlxuICAgIEB1cGRhdGVDb250ZW50KClcbiAgICBAdXBkYXRlSHRtbCgpXG5cblxuICB1cGRhdGVDb250ZW50OiAtPlxuICAgIEBjb250ZW50KEBtb2RlbC5jb250ZW50KVxuXG4gICAgaWYgbm90IEBoYXNGb2N1cygpXG4gICAgICBAZGlzcGxheU9wdGlvbmFscygpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICB1cGRhdGVIdG1sOiAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBAbW9kZWwuc3R5bGVzXG4gICAgICBAc3R5bGUobmFtZSwgdmFsdWUpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICBkaXNwbGF5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbFxuICAgICAgICAkZWxlbSA9ICQoZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIGlmIEBtb2RlbC5pc0VtcHR5KGRpcmVjdGl2ZS5uYW1lKVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICdub25lJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICcnKVxuXG5cbiAgIyBTaG93IGFsbCBkb2Mtb3B0aW9uYWxzIHdoZXRoZXIgdGhleSBhcmUgZW1wdHkgb3Igbm90LlxuICAjIFVzZSBvbiBmb2N1cy5cbiAgc2hvd09wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLnNob3coJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICAjIEhpZGUgYWxsIGVtcHR5IGRvYy1vcHRpb25hbHNcbiAgIyBVc2Ugb24gYmx1ci5cbiAgaGlkZUVtcHR5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbCAmJiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLmhpZGUoJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICBuZXh0OiAtPlxuICAgIEAkaHRtbC5uZXh0KCkuZGF0YSgnc25pcHBldCcpXG5cblxuICBwcmV2OiAtPlxuICAgIEAkaHRtbC5wcmV2KCkuZGF0YSgnc25pcHBldCcpXG5cblxuICBhZnRlckZvY3VzZWQ6ICgpIC0+XG4gICAgQCRodG1sLmFkZENsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIEBzaG93T3B0aW9uYWxzKClcblxuXG4gIGFmdGVyQmx1cnJlZDogKCkgLT5cbiAgICBAJGh0bWwucmVtb3ZlQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG4gICAgQGhpZGVFbXB0eU9wdGlvbmFscygpXG5cblxuICAjIEBwYXJhbSBjdXJzb3I6IHVuZGVmaW5lZCwgJ3N0YXJ0JywgJ2VuZCdcbiAgZm9jdXM6IChjdXJzb3IpIC0+XG4gICAgZmlyc3QgPSBAZGlyZWN0aXZlcy5lZGl0YWJsZT9bMF0uZWxlbVxuICAgICQoZmlyc3QpLmZvY3VzKClcblxuXG4gIGhhc0ZvY3VzOiAtPlxuICAgIEAkaHRtbC5oYXNDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KEAkaHRtbFswXSlcblxuXG4gIGNvbnRlbnQ6IChjb250ZW50KSAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBjb250ZW50XG4gICAgICBAc2V0KG5hbWUsIHZhbHVlKVxuXG5cbiAgc2V0OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAc2V0RWRpdGFibGUobmFtZSwgdmFsdWUpXG4gICAgICB3aGVuICdpbWFnZScgdGhlbiBAc2V0SW1hZ2UobmFtZSwgdmFsdWUpXG4gICAgICB3aGVuICdodG1sJyB0aGVuIEBzZXRIdG1sKG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJyB0aGVuIEBnZXRFZGl0YWJsZShuYW1lKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQGdldEltYWdlKG5hbWUpXG4gICAgICB3aGVuICdodG1sJyB0aGVuIEBnZXRIdG1sKG5hbWUpXG5cblxuICBnZXRFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwoKVxuXG5cbiAgc2V0RWRpdGFibGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgcGxhY2Vob2xkZXIgPSBpZiB2YWx1ZVxuICAgICAgY29uZmlnLnplcm9XaWR0aENoYXJhY3RlclxuICAgIGVsc2VcbiAgICAgIEB0ZW1wbGF0ZS5kZWZhdWx0c1tuYW1lXVxuXG4gICAgJGVsZW0uYXR0cihhdHRyLnBsYWNlaG9sZGVyLCBwbGFjZWhvbGRlcilcbiAgICAkZWxlbS5odG1sKHZhbHVlIHx8ICcnKVxuXG5cbiAgZm9jdXNFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmF0dHIoYXR0ci5wbGFjZWhvbGRlciwgY29uZmlnLnplcm9XaWR0aENoYXJhY3RlcilcblxuXG4gIGJsdXJFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIEBtb2RlbC5pc0VtcHR5KG5hbWUpXG4gICAgICAkZWxlbS5hdHRyKGF0dHIucGxhY2Vob2xkZXIsIEB0ZW1wbGF0ZS5kZWZhdWx0c1tuYW1lXSlcblxuXG4gIGdldEh0bWw6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEh0bWw6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgJGVsZW0uaHRtbChAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG4gICAgZWxzZSBpZiB2YWx1ZSBhbmQgbm90IEBpc1JlYWRPbmx5XG4gICAgICBAYmxvY2tJbnRlcmFjdGlvbigkZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzVG9SZXNldCB8fD0ge31cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXRbbmFtZV0gPSBuYW1lXG5cblxuICBnZXREaXJlY3RpdmVFbGVtZW50OiAoZGlyZWN0aXZlTmFtZSkgLT5cbiAgICBAZGlyZWN0aXZlcy5nZXQoZGlyZWN0aXZlTmFtZSk/LmVsZW1cblxuXG4gICMgUmVzZXQgZGlyZWN0aXZlcyB0aGF0IGNvbnRhaW4gYXJiaXRyYXJ5IGh0bWwgYWZ0ZXIgdGhlIHZpZXcgaXMgbW92ZWQgaW5cbiAgIyB0aGUgRE9NIHRvIHJlY3JlYXRlIGlmcmFtZXMuIEluIHRoZSBjYXNlIG9mIHR3aXR0ZXIgd2hlcmUgdGhlIGlmcmFtZXNcbiAgIyBkb24ndCBoYXZlIGEgc3JjIHRoZSByZWxvYWRpbmcgdGhhdCBoYXBwZW5zIHdoZW4gb25lIG1vdmVzIGFuIGlmcmFtZSBjbGVhcnNcbiAgIyBhbGwgY29udGVudCAoTWF5YmUgd2UgY291bGQgbGltaXQgcmVzZXR0aW5nIHRvIGlmcmFtZXMgd2l0aG91dCBhIHNyYykuXG4gICNcbiAgIyBTb21lIG1vcmUgaW5mbyBhYm91dCB0aGUgaXNzdWUgb24gc3RhY2tvdmVyZmxvdzpcbiAgIyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzgzMTgyNjQvaG93LXRvLW1vdmUtYW4taWZyYW1lLWluLXRoZS1kb20td2l0aG91dC1sb3NpbmctaXRzLXN0YXRlXG4gIHJlc2V0RGlyZWN0aXZlczogLT5cbiAgICBmb3IgbmFtZSBvZiBAZGlyZWN0aXZlc1RvUmVzZXRcbiAgICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAgIGlmICRlbGVtLmZpbmQoJ2lmcmFtZScpLmxlbmd0aFxuICAgICAgICBAc2V0KG5hbWUsIEBtb2RlbC5jb250ZW50W25hbWVdKVxuXG5cbiAgZ2V0SW1hZ2U6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hdHRyKCdzcmMnKVxuXG5cbiAgc2V0SW1hZ2U6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG5cbiAgICBpZiB2YWx1ZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBzZXRJbWFnZUF0dHJpYnV0ZSgkZWxlbSwgdmFsdWUpXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjb25maWcuY3NzLmVtcHR5SW1hZ2UpXG4gICAgZWxzZVxuICAgICAgc2V0UGxhY2Vob2xkZXIgPSAkLnByb3h5KEBzZXRQbGFjZWhvbGRlckltYWdlLCB0aGlzLCAkZWxlbSlcbiAgICAgIEBkZWxheVVudGlsQXR0YWNoZWQobmFtZSwgc2V0UGxhY2Vob2xkZXIpXG5cblxuICBzZXRJbWFnZUF0dHJpYnV0ZTogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICBpZiAkZWxlbVswXS5ub2RlTmFtZSA9PSAnSU1HJ1xuICAgICAgJGVsZW0uYXR0cignc3JjJywgdmFsdWUpXG4gICAgZWxzZVxuICAgICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgRXNjYXBlIHRoZSBVUkkgaW4gY2FzZSBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSAnKCcgb3IgJyknIGFyZSBwcmVzZW50LlxuICAjIFRoZSBlc2NhcGluZyBvbmx5IGhhcHBlbnMgaWYgaXQgaXMgbmVlZGVkIHNpbmNlIHRoaXMgZG9lcyBub3Qgd29yayBpbiBub2RlLlxuICAjIFdoZW4gdGhlIFVSSSBpcyBlc2NhcGVkIGluIG5vZGUgdGhlIGJhY2tncm91bmQtaW1hZ2UgaXMgbm90IHdyaXR0ZW4gdG8gdGhlXG4gICMgc3R5bGUgYXR0cmlidXRlLlxuICBlc2NhcGVDc3NVcmk6ICh1cmkpIC0+XG4gICAgaWYgL1soKV0vLnRlc3QodXJpKVxuICAgICAgXCInI3sgdXJpIH0nXCJcbiAgICBlbHNlXG4gICAgICB1cmlcblxuXG4gIHNldFBsYWNlaG9sZGVySW1hZ2U6ICgkZWxlbSkgLT5cbiAgICAkZWxlbS5hZGRDbGFzcyhjb25maWcuY3NzLmVtcHR5SW1hZ2UpXG4gICAgaWYgJGVsZW1bMF0ubm9kZU5hbWUgPT0gJ0lNRydcbiAgICAgIHdpZHRoID0gJGVsZW0ud2lkdGgoKVxuICAgICAgaGVpZ2h0ID0gJGVsZW0uaGVpZ2h0KClcbiAgICBlbHNlXG4gICAgICB3aWR0aCA9ICRlbGVtLm91dGVyV2lkdGgoKVxuICAgICAgaGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgIHZhbHVlID0gXCJodHRwOi8vcGxhY2Vob2xkLml0LyN7d2lkdGh9eCN7aGVpZ2h0fS9CRUY1NkYvQjJFNjY4XCJcbiAgICBAc2V0SW1hZ2VBdHRyaWJ1dGUoJGVsZW0sIHZhbHVlKVxuXG5cbiAgc3R5bGU6IChuYW1lLCBjbGFzc05hbWUpIC0+XG4gICAgY2hhbmdlcyA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV0uY3NzQ2xhc3NDaGFuZ2VzKGNsYXNzTmFtZSlcbiAgICBpZiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgZm9yIHJlbW92ZUNsYXNzIGluIGNoYW5nZXMucmVtb3ZlXG4gICAgICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhyZW1vdmVDbGFzcylcblxuICAgIEAkaHRtbC5hZGRDbGFzcyhjaGFuZ2VzLmFkZClcblxuXG4gICMgRGlzYWJsZSB0YWJiaW5nIGZvciB0aGUgY2hpbGRyZW4gb2YgYW4gZWxlbWVudC5cbiAgIyBUaGlzIGlzIHVzZWQgZm9yIGh0bWwgY29udGVudCBzbyBpdCBkb2VzIG5vdCBkaXNydXB0IHRoZSB1c2VyXG4gICMgZXhwZXJpZW5jZS4gVGhlIHRpbWVvdXQgaXMgdXNlZCBmb3IgY2FzZXMgbGlrZSB0d2VldHMgd2hlcmUgdGhlXG4gICMgaWZyYW1lIGlzIGdlbmVyYXRlZCBieSBhIHNjcmlwdCB3aXRoIGEgZGVsYXkuXG4gIGRpc2FibGVUYWJiaW5nOiAoJGVsZW0pIC0+XG4gICAgc2V0VGltZW91dCggPT5cbiAgICAgICRlbGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAsIDQwMClcblxuXG4gICMgQXBwZW5kIGEgY2hpbGQgdG8gdGhlIGVsZW1lbnQgd2hpY2ggd2lsbCBibG9jayB1c2VyIGludGVyYWN0aW9uXG4gICMgbGlrZSBjbGljayBvciB0b3VjaCBldmVudHMuIEFsc28gdHJ5IHRvIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBnZXR0aW5nXG4gICMgZm9jdXMgb24gYSBjaGlsZCBlbGVtbnQgdGhyb3VnaCB0YWJiaW5nLlxuICBibG9ja0ludGVyYWN0aW9uOiAoJGVsZW0pIC0+XG4gICAgQGVuc3VyZVJlbGF0aXZlUG9zaXRpb24oJGVsZW0pXG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmludGVyYWN0aW9uQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgICRlbGVtLmFwcGVuZCgkYmxvY2tlcilcblxuICAgIEBkaXNhYmxlVGFiYmluZygkZWxlbSlcblxuXG4gICMgTWFrZSBzdXJlIHRoYXQgYWxsIGFic29sdXRlIHBvc2l0aW9uZWQgY2hpbGRyZW4gYXJlIHBvc2l0aW9uZWRcbiAgIyByZWxhdGl2ZSB0byAkZWxlbS5cbiAgZW5zdXJlUmVsYXRpdmVQb3NpdGlvbjogKCRlbGVtKSAtPlxuICAgIHBvc2l0aW9uID0gJGVsZW0uY3NzKCdwb3NpdGlvbicpXG4gICAgaWYgcG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAnZml4ZWQnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZSdcbiAgICAgICRlbGVtLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuXG5cbiAgZ2V0JGNvbnRhaW5lcjogLT5cbiAgICAkKGRvbS5maW5kQ29udGFpbmVyKEAkaHRtbFswXSkubm9kZSlcblxuXG4gIGRlbGF5VW50aWxBdHRhY2hlZDogKG5hbWUsIGZ1bmMpIC0+XG4gICAgaWYgQGlzQXR0YWNoZWRUb0RvbVxuICAgICAgZnVuYygpXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBkZWxheWVkIHx8PSB7fVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSBldmVudGluZy5jYWxsT25jZSBAd2FzQXR0YWNoZWRUb0RvbSwgPT5cbiAgICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZnVuYygpXG5cblxuICBjYW5jZWxEZWxheWVkOiAobmFtZSkgLT5cbiAgICBpZiBAZGVsYXllZD9bbmFtZV1cbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLnJlbW92ZShAZGVsYXllZFtuYW1lXSlcbiAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG5cblxuICBzdHJpcEh0bWxJZlJlYWRPbmx5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzUmVhZE9ubHlcblxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKEAkaHRtbFswXSlcbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgQHN0cmlwRG9jQ2xhc3NlcyhlbGVtKVxuICAgICAgQHN0cmlwRG9jQXR0cmlidXRlcyhlbGVtKVxuICAgICAgQHN0cmlwRW1wdHlBdHRyaWJ1dGVzKGVsZW0pXG5cblxuICBzdHJpcERvY0NsYXNzZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBrbGFzcyBpbiBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhrbGFzcykgaWYgL2RvY1xcLS4qL2kudGVzdChrbGFzcylcblxuXG4gIHN0cmlwRG9jQXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAkZWxlbS5yZW1vdmVBdHRyKG5hbWUpIGlmIC9kYXRhXFwtZG9jXFwtLiovaS50ZXN0KG5hbWUpXG5cblxuICBzdHJpcEVtcHR5QXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgc3RyaXBwYWJsZUF0dHJpYnV0ZXMgPSBbJ3N0eWxlJywgJ2NsYXNzJ11cbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgPSBzdHJpcHBhYmxlQXR0cmlidXRlcy5pbmRleE9mKGF0dHJpYnV0ZS5uYW1lKSA+PSAwXG4gICAgICBpc0VtcHR5QXR0cmlidXRlID0gYXR0cmlidXRlLnZhbHVlLnRyaW0oKSA9PSAnJ1xuICAgICAgaWYgaXNTdHJpcHBhYmxlQXR0cmlidXRlIGFuZCBpc0VtcHR5QXR0cmlidXRlXG4gICAgICAgICRlbGVtLnJlbW92ZUF0dHIoYXR0cmlidXRlLm5hbWUpXG5cblxuICBzZXRBdHRhY2hlZFRvRG9tOiAobmV3VmFsKSAtPlxuICAgIHJldHVybiBpZiBuZXdWYWwgPT0gQGlzQXR0YWNoZWRUb0RvbVxuXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IG5ld1ZhbFxuXG4gICAgaWYgbmV3VmFsXG4gICAgICBAcmVzZXREaXJlY3RpdmVzKClcbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLmZpcmUoKVxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENzc0xvYWRlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHdpbmRvdykgLT5cbiAgICBAbG9hZGVkVXJscyA9IFtdXG5cblxuICBsb2FkOiAodXJscywgY2FsbGJhY2s9JC5ub29wKSAtPlxuICAgIHVybHMgPSBbdXJsc10gdW5sZXNzICQuaXNBcnJheSh1cmxzKVxuICAgIHNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiAgICBAbG9hZFNpbmdsZVVybCh1cmwsIHNlbWFwaG9yZS53YWl0KCkpIGZvciB1cmwgaW4gdXJsc1xuICAgIHNlbWFwaG9yZS5zdGFydCgpXG5cblxuICAjIEBwcml2YXRlXG4gIGxvYWRTaW5nbGVVcmw6ICh1cmwsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICBpZiBAaXNVcmxMb2FkZWQodXJsKVxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIGxpbmsgPSAkKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgLz4nKVswXVxuICAgICAgbGluay5vbmxvYWQgPSBjYWxsYmFja1xuICAgICAgbGluay5ocmVmID0gdXJsXG4gICAgICBAd2luZG93LmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluaylcbiAgICAgIEBtYXJrVXJsQXNMb2FkZWQodXJsKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBpc1VybExvYWRlZDogKHVybCkgLT5cbiAgICBAbG9hZGVkVXJscy5pbmRleE9mKHVybCkgPj0gMFxuXG5cbiAgIyBAcHJpdmF0ZVxuICBtYXJrVXJsQXNMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMucHVzaCh1cmwpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcbkZvY3VzID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZm9jdXMnKVxuRWRpdGFibGVDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlcicpXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbiMgQW4gSW50ZXJhY3RpdmVQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhbGxvd3MgZm9yIG1hbmlwdWxhdGlvbiBvZiB0aGVcbiMgcmVuZGVyZWQgU25pcHBldFRyZWUuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEludGVyYWN0aXZlUGFnZSBleHRlbmRzIFBhZ2VcblxuICBMRUZUX01PVVNFX0JVVFRPTiA9IDFcblxuICBpc1JlYWRPbmx5OiBmYWxzZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIGhvc3RXaW5kb3cgfT17fSkgLT5cbiAgICBzdXBlclxuXG4gICAgQGZvY3VzID0gbmV3IEZvY3VzKClcbiAgICBAZWRpdGFibGVDb250cm9sbGVyID0gbmV3IEVkaXRhYmxlQ29udHJvbGxlcih0aGlzKVxuXG4gICAgIyBldmVudHNcbiAgICBAaW1hZ2VDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQGh0bWxFbGVtZW50Q2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBzbmlwcGV0V2lsbEJlRHJhZ2dlZCA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldE1vZGVsKSAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldE1vZGVsKSAtPlxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuICAgIEBmb2N1cy5zbmlwcGV0Rm9jdXMuYWRkKCAkLnByb3h5KEBhZnRlclNuaXBwZXRGb2N1c2VkLCB0aGlzKSApXG4gICAgQGZvY3VzLnNuaXBwZXRCbHVyLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Qmx1cnJlZCwgdGhpcykgKVxuXG4gICAgQCRkb2N1bWVudFxuICAgICAgLm9uKCdjbGljay5saXZpbmdkb2NzJywgJC5wcm94eShAY2xpY2ssIHRoaXMpKVxuICAgICAgLm9uKCdtb3VzZWRvd24ubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ3RvdWNoc3RhcnQubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ2RyYWdzdGFydCcsICQucHJveHkoQGJyb3dzZXJEcmFnU3RhcnQsIHRoaXMpKVxuXG5cbiAgIyBwcmV2ZW50IHRoZSBicm93c2VyIERyYWcmRHJvcCBmcm9tIGludGVyZmVyaW5nXG4gIGJyb3dzZXJEcmFnU3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuXG4gIHJlbW92ZUxpc3RlbmVyczogLT5cbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MnKVxuICAgIEAkZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcblxuXG4gIG1vdXNlZG93bjogKGV2ZW50KSAtPlxuICAgIHJldHVybiBpZiBldmVudC53aGljaCAhPSBMRUZUX01PVVNFX0JVVFRPTiAmJiBldmVudC50eXBlID09ICdtb3VzZWRvd24nICMgb25seSByZXNwb25kIHRvIGxlZnQgbW91c2UgYnV0dG9uXG4gICAgc25pcHBldFZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGV2ZW50LnRhcmdldClcbiAgICByZXR1cm4gdW5sZXNzIHNuaXBwZXRWaWV3XG5cbiAgICBAc3RhcnREcmFnXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcbiAgICAgIGV2ZW50OiBldmVudFxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIGNsaWNrOiAoZXZlbnQpIC0+XG4gICAgc25pcHBldFZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGV2ZW50LnRhcmdldClcbiAgICBub2RlQ29udGV4dCA9IGRvbS5maW5kTm9kZUNvbnRleHQoZXZlbnQudGFyZ2V0KVxuXG4gICAgIyB0b2RvOiBpZiBhIHVzZXIgY2xpY2tlZCBvbiBhIG1hcmdpbiBvZiBhIHNuaXBwZXQgaXQgc2hvdWxkXG4gICAgIyBzdGlsbCBnZXQgc2VsZWN0ZWQuIChpZiBhIHNuaXBwZXQgaXMgZm91bmQgYnkgcGFyZW50U25pcHBldFxuICAgICMgYW5kIHRoYXQgc25pcHBldCBoYXMgbm8gY2hpbGRyZW4gd2UgZG8gbm90IG5lZWQgdG8gc2VhcmNoKVxuXG4gICAgIyBpZiBzbmlwcGV0IGhhc0NoaWxkcmVuLCBtYWtlIHN1cmUgd2UgZGlkbid0IHdhbnQgdG8gc2VsZWN0XG4gICAgIyBhIGNoaWxkXG5cbiAgICAjIGlmIG5vIHNuaXBwZXQgd2FzIHNlbGVjdGVkIGNoZWNrIGlmIHRoZSB1c2VyIHdhcyBub3QgY2xpY2tpbmdcbiAgICAjIG9uIGEgbWFyZ2luIG9mIGEgc25pcHBldFxuXG4gICAgIyB0b2RvOiBjaGVjayBpZiB0aGUgY2xpY2sgd2FzIG1lYW50IGZvciBhIHNuaXBwZXQgY29udGFpbmVyXG4gICAgaWYgc25pcHBldFZpZXdcbiAgICAgIEBmb2N1cy5zbmlwcGV0Rm9jdXNlZChzbmlwcGV0VmlldylcblxuICAgICAgaWYgbm9kZUNvbnRleHRcbiAgICAgICAgc3dpdGNoIG5vZGVDb250ZXh0LmNvbnRleHRBdHRyXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICAgICAgICAgIEBpbWFnZUNsaWNrLmZpcmUoc25pcHBldFZpZXcsIG5vZGVDb250ZXh0LmF0dHJOYW1lLCBldmVudClcbiAgICAgICAgICB3aGVuIGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaHRtbEVsZW1lbnRDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgZWxzZVxuICAgICAgQGZvY3VzLmJsdXIoKVxuXG5cbiAgZ2V0Rm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgd2luZG93LmRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcblxuXG4gIGJsdXJGb2N1c2VkRWxlbWVudDogLT5cbiAgICBAZm9jdXMuc2V0Rm9jdXModW5kZWZpbmVkKVxuICAgIGZvY3VzZWRFbGVtZW50ID0gQGdldEZvY3VzZWRFbGVtZW50KClcbiAgICAkKGZvY3VzZWRFbGVtZW50KS5ibHVyKCkgaWYgZm9jdXNlZEVsZW1lbnRcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBAaW5pdGlhbGl6ZUVkaXRhYmxlcyhzbmlwcGV0VmlldylcblxuXG4gIGluaXRpYWxpemVFZGl0YWJsZXM6IChzbmlwcGV0VmlldykgLT5cbiAgICBpZiBzbmlwcGV0Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICBlZGl0YWJsZU5vZGVzID0gZm9yIGRpcmVjdGl2ZSBpbiBzbmlwcGV0Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtXG5cbiAgICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIuYWRkKGVkaXRhYmxlTm9kZXMpXG5cblxuICBhZnRlclNuaXBwZXRGb2N1c2VkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJGb2N1c2VkKClcblxuXG4gIGFmdGVyU25pcHBldEJsdXJyZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBzbmlwcGV0Vmlldy5hZnRlckJsdXJyZWQoKVxuIiwiUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyJylcbkNzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzX2xvYWRlcicpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuIyBBIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZiBSZW5kZXJpbmdDb250YWluZXIgd2hpY2ggaXMgaW50ZW5kZWQgdG8gYmUgc2hvd24gdG9cbiMgdGhlIHVzZXIuIEl0IGhhcyBhIExvYWRlciB3aGljaCBhbGxvd3MgeW91IHRvIGluamVjdCBDU1MgYW5kIEpTIGZpbGVzIGludG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBhZ2UgZXh0ZW5kcyBSZW5kZXJpbmdDb250YWluZXJcblxuICBjb25zdHJ1Y3RvcjogKHsgcmVuZGVyTm9kZSwgcmVhZE9ubHksIGhvc3RXaW5kb3csIEBkZXNpZ24sIEBzbmlwcGV0VHJlZSB9PXt9KSAtPlxuICAgIEBpc1JlYWRPbmx5ID0gcmVhZE9ubHkgaWYgcmVhZE9ubHk/XG4gICAgQHNldFdpbmRvdyhob3N0V2luZG93KVxuXG4gICAgc3VwZXIoKVxuXG4gICAgcmVuZGVyTm9kZSA/PSAkKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIsIEAkYm9keSlcbiAgICBpZiByZW5kZXJOb2RlLmpxdWVyeVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlWzBdXG4gICAgZWxzZVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlXG5cbiAgICAjIHN0b3JlIHJlZmVyZW5jZSB0byBzbmlwcGV0VHJlZVxuICAgICQoQHJlbmRlck5vZGUpLmRhdGEoJ3NuaXBwZXRUcmVlJywgQHNuaXBwZXRUcmVlKVxuXG5cbiAgYmVmb3JlUmVhZHk6IC0+XG4gICAgQGNzc0xvYWRlciA9IG5ldyBDc3NMb2FkZXIoQHdpbmRvdylcbiAgICBAY3NzTG9hZGVyLmxvYWQoQGRlc2lnbi5jc3MsIEByZWFkeVNlbWFwaG9yZS53YWl0KCkpIGlmIEBkZXNpZ24/LmNzc1xuXG5cbiAgc2V0V2luZG93OiAoaG9zdFdpbmRvdykgLT5cbiAgICBAd2luZG93ID0gaG9zdFdpbmRvdyB8fCB3aW5kb3dcbiAgICBAZG9jdW1lbnQgPSBAd2luZG93LmRvY3VtZW50XG4gICAgQCRkb2N1bWVudCA9ICQoQGRvY3VtZW50KVxuICAgIEAkYm9keSA9ICQoQGRvY3VtZW50LmJvZHkpXG4iLCJTZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5cbiMgQSBSZW5kZXJpbmdDb250YWluZXIgaXMgdXNlZCBieSB0aGUgUmVuZGVyZXIgdG8gZ2VuZXJhdGUgSFRNTC5cbiNcbiMgVGhlIFJlbmRlcmVyIGluc2VydHMgU25pcHBldFZpZXdzIGludG8gdGhlIFJlbmRlcmluZ0NvbnRhaW5lciBhbmQgbm90aWZpZXMgaXRcbiMgb2YgdGhlIGluc2VydGlvbi5cbiNcbiMgVGhlIFJlbmRlcmluZ0NvbnRhaW5lciBpcyBpbnRlbmRlZCBmb3IgZ2VuZXJhdGluZyBIVE1MLiBQYWdlIGlzIGEgc3ViY2xhc3Mgb2ZcbiMgdGhpcyBiYXNlIGNsYXNzIHRoYXQgaXMgaW50ZW5kZWQgZm9yIGRpc3BsYXlpbmcgdG8gdGhlIHVzZXIuIEludGVyYWN0aXZlUGFnZVxuIyBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWRkcyBpbnRlcmFjdGl2aXR5LCBhbmQgdGh1cyBlZGl0YWJpbGl0eSwgdG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGlzUmVhZE9ubHk6IHRydWVcblxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZW5kZXJOb2RlID0gJCgnPGRpdi8+JylbMF1cbiAgICBAcmVhZHlTZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBAYmVmb3JlUmVhZHkoKVxuICAgIEByZWFkeVNlbWFwaG9yZS5zdGFydCgpXG5cblxuICBodG1sOiAtPlxuICAgICQoQHJlbmRlck5vZGUpLmh0bWwoKVxuXG5cbiAgc25pcHBldFZpZXdXYXNJbnNlcnRlZDogKHNuaXBwZXRWaWV3KSAtPlxuXG5cbiAgIyBUaGlzIGlzIGNhbGxlZCBiZWZvcmUgdGhlIHNlbWFwaG9yZSBpcyBzdGFydGVkIHRvIGdpdmUgc3ViY2xhc3NlcyBhIGNoYW5jZVxuICAjIHRvIGluY3JlbWVudCB0aGUgc2VtYXBob3JlIHNvIGl0IGRvZXMgbm90IGZpcmUgaW1tZWRpYXRlbHkuXG4gIGJlZm9yZVJlYWR5OiAtPlxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4iLCIjIGpRdWVyeSBsaWtlIHJlc3VsdHMgd2hlbiBzZWFyY2hpbmcgZm9yIHNuaXBwZXRzLlxuIyBgZG9jKFwiaGVyb1wiKWAgd2lsbCByZXR1cm4gYSBTbmlwcGV0QXJyYXkgdGhhdCB3b3JrcyBzaW1pbGFyIHRvIGEgalF1ZXJ5IG9iamVjdC5cbiMgRm9yIGV4dGVuc2liaWxpdHkgdmlhIHBsdWdpbnMgd2UgZXhwb3NlIHRoZSBwcm90b3R5cGUgb2YgU25pcHBldEFycmF5IHZpYSBgZG9jLmZuYC5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldEFycmF5XG5cblxuICAjIEBwYXJhbSBzbmlwcGV0czogYXJyYXkgb2Ygc25pcHBldHNcbiAgY29uc3RydWN0b3I6IChAc25pcHBldHMpIC0+XG4gICAgQHNuaXBwZXRzID0gW10gdW5sZXNzIEBzbmlwcGV0cz9cbiAgICBAY3JlYXRlUHNldWRvQXJyYXkoKVxuXG5cbiAgY3JlYXRlUHNldWRvQXJyYXk6ICgpIC0+XG4gICAgZm9yIHJlc3VsdCwgaW5kZXggaW4gQHNuaXBwZXRzXG4gICAgICBAW2luZGV4XSA9IHJlc3VsdFxuXG4gICAgQGxlbmd0aCA9IEBzbmlwcGV0cy5sZW5ndGhcbiAgICBpZiBAc25pcHBldHMubGVuZ3RoXG4gICAgICBAZmlyc3QgPSBAWzBdXG4gICAgICBAbGFzdCA9IEBbQHNuaXBwZXRzLmxlbmd0aCAtIDFdXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIHNuaXBwZXQgaW4gQHNuaXBwZXRzXG4gICAgICBjYWxsYmFjayhzbmlwcGV0KVxuXG4gICAgdGhpc1xuXG5cbiAgcmVtb3ZlOiAoKSAtPlxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgc25pcHBldC5yZW1vdmUoKVxuXG4gICAgdGhpc1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbiMgU25pcHBldENvbnRhaW5lclxuIyAtLS0tLS0tLS0tLS0tLS0tXG4jIEEgU25pcHBldENvbnRhaW5lciBjb250YWlucyBhbmQgbWFuYWdlcyBhIGxpbmtlZCBsaXN0XG4jIG9mIHNuaXBwZXRzLlxuI1xuIyBUaGUgc25pcHBldENvbnRhaW5lciBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZyBpdHMgc25pcHBldFRyZWVcbiMgaW5mb3JtZWQgYWJvdXQgY2hhbmdlcyAob25seSBpZiB0aGV5IGFyZSBhdHRhY2hlZCB0byBvbmUpLlxuI1xuIyBAcHJvcCBmaXJzdDogZmlyc3Qgc25pcHBldCBpbiB0aGUgY29udGFpbmVyXG4jIEBwcm9wIGxhc3Q6IGxhc3Qgc25pcHBldCBpbiB0aGUgY29udGFpbmVyXG4jIEBwcm9wIHBhcmVudFNuaXBwZXQ6IHBhcmVudCBTbmlwcGV0TW9kZWxcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldENvbnRhaW5lclxuXG5cbiAgY29uc3RydWN0b3I6ICh7IEBwYXJlbnRTbmlwcGV0LCBAbmFtZSwgaXNSb290IH0pIC0+XG4gICAgQGlzUm9vdCA9IGlzUm9vdD9cbiAgICBAZmlyc3QgPSBAbGFzdCA9IHVuZGVmaW5lZFxuXG5cbiAgcHJlcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgaWYgQGZpcnN0XG4gICAgICBAaW5zZXJ0QmVmb3JlKEBmaXJzdCwgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgdGhpc1xuXG5cbiAgYXBwZW5kOiAoc25pcHBldCkgLT5cbiAgICBpZiBAcGFyZW50U25pcHBldFxuICAgICAgYXNzZXJ0IHNuaXBwZXQgaXNudCBAcGFyZW50U25pcHBldCwgJ2Nhbm5vdCBhcHBlbmQgc25pcHBldCB0byBpdHNlbGYnXG5cbiAgICBpZiBAbGFzdFxuICAgICAgQGluc2VydEFmdGVyKEBsYXN0LCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIEBhdHRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICBpbnNlcnRCZWZvcmU6IChzbmlwcGV0LCBpbnNlcnRlZFNuaXBwZXQpIC0+XG4gICAgcmV0dXJuIGlmIHNuaXBwZXQucHJldmlvdXMgPT0gaW5zZXJ0ZWRTbmlwcGV0XG4gICAgYXNzZXJ0IHNuaXBwZXQgaXNudCBpbnNlcnRlZFNuaXBwZXQsICdjYW5ub3QgaW5zZXJ0IHNuaXBwZXQgYmVmb3JlIGl0c2VsZidcblxuICAgIHBvc2l0aW9uID1cbiAgICAgIHByZXZpb3VzOiBzbmlwcGV0LnByZXZpb3VzXG4gICAgICBuZXh0OiBzbmlwcGV0XG4gICAgICBwYXJlbnRDb250YWluZXI6IHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG5cbiAgICBAYXR0YWNoU25pcHBldChpbnNlcnRlZFNuaXBwZXQsIHBvc2l0aW9uKVxuXG5cbiAgaW5zZXJ0QWZ0ZXI6IChzbmlwcGV0LCBpbnNlcnRlZFNuaXBwZXQpIC0+XG4gICAgcmV0dXJuIGlmIHNuaXBwZXQubmV4dCA9PSBpbnNlcnRlZFNuaXBwZXRcbiAgICBhc3NlcnQgc25pcHBldCBpc250IGluc2VydGVkU25pcHBldCwgJ2Nhbm5vdCBpbnNlcnQgc25pcHBldCBhZnRlciBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogc25pcHBldFxuICAgICAgbmV4dDogc25pcHBldC5uZXh0XG4gICAgICBwYXJlbnRDb250YWluZXI6IHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG5cbiAgICBAYXR0YWNoU25pcHBldChpbnNlcnRlZFNuaXBwZXQsIHBvc2l0aW9uKVxuXG5cbiAgdXA6IChzbmlwcGV0KSAtPlxuICAgIGlmIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBAaW5zZXJ0QmVmb3JlKHNuaXBwZXQucHJldmlvdXMsIHNuaXBwZXQpXG5cblxuICBkb3duOiAoc25pcHBldCkgLT5cbiAgICBpZiBzbmlwcGV0Lm5leHQ/XG4gICAgICBAaW5zZXJ0QWZ0ZXIoc25pcHBldC5uZXh0LCBzbmlwcGV0KVxuXG5cbiAgZ2V0U25pcHBldFRyZWU6IC0+XG4gICAgQHNuaXBwZXRUcmVlIHx8IEBwYXJlbnRTbmlwcGV0Py5zbmlwcGV0VHJlZVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgc25pcHBldHNcbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIHNuaXBwZXQgPSBAZmlyc3RcbiAgICB3aGlsZSAoc25pcHBldClcbiAgICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmKGNhbGxiYWNrKVxuICAgICAgc25pcHBldCA9IHNuaXBwZXQubmV4dFxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gICMgVHJhdmVyc2UgYWxsIHNuaXBwZXRzIGFuZCBjb250YWluZXJzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBjYWxsYmFjayhzbmlwcGV0KVxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICByZW1vdmU6IChzbmlwcGV0KSAtPlxuICAgIHNuaXBwZXQuZGVzdHJveSgpXG4gICAgQF9kZXRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cblxuICB1aTogLT5cbiAgICBpZiBub3QgQHVpSW5qZWN0b3JcbiAgICAgIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLnJlbmRlcmVyLmNyZWF0ZUludGVyZmFjZUluamVjdG9yKHRoaXMpXG4gICAgQHVpSW5qZWN0b3JcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEV2ZXJ5IHNuaXBwZXQgYWRkZWQgb3IgbW92ZWQgbW9zdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgc25pcHBldFRyZWUgaWYgdGhlIHBhcmVudCBzbmlwcGV0IGlzXG4gICMgYXR0YWNoZWQgdG8gb25lLlxuICAjIEBhcGkgcHJpdmF0ZVxuICBhdHRhY2hTbmlwcGV0OiAoc25pcHBldCwgcG9zaXRpb24gPSB7fSkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEBsaW5rKHNuaXBwZXQsIHBvc2l0aW9uKVxuXG4gICAgaWYgc25pcHBldFRyZWUgPSBAZ2V0U25pcHBldFRyZWUoKVxuICAgICAgc25pcHBldFRyZWUuYXR0YWNoaW5nU25pcHBldChzbmlwcGV0LCBmdW5jKVxuICAgIGVsc2VcbiAgICAgIGZ1bmMoKVxuXG5cbiAgIyBFdmVyeSBzbmlwcGV0IHRoYXQgaXMgcmVtb3ZlZCBtdXN0IGNvbWUgdGhyb3VnaCBoZXJlLlxuICAjIE5vdGlmaWVzIHRoZSBzbmlwcGV0VHJlZSBpZiB0aGUgcGFyZW50IHNuaXBwZXQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgU25pcHBldHMgdGhhdCBhcmUgbW92ZWQgaW5zaWRlIGEgc25pcHBldFRyZWUgc2hvdWxkIG5vdFxuICAjIGNhbGwgX2RldGFjaFNuaXBwZXQgc2luY2Ugd2UgZG9uJ3Qgd2FudCB0byBmaXJlXG4gICMgU25pcHBldFJlbW92ZWQgZXZlbnRzIG9uIHRoZSBzbmlwcGV0IHRyZWUsIGluIHRoZXNlXG4gICMgY2FzZXMgdW5saW5rIGNhbiBiZSB1c2VkXG4gICMgQGFwaSBwcml2YXRlXG4gIF9kZXRhY2hTbmlwcGV0OiAoc25pcHBldCkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEB1bmxpbmsoc25pcHBldClcblxuICAgIGlmIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLmRldGFjaGluZ1NuaXBwZXQoc25pcHBldCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGxpbms6IChzbmlwcGV0LCBwb3NpdGlvbikgLT5cbiAgICBAdW5saW5rKHNuaXBwZXQpIGlmIHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG5cbiAgICBwb3NpdGlvbi5wYXJlbnRDb250YWluZXIgfHw9IHRoaXNcbiAgICBAc2V0U25pcHBldFBvc2l0aW9uKHNuaXBwZXQsIHBvc2l0aW9uKVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgdW5saW5rOiAoc25pcHBldCkgLT5cbiAgICBjb250YWluZXIgPSBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuICAgIGlmIGNvbnRhaW5lclxuXG4gICAgICAjIHVwZGF0ZSBwYXJlbnRDb250YWluZXIgbGlua3NcbiAgICAgIGNvbnRhaW5lci5maXJzdCA9IHNuaXBwZXQubmV4dCB1bmxlc3Mgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIGNvbnRhaW5lci5sYXN0ID0gc25pcHBldC5wcmV2aW91cyB1bmxlc3Mgc25pcHBldC5uZXh0P1xuXG4gICAgICAjIHVwZGF0ZSBwcmV2aW91cyBhbmQgbmV4dCBub2Rlc1xuICAgICAgc25pcHBldC5uZXh0Py5wcmV2aW91cyA9IHNuaXBwZXQucHJldmlvdXNcbiAgICAgIHNuaXBwZXQucHJldmlvdXM/Lm5leHQgPSBzbmlwcGV0Lm5leHRcblxuICAgICAgQHNldFNuaXBwZXRQb3NpdGlvbihzbmlwcGV0LCB7fSlcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHNldFNuaXBwZXRQb3NpdGlvbjogKHNuaXBwZXQsIHsgcGFyZW50Q29udGFpbmVyLCBwcmV2aW91cywgbmV4dCB9KSAtPlxuICAgIHNuaXBwZXQucGFyZW50Q29udGFpbmVyID0gcGFyZW50Q29udGFpbmVyXG4gICAgc25pcHBldC5wcmV2aW91cyA9IHByZXZpb3VzXG4gICAgc25pcHBldC5uZXh0ID0gbmV4dFxuXG4gICAgaWYgcGFyZW50Q29udGFpbmVyXG4gICAgICBwcmV2aW91cy5uZXh0ID0gc25pcHBldCBpZiBwcmV2aW91c1xuICAgICAgbmV4dC5wcmV2aW91cyA9IHNuaXBwZXQgaWYgbmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyLmZpcnN0ID0gc25pcHBldCB1bmxlc3Mgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIHBhcmVudENvbnRhaW5lci5sYXN0ID0gc25pcHBldCB1bmxlc3Mgc25pcHBldC5uZXh0P1xuXG5cbiIsIlNuaXBwZXRDb250YWluZXIgPSByZXF1aXJlKCcuL3NuaXBwZXRfY29udGFpbmVyJylcbmd1aWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2d1aWQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbnNlcmlhbGl6YXRpb24gPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlcmlhbGl6YXRpb24nKVxuXG4jIFNuaXBwZXRNb2RlbFxuIyAtLS0tLS0tLS0tLS1cbiMgRWFjaCBTbmlwcGV0TW9kZWwgaGFzIGEgdGVtcGxhdGUgd2hpY2ggYWxsb3dzIHRvIGdlbmVyYXRlIGEgc25pcHBldFZpZXdcbiMgZnJvbSBhIHNuaXBwZXRNb2RlbFxuI1xuIyBSZXByZXNlbnRzIGEgbm9kZSBpbiBhIFNuaXBwZXRUcmVlLlxuIyBFdmVyeSBTbmlwcGV0TW9kZWwgY2FuIGhhdmUgYSBwYXJlbnQgKFNuaXBwZXRDb250YWluZXIpLFxuIyBzaWJsaW5ncyAob3RoZXIgc25pcHBldHMpIGFuZCBtdWx0aXBsZSBjb250YWluZXJzIChTbmlwcGV0Q29udGFpbmVycykuXG4jXG4jIFRoZSBjb250YWluZXJzIGFyZSB0aGUgcGFyZW50cyBvZiB0aGUgY2hpbGQgU25pcHBldE1vZGVscy5cbiMgRS5nLiBhIGdyaWQgcm93IHdvdWxkIGhhdmUgYXMgbWFueSBjb250YWluZXJzIGFzIGl0IGhhc1xuIyBjb2x1bW5zXG4jXG4jICMgQHByb3AgcGFyZW50Q29udGFpbmVyOiBwYXJlbnQgU25pcHBldENvbnRhaW5lclxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0TW9kZWxcblxuICBjb25zdHJ1Y3RvcjogKHsgQHRlbXBsYXRlLCBpZCB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IEB0ZW1wbGF0ZSwgJ2Nhbm5vdCBpbnN0YW50aWF0ZSBzbmlwcGV0IHdpdGhvdXQgdGVtcGxhdGUgcmVmZXJlbmNlJ1xuXG4gICAgQGluaXRpYWxpemVEaXJlY3RpdmVzKClcbiAgICBAc3R5bGVzID0ge31cbiAgICBAaWQgPSBpZCB8fCBndWlkLm5leHQoKVxuICAgIEBpZGVudGlmaWVyID0gQHRlbXBsYXRlLmlkZW50aWZpZXJcblxuICAgIEBuZXh0ID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldENvbnRhaW5lclxuICAgIEBzbmlwcGV0VHJlZSA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBAdGVtcGxhdGUuZGlyZWN0aXZlc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAY29udGFpbmVycyB8fD0ge31cbiAgICAgICAgICBAY29udGFpbmVyc1tkaXJlY3RpdmUubmFtZV0gPSBuZXcgU25pcHBldENvbnRhaW5lclxuICAgICAgICAgICAgbmFtZTogZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgICAgIHBhcmVudFNuaXBwZXQ6IHRoaXNcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gU25pcHBldE1vZGVsXCJcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICBoYXNDb250YWluZXJzOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdjb250YWluZXInKSA+IDBcblxuXG4gIGhhc0VkaXRhYmxlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnZWRpdGFibGUnKSA+IDBcblxuXG4gIGhhc0h0bWw6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2h0bWwnKSA+IDBcblxuXG4gIGhhc0ltYWdlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnaW1hZ2UnKSA+IDBcblxuXG4gIGJlZm9yZTogKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBzbmlwcGV0TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIHNuaXBwZXRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAcHJldmlvdXNcblxuXG4gIGFmdGVyOiAoc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIHNuaXBwZXRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQG5leHRcblxuXG4gIGFwcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChzbmlwcGV0TW9kZWwpXG4gICAgdGhpc1xuXG5cbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLnByZXBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGFzc2VydCBAY29udGVudD8uaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcInNldCBlcnJvcjogI3sgQGlkZW50aWZpZXIgfSBoYXMgbm8gY29udGVudCBuYW1lZCAjeyBuYW1lIH1cIlxuXG4gICAgaWYgQGNvbnRlbnRbbmFtZV0gIT0gdmFsdWVcbiAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgIEBzbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcodGhpcywgbmFtZSkgaWYgQHNuaXBwZXRUcmVlXG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIGFzc2VydCBAY29udGVudD8uaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcImdldCBlcnJvcjogI3sgQGlkZW50aWZpZXIgfSBoYXMgbm8gY29udGVudCBuYW1lZCAjeyBuYW1lIH1cIlxuXG4gICAgQGNvbnRlbnRbbmFtZV1cblxuXG4gIGlzRW1wdHk6IChuYW1lKSAtPlxuICAgIHZhbHVlID0gQGdldChuYW1lKVxuICAgIHZhbHVlID09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PSAnJ1xuXG5cbiAgc3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIEBzdHlsZXNbbmFtZV1cbiAgICBlbHNlXG4gICAgICBAc2V0U3R5bGUobmFtZSwgdmFsdWUpXG5cblxuICBzZXRTdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHN0eWxlID0gQHRlbXBsYXRlLnN0eWxlc1tuYW1lXVxuICAgIGlmIG5vdCBzdHlsZVxuICAgICAgbG9nLndhcm4gXCJVbmtub3duIHN0eWxlICcjeyBuYW1lIH0nIGluIFNuaXBwZXRNb2RlbCAjeyBAaWRlbnRpZmllciB9XCJcbiAgICBlbHNlIGlmIG5vdCBzdHlsZS52YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgbG9nLndhcm4gXCJJbnZhbGlkIHZhbHVlICcjeyB2YWx1ZSB9JyBmb3Igc3R5bGUgJyN7IG5hbWUgfScgaW4gU25pcHBldE1vZGVsICN7IEBpZGVudGlmaWVyIH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIEBzdHlsZXNbbmFtZV0gIT0gdmFsdWVcbiAgICAgICAgQHN0eWxlc1tuYW1lXSA9IHZhbHVlXG4gICAgICAgIGlmIEBzbmlwcGV0VHJlZVxuICAgICAgICAgIEBzbmlwcGV0VHJlZS5odG1sQ2hhbmdpbmcodGhpcywgJ3N0eWxlJywgeyBuYW1lLCB2YWx1ZSB9KVxuXG5cbiAgY29weTogLT5cbiAgICBsb2cud2FybihcIlNuaXBwZXRNb2RlbCNjb3B5KCkgaXMgbm90IGltcGxlbWVudGVkIHlldC5cIilcblxuICAgICMgc2VyaWFsaXppbmcvZGVzZXJpYWxpemluZyBzaG91bGQgd29yayBidXQgbmVlZHMgdG8gZ2V0IHNvbWUgdGVzdHMgZmlyc3RcbiAgICAjIGpzb24gPSBAdG9Kc29uKClcbiAgICAjIGpzb24uaWQgPSBndWlkLm5leHQoKVxuICAgICMgU25pcHBldE1vZGVsLmZyb21Kc29uKGpzb24pXG5cblxuICBjb3B5V2l0aG91dENvbnRlbnQ6IC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuXG4gICMgbW92ZSB1cCAocHJldmlvdXMpXG4gIHVwOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIudXAodGhpcylcbiAgICB0aGlzXG5cblxuICAjIG1vdmUgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIHJlbW92ZSBUcmVlTm9kZSBmcm9tIGl0cyBjb250YWluZXIgYW5kIFNuaXBwZXRUcmVlXG4gIHJlbW92ZTogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLnJlbW92ZSh0aGlzKVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgZGVzdHJveTogLT5cbiAgICAjIHRvZG86IG1vdmUgaW50byB0byByZW5kZXJlclxuXG4gICAgIyByZW1vdmUgdXNlciBpbnRlcmZhY2UgZWxlbWVudHNcbiAgICBAdWlJbmplY3Rvci5yZW1vdmUoKSBpZiBAdWlJbmplY3RvclxuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRTbmlwcGV0XG5cblxuICB1aTogLT5cbiAgICBpZiBub3QgQHVpSW5qZWN0b3JcbiAgICAgIEBzbmlwcGV0VHJlZS5yZW5kZXJlci5jcmVhdGVJbnRlcmZhY2VJbmplY3Rvcih0aGlzKVxuICAgIEB1aUluamVjdG9yXG5cblxuICAjIEl0ZXJhdG9yc1xuICAjIC0tLS0tLS0tLVxuXG4gIHBhcmVudHM6IChjYWxsYmFjaykgLT5cbiAgICBzbmlwcGV0TW9kZWwgPSB0aGlzXG4gICAgd2hpbGUgKHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5nZXRQYXJlbnQoKSlcbiAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbClcblxuXG4gIGNoaWxkcmVuOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcbiAgICAgIHdoaWxlIChzbmlwcGV0TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbClcbiAgICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLm5leHRcblxuXG4gIGRlc2NlbmRhbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcbiAgICAgIHdoaWxlIChzbmlwcGV0TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbClcbiAgICAgICAgc25pcHBldE1vZGVsLmRlc2NlbmRhbnRzKGNhbGxiYWNrKVxuICAgICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwubmV4dFxuXG5cbiAgZGVzY2VuZGFudHNBbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZGVzY2VuZGFudHMoY2FsbGJhY2spXG5cblxuICAjIHJldHVybiBhbGwgZGVzY2VuZGFudCBjb250YWluZXJzIChpbmNsdWRpbmcgdGhvc2Ugb2YgdGhpcyBzbmlwcGV0TW9kZWwpXG4gIGRlc2NlbmRhbnRDb250YWluZXJzOiAoY2FsbGJhY2spIC0+XG4gICAgQGRlc2NlbmRhbnRzQW5kU2VsZiAoc25pcHBldE1vZGVsKSAtPlxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgYW5kIHNuaXBwZXRzXG4gIGFsbERlc2NlbmRhbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgQGRlc2NlbmRhbnRzQW5kU2VsZiAoc25pcHBldE1vZGVsKSA9PlxuICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKSBpZiBzbmlwcGV0TW9kZWwgIT0gdGhpc1xuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gIGNoaWxkcmVuQW5kU2VsZjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGNoaWxkcmVuKGNhbGxiYWNrKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHRvSnNvbjogLT5cblxuICAgIGpzb24gPVxuICAgICAgaWQ6IEBpZFxuICAgICAgaWRlbnRpZmllcjogQGlkZW50aWZpZXJcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoQGNvbnRlbnQpXG4gICAgICBqc29uLmNvbnRlbnQgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KEBjb250ZW50KVxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShAc3R5bGVzKVxuICAgICAganNvbi5zdHlsZXMgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KEBzdHlsZXMpXG5cbiAgICAjIGNyZWF0ZSBhbiBhcnJheSBmb3IgZXZlcnkgY29udGFpbmVyXG4gICAgZm9yIG5hbWUgb2YgQGNvbnRhaW5lcnNcbiAgICAgIGpzb24uY29udGFpbmVycyB8fD0ge31cbiAgICAgIGpzb24uY29udGFpbmVyc1tuYW1lXSA9IFtdXG5cbiAgICBqc29uXG5cblxuU25pcHBldE1vZGVsLmZyb21Kc29uID0gKGpzb24sIGRlc2lnbikgLT5cbiAgdGVtcGxhdGUgPSBkZXNpZ24uZ2V0KGpzb24uaWRlbnRpZmllcilcblxuICBhc3NlcnQgdGVtcGxhdGUsXG4gICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gdGVtcGxhdGUgaWRlbnRpZmllciAnI3sganNvbi5pZGVudGlmaWVyIH0nXCJcblxuICBtb2RlbCA9IG5ldyBTbmlwcGV0TW9kZWwoeyB0ZW1wbGF0ZSwgaWQ6IGpzb24uaWQgfSlcblxuICBmb3IgbmFtZSwgdmFsdWUgb2YganNvbi5jb250ZW50XG4gICAgYXNzZXJ0IG1vZGVsLmNvbnRlbnQuaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250ZW50ICcjeyBuYW1lIH0nXCJcbiAgICBtb2RlbC5jb250ZW50W25hbWVdID0gdmFsdWVcblxuICBmb3Igc3R5bGVOYW1lLCB2YWx1ZSBvZiBqc29uLnN0eWxlc1xuICAgIG1vZGVsLnN0eWxlKHN0eWxlTmFtZSwgdmFsdWUpXG5cbiAgZm9yIGNvbnRhaW5lck5hbWUsIHNuaXBwZXRBcnJheSBvZiBqc29uLmNvbnRhaW5lcnNcbiAgICBhc3NlcnQgbW9kZWwuY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShjb250YWluZXJOYW1lKSxcbiAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIGNvbnRhaW5lciAjeyBjb250YWluZXJOYW1lIH1cIlxuXG4gICAgaWYgc25pcHBldEFycmF5XG4gICAgICBhc3NlcnQgJC5pc0FycmF5KHNuaXBwZXRBcnJheSksXG4gICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiBjb250YWluZXIgaXMgbm90IGFycmF5ICN7IGNvbnRhaW5lck5hbWUgfVwiXG4gICAgICBmb3IgY2hpbGQgaW4gc25pcHBldEFycmF5XG4gICAgICAgIG1vZGVsLmFwcGVuZCggY29udGFpbmVyTmFtZSwgU25pcHBldE1vZGVsLmZyb21Kc29uKGNoaWxkLCBkZXNpZ24pIClcblxuICBtb2RlbFxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5TbmlwcGV0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X2NvbnRhaW5lcicpXG5TbmlwcGV0QXJyYXkgPSByZXF1aXJlKCcuL3NuaXBwZXRfYXJyYXknKVxuU25pcHBldE1vZGVsID0gcmVxdWlyZSgnLi9zbmlwcGV0X21vZGVsJylcblxuIyBTbmlwcGV0VHJlZVxuIyAtLS0tLS0tLS0tLVxuIyBMaXZpbmdkb2NzIGVxdWl2YWxlbnQgdG8gdGhlIERPTSB0cmVlLlxuIyBBIHNuaXBwZXQgdHJlZSBjb250YWluZXMgYWxsIHRoZSBzbmlwcGV0cyBvZiBhIHBhZ2UgaW4gaGllcmFyY2hpY2FsIG9yZGVyLlxuI1xuIyBUaGUgcm9vdCBvZiB0aGUgU25pcHBldFRyZWUgaXMgYSBTbmlwcGV0Q29udGFpbmVyLiBBIFNuaXBwZXRDb250YWluZXJcbiMgY29udGFpbnMgYSBsaXN0IG9mIHNuaXBwZXRzLlxuI1xuIyBzbmlwcGV0cyBjYW4gaGF2ZSBtdWx0aWJsZSBTbmlwcGV0Q29udGFpbmVycyB0aGVtc2VsdmVzLlxuI1xuIyAjIyMgRXhhbXBsZTpcbiMgICAgIC0gU25pcHBldENvbnRhaW5lciAocm9vdClcbiMgICAgICAgLSBTbmlwcGV0ICdIZXJvJ1xuIyAgICAgICAtIFNuaXBwZXQgJzIgQ29sdW1ucydcbiMgICAgICAgICAtIFNuaXBwZXRDb250YWluZXIgJ21haW4nXG4jICAgICAgICAgICAtIFNuaXBwZXQgJ1RpdGxlJ1xuIyAgICAgICAgIC0gU25pcHBldENvbnRhaW5lciAnc2lkZWJhcidcbiMgICAgICAgICAgIC0gU25pcHBldCAnSW5mby1Cb3gnJ1xuI1xuIyAjIyMgRXZlbnRzOlxuIyBUaGUgZmlyc3Qgc2V0IG9mIFNuaXBwZXRUcmVlIEV2ZW50cyBhcmUgY29uY2VybmVkIHdpdGggbGF5b3V0IGNoYW5nZXMgbGlrZVxuIyBhZGRpbmcsIHJlbW92aW5nIG9yIG1vdmluZyBzbmlwcGV0cy5cbiNcbiMgQ29uc2lkZXI6IEhhdmUgYSBkb2N1bWVudEZyYWdtZW50IGFzIHRoZSByb290Tm9kZSBpZiBubyByb290Tm9kZSBpcyBnaXZlblxuIyBtYXliZSB0aGlzIHdvdWxkIGhlbHAgc2ltcGxpZnkgc29tZSBjb2RlIChzaW5jZSBzbmlwcGV0cyBhcmUgYWx3YXlzXG4jIGF0dGFjaGVkIHRvIHRoZSBET00pLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0VHJlZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGNvbnRlbnQsIGRlc2lnbiB9ID0ge30pIC0+XG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICAjIGluaXRpYWxpemUgY29udGVudCBiZWZvcmUgd2Ugc2V0IHRoZSBzbmlwcGV0IHRyZWUgdG8gdGhlIHJvb3RcbiAgICAjIG90aGVyd2lzZSBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIHRyaWdnZXJlZCB3aGlsZSBidWlsZGluZyB0aGUgdHJlZVxuICAgIGlmIGNvbnRlbnQ/IGFuZCBkZXNpZ24/XG4gICAgICBAZnJvbUpzb24oY29udGVudCwgZGVzaWduKVxuXG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgQGluaXRpYWxpemVFdmVudHMoKVxuXG5cbiAgIyBpbnNlcnQgc25pcHBldCBhdCB0aGUgYmVnaW5uaW5nXG4gIHByZXBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIEByb290LnByZXBlbmQoc25pcHBldClcbiAgICB0aGlzXG5cblxuICAjIGluc2VydCBzbmlwcGV0IGF0IHRoZSBlbmRcbiAgYXBwZW5kOiAoc25pcHBldCkgLT5cbiAgICBAcm9vdC5hcHBlbmQoc25pcHBldClcbiAgICB0aGlzXG5cblxuICBpbml0aWFsaXplRXZlbnRzOiAoKSAtPlxuXG4gICAgIyBsYXlvdXQgY2hhbmdlc1xuICAgIEBzbmlwcGV0QWRkZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRSZW1vdmVkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0TW92ZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICAjIGNvbnRlbnQgY2hhbmdlc1xuICAgIEBzbmlwcGV0Q29udGVudENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRIdG1sQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldFNldHRpbmdzQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuICAgIEBjaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgIyBUcmF2ZXJzZSB0aGUgd2hvbGUgc25pcHBldCB0cmVlLlxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaChjYWxsYmFjaylcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoQ29udGFpbmVyKGNhbGxiYWNrKVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgY29udGFpbmVycyBhbmQgc25pcHBldHNcbiAgYWxsOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuYWxsKGNhbGxiYWNrKVxuXG5cbiAgZmluZDogKHNlYXJjaCkgLT5cbiAgICBpZiB0eXBlb2Ygc2VhcmNoID09ICdzdHJpbmcnXG4gICAgICByZXMgPSBbXVxuICAgICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICAgIGlmIHNuaXBwZXQuaWRlbnRpZmllciA9PSBzZWFyY2ggfHwgc25pcHBldC50ZW1wbGF0ZS5pZCA9PSBzZWFyY2hcbiAgICAgICAgICByZXMucHVzaChzbmlwcGV0KVxuXG4gICAgICBuZXcgU25pcHBldEFycmF5KHJlcylcbiAgICBlbHNlXG4gICAgICBuZXcgU25pcHBldEFycmF5KClcblxuXG4gIGRldGFjaDogLT5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgc25pcHBldC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgb2xkUm9vdCA9IEByb290XG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICBvbGRSb290XG5cblxuICAjIGVhY2hXaXRoUGFyZW50czogKHNuaXBwZXQsIHBhcmVudHMpIC0+XG4gICMgICBwYXJlbnRzIHx8PSBbXVxuXG4gICMgICAjIHRyYXZlcnNlXG4gICMgICBwYXJlbnRzID0gcGFyZW50cy5wdXNoKHNuaXBwZXQpXG4gICMgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgIyAgICAgc25pcHBldCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAjICAgICB3aGlsZSAoc25pcHBldClcbiAgIyAgICAgICBAZWFjaFdpdGhQYXJlbnRzKHNuaXBwZXQsIHBhcmVudHMpXG4gICMgICAgICAgc25pcHBldCA9IHNuaXBwZXQubmV4dFxuXG4gICMgICBwYXJlbnRzLnNwbGljZSgtMSlcblxuXG4gICMgcmV0dXJucyBhIHJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICBwcmludDogKCkgLT5cbiAgICBvdXRwdXQgPSAnU25pcHBldFRyZWVcXG4tLS0tLS0tLS0tLVxcbidcblxuICAgIGFkZExpbmUgPSAodGV4dCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgb3V0cHV0ICs9IFwiI3sgQXJyYXkoaW5kZW50YXRpb24gKyAxKS5qb2luKFwiIFwiKSB9I3sgdGV4dCB9XFxuXCJcblxuICAgIHdhbGtlciA9IChzbmlwcGV0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICB0ZW1wbGF0ZSA9IHNuaXBwZXQudGVtcGxhdGVcbiAgICAgIGFkZExpbmUoXCItICN7IHRlbXBsYXRlLnRpdGxlIH0gKCN7IHRlbXBsYXRlLmlkZW50aWZpZXIgfSlcIiwgaW5kZW50YXRpb24pXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBhZGRMaW5lKFwiI3sgbmFtZSB9OlwiLCBpbmRlbnRhdGlvbiArIDIpXG4gICAgICAgIHdhbGtlcihzbmlwcGV0Q29udGFpbmVyLmZpcnN0LCBpbmRlbnRhdGlvbiArIDQpIGlmIHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAgICAgIyB0cmF2ZXJzZSBzaWJsaW5nc1xuICAgICAgd2Fsa2VyKHNuaXBwZXQubmV4dCwgaW5kZW50YXRpb24pIGlmIHNuaXBwZXQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0KSBpZiBAcm9vdC5maXJzdFxuICAgIHJldHVybiBvdXRwdXRcblxuXG4gICMgVHJlZSBDaGFuZ2UgRXZlbnRzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgUmFpc2UgZXZlbnRzIGZvciBBZGQsIFJlbW92ZSBhbmQgTW92ZSBvZiBzbmlwcGV0c1xuICAjIFRoZXNlIGZ1bmN0aW9ucyBzaG91bGQgb25seSBiZSBjYWxsZWQgYnkgc25pcHBldENvbnRhaW5lcnNcblxuICBhdHRhY2hpbmdTbmlwcGV0OiAoc25pcHBldCwgYXR0YWNoU25pcHBldEZ1bmMpIC0+XG4gICAgaWYgc25pcHBldC5zbmlwcGV0VHJlZSA9PSB0aGlzXG4gICAgICAjIG1vdmUgc25pcHBldFxuICAgICAgYXR0YWNoU25pcHBldEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnc25pcHBldE1vdmVkJywgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBpZiBzbmlwcGV0LnNuaXBwZXRUcmVlP1xuICAgICAgICAjIHJlbW92ZSBmcm9tIG90aGVyIHNuaXBwZXQgdHJlZVxuICAgICAgICBzbmlwcGV0LnNuaXBwZXRDb250YWluZXIuZGV0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudCkgPT5cbiAgICAgICAgZGVzY2VuZGFudC5zbmlwcGV0VHJlZSA9IHRoaXNcblxuICAgICAgYXR0YWNoU25pcHBldEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnc25pcHBldEFkZGVkJywgc25pcHBldClcblxuXG4gIGZpcmVFdmVudDogKGV2ZW50LCBhcmdzLi4uKSAtPlxuICAgIHRoaXNbZXZlbnRdLmZpcmUuYXBwbHkoZXZlbnQsIGFyZ3MpXG4gICAgQGNoYW5nZWQuZmlyZSgpXG5cblxuICBkZXRhY2hpbmdTbmlwcGV0OiAoc25pcHBldCwgZGV0YWNoU25pcHBldEZ1bmMpIC0+XG4gICAgYXNzZXJ0IHNuaXBwZXQuc25pcHBldFRyZWUgaXMgdGhpcyxcbiAgICAgICdjYW5ub3QgcmVtb3ZlIHNuaXBwZXQgZnJvbSBhbm90aGVyIFNuaXBwZXRUcmVlJ1xuXG4gICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnRzKSAtPlxuICAgICAgZGVzY2VuZGFudHMuc25pcHBldFRyZWUgPSB1bmRlZmluZWRcblxuICAgIGRldGFjaFNuaXBwZXRGdW5jKClcbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0UmVtb3ZlZCcsIHNuaXBwZXQpXG5cblxuICBjb250ZW50Q2hhbmdpbmc6IChzbmlwcGV0KSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRDb250ZW50Q2hhbmdlZCcsIHNuaXBwZXQpXG5cblxuICBodG1sQ2hhbmdpbmc6IChzbmlwcGV0KSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRIdG1sQ2hhbmdlZCcsIHNuaXBwZXQpXG5cblxuICAjIFNlcmlhbGl6YXRpb25cbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgcHJpbnRKc29uOiAtPlxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihAdG9Kc29uKCkpXG5cblxuICAjIHJldHVybnMgYSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gIHRvSnNvbjogLT5cbiAgICBqc29uID0ge31cbiAgICBqc29uWydjb250ZW50J10gPSBbXVxuXG4gICAgc25pcHBldFRvSnNvbiA9IChzbmlwcGV0LCBsZXZlbCwgY29udGFpbmVyQXJyYXkpIC0+XG4gICAgICBzbmlwcGV0SnNvbiA9IHNuaXBwZXQudG9Kc29uKClcbiAgICAgIGNvbnRhaW5lckFycmF5LnB1c2ggc25pcHBldEpzb25cblxuICAgICAgc25pcHBldEpzb25cblxuICAgIHdhbGtlciA9IChzbmlwcGV0LCBsZXZlbCwganNvbk9iaikgLT5cbiAgICAgIHNuaXBwZXRKc29uID0gc25pcHBldFRvSnNvbihzbmlwcGV0LCBsZXZlbCwganNvbk9iailcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNvbnRhaW5lckFycmF5ID0gc25pcHBldEpzb24uY29udGFpbmVyc1tzbmlwcGV0Q29udGFpbmVyLm5hbWVdID0gW11cbiAgICAgICAgd2Fsa2VyKHNuaXBwZXRDb250YWluZXIuZmlyc3QsIGxldmVsICsgMSwgY29udGFpbmVyQXJyYXkpIGlmIHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAgICAgIyB0cmF2ZXJzZSBzaWJsaW5nc1xuICAgICAgd2Fsa2VyKHNuaXBwZXQubmV4dCwgbGV2ZWwsIGpzb25PYmopIGlmIHNuaXBwZXQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0LCAwLCBqc29uWydjb250ZW50J10pIGlmIEByb290LmZpcnN0XG5cbiAgICBqc29uXG5cblxuICBmcm9tSnNvbjogKGpzb24sIGRlc2lnbikgLT5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuICAgIGlmIGpzb24uY29udGVudFxuICAgICAgZm9yIHNuaXBwZXRKc29uIGluIGpzb24uY29udGVudFxuICAgICAgICBzbmlwcGV0ID0gU25pcHBldE1vZGVsLmZyb21Kc29uKHNuaXBwZXRKc29uLCBkZXNpZ24pXG4gICAgICAgIEByb290LmFwcGVuZChzbmlwcGV0KVxuXG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgQHJvb3QuZWFjaCAoc25pcHBldCkgPT5cbiAgICAgIHNuaXBwZXQuc25pcHBldFRyZWUgPSB0aGlzXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVcblxuICBjb25zdHJ1Y3RvcjogKHsgbmFtZSwgQHR5cGUsIEBlbGVtIH0pIC0+XG4gICAgQG5hbWUgPSBuYW1lIHx8IGNvbmZpZy5kaXJlY3RpdmVzW0B0eXBlXS5kZWZhdWx0TmFtZVxuICAgIEBjb25maWcgPSBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV1cbiAgICBAb3B0aW9uYWwgPSBmYWxzZVxuXG5cbiAgcmVuZGVyZWRBdHRyOiAtPlxuICAgIEBjb25maWcucmVuZGVyZWRBdHRyXG5cblxuICBpc0VsZW1lbnREaXJlY3RpdmU6IC0+XG4gICAgQGNvbmZpZy5lbGVtZW50RGlyZWN0aXZlXG5cblxuICAjIEZvciBldmVyeSBuZXcgU25pcHBldFZpZXcgdGhlIGRpcmVjdGl2ZXMgYXJlIGNsb25lZCBmcm9tIHRoZVxuICAjIHRlbXBsYXRlIGFuZCBsaW5rZWQgd2l0aCB0aGUgZWxlbWVudHMgZnJvbSB0aGUgbmV3IHZpZXdcbiAgY2xvbmU6IC0+XG4gICAgbmV3RGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZShuYW1lOiBAbmFtZSwgdHlwZTogQHR5cGUpXG4gICAgbmV3RGlyZWN0aXZlLm9wdGlvbmFsID0gQG9wdGlvbmFsXG4gICAgbmV3RGlyZWN0aXZlXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG4jIEEgbGlzdCBvZiBhbGwgZGlyZWN0aXZlcyBvZiBhIHRlbXBsYXRlXG4jIEV2ZXJ5IG5vZGUgd2l0aCBhbiBkb2MtIGF0dHJpYnV0ZSB3aWxsIGJlIHN0b3JlZCBieSBpdHMgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVDb2xsZWN0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAYWxsPXt9KSAtPlxuICAgIEBsZW5ndGggPSAwXG5cblxuICBhZGQ6IChkaXJlY3RpdmUpIC0+XG4gICAgQGFzc2VydE5hbWVOb3RVc2VkKGRpcmVjdGl2ZSlcblxuICAgICMgY3JlYXRlIHBzZXVkbyBhcnJheVxuICAgIHRoaXNbQGxlbmd0aF0gPSBkaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUuaW5kZXggPSBAbGVuZ3RoXG4gICAgQGxlbmd0aCArPSAxXG5cbiAgICAjIGluZGV4IGJ5IG5hbWVcbiAgICBAYWxsW2RpcmVjdGl2ZS5uYW1lXSA9IGRpcmVjdGl2ZVxuXG4gICAgIyBpbmRleCBieSB0eXBlXG4gICAgIyBkaXJlY3RpdmUudHlwZSBpcyBvbmUgb2YgdGhvc2UgJ2NvbnRhaW5lcicsICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdIHx8PSBbXVxuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdLnB1c2goZGlyZWN0aXZlKVxuXG5cbiAgbmV4dDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlIHx8PSBAYWxsW25hbWVdXG4gICAgdGhpc1tkaXJlY3RpdmUuaW5kZXggKz0gMV1cblxuXG4gIG5leHRPZlR5cGU6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSB8fD0gQGFsbFtuYW1lXVxuXG4gICAgcmVxdWlyZWRUeXBlID0gZGlyZWN0aXZlLnR5cGVcbiAgICB3aGlsZSBkaXJlY3RpdmUgPSBAbmV4dChkaXJlY3RpdmUpXG4gICAgICByZXR1cm4gZGlyZWN0aXZlIGlmIGRpcmVjdGl2ZS50eXBlIGlzIHJlcXVpcmVkVHlwZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBAYWxsW25hbWVdXG5cblxuICAjIGhlbHBlciB0byBkaXJlY3RseSBnZXQgZWxlbWVudCB3cmFwcGVkIGluIGEgalF1ZXJ5IG9iamVjdFxuICAkZ2V0RWxlbTogKG5hbWUpIC0+XG4gICAgJChAYWxsW25hbWVdLmVsZW0pXG5cblxuICBjb3VudDogKHR5cGUpIC0+XG4gICAgaWYgdHlwZVxuICAgICAgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgQGxlbmd0aFxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgY2xvbmU6IC0+XG4gICAgbmV3Q29sbGVjdGlvbiA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcbiAgICBAZWFjaCAoZGlyZWN0aXZlKSAtPlxuICAgICAgbmV3Q29sbGVjdGlvbi5hZGQoZGlyZWN0aXZlLmNsb25lKCkpXG5cbiAgICBuZXdDb2xsZWN0aW9uXG5cblxuICBhc3NlcnRBbGxMaW5rZWQ6IC0+XG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZGlyZWN0aXZlLmVsZW1cblxuICAgIHJldHVybiB0cnVlXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBhc3NlcnROYW1lTm90VXNlZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBhc3NlcnQgZGlyZWN0aXZlICYmIG5vdCBAYWxsW2RpcmVjdGl2ZS5uYW1lXSxcbiAgICAgIFwiXCJcIlxuICAgICAgI3tkaXJlY3RpdmUudHlwZX0gVGVtcGxhdGUgcGFyc2luZyBlcnJvcjpcbiAgICAgICN7IGNvbmZpZy5kaXJlY3RpdmVzW2RpcmVjdGl2ZS50eXBlXS5yZW5kZXJlZEF0dHIgfT1cIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIi5cbiAgICAgIFwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiIGlzIGEgZHVwbGljYXRlIG5hbWUuXG4gICAgICBcIlwiXCJcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIHBhcnNlOiAoZWxlbSkgLT5cbiAgICBlbGVtRGlyZWN0aXZlID0gdW5kZWZpbmVkXG4gICAgbW9kaWZpY2F0aW9ucyA9IFtdXG4gICAgQHBhcnNlRGlyZWN0aXZlcyBlbGVtLCAoZGlyZWN0aXZlKSAtPlxuICAgICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICAgIGVsZW1EaXJlY3RpdmUgPSBkaXJlY3RpdmVcbiAgICAgIGVsc2VcbiAgICAgICAgbW9kaWZpY2F0aW9ucy5wdXNoKGRpcmVjdGl2ZSlcblxuICAgIEBhcHBseU1vZGlmaWNhdGlvbnMoZWxlbURpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgaWYgZWxlbURpcmVjdGl2ZVxuICAgIHJldHVybiBlbGVtRGlyZWN0aXZlXG5cblxuICBwYXJzZURpcmVjdGl2ZXM6IChlbGVtLCBmdW5jKSAtPlxuICAgIGRpcmVjdGl2ZURhdGEgPSBbXVxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgYXR0cmlidXRlTmFtZSA9IGF0dHIubmFtZVxuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyaWJ1dGVOYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmVEYXRhLnB1c2hcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiBhdHRyaWJ1dGVOYW1lXG4gICAgICAgICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlXG4gICAgICAgICAgICBuYW1lOiBhdHRyLnZhbHVlXG4gICAgICAgICAgICB0eXBlOiB0eXBlXG4gICAgICAgICAgICBlbGVtOiBlbGVtXG5cbiAgICAjIFNpbmNlIHdlIG1vZGlmeSB0aGUgYXR0cmlidXRlcyB3ZSBoYXZlIHRvIHNwbGl0XG4gICAgIyB0aGlzIGludG8gdHdvIGxvb3BzXG4gICAgZm9yIGRhdGEgaW4gZGlyZWN0aXZlRGF0YVxuICAgICAgZGlyZWN0aXZlID0gZGF0YS5kaXJlY3RpdmVcbiAgICAgIEByZXdyaXRlQXR0cmlidXRlKGRpcmVjdGl2ZSwgZGF0YS5hdHRyaWJ1dGVOYW1lKVxuICAgICAgZnVuYyhkaXJlY3RpdmUpXG5cblxuICBhcHBseU1vZGlmaWNhdGlvbnM6IChtYWluRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gbW9kaWZpY2F0aW9uc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ29wdGlvbmFsJ1xuICAgICAgICAgIG1haW5EaXJlY3RpdmUub3B0aW9uYWwgPSB0cnVlXG5cblxuICAjIE5vcm1hbGl6ZSBvciByZW1vdmUgdGhlIGF0dHJpYnV0ZVxuICAjIGRlcGVuZGluZyBvbiB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gIHJld3JpdGVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICBpZiBhdHRyaWJ1dGVOYW1lICE9IGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICAgIGVsc2UgaWYgbm90IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlKVxuICAgIGVsc2VcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuXG5cbiAgIyBmb3JjZSBhdHRyaWJ1dGUgc3R5bGUgYXMgc3BlY2lmaWVkIGluIGNvbmZpZ1xuICAjIGUuZy4gYXR0cmlidXRlICdkb2MtY29udGFpbmVyJyBiZWNvbWVzICdkYXRhLWRvYy1jb250YWluZXInXG4gIG5vcm1hbGl6ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBlbGVtID0gZGlyZWN0aXZlLmVsZW1cbiAgICBpZiBhdHRyaWJ1dGVOYW1lXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICBlbGVtLnNldEF0dHJpYnV0ZShkaXJlY3RpdmUucmVuZGVyZWRBdHRyKCksIGRpcmVjdGl2ZS5uYW1lKVxuXG5cbiAgcmVtb3ZlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGRpcmVjdGl2ZS5lbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKVxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJlY3RpdmVGaW5kZXIgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBsaW5rOiAoZWxlbSwgZGlyZWN0aXZlQ29sbGVjdGlvbikgLT5cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0ci5uYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb2xsZWN0aW9uLmdldChhdHRyLnZhbHVlKVxuICAgICAgICBkaXJlY3RpdmUuZWxlbSA9IGVsZW1cblxuICAgIHVuZGVmaW5lZFxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgRGlyZWN0aXZlIEl0ZXJhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBDb2RlIGlzIHBvcnRlZCBmcm9tIHJhbmd5IE5vZGVJdGVyYXRvciBhbmQgYWRhcHRlZCBmb3Igc25pcHBldCB0ZW1wbGF0ZXNcbiMgc28gaXQgZG9lcyBub3QgdHJhdmVyc2UgaW50byBjb250YWluZXJzLlxuI1xuIyBVc2UgdG8gdHJhdmVyc2UgYWxsIG5vZGVzIG9mIGEgdGVtcGxhdGUuIFRoZSBpdGVyYXRvciBkb2VzIG5vdCBnbyBpbnRvXG4jIGNvbnRhaW5lcnMgYW5kIGlzIHNhZmUgdG8gdXNlIGV2ZW4gaWYgdGhlcmUgaXMgY29udGVudCBpbiB0aGVzZSBjb250YWluZXJzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVJdGVyYXRvclxuXG4gIGNvbnN0cnVjdG9yOiAocm9vdCkgLT5cbiAgICBAcm9vdCA9IEBfbmV4dCA9IHJvb3RcbiAgICBAY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuXG4gIGN1cnJlbnQ6IG51bGxcblxuXG4gIGhhc05leHQ6IC0+XG4gICAgISFAX25leHRcblxuXG4gIG5leHQ6ICgpIC0+XG4gICAgbiA9IEBjdXJyZW50ID0gQF9uZXh0XG4gICAgY2hpbGQgPSBuZXh0ID0gdW5kZWZpbmVkXG4gICAgaWYgQGN1cnJlbnRcbiAgICAgIGNoaWxkID0gbi5maXJzdENoaWxkXG4gICAgICBpZiBjaGlsZCAmJiBuLm5vZGVUeXBlID09IDEgJiYgIW4uaGFzQXR0cmlidXRlKEBjb250YWluZXJBdHRyKVxuICAgICAgICBAX25leHQgPSBjaGlsZFxuICAgICAgZWxzZVxuICAgICAgICBuZXh0ID0gbnVsbFxuICAgICAgICB3aGlsZSAobiAhPSBAcm9vdCkgJiYgIShuZXh0ID0gbi5uZXh0U2libGluZylcbiAgICAgICAgICBuID0gbi5wYXJlbnROb2RlXG5cbiAgICAgICAgQF9uZXh0ID0gbmV4dFxuXG4gICAgQGN1cnJlbnRcblxuXG4gICMgb25seSBpdGVyYXRlIG92ZXIgZWxlbWVudCBub2RlcyAoTm9kZS5FTEVNRU5UX05PREUgPT0gMSlcbiAgbmV4dEVsZW1lbnQ6ICgpIC0+XG4gICAgd2hpbGUgQG5leHQoKVxuICAgICAgYnJlYWsgaWYgQGN1cnJlbnQubm9kZVR5cGUgPT0gMVxuXG4gICAgQGN1cnJlbnRcblxuXG4gIGRldGFjaDogKCkgLT5cbiAgICBAY3VycmVudCA9IEBfbmV4dCA9IEByb290ID0gbnVsbFxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcblxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfaXRlcmF0b3InKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuZGlyZWN0aXZlQ29tcGlsZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb21waWxlcicpXG5kaXJlY3RpdmVGaW5kZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9maW5kZXInKVxuXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuLi9zbmlwcGV0X3RyZWUvc25pcHBldF9tb2RlbCcpXG5TbmlwcGV0VmlldyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcnKVxuXG4jIFRlbXBsYXRlXG4jIC0tLS0tLS0tXG4jIFBhcnNlcyBzbmlwcGV0IHRlbXBsYXRlcyBhbmQgY3JlYXRlcyBTbmlwcGV0TW9kZWxzIGFuZCBTbmlwcGV0Vmlld3MuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRlbXBsYXRlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgaHRtbCwgQG5hbWVzcGFjZSwgQGlkLCBpZGVudGlmaWVyLCB0aXRsZSwgc3R5bGVzLCB3ZWlnaHQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBodG1sLCAnVGVtcGxhdGU6IHBhcmFtIGh0bWwgbWlzc2luZydcblxuICAgIGlmIGlkZW50aWZpZXJcbiAgICAgIHsgQG5hbWVzcGFjZSwgQGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIEBpZGVudGlmaWVyID0gaWYgQG5hbWVzcGFjZSAmJiBAaWRcbiAgICAgIFwiI3sgQG5hbWVzcGFjZSB9LiN7IEBpZCB9XCJcblxuICAgIEAkdGVtcGxhdGUgPSAkKCBAcHJ1bmVIdG1sKGh0bWwpICkud3JhcCgnPGRpdj4nKVxuICAgIEAkd3JhcCA9IEAkdGVtcGxhdGUucGFyZW50KClcblxuICAgIEB0aXRsZSA9IHRpdGxlIHx8IHdvcmRzLmh1bWFuaXplKCBAaWQgKVxuICAgIEBzdHlsZXMgPSBzdHlsZXMgfHwge31cbiAgICBAd2VpZ2h0ID0gd2VpZ2h0XG4gICAgQGRlZmF1bHRzID0ge31cblxuICAgIEBwYXJzZVRlbXBsYXRlKClcblxuXG4gICMgY3JlYXRlIGEgbmV3IFNuaXBwZXRNb2RlbCBpbnN0YW5jZSBmcm9tIHRoaXMgdGVtcGxhdGVcbiAgY3JlYXRlTW9kZWw6ICgpIC0+XG4gICAgbmV3IFNuaXBwZXRNb2RlbCh0ZW1wbGF0ZTogdGhpcylcblxuXG4gIGNyZWF0ZVZpZXc6IChzbmlwcGV0TW9kZWwsIGlzUmVhZE9ubHkpIC0+XG4gICAgc25pcHBldE1vZGVsIHx8PSBAY3JlYXRlTW9kZWwoKVxuICAgICRlbGVtID0gQCR0ZW1wbGF0ZS5jbG9uZSgpXG4gICAgZGlyZWN0aXZlcyA9IEBsaW5rRGlyZWN0aXZlcygkZWxlbVswXSlcblxuICAgIHNuaXBwZXRWaWV3ID0gbmV3IFNuaXBwZXRWaWV3XG4gICAgICBtb2RlbDogc25pcHBldE1vZGVsXG4gICAgICAkaHRtbDogJGVsZW1cbiAgICAgIGRpcmVjdGl2ZXM6IGRpcmVjdGl2ZXNcbiAgICAgIGlzUmVhZE9ubHk6IGlzUmVhZE9ubHlcblxuXG4gIHBydW5lSHRtbDogKGh0bWwpIC0+XG5cbiAgICAjIHJlbW92ZSBhbGwgY29tbWVudHNcbiAgICBodG1sID0gJChodG1sKS5maWx0ZXIgKGluZGV4KSAtPlxuICAgICAgQG5vZGVUeXBlICE9OFxuXG4gICAgIyBvbmx5IGFsbG93IG9uZSByb290IGVsZW1lbnRcbiAgICBhc3NlcnQgaHRtbC5sZW5ndGggPT0gMSwgXCJUZW1wbGF0ZXMgbXVzdCBjb250YWluIG9uZSByb290IGVsZW1lbnQuIFRoZSBUZW1wbGF0ZSBcXFwiI3tAaWRlbnRpZmllcn1cXFwiIGNvbnRhaW5zICN7IGh0bWwubGVuZ3RoIH1cIlxuXG4gICAgaHRtbFxuXG4gIHBhcnNlVGVtcGxhdGU6ICgpIC0+XG4gICAgZWxlbSA9IEAkdGVtcGxhdGVbMF1cbiAgICBAZGlyZWN0aXZlcyA9IEBjb21waWxlRGlyZWN0aXZlcyhlbGVtKVxuXG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICAgIEBmb3JtYXRFZGl0YWJsZShkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAZm9ybWF0Q29udGFpbmVyKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgICBAZm9ybWF0SHRtbChkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG5cblxuICAjIEluIHRoZSBodG1sIG9mIHRoZSB0ZW1wbGF0ZSBmaW5kIGFuZCBzdG9yZSBhbGwgRE9NIG5vZGVzXG4gICMgd2hpY2ggYXJlIGRpcmVjdGl2ZXMgKGUuZy4gZWRpdGFibGVzIG9yIGNvbnRhaW5lcnMpLlxuICBjb21waWxlRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbXBpbGVyLnBhcnNlKGVsZW0pXG4gICAgICBkaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpIGlmIGRpcmVjdGl2ZVxuXG4gICAgZGlyZWN0aXZlc1xuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWRcbiAgIyBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3LlxuICBsaW5rRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBzbmlwcGV0RGlyZWN0aXZlcyA9IEBkaXJlY3RpdmVzLmNsb25lKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmVGaW5kZXIubGluayhlbGVtLCBzbmlwcGV0RGlyZWN0aXZlcylcblxuICAgIHNuaXBwZXREaXJlY3RpdmVzXG5cblxuICBmb3JtYXRFZGl0YWJsZTogKG5hbWUsIGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lZGl0YWJsZSlcblxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gZGVmYXVsdFZhbHVlIGlmIGRlZmF1bHRWYWx1ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdENvbnRhaW5lcjogKG5hbWUsIGVsZW0pIC0+XG4gICAgIyByZW1vdmUgYWxsIGNvbnRlbnQgZnJvbiBhIGNvbnRhaW5lciBmcm9tIHRoZSB0ZW1wbGF0ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdEh0bWw6IChuYW1lLCBlbGVtKSAtPlxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gZGVmYXVsdFZhbHVlIGlmIGRlZmF1bHRWYWx1ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gICMgb3V0cHV0IHRoZSBhY2NlcHRlZCBjb250ZW50IG9mIHRoZSBzbmlwcGV0XG4gICMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGNyZWF0ZVxuICAjIGUuZzogeyB0aXRsZTogXCJJdGNoeSBhbmQgU2NyYXRjaHlcIiB9XG4gIHByaW50RG9jOiAoKSAtPlxuICAgIGRvYyA9XG4gICAgICBpZGVudGlmaWVyOiBAaWRlbnRpZmllclxuICAgICAgIyBlZGl0YWJsZXM6IE9iamVjdC5rZXlzIEBlZGl0YWJsZXMgaWYgQGVkaXRhYmxlc1xuICAgICAgIyBjb250YWluZXJzOiBPYmplY3Qua2V5cyBAY29udGFpbmVycyBpZiBAY29udGFpbmVyc1xuXG4gICAgd29yZHMucmVhZGFibGVKc29uKGRvYylcblxuXG4jIFN0YXRpYyBmdW5jdGlvbnNcbiMgLS0tLS0tLS0tLS0tLS0tLVxuXG5UZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIgPSAoaWRlbnRpZmllcikgLT5cbiAgcmV0dXJuIHVubGVzcyBpZGVudGlmaWVyICMgc2lsZW50bHkgZmFpbCBvbiB1bmRlZmluZWQgb3IgZW1wdHkgc3RyaW5nc1xuXG4gIHBhcnRzID0gaWRlbnRpZmllci5zcGxpdCgnLicpXG4gIGlmIHBhcnRzLmxlbmd0aCA9PSAxXG4gICAgeyBuYW1lc3BhY2U6IHVuZGVmaW5lZCwgaWQ6IHBhcnRzWzBdIH1cbiAgZWxzZSBpZiBwYXJ0cy5sZW5ndGggPT0gMlxuICAgIHsgbmFtZXNwYWNlOiBwYXJ0c1swXSwgaWQ6IHBhcnRzWzFdIH1cbiAgZWxzZVxuICAgIGxvZy5lcnJvcihcImNvdWxkIG5vdCBwYXJzZSBzbmlwcGV0IHRlbXBsYXRlIGlkZW50aWZpZXI6ICN7IGlkZW50aWZpZXIgfVwiKVxuIl19
