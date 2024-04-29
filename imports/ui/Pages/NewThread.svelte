<script>

  import SvgIcons from "../Components/SvgIcons.svelte";
  import _ from 'lodash'
  import './Threads.css'

  import { onMount } from 'svelte';
  import {router} from "tinro";
  onMount(() => { document.title = 'AI: New Thread'; });

  export let models
  let selectedModel = models[0]

  let newThread = {
    model: models[0],
    instructions: [
      {role: 'system', content: 'You are a helpful assistant.', index: 0, tokens: 6}
    ],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    onlySendLatest: false,
  }

  let isLoading = true, threads = [], threadCount = 0, totalInputTokens = 0, totalOutputTokens = 0, totalTokens = 0, title = 'New Chat - ' + (new Date()).toLocaleDateString()

  let instructions = [
    {role: 'system', content: 'You are a helpful assistant.', index: 0, tokens: 6}
  ]

  let resetThread = () => {
    instructions = [
      {role: 'system', content: 'You are a helpful assistant.', index: 0, tokens: 6}
    ]
    title = 'New Chat - ' + (new Date()).toLocaleDateString()
    selectedModel = models[0]
    newThread.onlySendLatest = false
  }

  let addMessage = (x) => x, removeMessage = (x) => x

  let createThread = () => {
    instructions = _.chain(instructions).filter('content').map(x => ({...x, content: x.content?.trim()})).filter('content').value()
    if(!title.trim()) return alert('No Title. Failed to insert.')
    if (!instructions.length) return alert('No Instructions Found. Failed to insert.')
    Meteor.call('Threads : New Thread', {title, model:selectedModel, instructions, totalInputTokens, totalOutputTokens, totalTokens, onlySendLatest:newThread.onlySendLatest }, (err, data) => {
      resetThread()
      router.goto('/threads?threadId=' + data)
      // console.log(data)
    })
  }


  $m: {

    addMessage = () => {
      let max = _.chain(instructions).map('index').max().value() + 1
      instructions= [...instructions, { role: 'user', content: '', index: max } ]
    }
    removeMessage = (idx) => {
      instructions = instructions.filter((x, i) => i!==idx)
      // console.log(instructions)
    }
    totalOutputTokens = _.chain(instructions).filter(x => x.role === 'assistant').map('tokens').compact().sum().value()
    totalInputTokens  = _.chain(instructions).filter(x => x.role !== 'assistant').map('tokens').compact().sum().value()
    totalTokens       = _.chain(instructions).map('tokens').compact().sum().value()

  }

</script>

<style>

</style>

<div class="messagesContainer">
  <div class="instructions">
    <div class="userMessage">
      <label for="userMessage0" class="font-monospace messageLabel" data-tokens="" style="cursor: pointer;">Title</label>
      <textarea id="userMessage0" class="font-monospace" rows="10" cols="20" autofocus="" placeholder="Enter Title" bind:value={title}></textarea>
    </div>
    {#each instructions as msg, idx (msg.index)}
      <div class="{msg.role}Message">
        <label for="{msg.role}Message{idx}" class="font-monospace messageLabel"
               data-tokens="{msg.tokens ? '(' + msg.tokens.toLocaleString() + ' Tokens)' : ''}"
               style="cursor: {msg.role !== 'system' ? 'pointer' : ''}"
               on:click={() => msg.role = msg.role === 'system' ? msg.role : msg.role === 'user' ? 'assistant' : 'user'}>
          {msg.role}{#if msg.role!=='system'}<a href="" class="removeLink" on:click={() => removeMessage(idx)}><SvgIcons iconName="circle-minus" /></a>{/if}
        </label>
        <textarea
          id="{msg.role}Message{idx}"
          class="font-monospace messageTextArea"
          rows="5" cols="20"
          style="height: 100px !important;"
          autofocus="{idx+1 === instructions.length}"
          placeholder="Enter {_.startCase(msg.role)} Message"
          bind:value={msg.content}
          on:keyup={_.debounce(() => Meteor.call('AI: Calculate Tokens', msg.content, selectedModel, (err, data) => { msg.tokens = data ?? 0 }), 1000, {trailing:true, leading:false, maxWait: 1000})}
        ></textarea>
      </div>
    {/each}
  </div>
  <div class="newThreadControls">
    <span><button class="btn btn-link addButton" on:click|preventDefault={addMessage}><SvgIcons iconName="circle-plus" /><span class="addButtonText">Add Message</span></button></span>
    <div class="form-check form-switch btn btn-link text-decoration-none text-muted text-start">
      <input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault" bind:checked={newThread.onlySendLatest}>
      <label class="form-check-label  text-start" for="flexSwitchCheckDefault">Send Latest Only</label>
    </div>
    <span class="btn btn-link text-decoration-none text-muted" style="cursor: default">Input Tokens: {totalInputTokens?.toLocaleString()}</span>
    <span class="btn btn-link text-decoration-none text-muted" style="cursor: default">Output Tokens: {totalOutputTokens?.toLocaleString()}</span>
    <select class="form-select" aria-label="Default select example" bind:value={selectedModel}>
      {#each models as model}
        <option value="{model}">{model}</option>
      {/each}
    </select>
    <button class="btn btn-primary createButton" on:click|preventDefault={createThread}>Create Thread</button>
  </div>
</div>
