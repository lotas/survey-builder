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

  function addRow() {
    questions.push({
      id: genId(),
      title: 'New question',
      required: true,
      type: SurveyBuilderTypes.TextInput,
    })
    questions = questions
  }
</script>

<main>
  <ol class="questions">
    {#each questions as item, idx (item.id)}
      <li animate:flip={{ duration: 250 }} class="flex flex-wrap my-4">
        <div class="w-full">
          <span class="number w-8">{idx + 1}</span>
          <input class="w-1/2 px-4" type="text" bind:value={item.title} />
          <div class="actions w-1/4 px-4">
          {#if idx < questions.length - 1}<button on:click|preventDefault={() => moveUp(idx)}
            >&darr;</button
            >{/if}
            {#if idx > 0}<button on:click|preventDefault={() => moveDown(idx)}>&uarr;</button>{/if}
            {#if deleteConfirmation !== idx}
            <button class="text-red-700" on:click|preventDefault={() => deleteRow(idx)}>&times; Delete </button>
            {:else}
            <button class="text-red-700" on:click|preventDefault={() => deleteRowConfirm(idx)}>&times; Yes, delete </button>
            <button class="text-red-700" on:click|preventDefault={() => deleteRow(-1)}> Cancel </button>
            {/if}
          </div>
        </div>
        {#if !parentType}
        <div class="type-selector">
          <TypeSelector
            questionType={item.type}
            onChange={(value) => onQuestionTypeChange(idx, value)}
          />
        </div>
        {/if}
        {#if !parentType}
        {#if customInputNames}
          <input class="name" type="text" bind:value={item.name} placeholder="input-name" />
        {/if}
        <label>
          <input type="checkbox" bind:checked={item.required} />
          Required
        </label>
        {/if}
        {#if item.type === SurveyBuilderTypes.StarsRating}
          <label>
            Max rating
            <input type="number" bind:value={item.options} placeholder="5" />
          </label>
        {/if}

        {#if !parentType}
        <div class="answers">
          {#if item.type !== SurveyBuilderTypes.StarsRating && item.type !== SurveyBuilderTypes.TextInput}
            <svelte:self bind:questions={item.answers} bind:parentType={item.type} />
            <button class="add-answer" on:click|preventDefault={() => addAnswer(idx)}>+ Answer</button>
          {/if}
        </div>
        {/if}
      </li>
    {/each}
    {#if !parentType}
    <li class="add-question">
      <button on:click|preventDefault={addRow}> &plus; Add question </button>
    </li>
    {/if}
  </ol>
</main>

<style lang="postcss">
  .questions {
    /* padding-left: 0px;
    list-style-type: none;
    font-size: 15px; */
  }

  .questions li {
    /* margin: 20px 0;
    padding: 8px 4px;
    border-bottom: 1px solid #ccc;

    align-items: center; */
    /* display: flex;
    flex: 0 1 auto;
    flex-wrap: wrap;
    flex-direction: row;
    box-sizing: border-box;
     justify-content: space-between;
    align-items: center; */
  }
/*
  .questions li button {
    opacity: 0.7;
  }
  .questions li button:hover {
    opacity: 1;
  }

  .questions li .number {
    color: gray;
    font-weight: 100;
    flex-basis: 30px;
    max-width: 30px;
    margin-bottom: 20px;
  }
  .questions li .title {
    flex-basis: 60%;
    max-width: 60%;
    margin-bottom: 20px;
  }
  .questions li .actions {
    flex-basis: 30%;
    margin-bottom: 20px;

    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }

  .questions li:hover {
    border-color: rgb(76, 115, 160);
    background-color: rgba(239, 248, 250, 0.295);
    cursor: pointer;
  }
  .questions li .answers {
    flex-basis: 100%;
    max-width: 80%;
    margin-left: 30px;
    margin-top: 20px;
  }

  .questions li.add-question {
    display: block;
  }
  .questions li.add-question button {
    width: 100%;
    background: rgb(232, 248, 252);
    padding: 10px 0;
  }

  .questions .add-answer {
    display: block;
    width: 100%;
    padding: 10px 0;
    background: rgb(232, 252, 234);
  }

  .questions :global(.questions button) {
    background-color: var(--survey-builder-secondary-button-background);
  } */
</style>
