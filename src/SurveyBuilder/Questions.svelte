<script lang="ts">
  import type { SurveyBuilderQuestion } from './types'
  import { SurveyBuilderTypes } from './types'
  import TypeSelector from './TypeSelector.svelte'
  import { flip } from 'svelte/animate'
  import { genId } from './utils'

  export let questions: SurveyBuilderQuestion[] = []
  export let parentType: SurveyBuilderTypes | null = null
  export let customInputNames: boolean = true

  let deleteConfirmation = -1
  function deleteRow(idx: number) {
    deleteConfirmation = idx
  }

  function deleteRowConfirm(idx: number) {
    questions.splice(idx, 1)
    questions = questions
    deleteConfirmation = -1
  }

  function onQuestionTypeChange(idx: number, newType: SurveyBuilderTypes) {
    questions[idx].type = newType
    questions = questions
  }

  function moveUp(idx: number) {
    const [item] = questions.splice(idx + 1, 1)
    questions.splice(idx, 0, item)
    questions = questions
  }
  function moveDown(idx: number) {
    const [item] = questions.splice(idx, 1)
    questions.splice(idx - 1, 0, item)
    questions = questions
  }

  function addAnswer(idx: number) {
    if (!Array.isArray(questions[idx].answers)) {
      questions[idx].answers = []
    }
    questions[idx].answers.push({
      id: genId(),
      title: 'Answer ',
      name: '',
      type: SurveyBuilderTypes.TextValue,
    })
    questions = questions
  }
</script>

<main>
  <ol class="questions">
    {#each questions as item, idx (item.id)}
      <li animate:flip={{ duration: 250 }}>
        <span class="number">{idx + 1}</span>
        <input class="title" type="text" bind:value={item.title} />
        {#if !parentType}
        {#if customInputNames}
          <input class="name" type="text" bind:value={item.name} placeholder="input-name" />
        {/if}
        <label>
          <input type="checkbox" bind:checked={item.required} />
          Required
        </label>
        {:else}
          <div></div>
        {/if}
        {#if !parentType}
        <TypeSelector
          questionType={item.type}
          onChange={(value) => onQuestionTypeChange(idx, value)}
        />
        {:else}
          <div></div>
        {/if}
        <div class="actions">
          {#if idx < questions.length - 1}<button on:click|preventDefault={() => moveUp(idx)}
              >&darr;</button
            >{/if}
          {#if idx > 0}<button on:click|preventDefault={() => moveDown(idx)}>&uarr;</button>{/if}
          {#if deleteConfirmation !== idx}
          <button class="danger" on:click|preventDefault={() => deleteRow(idx)}>&times; Delete </button>
          {:else}
          <button class="danger" on:click|preventDefault={() => deleteRowConfirm(idx)}>&times; Yes, delete </button>
          <button class="danger" on:click|preventDefault={() => deleteRow(-1)}> Cancel </button>
          {/if}
        </div>

        {#if !parentType}
        <div class="answers">
          {#if item.type === SurveyBuilderTypes.StarsRating}
            <label>
              Max stars
              <input type="number" bind:value={item.options} placeholder="5" />
            </label>
          {/if}
          {#if item.type !== SurveyBuilderTypes.StarsRating}
            <svelte:self bind:questions={item.answers} bind:parentType={item.type} />
            <button on:click|preventDefault={() => addAnswer(idx)}>+ Answer</button>
          {/if}
        </div>
        {/if}
      </li>
    {/each}
  </ol>
</main>

<style>
  .questions {
    padding-left: 0px;
    list-style-type: none;
    font-size: 15px;
  }
  button.danger {
    color: red;
  }
  .questions li {
    margin: 20px 0;
    padding: 8px 4px;
    border: 1px dotted #eee;

    align-items: center;
    display: grid;
    grid-template-columns: 20px auto 150px 100px 200px 240px;
    grid-gap: 5px 5px;
  }
  .questions li button {
    opacity: 0.7;
  }
  .questions li button:hover {
    opacity: 1;
  }

  .questions li .number {
    color: gray;
    font-weight: 100;
  }
  .questions li .actions {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .questions li:hover {
    border-color: #3c3;
    cursor: pointer;
  }
  .questions li .answers {
    grid-column: 2/5;
  }

  .questions :global(.questions button) {
    background-color: var(--survey-builder-secondary-button-background);
  }
</style>
