<script>
  let Diff = require('../../logic/text-diff-logic')
  let _ = require('lodash')

  import { onMount } from 'svelte';
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

  code {
    display: block;
    /*background: white;*/
    /*color: #414141;*/
    padding: 10px;
    /*margin-top: 1rem;*/
    font-size: 50%;
  }

  .heading {
    text-align: center;
    font-weight: bold;
  }
  #result {
    padding: 0 1em;
    font-size: 2rem;
    /*border: 1px solid grey;*/
  }
  .diff {
    border-top: 1px solid grey;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1em;
    padding: 0.25em 0;
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


</style>

<form id="diffForm">
  <div class="textInput">
    <textarea name="text1" rows="20" cols="30" class="font-monospace" placeholder="Enter first text here..." bind:value={text1} on:keyup={(event) => {
      // console.log(event.target.value)
      stats1 = Diff.updateStats(text1)
      result = Diff.diff(text1, text2)
      // console.log(result)
    }}></textarea>
    <div>
      <table class="table">
        {#each _.chain(stats1).toPairs().value() as elem}
          <tr>
            <th>{elem[0]}:</th>
            <td>{elem[1]?.toLocaleString()}</td>
          </tr>
        {/each}
        <tr><td colspan="2" class="text-center"><button class="btn btn-link" on:click|preventDefault={() => getTokens(text1, '1')}>Calculate Tokens</button></td></tr>
        {#each tokens['1'] ?? [] as elem}
          <tr>
            <th>{elem?.model ?? ''}</th>
            <td>{elem?.tokens?.toLocaleString() ?? ''}</td>
          </tr>
        {/each}

      </table>
    </div>
  </div>
  <div class="textInput">
    <textarea name="text2" rows="20" cols="30" class="font-monospace" placeholder="Enter second text here..." bind:value={text2} on:keyup={(event) => {
     // console.log(event.target.value)
     stats2 = Diff.updateStats(text2)
     result = Diff.diff(text1, text2)
     // console.log(result)
   }}></textarea>
    <div>
      <table class="table">
        {#each _.chain(stats2).toPairs().value() as elem}
          <tr>
            <th>{elem[0]}</th>
            <td>{elem[1]?.toLocaleString()}</td>
          </tr>
        {/each}
        <tr><td colspan="2" class="text-center"><button class="btn btn-link" on:click|preventDefault={() => getTokens(text2, '2')}>Calculate Tokens</button></td></tr>
        {#each tokens['2'] ?? [] as elem}
          <tr>
            <th>{elem?.model ?? ''}</th>
            <td>{elem?.tokens?.toLocaleString() ?? ''}</td>
          </tr>
        {/each}

      </table>
    </div>
  </div>
</form>
<div style="" id="result">
  <div class='heading'>{result.heading ?? ''}</div>
  {#if result.diffFound}
    <div class="diff">
      <code>{@html result.before}</code>
      <code>{@html result.after}</code>
    </div>
  {/if}
</div>

