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
  <ol class="{ parentType ? 'answers' : 'questions' }">
    {#each questions as item, idx (item.id)}
      <li animate:flip={{ duration: 250 }}>
        <div class="w-full flex items-center py-2">
          <span class="number w-8 text-xl">{idx + 1}.</span>
          <div class="flex-auto relative">
            <label class="label-inline" for="title-{item.id}">Title:</label>
            <input id="title-{item.id}" class="w-full px-4" type="text" bind:value={item.title} />
          </div>
          <div class="actions w-auto px-4 content-end text-right">
          {#if idx < questions.length - 1}<button on:click|preventDefault={() => moveUp(idx)}
            >&darr;</button
            >{/if}
            {#if idx > 0}<button on:click|preventDefault={() => moveDown(idx)}>&uarr;</button>{/if}
            {#if deleteConfirmation !== idx}
            <button class="warning" on:click|preventDefault={() => deleteRow(idx)}>&times; Delete </button>
            {:else}
            <button class="danger" on:click|preventDefault={() => deleteRowConfirm(idx)}>&times; Yes, delete </button>
            <button class="warning" on:click|preventDefault={() => deleteRow(-1)}> Cancel </button>
            {/if}
          </div>
        </div>
        {#if !parentType}
        <div class="flex w-3/4 items-center ml-8 py-2">
          <TypeSelector
            id={item.id}
            questionType={item.type}
            onChange={(value) => onQuestionTypeChange(idx, value)}
          />
          <label class="mx-4 whitespace-nowrap">
            <input type="checkbox" bind:checked={item.required} />
            Required
          </label>
          {#if  customInputNames}
          <div class="flex-auto relative mr-4">
            <label class="label-inline" for="name-{item.id}">Name:</label>
            <input id="name-{item.id}" class="w-40 lg:w-64 px-4" type="text" bind:value={item.name} placeholder="inputName" />
          </div>
          {/if}
          {#if item.type === SurveyBuilderTypes.StarsRating}
          <div class="relative flex-auto">
            <label class="label-inline" for="opts-{item.id}">Max: </label>
            <input id="opts-{item.id}" class="w-24 lg:w-32" type="number" bind:value={item.options} placeholder="5" />
          </div>
          {/if}
        </div>
        {/if}

        {#if !parentType}
        <div class="ml-8 w-3/4">
          {#if item.type !== SurveyBuilderTypes.StarsRating && item.type !== SurveyBuilderTypes.TextInput}
            <svelte:self bind:questions={item.answers} bind:parentType={item.type} />
            <button class="secondary w-full" on:click|preventDefault={() => addAnswer(idx)}>+ Answer</button>
          {/if}
        </div>
        {/if}
      </li>
    {/each}
    {#if !parentType}
    <li class="add-question">
      <button class="w-full" on:click|preventDefault={addRow}> &plus; Add question </button>
    </li>
    {/if}
  </ol>
</main>

<style lang="postcss">
li {
  @apply flex flex-wrap my-1 p-2 items-center rounded;
}
.questions li {
  @apply bg-indigo-50 bg-opacity-30 hover:bg-opacity-50;
}
.answers li {
  @apply bg-green-50 bg-opacity-30 hover:bg-opacity-50;
}

.label-inline {
  @apply absolute inset-y-3 left-2 hidden lg:block uppercase tracking-wide text-gray-400 text-xs font-bold;
}

input[type="text"],
input[type="number"] {
  text-indent: 35px;
}

@media (max-width: 1024px) {
  input[type="text"],
  input[type="number"] {
    text-indent: initial;
  }
}
</style>