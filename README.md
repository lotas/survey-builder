# Survey Builder

Small library to build custom surveys, export/import to JSON.

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
    snapshot?: SurveyBuilderSnapshot; // see below
    onChange?: (snapshot: SurveyBuilderSnapshot) => void; // will be triggered on every change
    onExport?: (snapshot: SurveyBuilderSnapshot) => void; // will be triggered on export click
  };
}
```

To use it:

```html
<div id="element-root"></div>

<script>
  window.SurveyBuilderInit({
      target: document.getElementById('element-root'),
      onExport: (data) => { console.log('Model export', data) },
      onChange: (data) => { console.log('Model changed', data) },
      props: {
        haveTitle: false,
        snapshot: {
          title: 'Sample survey',
          questions: [
            {
              id: genId('q'),
              title: 'User name',
              type: 'input',
              required: true
            },
            {
              id: genId('q'),
              title: 'User name',
              type: 'rating',
              required: true,
              options: 5
            },
            {
              id: genId('q'),
              title: 'Account type',
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
                }
              ]
            },
          ]
        },
      }
    })
</script>
```