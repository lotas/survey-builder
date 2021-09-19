# Survey Builder

Small library to build custom surveys, export/import to JSON.

![](docs/2021-09-14-15-05-56.png)

# Installation

Use sources or include `dist/survey-builder.css`, `dist/survey-builder[.min].js` files.

# Usage

Library will register custom component in global scope `SurveyBuilderInit`:

```ts
function SurveyBuilderInit(SurveyBuilderOpts): void;

export interface SurveyBuilderOpts {
  target: HTMLElement | Element;  // i.e. document.getElementById('placeholder')
  props: {
    haveTitle?: boolean;
    customInputNames?: boolean; // allow input of custom names for each question
    snapshot?: SurveyBuilderSnapshot; // see below
    onChange?: (snapshot: SurveyBuilderSnapshot) => void; // will be triggered on every change
    onExport?: (snapshot: SurveyBuilderSnapshot) => void; // will be triggered on export click
    debug?: boolean; // show debug info
  };
}
```

To use it:

```html
<head>
  <link rel='stylesheet' href='/dist/survey-builder.css'>
  <script src='/dist/survey-builder.min.js'></script>
</head>

<div id="element-root"></div>

<script>
  window.SurveyBuilderInit({
    target: document.getElementById('element-root'),
    props: {
      haveTitle: false,
      customInputNames: true,
      debug: true,
      snapshot: {
        title: 'Sample survey',
        questions: [
          {
            id: genId('q'),
            title: 'User name',
            name: 'userName',
            type: 'input',
            required: true,
          },
          {
            id: genId('q'),
            title: 'User rating',
            name: 'userRating',
            type: 'rating',
            required: true,
            options: 5,
          },
          {
            id: genId('q'),
            title: 'Account type',
            name: 'accountType',
            type: 'single',
            required: true,
            answers: [
              {
                id: genId('a'),
                title: 'Private account',
                type: 'text',
              },
              {
                id: genId('a'),
                title: 'Business account',
                type: 'text',
              },
            ],
          },
        ],
      },
      onExport: (data: SurveyBuilderSnapshot) => {
        console.log('Congrats: export', data)
      },
      onChange: (data: SurveyBuilderSnapshot) => {
        console.log('Model changed', data)
      },
    },
  })
</script>
```

# Styling options

Currently following CSS variables are being used:

```css
:root {
  --survey-builder-button-color: rgb(14, 40, 53);
  --survey-builder-button-border: rgb(34, 151, 172);
  --survey-builder-button-border-hover: rgb(52, 196, 240);
  --survey-builder-button-background: rgb(184, 227, 247);
  --survey-builder-button-background-hover: rgb(154, 220, 250);
  --survey-builder-secondary-button-border: rgb(34, 172, 92);
  --survey-builder-secondary-button-background: rgb(184, 247, 195);
}
```

They can be redefined on a component or document level