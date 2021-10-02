<script lang="ts">
  import { SurveyBuilderTypes } from './SurveyBuilder/types'
  import type { SurveyBuilderSnapshot } from './SurveyBuilder/types'

  import SurveyBuilder from './SurveyBuilder/SurveyBuilder.svelte'
  import { genId } from './SurveyBuilder/utils'

  export let props = {
    haveTitle: false,
    customInputNames: true,
    debug: true,
    showExportButton: false,
    snapshot: {
      title: 'Sample survey',
      questions: [
        {
          id: genId('q'),
          title: 'User name',
          name: 'userName',
          type: SurveyBuilderTypes.TextInput,
          required: true,
        },
        {
          id: genId('q'),
          title: 'User rating',
          name: 'userRating',
          type: SurveyBuilderTypes.StarsRating,
          required: true,
          options: 5,
        },
        {
          id: genId('q'),
          title: 'Account type',
          name: 'accountType',
          type: SurveyBuilderTypes.SingleSelect,
          required: true,
          answers: [
            {
              id: genId('a'),
              title: 'Private account',
              type: SurveyBuilderTypes.TextValue,
            },
            {
              id: genId('a'),
              title: 'Business account',
              type: SurveyBuilderTypes.TextValue,
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
  }
</script>

<main class="container mx-auto">
  <div class="border-2 my-4 px-8 py-4">
    <label>
      <input type="checkbox" bind:checked={props.haveTitle} />
      Have title?
    </label>
    <label>
      <input type="checkbox" bind:checked={props.showExportButton} />
      Show Export button?
    </label>
    <label>
      <input type="checkbox" bind:checked={props.customInputNames} />
      Custom input names
    </label>
    <label>
      <input type="checkbox" bind:checked={props.debug} />
      Debug
    </label>
  </div>

  <SurveyBuilder
    bind:haveTitle={props.haveTitle}
    bind:customInputNames={props.customInputNames}
    bind:debug={props.debug}
    bind:snapshot={props.snapshot}
  />
</main>