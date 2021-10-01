
<script lang="ts">
  import type { SurveyBuilderSnapshot } from './types'
  import Questions from './Questions.svelte'

  // Props
  export let haveTitle = true
  export let customInputNames = true
  export let snapshot: SurveyBuilderSnapshot = {}
  export let onChange: (snapshot: SurveyBuilderSnapshot) => void = () => {}
  export let onExport: (snapshot: SurveyBuilderSnapshot) => void = () => {}
  export let debug = false

  $: {
    if (typeof onChange === 'function') {
      onChange(snapshot)
    }
  }

  function handleExport() {
    if (typeof onExport === 'function') {
      onExport(snapshot)
    } else {
      console.warn('onExport is not defined')
    }
  }
</script>

<main class="survey-builder container mx-auto font-sans">
  <h1 class="text-3xl">Survey builder &quot;{snapshot.title || 'no name'}&quot;</h1>
  {#if haveTitle}
    <div class="my-4">
      <label>
        Title:
        <input type="text" bind:value={snapshot.title} />
      </label>
    </div>
  {/if}
  <div class="my-4">
    <button on:click|preventDefault={handleExport}> Export </button>
  </div>

  <h3>Questions:</h3>
  <Questions bind:questions={snapshot.questions} bind:customInputNames />

  {#if debug}
  <div class="debug">
    <h3>Data model:</h3>
    <pre>
      {JSON.stringify(snapshot, null, 2)}
    </pre>
  </div>
  {/if}

</main>


<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  .survey-builder button {
    @apply font-bold py-2 px-4 rounded bg-blue-200 text-blue-900 hover:bg-blue-100;
  }
  .survey-builder button.danger {
    @apply bg-red-400 text-red-900 hover:bg-red-200;
  }
  .survey-builder button.warning {
    @apply bg-red-100 text-red-900 hover:bg-red-50;
  }
  .survey-builder button.secondary {
    @apply bg-green-100 text-green-900 hover:bg-green-50;
  }
  .survey-builder input[type="text"],
  .survey-builder input[type="number"] {
    @apply bg-blue-50 bg-opacity-10 appearance-none border-2 border-blue-200 rounded h-10
      py-2 px-4 text-gray-800 leading-tight
      focus:outline-none focus:bg-white focus:border-blue-500;
  }
</style>
