
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

<main>
  <h1>Survey builder &quot;{snapshot.title || 'no name'}&quot;</h1>
  {#if haveTitle}
    <div class="survey-title">
      <label for="survey-title">
        Title:
        <input id="survey-title" type="text" bind:value={snapshot.title} />
      </label>
    </div>
  {/if}
  <div class="controls">
    <button on:click|preventDefault={handleExport}> Export </button>
  </div>

  <h3>Questions:</h3>
  <Questions bind:questions={snapshot.questions} bind:customInputNames />

  {#if debug}
  <h3>Data model:</h3>
  <pre class="debug">
    {JSON.stringify(snapshot, null, 2)}
  </pre>
  {/if}

</main>

<style>
  :global(:root) {
    --survey-builder-button-color: rgb(14, 40, 53);
    --survey-builder-button-border-hover: rgb(52, 196, 240);
    --survey-builder-button-background: rgb(215, 237, 247);
    --survey-builder-button-background-hover: rgb(154, 220, 250);
    --survey-builder-secondary-button-background: rgb(208, 243, 214);
    --survey-builder-input-border: rgb(136, 157, 185);
  }

  main {
    padding: 8px 10px;
    font-size: 15px;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
  }

  main :global(button) {
    padding: 4px 8px;
    color: var(--survey-builder-button-color);
    background-color: var(--survey-builder-button-background);
    box-shadow: 2px 2px 5px #ccc;
    font-size: 15px;
    line-height: 20px;
    border: 0;
  }
  main :global(button:hover) {
    cursor: pointer;
    background-color: var(--survey-builder-button-background-hover);
  }
  main :global(button.secondary) {
    background-color: var(--survey-builder-secondary-button-background);
  }
  main :global(select),
  main :global(input) {
    padding: 4px 8px;
    font-size: 15px;
    border: 1px solid var(--survey-builder-input-border);
    border-radius: 2px;
    line-height: 24px;
  }

  h1 {
    color: #533;
    text-transform: uppercase;
    font-size: 1.5em;
    font-weight: 100;
  }

  .controls {
    margin: 2px 5px;
    display: flex;
    justify-content: space-between;
  }
  .survey-title {
    margin: 20px 0;
  }

  .debug {
    width: 100%;
    text-align: left;
  }
  label {
    font-size: 15px;
  }
</style>
