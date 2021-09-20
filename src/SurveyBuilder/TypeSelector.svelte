<script lang="ts">
  import { SurveyBuilderTypes } from './types'

  export let questionType: string
  export let id: string = "qt"

  const dropdownOptions = [
    [SurveyBuilderTypes.TextInput, 'User input'],
    [SurveyBuilderTypes.SingleSelect, 'Single option'],
    [SurveyBuilderTypes.MultipleSelect, 'Multiple options'],
    [SurveyBuilderTypes.StarsRating, 'Rating'],
  ]

  export let onChange: (arg0: any) => void

  const handleInput = (evt: any) => onChange(evt.target.value)
</script>

<main>
  <div class="relative">
    <label for="qtype-{id}" class="absolute inset-y-3 left-2 hidden lg:block uppercase tracking-wide text-gray-400 text-xs font-bold">Type:</label>
    <select id="qtype-{id}" class="dropdown" bind:value={questionType} on:input|preventDefault={handleInput}>
      {#each dropdownOptions as [value, label]}
        <option {value}>{label}</option>
      {/each}
    </select>
    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
      <svg
        class="fill-current h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        >
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
      </svg>
    </div>
  </div>
</main>

<style lang="postcss">
  .dropdown {
    @apply appearance-none bg-blue-50 bg-opacity-10 cursor-pointer h-10
      border border-blue-200 text-gray-700 py-2 px-4 pr-8
      rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500
      w-44 lg:w-52;

    text-indent: 15px;
  }
  @media (max-width: 1024px) {
    .dropdown {
      text-indent: initial;
    }
  }
</style>
