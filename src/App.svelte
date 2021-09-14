<script lang="ts">
import type { SurveyBuilderSnapshot } from './SurveyBuilder/types';

import { genId } from './SurveyBuilder/utils';


  setTimeout(() => {
    (window as any).SurveyBuilder({
      target: document.getElementById('survey-builder'),
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
        onExport: (data: SurveyBuilderSnapshot) => {
          console.log('Congrats: export', data)
        },
        onChange: (data: SurveyBuilderSnapshot) => {
          console.log('Model changed', data)
        }
      }
    })
  }, 5)
</script>

<main>
  <div id="survey-builder"></div>
</main>

<style>
  #survey-builder {
    border: 1px solid #ccc;
  }
</style>

