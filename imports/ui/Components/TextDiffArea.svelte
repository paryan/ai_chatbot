<script>

import Diff from "../../logic/text-diff-logic";
import _ from "lodash";
import DropZone from "./DropZone.svelte";
import mammoth from "mammoth";
import pretty from "pretty";
import TurndownService from 'turndown';
const turndownService = new TurndownService({emDelimiter: '*'});

import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

export let inputText
let stats = Diff.updateStats(''), tokens = []

let textChange = () => dispatch('textChange', inputText)
let debounced = _.debounce(textChange, 200, {trailing:true, leading:false, maxWait: 300})


function parseWordDocxFile(inputElement) {
  let files = inputElement?.target?.files || [];
  if (!files.length) return;
  let file = files[0];

  let reader = new FileReader();
  reader.onloadend = function(event) {
    let arrayBuffer = reader.result;

    mammoth.convertToHtml({arrayBuffer: arrayBuffer}).then(function (resultObject) {
      let markdown = turndownService.turndown(pretty(resultObject.value))
      inputText = markdown
      stats = Diff.updateStats(inputText)
      textChange()
    })
  };
  reader.readAsArrayBuffer(file);
}

export let models = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
let getTokens = (text) => {
  Meteor.call('AI: Token Counter', text, models, (err, data) => {
    // console.log(data)
    tokens = data
  })
}


</script>

<style>
  .textInput {
    display: grid;
    grid-template-columns: auto 17em;
    gap: 10px;
    padding: .5em;
    border: 1px solid var(--diff-results-border);
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

</style>

<div class="textInput">
    <textarea name="inputText" rows="15" cols="30" class="font-monospace" placeholder="Enter second text here..." bind:value={inputText} on:keyup={(event) => {
      debounced()
      stats = Diff.updateStats(inputText)
      // result = Diff.diff(text1, inputText)
   }}></textarea>
  <div>
    <table class="table" width="100%">
      {#each _.chain(stats).toPairs().value() as elem}
        <tr>
          <th width="45%">{elem[0]}</th>
          <td style="text-align: right">{elem[1]?.toLocaleString()}</td>
        </tr>
      {/each}
      <tr><td colspan="2" class="text-center"><DropZone on:uploadedFiles={(event) => parseWordDocxFile({target: {files: event.detail}})} accept=".docx" /> </td></tr>
      <tr><td colspan="2" class="text-center"><button class="btn btn-link" on:click|preventDefault={() => getTokens(inputText)}>Calculate Tokens</button></td></tr>
      {#each tokens as elem}
        <tr>
          <th>{elem?.model ?? ''}</th>
          <td>{elem?.tokens?.toLocaleString() ?? ''}</td>
        </tr>
      {/each}

    </table>
  </div>
</div>
