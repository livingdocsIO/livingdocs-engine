(function() {
  var CssLoader, Design, DesignStyle, Directive, DirectiveCollection, DirectiveIterator, DragDrop, EditableController, Focus, InteractivePage, LimitedLocalstore, Page, Renderer, RenderingContainer, Semaphore, SnippetArray, SnippetContainer, SnippetDrag, SnippetModel, SnippetTree, SnippetView, Template, assert, chainable, chainableProxy, directiveCompiler, directiveFinder, document, dom, eventing, guid, htmlCompare, jsonHelper, kickstart, localstore, log, mixins, pageReady, setupApi, stash,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    var name, prefix, value, _ref, _results;
    this.config = {
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
    this.docClass = config.html.css;
    this.docAttr = config.html.attr;
    this.docDirective = {};
    this.templateAttrLookup = {};
    _ref = config.directives;
    _results = [];
    for (name in _ref) {
      value = _ref[name];
      if (this.config.attributePrefix) {
        prefix = "" + config.attributePrefix + "-";
      }
      value.renderedAttr = "" + (prefix || '') + value.attr;
      this.docDirective[name] = value.renderedAttr;
      _results.push(this.templateAttrLookup[value.attr] = name);
    }
    return _results;
  })();

  assert = function(condition, message) {
    if (!condition) {
      return log.error(message);
    }
  };

  chainableProxy = function(chainedObj) {
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

  eventing = (function() {
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

  guid = (function() {
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

  htmlCompare = (function() {
    return {
      empty: /^\s*$/,
      whitespace: /\s+/g,
      normalizeWhitespace: true,
      compare: function(a, b) {
        var equivalent, nextInA, nextInB;
        if (typeof a === 'string') {
          a = $(a);
        }
        if (typeof b === 'string') {
          b = $(b);
        }
        if (a.jquery) {
          a = a[0];
        }
        if (b.jquery) {
          b = b[0];
        }
        nextInA = this.iterateComparables(a);
        nextInB = this.iterateComparables(b);
        equivalent = true;
        while (equivalent) {
          equivalent = this.compareNode(a = nextInA(), b = nextInB());
        }
        if ((a == null) && (b == null)) {
          return true;
        } else {
          return false;
        }
      },
      compareNode: function(a, b) {
        if ((a != null) && (b != null)) {
          if (a.nodeType === b.nodeType) {
            switch (a.nodeType) {
              case 1:
                return this.compareElement(a, b);
              case 3:
                return this.compareText(a, b);
              default:
                return log.error("HtmlCompare: nodeType " + a.nodeType + " not supported");
            }
          }
        }
      },
      compareElement: function(a, b) {
        if (this.compareTag(a, b)) {
          if (this.compareAttributes(a, b)) {
            return true;
          }
        }
      },
      compareText: function(a, b) {
        var valA, valB;
        if (this.normalizeWhitespace) {
          valA = $.trim(a.textContent).replace(this.whitespace, ' ');
          valB = $.trim(b.textContent).replace(this.whitespace, ' ');
          return valA === valB;
        } else {
          return a.nodeValue === b.nodeValue;
        }
      },
      compareTag: function(a, b) {
        return this.getTag(a) === this.getTag(b);
      },
      getTag: function(node) {
        return node.namespaceURI + ':' + node.localName;
      },
      compareAttributes: function(a, b) {
        return this.compareAttributesWithOther(a, b) && this.compareAttributesWithOther(b, a);
      },
      compareAttributesWithOther: function(a, b) {
        var aAttr, bValue, _i, _len, _ref;
        _ref = a.attributes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          aAttr = _ref[_i];
          bValue = b.getAttribute(aAttr.name);
          if (!this.compareAttributeValue(aAttr.name, aAttr.value, bValue)) {
            return false;
          }
          if (this.isEmptyAttributeValue(aAttr.value) && this.emptyAttributeCounts(aAttr.name)) {
            if (!b.hasAttribute(aAttr.name)) {
              return false;
            }
          }
        }
        return true;
      },
      emptyAttributeCounts: function(attrName) {
        switch (attrName) {
          case 'class':
          case 'style':
            return false;
          default:
            return true;
        }
      },
      compareAttributeValue: function(attrName, aValue, bValue) {
        var aCleaned, aSorted, bCleaned, bSorted;
        if (this.isEmptyAttributeValue(aValue) && this.isEmptyAttributeValue(bValue)) {
          return true;
        }
        if (this.isEmptyAttributeValue(aValue) || this.isEmptyAttributeValue(bValue)) {
          return false;
        }
        switch (attrName) {
          case 'class':
            aSorted = aValue.split(' ').sort();
            bSorted = bValue.split(' ').sort();
            return aSorted.join(' ') === bSorted.join(' ');
          case 'style':
            aCleaned = this.prepareStyleValue(aValue);
            bCleaned = this.prepareStyleValue(bValue);
            return aCleaned === bCleaned;
          default:
            return aValue === bValue;
        }
      },
      isEmptyAttributeValue: function(val) {
        return (val == null) || val === '';
      },
      prepareStyleValue: function(val) {
        val = $.trim(val).replace(/\s*:\s*/g, ':').replace(/\s*;\s*/g, ';').replace(/;$/g, '');
        return val.split(';').sort().join(';');
      },
      isEmptyTextNode: function(textNode) {
        return this.empty.test(textNode.nodeValue);
      },
      isComparable: function(node) {
        var nodeType;
        nodeType = node.nodeType;
        if (nodeType === 1 || (nodeType === 3 && !this.isEmptyTextNode(node))) {
          return true;
        }
      },
      iterateComparables: function(root) {
        var iterate,
          _this = this;
        iterate = this.iterate(root);
        return function() {
          var next;
          while (next = iterate()) {
            if (_this.isComparable(next)) {
              return next;
            }
          }
        };
      },
      iterate: function(root) {
        var current, next;
        current = next = root;
        return function() {
          var child, n;
          n = current = next;
          child = next = void 0;
          if (current) {
            if (child = n.firstChild) {
              next = child;
            } else {
              while ((n !== root) && !(next = n.nextSibling)) {
                n = n.parentNode;
              }
            }
          }
          return current;
        };
      }
    };
  })();

  jQuery.fn.outerHtml = jQuery.fn.outerHtml || function() {
    var el, error, error2;
    el = this[0];
    if (el) {
      if (typeof el.outerHTML !== 'undefined') {
        return el.outerHTML;
      }
      try {
        return (new XMLSerializer()).serializeToString(el);
      } catch (_error) {
        error = _error;
        try {
          return el.xml;
        } catch (_error) {
          error2 = _error;
        }
      }
    }
  };

  jQuery.fn.replaceClass = function(classToBeRemoved, classToBeAdded) {
    this.removeClass(classToBeRemoved);
    return this.addClass(classToBeAdded);
  };

  jQuery.fn.findIn = function(selector) {
    return this.find(selector).add(this.filter(selector));
  };

  jsonHelper = (function() {
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

  LimitedLocalstore = (function() {
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

  localstore = (function() {
    var $;
    $ = jQuery;
    return {
      set: function(key, value) {
        return store.set(key, value);
      },
      get: function(key) {
        return store.get(key);
      },
      remove: function(key) {
        return store.remove(key);
      },
      clear: function() {
        return store.clear();
      },
      disbled: function() {
        return store.disabled;
      }
    };
  })();

  log = function() {
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

  mixins = function() {
    var Mixed, method, mixin, mixins, name, _i;
    mixins = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Mixed = function() {};
    for (_i = mixins.length - 1; _i >= 0; _i += -1) {
      mixin = mixins[_i];
      for (name in mixin) {
        method = mixin[name];
        Mixed.prototype[name] = method;
      }
    }
    return Mixed;
  };

  Semaphore = (function() {
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
      var _this = this;
      this.increment();
      return function() {
        return _this.decrement();
      };
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

  stash = (function() {
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

  this.words = (function() {
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

  RenderingContainer = (function() {
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

  Page = (function(_super) {
    __extends(Page, _super);

    function Page(_arg) {
      var hostWindow, readOnly, renderNode, _ref;
      _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, readOnly = _ref.readOnly, hostWindow = _ref.hostWindow, this.design = _ref.design;
      if (readOnly != null) {
        this.isReadOnly = readOnly;
      }
      this.setWindow(hostWindow);
      Page.__super__.constructor.call(this);
      renderNode = renderNode || $("." + docClass.section, this.$body);
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

  InteractivePage = (function(_super) {
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
      var eventNames,
        _this = this;
      eventNames = event.type === 'touchstart' ? 'touchend.livingdocs-drag touchcancel.livingdocs-drag touchleave.livingdocs-drag' : 'mouseup.livingdocs-drag';
      return this.$document.on(eventNames, function() {
        dragDrop.drop();
        return _this.$document.off('.livingdocs-drag');
      });
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

  SnippetArray = (function() {
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

  SnippetContainer = (function() {
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
      var func, snippetTree,
        _this = this;
      if (position == null) {
        position = {};
      }
      func = function() {
        return _this.link(snippet, position);
      };
      if (snippetTree = this.getSnippetTree()) {
        return snippetTree.attachingSnippet(snippet, func);
      } else {
        return func();
      }
    };

    SnippetContainer.prototype._detachSnippet = function(snippet) {
      var func, snippetTree,
        _this = this;
      func = function() {
        return _this.unlink(snippet);
      };
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

  SnippetModel = (function() {
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
      var _this = this;
      return this.descendantsAndSelf(function(snippetModel) {
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
      });
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
      if (!jsonHelper.isEmpty(this.content)) {
        json.content = jsonHelper.flatCopy(this.content);
      }
      if (!jsonHelper.isEmpty(this.styles)) {
        json.styles = jsonHelper.flatCopy(this.styles);
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

  SnippetTree = (function() {
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
      var _this = this;
      if (snippet.snippetTree === this) {
        attachSnippetFunc();
        return this.fireEvent('snippetMoved', snippet);
      } else {
        if (snippet.snippetTree != null) {
          snippet.snippetContainer.detachSnippet(snippet);
        }
        snippet.descendantsAndSelf(function(descendant) {
          return descendant.snippetTree = _this;
        });
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
      var snippet, snippetJson, _i, _len, _ref,
        _this = this;
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
      return this.root.each(function(snippet) {
        return snippet.snippetTree = _this;
      });
    };

    return SnippetTree;

  })();

  Directive = (function() {
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

  DirectiveCollection = (function() {
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

  directiveCompiler = (function() {
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
          if (type = templateAttrLookup[normalizedName]) {
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

  directiveFinder = (function() {
    var attributePrefix;
    attributePrefix = /^(x-|data-)/;
    return {
      link: function(elem, directiveCollection) {
        var attr, directive, normalizedName, type, _i, _len, _ref;
        _ref = elem.attributes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attr = _ref[_i];
          normalizedName = attr.name.replace(attributePrefix, '');
          if (type = templateAttrLookup[normalizedName]) {
            directive = directiveCollection.get(attr.value);
            directive.elem = elem;
          }
        }
        return void 0;
      }
    };
  })();

  DirectiveIterator = (function() {
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

  Template = (function() {
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
      var elem,
        _this = this;
      elem = this.$template[0];
      this.directives = this.compileDirectives(elem);
      return this.directives.each(function(directive) {
        switch (directive.type) {
          case 'editable':
            return _this.formatEditable(directive.name, directive.elem);
          case 'container':
            return _this.formatContainer(directive.name, directive.elem);
          case 'html':
            return _this.formatHtml(directive.name, directive.elem);
        }
      });
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
      $elem.addClass(docClass.editable);
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

  CssLoader = (function() {
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

  Design = (function() {
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
      var _this = this;
      return this.checkNamespace(identifier, function(id) {
        return _this.templates.splice(_this.getIndex(id), 1);
      });
    };

    Design.prototype.get = function(identifier) {
      var _this = this;
      return this.checkNamespace(identifier, function(id) {
        var template;
        template = void 0;
        _this.each(function(t, index) {
          if (t.id === id) {
            return template = t;
          }
        });
        return template;
      });
    };

    Design.prototype.getIndex = function(identifier) {
      var _this = this;
      return this.checkNamespace(identifier, function(id) {
        var index;
        index = void 0;
        _this.each(function(t, i) {
          if (t.id === id) {
            return index = i;
          }
        });
        return index;
      });
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

  DesignStyle = (function() {
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

  document = (function() {
    return {
      initialized: false,
      uniqueId: 0,
      ready: $.Callbacks('memory once'),
      changed: $.Callbacks(),
      init: function(_arg) {
        var design, json, rootNode, _ref,
          _this = this;
        _ref = _arg != null ? _arg : {}, design = _ref.design, json = _ref.json, rootNode = _ref.rootNode;
        assert(!this.initialized, 'document is already initialized');
        this.initialized = true;
        this.design = new Design(design);
        this.snippetTree = json && this.design ? new SnippetTree({
          content: json,
          design: this.design
        }) : new SnippetTree();
        this.snippetTree.changed.add(function() {
          return _this.changed.fire();
        });
        this.page = new InteractivePage({
          renderNode: rootNode,
          design: this.design
        });
        this.renderer = new Renderer({
          snippetTree: this.snippetTree,
          renderingContainer: this.page
        });
        return this.renderer.ready(function() {
          return _this.ready.fire();
        });
      },
      createView: function(parent) {
        var $parent, createRendererAndResolvePromise, deferred, iframe,
          _this = this;
        if (parent == null) {
          parent = window.document.body;
        }
        createRendererAndResolvePromise = function() {
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
      }
    };
  })();

  dom = (function() {
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
        var $snippets, closest, insertSnippet, left, top,
          _this = this;
        top = _arg.top, left = _arg.left;
        $snippets = $container.find("." + docClass.snippet);
        closest = void 0;
        insertSnippet = void 0;
        $snippets.each(function(index, elem) {
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
        });
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

  DragDrop = (function() {
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
      var _this = this;
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
        this.drag.timeout = setTimeout(function() {
          return _this.start();
        }, this.options.longpressDelay);
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

  EditableController = (function() {
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
      var _this = this;
      return function() {
        var args, editableName, element, view;
        element = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        view = dom.findSnippetView(element);
        editableName = element.getAttribute(_this.editableAttr);
        args.unshift(view, editableName);
        return func.apply(_this, args);
      };
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
        template = document.design.get(snippetName);
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

  Focus = (function() {
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

  kickstart = (function() {
    return {
      init: function(_arg) {
        var design, destination, destinationNode, scriptNode, xmlTemplate,
          _this = this;
        xmlTemplate = _arg.xmlTemplate, scriptNode = _arg.scriptNode, destination = _arg.destination, design = _arg.design;
        if (scriptNode) {
          xmlTemplate = $(scriptNode).text();
        }
        assert(xmlTemplate, 'Please provide parameter "xmlTemplate" or "scriptNode"');
        destinationNode = $(destination)[0];
        if (!doc.document.initialized) {
          doc.init({
            design: design,
            rootNode: destinationNode
          });
        }
        return doc.ready(function() {
          var rootSnippets, snippet, _i, _len, _results;
          rootSnippets = _this.parseDocumentTemplate(xmlTemplate);
          _results = [];
          for (_i = 0, _len = rootSnippets.length; _i < _len; _i++) {
            snippet = rootSnippets[_i];
            _results.push(doc.add(snippet));
          }
          return _results;
        });
      },
      parseDocumentTemplate: function(xmlTemplate) {
        var root;
        root = $.parseXML("<root>" + xmlTemplate + "</root>").firstChild;
        return this.addRootSnippets($(root).children());
      },
      addRootSnippets: function(xmlElements) {
        var index, rootSnippets, snippetModel, xmlElement, _i, _len;
        rootSnippets = [];
        for (index = _i = 0, _len = xmlElements.length; _i < _len; index = ++_i) {
          xmlElement = xmlElements[index];
          snippetModel = doc.create(this.nodeToSnippetName(xmlElement));
          rootSnippets.push(snippetModel);
          this.setChildren(snippetModel, xmlElement);
        }
        return rootSnippets;
      },
      setChildren: function(snippetModel, snippetXML) {
        this.populateSnippetContainers(snippetModel, snippetXML);
        this.setEditables(snippetModel, snippetXML);
        return this.setEditableStyles(snippetModel, snippetXML);
      },
      populateSnippetContainers: function(snippetModel, snippetXML) {
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
      },
      appendSnippetToContainer: function(snippetModel, snippetXML, region) {
        var snippet;
        snippet = doc.create(this.nodeToSnippetName(snippetXML));
        snippetModel.append(region, snippet);
        return this.setChildren(snippet, snippetXML);
      },
      setEditables: function(snippetModel, snippetXML) {
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
      },
      getValueForEditable: function(editableName, snippetXML, directivesQuantity) {
        var child, value;
        child = this.descendants(snippetXML, editableName)[0];
        value = this.getXmlValue(child);
        if (!value && directivesQuantity === 1) {
          log.warn("The editable '" + editableName + "' of '" + (this.nodeToSnippetName(snippetXML)) + "' has no content. Display parent HTML instead.");
          value = this.getXmlValue(snippetXML);
        }
        return value;
      },
      nodeNameToCamelCase: function(element) {
        return words.camelize(element.nodeName);
      },
      setEditableStyles: function(snippetModel, snippetXML) {
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
      },
      nodeToSnippetName: function(element) {
        var snippet, snippetName;
        snippetName = this.nodeNameToCamelCase(element);
        snippet = doc.getDesign().get(snippetName);
        assert(snippet, "The Template named '" + snippetName + "' does not exist.");
        return snippetName;
      },
      descendants: function(xml, nodeName) {
        var tagLimiter;
        if (nodeName) {
          tagLimiter = words.snakeCase(nodeName);
        }
        return $(xml).children(tagLimiter);
      },
      getXmlValue: function(node) {
        var end, start, string;
        if (node) {
          string = new XMLSerializer().serializeToString(node);
          start = string.indexOf('>') + 1;
          end = string.lastIndexOf('<');
          if (end > start) {
            return string.substring(start, end);
          }
        }
      }
    };
  })();

  Renderer = (function() {
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
      var _this = this;
      this.readySemaphore.increment();
      return this.renderingContainer.ready(function() {
        _this.render();
        return _this.readySemaphore.decrement();
      });
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
      var _this = this;
      return this.snippetTree.each(function(model) {
        return _this.insertSnippet(model);
      });
    };

    Renderer.prototype.clear = function() {
      var _this = this;
      this.snippetTree.each(function(model) {
        return _this.snippetViewForSnippet(model).setAttachedToDom(false);
      });
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
      var _this = this;
      return model.children(function(childModel) {
        if (!_this.isSnippetAttached(childModel)) {
          return _this.insertSnippet(childModel);
        }
      });
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

  SnippetDrag = (function() {
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

  SnippetView = (function() {
    function SnippetView(_arg) {
      this.model = _arg.model, this.$html = _arg.$html, this.directives = _arg.directives, this.isReadOnly = _arg.isReadOnly;
      this.template = this.model.template;
      this.isAttachedToDom = false;
      this.wasAttachedToDom = $.Callbacks();
      if (!this.isReadOnly) {
        this.$html.data('snippet', this).addClass(docClass.snippet).attr(docAttr.template, this.template.identifier);
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
      var _this = this;
      return this.directives.each(function(directive) {
        var $elem;
        if (directive.optional) {
          $elem = $(directive.elem);
          if (_this.model.isEmpty(directive.name)) {
            return $elem.css('display', 'none');
          } else {
            return $elem.css('display', '');
          }
        }
      });
    };

    SnippetView.prototype.showOptionals = function() {
      var _this = this;
      return this.directives.each(function(directive) {
        if (directive.optional) {
          return config.animations.optionals.show($(directive.elem));
        }
      });
    };

    SnippetView.prototype.hideEmptyOptionals = function() {
      var _this = this;
      return this.directives.each(function(directive) {
        if (directive.optional && _this.model.isEmpty(directive.name)) {
          return config.animations.optionals.hide($(directive.elem));
        }
      });
    };

    SnippetView.prototype.next = function() {
      return this.$html.next().data('snippet');
    };

    SnippetView.prototype.prev = function() {
      return this.$html.prev().data('snippet');
    };

    SnippetView.prototype.afterFocused = function() {
      this.$html.addClass(docClass.snippetHighlight);
      return this.showOptionals();
    };

    SnippetView.prototype.afterBlurred = function() {
      this.$html.removeClass(docClass.snippetHighlight);
      return this.hideEmptyOptionals();
    };

    SnippetView.prototype.focus = function(cursor) {
      var first, _ref;
      first = (_ref = this.directives.editable) != null ? _ref[0].elem : void 0;
      return $(first).focus();
    };

    SnippetView.prototype.hasFocus = function() {
      return this.$html.hasClass(docClass.snippetHighlight);
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
      var _this = this;
      return setTimeout(function() {
        return $elem.find('iframe').attr('tabindex', '-1');
      }, 400);
    };

    SnippetView.prototype.blockInteraction = function($elem) {
      var $blocker;
      this.ensureRelativePosition($elem);
      $blocker = $("<div class='" + docClass.interactionBlocker + "'>").attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;');
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
      var _this = this;
      if (this.isAttachedToDom) {
        return func();
      } else {
        this.cancelDelayed(name);
        this.delayed || (this.delayed = {});
        return this.delayed[name] = eventing.callOnce(this.wasAttachedToDom, function() {
          _this.delayed[name] = void 0;
          return func();
        });
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

  this.doc = function(search) {
    return document.find(search);
  };

  chainable = chainableProxy(doc);

  setupApi = function() {
    this.kickstart = chainable(kickstart, 'init');
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

}).call(this);

/*
//@ sourceMappingURL=livingdocs-engine.js.map
*/