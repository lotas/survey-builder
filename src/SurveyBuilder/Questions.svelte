<script lang="ts">
  import type { SurveyBuilderQuestion, SurveyBuilderTypes } from './types';
  import TypeSelector from './TypeSelector.svelte';

  export let questions: SurveyBuilderQuestion[] = []

  function deleteRow(idx: number) {
    questions.splice(idx, 1)
    questions = questions
  }

  function onQuestionTypeChange(idx: number, newType: SurveyBuilderTypes) {
    questions[idx].type = newType
    questions = questions
  }

  // drag and drop https://svelte.dev/repl/3bf15c868aa94743b5f1487369378cf3?version=3.21.0
</script>

<main>
  <ol class="questions">
    {#each questions as item, idx (item.id)}
      <li>
        <div class="id">{item.id}</div>
        <div class="title">{item.title}</div>
        <TypeSelector questionType={item.type} onChange={value => onQuestionTypeChange(idx, value)} />
        <div class="actions">
          <button on:click={deleteRow(idx)}>
            Delete
          </button>
        </div>
      </li>
    {/each}
  </ol>
</main>

<style>
  .questions {
    border: 1px dotted #eee;
    padding-left: 20px;
    list-style-type: none;
  }
  .questions li {
    margin: 10px 0;
    padding: 2px 4px;
    border: 1px dotted #eee;

    align-items: center;
    display: grid;
    grid-template-columns: 140px auto 200px 80px;
  }
  .questions li .id {
    color: gray;
    font-weight: 100;
  }
  .questions li .actions {
  }
  .questions li:hover {
    border-color: #3c3;
    cursor: pointer;
  }
</style>
