<script lang="ts">
import { genId } from './SurveyBuilder/utils';


  setTimeout(() => {
    const builder = (window as any).SurveyBuilder({
      target: document.getElementById('survey-builder'),
      props: {
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
              title: 'Account type',
              type: 'single',
              required: true,
              options: [
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
        onExport: (data) => {
          console.log('Congrats: export', data)
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

