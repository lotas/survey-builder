<script lang="ts">
  import type { SurveyBuilderQuestion } from './types'
  import { SurveyBuilderTypes } from './types'
  import TypeSelector from './TypeSelector.svelte'
  import { flip } from 'svelte/animate'
  import { genId } from './utils'

  export let questions: SurveyBuilderQuestion[] = []
  export let parentType: SurveyBuilderTypes | null = null

  function deleteRow(idx: number) {
    questions.splice(idx, 1)
    questions = questions
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
    if (!Array.isArray(questions[idx].options)) {
      questions[idx].options = []
    }
    ;(questions[idx].options as SurveyBuilderQuestion[]).push({
      id: genId(),
      title: 'Answer ',
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
        <TypeSelector
          questionType={item.type}
          onChange={(value) => onQuestionTypeChange(idx, value)}
        />
        {:else}
          <div></div>
        {/if}
        <div class="actions">
          {#if idx < questions.length - 1}<button on:click={moveUp(idx)}
              >&darr;</button
            >{/if}
          {#if idx > 0}<button on:click={moveDown(idx)}>&uarr;</button>{/if}
          <button on:click={deleteRow(idx)}> Delete </button>
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
            <svelte:self bind:questions={item.options} bind:parentType={item.type} />
            <button on:click={addAnswer(idx)}>+ Answer</button>
          {/if}
        </div>
        {/if}
      </li>
    {/each}
  </ol>
</main>

<style>
  .questions {
    border: 1px dotted #eee;
    padding-left: 0px;
    list-style-type: none;
  }
  .questions li {
    margin: 10px 0;
    padding: 2px 4px;
    border: 1px dotted #eee;

    align-items: center;
    display: grid;
    grid-template-columns: 20px auto 200px 140px;
    column-gap: 5px;
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
</style>
