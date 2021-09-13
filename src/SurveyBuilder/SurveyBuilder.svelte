<svelte:options immutable={false} />

<script lang="ts">
  import type { SurveyBuilderSnapshot } from './types';
  import { SurveyBuilderTypes } from './types';
  import Questions from './Questions.svelte';
  import { genId } from './utils';

  export let snapshot: SurveyBuilderSnapshot = {};
  export let onExport: (snapshot: SurveyBuilderSnapshot) => void;

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
  <button on:click={addRow}>
    + Add row
  </button>
  <button on:click={handleExport}>
    Export
  </button>

  <Questions bind:questions={snapshot.questions} />

  <pre class="debug">
    {JSON.stringify(snapshot, null, 2)}
  </pre>
</main>

<style>
  main {
    padding: 8px 10px;
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

