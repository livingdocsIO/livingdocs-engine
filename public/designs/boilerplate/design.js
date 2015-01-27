(function () { var designJSON = {
  "name": "boilerplate",
  "version": "0.0.1",
  "author": "Peter Pan",
  "assets": {
    "basePath": "/designs/boilerplate",
    "css": [
      "./stylesheets/boilerplate.css"
    ]
  },

  "componentProperties": {
    "featured": {
      "label": "Featured",
      "type": "option",
      "value": "bleed"
    },
    "unordered": {
      "label": "Unordered",
      "type": "option",
      "value": "bullet"
    },
    "dropcap": {
      "label": "Drop Capital",
      "type": "option",
      "value": "drop-cap"
    },
    "large": {
      "label": "Large",
      "type": "option",
      "value": "large"
    },
    "position": {
      "label": "Position",
      "type": "select",
      "options": [
        {
          "caption": "Default"
        },
        {
          "caption": "Left",
          "value": "left"
        },
        {
          "caption": "Right",
          "value": "right"
        },
        {
          "caption": "Middle",
          "value": "middle"
        }
      ]
    },
    "aspect-ratio": {
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {
          "caption": "Default"
        },
        {
          "caption": "Cinemascope",
          "value": "cinemascope"
        },
        {
          "caption": "Square",
          "value": "square"
        }
      ]
    },
    "inside-caption": {
      "label": "Inside Caption",
      "type": "option",
      "value": "caption-inside-fade"
    },
    "peephole": {
      "label": "Size",
      "type": "select",
      "options": [
        {
          "caption": "Default"
        },
        {
          "caption": "Small",
          "value": "small"
        },
        {
          "caption": "Stripe",
          "value": "half-height"
        }
      ]
    },
    "fixed-background": {
      "label": "Fixed Background",
      "type": "option",
      "value": "peephole"
    }
  },
  "groups": [
    {
      "label": "Headers",
      "components": [
        "title"
      ]
    },
    {
      "label": "Text",
      "components": [
        "p"
      ]
    }
  ],
  "defaultComponents": {
    "paragraph": "p"
  },
  "components": [
    {
      "name": "head",
      "html": "<div class=\"head\">\n  <h1 doc-editable=\"title\">\n    History\n  </h1>\n  <p class=\"lead\" doc-editable=\"text\">\n    Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n  </p>\n</div>",
      "label": "Title and Lead"
    },
    {
      "name": "hero",
      "html": "<figure class=\"hero\">\n  <div class=\"container image-container\" doc-image=\"image\">\n    <div class=\"base-layout middle-text full-height\">\n      <figcaption class=\"inverted centered\">\n        <h1 doc-editable=\"title\">\n          Studio Ghibli\n        </h1>\n        <h2 doc-editable=\"subtitle\">\n          A world of magical imagination in service of realsim\n        </h2>\n        <p doc-editable=\"text\">\n          From Wikipedia, the funky free encyclopdia\n        </p>\n      </figcaption>\n    </div>\n  </div>\n</figure>",
      "label": "Large Image",
      "properties": [
        "fixed-background"
      ]
    },
    {
      "name": "title",
      "html": "<h2 class=\"title\" doc-editable=\"title\">\n  History\n</h2>",
      "label": "Simple Title"
    },
    {
      "name": "fullSize",
      "html": "<figure class=\"full-size\">\n  <div class=\"container image-container\" doc-image=\"image\">\n    <div class=\"base-layout middle-text full-height\">\n      <figcaption class=\"inverted centered\">\n        <h2 doc-editable=\"title\">\n          A world of magical imagination in service of realism\n        </h2>\n        <h4 doc-editable=\"subtitle\">\n          Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n        </h4>\n      </figcaption>\n    </div>\n  </div>\n</figure>",
      "label": "Full-Size"
    },
    {
      "name": "normal",
      "html": "<figure class=\"aspect-ratio\">\n  <div class=\"figure-container\" doc-image=\"image\"></div>\n  <figcaption doc-editable=\"caption\">The Ghibli Museum, is located in Inokashira Park in Mitaka, a western suburb of Tokyo, Japan.</figcaption>\n</figure>",
      "label": "Normal",
      "properties": [
        "position",
        "aspect-ratio",
        "inside-caption"
      ]
    },
    {
      "name": "peephole",
      "html": "<figure class=\"peephole\">\n  <div class=\"container image-container\" doc-image=\"image\"></div>\n</figure>",
      "label": "Peephole",
      "properties": [
        "peephole"
      ]
    },
    {
      "name": "aside",
      "html": "<aside class=\"sidenote right\">\n  <h4 doc-editable=\"title\">\n    Aside with vertical rhythm\n  </h4>\n  <p doc-editable=\"text\">\n    The studio is also known for its strict &#x201C;0-edits&#x201D; policy in licensing their films abroad due to Nausica&#xE4; of the Valley of Wind being heavily edited for the film&#x2019;s release in the United States as Warriors of the Wind. The &#x201C;no cuts&#x201D; policy was highlighted when Miramax co-chairman Harvey Weinstein suggested editing Princess Mononoke to make it more marketable. A Studio Ghibli producer is rumoured to have sent an authentic Japanese sword with a simple message: &#x201C;0 cuts&#x201D;.\n  </p>\n</aside>",
      "label": "Aside",
      "properties": [
        "featured"
      ]
    },
    {
      "name": "listItem",
      "html": "<p class=\"list-item\" doc-editable=\"text\">\n  An item\n</p>",
      "label": "List Item",
      "properties": [
        "unordered"
      ]
    },
    {
      "name": "p",
      "html": "<p doc-editable=\"text\">\n  Studio Ghibli, Inc. is a Japanese animation film studio based in Koganei, Tokyo, Japan. The studio is best known for its anime feature films. Studio Ghibli began in June 1985 after the success of Nausica&#xE4; of the Valley of the Wind with funding by Tokuma Shoten. The company&#x2019;s logo features the character Totoro (a large forest spirit) from Miyazaki&#x2019;s film My Neighbor Totoro. At one time the studio was based in Kichij&#x14D;ji, Musashino, Tokyo.\n</p>",
      "label": "Paragraph",
      "properties": [
        "dropcap"
      ]
    },
    {
      "name": "quote",
      "html": "<blockquote>\n  <p>\n    <span class=\"quotation-mark\">&#x201C;</span><span class=\"quote\" doc-editable=\"text\">We depict hatred, but it is to depict that there are more important things. We depict a curse, to depict the joy of liberation.</span>\n  </p>\n  <footer doc-editable=\"author\">\n    Hayao Miyazaki\n  </footer>\n</blockquote>",
      "label": "Quote",
      "properties": [
        "large"
      ]
    },
    {
      "name": "subtitle",
      "html": "<h4 doc-editable=\"title\">\n  History\n</h4>",
      "label": "Subtitle"
    }
  ]
}; if(typeof module !== 'undefined' && module.exports) {return module.exports = designJSON;} else { this.design = this.design || {}; this.design.boilerplate = designJSON;} }).call(this);
