<script lang="ts">
import SurveyBuilder from './SurveyBuilder.svelte';

  import { SurveyBuilderTypes } from './types'

  export let questionType: string

  const dropdownOptions = [
    [SurveyBuilderTypes.TextInput, 'User input'],
    [SurveyBuilderTypes.TextValue, 'Text value'],
    [SurveyBuilderTypes.SingleSelect, 'Single value'],
    [SurveyBuilderTypes.MultipleSelect, 'Multiple values'],
    [SurveyBuilderTypes.StarsRating, 'Rating'],
  ]

  export let onChange: (any) => void
</script>

<main>
  <select bind:value={questionType} on:input={evt => onChange(evt.target.value)}>
    {#each dropdownOptions as [value, label]}
      <option value={value}>{label}</option>
    {/each}
  </select>
</main>

<style>

</style>
