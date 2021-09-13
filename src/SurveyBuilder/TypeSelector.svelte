<script lang="ts">
  import { SurveyBuilderTypes } from './types'

  export let questionType: string

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
  <select bind:value={questionType} on:input={handleInput}>
    {#each dropdownOptions as [value, label]}
      <option value={value}>{label}</option>
    {/each}
  </select>
</main>

<style>

</style>
