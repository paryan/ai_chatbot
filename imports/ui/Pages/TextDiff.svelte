<script>
  import DropZone from "../Components/DropZone.svelte";

  let Diff = require('../../logic/text-diff-logic')
  let _ = require('lodash')

  import TurndownService from 'turndown';
  const turndownService = new TurndownService({emDelimiter: '*'});

  import { onMount } from 'svelte';
  import mammoth from "mammoth";
  import pretty from "pretty";
  import TextDiffArea from "../Components/TextDiffArea.svelte";
  onMount(() => { document.title = 'AI: Text Diff'; });

  let result = '', stats1 = Diff.updateStats(''), stats2 = Diff.updateStats(''), text1, text2
  let tokens= {
    1: [],
    2: []
  }

  export let models = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
  let getTokens = (inputText, target) => {
    Meteor.call('AI: Token Counter', inputText, models, (err, data) => {
      tokens[target] = data
    })
  }



</script>

<style>

  code, pre {
    display: block;
    /*background: white;*/
    /*color: #414141;*/
    padding: 10px;
    /*margin-top: 1rem;*/
    margin: 0;
    font-size: 50%;
    white-space: break-spaces;
    overflow: visible;
    font-size: 14px;
    background: var(--diff-results);
    border: 1px solid var(--diff-results-border);
    border-radius: 5px;
  }

  .heading {
    text-align: center;
    font-weight: bold;
  }
  #result {
    padding: 0 .5em;
    font-size: 2rem;
    /*border: 1px solid grey;*/
  }
  .diff {
    /*border-top: 1px solid grey;*/
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5em;
    /*padding: 0.25em 0;*/
    overflow: scroll;
    height: calc(100vh - 15.1em);
  }
  b {
    display: block;
    border-bottom: 1px solid black;
  }
  #diffForm {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1em;
    padding: 1em;
    width: calc(100vw - 18em);
  }
  .textInput {
    display: grid;
    grid-template-columns: auto 16em;
    gap: 10px;
    padding: .5em;
    border: 1px solid grey;
    border-radius: 5px;
  }
  .textInput textarea {
    width: 100%;
    margin: 0;
    border: 0;
    font-size: 1rem;
    background: var(--bs-textarea);
    padding: 2px 7px;
    border-radius: 5px;
  }
  #stats1, #stats2 {
    display: grid;
    grid-template-columns: 7.5em auto;
    gap: 0em;
    padding: .25em;
  }
  table {
    font-size: 95%
  }

</style>

<form id="diffForm">
  <TextDiffArea {models} inputText={text1} on:textChange={(e) => {
    text1 = e.detail
    result = Diff.diff(text1, text2)
  }} />
  <TextDiffArea {models} inputText={text2} on:textChange={(e) => {
    text2 = e.detail
    result = Diff.diff(text1, text2)
  }} />

</form>
<div style="" id="result">
  {#if result.heading}<div class='heading'>{result.heading ?? ''}</div>{/if}
  {#if result.diffFound && result.diffFound !== 'No Diff'}
    <div class="diff">
      <pre>{@html result.before}</pre>
      <pre>{@html result.after}</pre>
    </div>
  {/if}
</div>

