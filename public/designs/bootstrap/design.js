(function() { this.design || (this.design = {}); design.bootstrap = (function() { return {
  "templates": [
    {
      "title": "Single Centered Column",
      "id": "column",
      "html": "<!-- test --><div class=\"row-fluid\"><div class=\"span8 offset2\" doc-container=\"\"></div></div>"
    },
    {
      "title": "Main and Sidebar Columns",
      "id": "mainAndSidebar",
      "html": "<div class=\"row-fluid\"><div class=\"span8\" doc-container=\"main\"></div><div class=\"span4\" doc-container=\"sidebar\"></div></div>"
    },
    {
      "title": "Button",
      "id": "button",
      "html": "<button class=\"btn\" type=\"button\" doc-editable=\"button\">Button</button>"
    },
    {
      "title": "Hero",
      "id": "hero",
      "html": "<div class=\"hero-unit\"><h1 doc-editable=\"title\">Titel</h1><p doc-editable=\"tagline\" doc-optional>Tagline</p></div>"
    },
    {
      "title": "Image",
      "id": "image",
      "html": "<div class=\"img-polaroid\" doc-editable=\"image\">Drag your image here...</div>"
    },
    {
      "title": "Info",
      "id": "info",
      "html": "<div class=\"alert\" doc-editable=\"info\">Lorem Ipsum dolorem</div>",
      "styles": [
        {
          "name": "Alert Type",
          "type": "select",
          "options": [
            { "caption": "Info",        "value": "alert-info" },
            { "caption": "Success",     "value": "alert-success" },
            { "caption": "Error",       "value": "alert-error" },
            { "caption": "Warning",     "value": "alert-warning" }
          ]
        }
      ]
    },
    {
      "title": "Large Button",
      "id": "largeButton",
      "html": "<div><hr></div>"
    },
    {
      "title": "Seperator",
      "id": "seperator",
      "html": "<div><hr></div>"
    },
    {
      "title": "Paragraph Title",
      "id": "smallSubtitle",
      "html": "<h3 doc-editable=\"title\">Lorem ipsum dolorem</h3>"
    },
    {
      "title": "Subtitle",
      "id": "subtitle",
      "html": "<h2 doc-editable=\"title\">Subtitle</h2>"
    },
    {
      "title": "Text",
      "id": "text",
      "html": "<p doc-editable=\"text\">Lorem ipsum dolorem. Lorem ipsum dolorem. Lorem ipsum dolorem</p>"
    },
    {
      "title": "Html",
      "id": "html",
      "html": "<div doc-html=\"html\">Insert HTML here</div>"
    },
    {
      "title": "Title",
      "id": "title",
      "html": "<h1 doc-editable=\"title\">Titel</h1>"
    }
  ],
  "config": {
    "namespace": "bootstrap",
    "version": 1,
    "css": [
      "/designs/bootstrap/css/style.css"
    ],
    "groups": {
      "layout": {
        "title": "Layout",
        "templates": [
          "column",
          "mainAndSidebar"
        ]
      },
      "others": {
        "title": "others",
        "templates": [
          "button",
          "hero",
          "image",
          "info",
          "largeButton",
          "seperator",
          "smallSubtitle",
          "subtitle",
          "text",
          "title"
        ]
      }
    }
  }
};})();}).call(this);
