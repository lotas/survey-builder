<svelte:options immutable={false} />

<script lang="ts">
  import type { SurveyBuilderSnapshot } from './types';
  import { SurveyBuilderTypes } from './types';
  import Questions from './Questions.svelte';
  import { genId } from './utils';

  export let snapshot: SurveyBuilderSnapshot = {};
  export let onExport: (snapshot: SurveyBuilderSnapshot) => void;

  $: {
    onExport(snapshot)
  }

  function addRow() {
    snapshot.questions.push({
      id: genId(),
      title: 'New question',
      type: SurveyBuilderTypes.TextValue,
    })
    // to make it reactive, reassing value
    snapshot = snapshot
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
  <label for="title">
    Title:
    <input id="title" type="text" bind:value={snapshot.title} />
  </label>
  <button on:click={handleExport}>
    Export
  </button>

  <Questions bind:questions={snapshot.questions} />

  <button on:click={addRow}>
    + Add row
  </button>

  <pre class="debug">
    {JSON.stringify(snapshot, null, 2)}
  </pre>
</main>

<style>
  :global(:root){
    --survey-builder-button-color: rgb(14, 40, 53);
    --survey-builder-button-border: rgb(34, 151, 172);
    --survey-builder-button-border-hover: rgb(52, 196, 240);
    --survey-builder-button-background: rgb(184, 227, 247);
    --survey-builder-button-background-hover: rgb(154, 220, 250);
  }

  main {
    padding: 8px 10px;
  }

  main :global(button) {
    padding: 4px 6px;
    color: var(--survey-builder-button-color);
    border: 1px solid var(--survey-builder-button-border);
    background-color: var(--survey-builder-button-background);
  }
  main :global(button:hover) {
    border-color: var(--survey-builder-button-hover);
    background-color: var(--survey-builder-button-background-hover);
  }

  h1 {
    color: #533;
    text-transform: uppercase;
    font-size: 1.5em;
    font-weight: 100;
  }

  .debug {
    width: 100%;
    text-align: left;
  }
</style>

