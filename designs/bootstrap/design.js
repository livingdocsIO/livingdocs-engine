(function() { this.design || (this.design = {}); design.bootstrap = (function() { return {
  "templates": [
    {
      "name": "Single Centered Column",
      "id": "column",
      "html": "<div class=\"row-fluid\"><div class=\"span8 offset2\" doc-container=\"\"></div></div>"
    },
    {
      "name": "Main and Sidebar Columns",
      "id": "mainAndSidebar",
      "html": "<div class=\"row-fluid\"><div class=\"span8\" doc-container=\"main\"></div><div class=\"span4\" doc-container=\"sidebar\"></div></div>"
    },
    {
      "name": "Button",
      "id": "button",
      "html": "<button class=\"btn\" type=\"button\" doc-editable=\"button\">Button</button>"
    },
    {
      "name": "Hero",
      "id": "hero",
      "html": "<div class=\"hero-unit\"><h1 doc-editable=\"title\">Titel</h1><p doc-editable=\"tagline\">Tagline</p></div>"
    },
    {
      "name": "Image",
      "id": "image",
      "html": "<div class=\"img-polaroid\" doc-editable=\"image\">Drag your image here...</div>"
    },
    {
      "name": "Info",
      "id": "info",
      "html": "<div class=\"alert alert-info\" doc-editable=\"info\">Lorem Ipsum dolorem</div>"
    },
    {
      "name": "Large Button",
      "id": "largeButton",
      "html": "<div><hr></div>"
    },
    {
      "name": "Seperator",
      "id": "seperator",
      "html": "<div><hr></div>"
    },
    {
      "name": "Paragraph Title",
      "id": "smallSubtitle",
      "html": "<h3 doc-editable=\"title\">Lorem ipsum dolorem</h3>"
    },
    {
      "name": "Subtitle",
      "id": "subtitle",
      "html": "<h2 doc-editable=\"title\">Subtitle</h2>"
    },
    {
      "name": "Text",
      "id": "text",
      "html": "<p doc-editable=\"text\">Lorem ipsum dolorem. Lorem ipsum dolorem. Lorem ipsum dolorem</p>"
    },
    {
      "name": "Title",
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
        "name": "Layout",
        "templates": [
          "column",
          "mainAndSidebar"
        ]
      },
      "others": {
        "name": "others",
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