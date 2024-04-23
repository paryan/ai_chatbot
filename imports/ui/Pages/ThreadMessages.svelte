<script>

  import {ThreadsCollection, MessagesCollection} from "../../db/DatabaseCollection";
  import SvgIcons from "../Components/SvgIcons.svelte";
  import {meta} from 'tinro';
  import HeroMessage from "../Components/HeroMessage.svelte";
  import _ from "lodash";
  import M from 'moment'
  import {marked} from 'marked';

  const route = meta();

  // Optionally set marked options
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Line breaks
    sanitize: false, // Do NOT use sanitize in production without proper XSS mitigation
  });

  const parseMarkdown = content => marked(content);


  export let details, models

  import { onMount, tick } from 'svelte';
  import {copyText} from "../../api/Utils";


  let isLoading = true, thread = {}, threadCopy = {}, chatMessages = [], newContent = ''
  // let noThread = true
  let threadQuery = details?.query?.threadId ? {_id: details?.query?.threadId} : {noThread: true}
  let chatQuery = details?.query?.threadId ? {threadId: details?.query?.threadId} : {noThread: true}

  let scrollToBottom = () => {
    let messagesContainer = document.querySelector('.chatMessages');
    if(messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  let threadHandler = Meteor.subscribe('dynamicQuery', 'MessagesCollection', chatQuery, {
    onReady: async () => {
      chatMessages = MessagesCollection.find( chatQuery, { sort: { index: 1 } } ).fetch();
      await tick(); // Wait until the DOM is updated
      scrollToBottom();
    }
  })

  let totalInputTokens = 0, totalOutputTokens = 0, instructionsList
  let addInstructions = (x) => x, removeInstructions = (x) => x


  onMount(() => {
    Meteor.subscribe('dynamicQuery', 'ThreadsCollection', threadQuery, () => {
      isLoading = false;
      thread = ThreadsCollection.findOne( threadQuery );
      scrollToBottom()
    });
  });

  onMount(() => {
    window.addEventListener('resize', scrollToBottom);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        scrollToBottom();
      }
    });

    return () => {
      window.removeEventListener('resize', scrollToBottom);
      document.removeEventListener('visibilitychange', scrollToBottom);
    };
  });


  let newMessage = () => {
    if (!newContent.trim()) return
    Meteor.call('Messages : New Message', thread._id, newContent, 'user', thread.model, async (err, data) => {
      await tick(); // Ensures the DOM updates with the new message
      scrollToBottom()
      let messages = [...thread.instructions, ...data]
      Meteor.call('AI: Chat Completion', thread.model, messages, async (err1, aiMsg) => {
        // console.log(messages, aiMsg)
        await Meteor.call('Threads : Update Thread', thread._id, { $set: {totalInputTokens: aiMsg.prompt_tokens, totalOutputTokens: aiMsg.completion_tokens, updatedAt: Date.now() } })
        await Meteor.call('Messages : New Message', thread._id, aiMsg.content, aiMsg.role, thread.model, async () => {
          await tick(); // Ensures the DOM updates with the new message
          scrollToBottom()
        })
      })

      // console.log(data, messagesContainer, messagesContainer?.scrollTop, messagesContainer?.scrollHeight)
    })
  }
  let removeMessage = async (msg) => {
    // console.log(msg)
    Meteor.call('Messages : Remove Message', msg._id, (err, data) => {
      // scrollToBottom()
      // console.log(data)
    })
    // await tick(); // Ensures the DOM updates with the new message
    // scrollToBottom();
  }

  $m: {
    // noThread = !details?.query?.threadId
    // isLoading = !threadHandler.ready();

    // console.log(thread)

    chatMessages = MessagesCollection.find( chatQuery, { sort: { index: 1 } } ).fetch();

    // if(chatMessages.length) scrollToBottom()
    addInstructions = () => {
      let max = _.chain(thread.instructions).map('index').max().value() + 1
      thread.instructions= [...thread.instructions, { role: 'user', content: '', index: max } ]
      // console.log(thread.instructions)
    }
    removeInstructions = (idx) => {
      thread.instructions = thread.instructions.filter((x, i) => i!==idx)
      // console.log(thread.instructions)
    }
    if (thread) {
      thread.totalOutputTokens = _.chain(thread).get('instructions').filter(x => x.role === 'assistant').map('tokens').compact().sum().value()
      thread.totalInputTokens  = _.chain(thread).get('instructions').filter(x => x.role !== 'assistant').map('tokens').compact().sum().value()
      scrollToBottom()
    }

    // console.log(thread)
  }

  $: chatMessages, scrollToBottom();

</script>

<style>
  .messagesContainer {
    padding-bottom: 0;
    margin-bottom: 0;
    grid-template-rows: auto 4.5em;
    height: calc(100vh - 4em);
  }

  .threadMeta {
    backdrop-filter: brightness(150%);
    margin: 0 10px;
    padding: 5px;
    position: sticky;
    border-radius: 5px;
  }

  .threadMeta summary {
    display: block;
    padding-left: 12px;
  }

  .instructionsContainer {
    height: 15em;
    overflow-y: scroll;
    margin-top: 5px;
  }
  .newThreadControls {
    border-top: 1px solid rgba(128, 128, 128, 0.46);
    margin: 0px 10px 0 10px;
    padding: 5px 0;
  }
  .instructionsContainer .messages {
    border: 0
  }
  .addButton {
    padding-left: 5px;
  }
  .addButton .addButtonText {
    position: relative !important;
    top: 2px !important;;
  }
  details[open] summary {
    /*padding-left: 12px;*/
  }
  .newMessage {
    padding: 6px 7px;
  }
  .chatMessages {
    overflow-y: scroll;
    height: calc(100vh - 11.5em);
    padding: 10px;
    display: flex;
    flex-direction: column;
    /*max-width: 800px; !* or your preferred max width *!*/
    margin: auto;
  }
  .chatMessages .chatMessage {
    /*max-width: 50%;*/
    /*border: 1px solid grey;*/
  }
  .chatMessages .chatMessage .role {
    font-family: var(--bs-font-monospace) !important;
    font-size: 12px;
  }
  .chatMessages .messageFromUser {
    /*text-align: right;*/
    /*position: relative;*/
    /*left: 50%;*/

  }
  .chatMessage {
    padding: 4px 4px 2px 4px;
    display: block;
    line-height: 1;
    font-family: var(--bs-font-monospace) !important;
    font-size: 14px;
    border-radius: 3px;
  }
  .chatMessage span {
    width: fit-content;
    background: #0a8560;
  }


  .chat-container {
    display: flex;
    flex-direction: column;
    /*max-width: 800px; !* or your preferred max width *!*/
    margin: auto;
  }

  /* Base styles for each chat bubble */
  .chat-bubble {
    padding: 10px;
    margin: 5px;
    border-radius: 10px;
    color: #fff;
    max-width: 70%;
    min-width: 20%;
  }

  .sender {
    align-self: flex-end;
    background-color: #007BFF; /* Blue for sender */
  }

  .responder {
    align-self: flex-start;
    background-color: #6c757d; /* Gray for responder */
  }

  /* Message info (role, time, delete) */
  .message-info {
    font-size: 0.8rem; /* Smaller text for message info */
    /*display: flex;*/
    /*justify-content: space-between; !* Spreads out the info across the bubble *!*/
    padding-bottom: 4px; /* Space between info and message content */
    margin-bottom: 4px; /* Space between info and message content */
    border-bottom: 1px solid white;
    display: grid;
    grid-template-columns: auto 4em;
  }

  .message-info-icons {
    text-align: right;
  }
  .delete-btn, .copy-btn, .reuse-btn {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    display: inline-block;
  }

  /* Message content styling */
  .message-content {
    font-size: 1rem; /* Regular text size for message content */
  }

  /* Optional: styling for hover state on delete button */
  .delete-btn:hover {
    opacity: 0.8;
  }
</style>
{#if !thread}
  <div class="user-select-none" style="margin: 10px"> ◀ Select a Thread</div>
{:else if isLoading}
  <HeroMessage message="Loading..." />
{:else}
  <div class="messagesContainer">
    <div class="threadsBox">
      <details class="threadMeta">
        <summary class="font-monospace">Meta: {thread?.model?.toUpperCase()} : {thread.title}</summary>
        <div class="instructionsContainer">
          <div class="instructions">
            <div class="userMessage">
              <label for="userMessage0" class="font-monospace messageLabel" data-tokens="" style="cursor: pointer;">Title</label>
              <textarea id="userMessage0" class="font-monospace" rows="10" cols="20" autofocus="" placeholder="Enter Title" bind:value={thread.title}></textarea>
            </div>
            {#each thread.instructions ?? [] as msg, idx (msg.index)}
              <div class="{msg.role}Message">
                <label for="{msg.role}Message{idx}" class="font-monospace messageLabel"
                       data-tokens="{msg.tokens ? '(' + msg.tokens.toLocaleString() + ' Tokens)' : ''}"
                       style="cursor: {msg.role !== 'system' ? 'pointer' : ''}"
                       on:click={() => msg.role = msg.role === 'system' ? msg.role : msg.role === 'user' ? 'assistant' : 'user'}>
                  {msg.role}{#if msg.role!=='system'}<a href="" class="removeLink" on:click={() => removeInstructions(idx)}><SvgIcons iconName="circle-minus" /></a>{/if}
                </label>
                <textarea
                  id="{msg.role}Message{idx}"
                  class="font-monospace"
                  rows="10" cols="20"
                  autofocus="{idx+1 === thread.instructions.length}"
                  placeholder="Enter {_.startCase(msg.role)} Message"
                  bind:value={msg.content}
                  on:keyup={_.debounce(() => Meteor.call('AI: Calculate Tokens', msg.content, thread.model, (err, data) => { msg.tokens = data ?? 0 }), 1000, {trailing:true, leading:false, maxWait: 1000})}
                ></textarea>
              </div>
            {/each}
          </div>
        </div>
        <div class="newThreadControls">
          <span><button class="btn btn-link addButton" on:click|preventDefault={addInstructions}><SvgIcons iconName="circle-plus" /><span class="addButtonText">Add Message</span></button></span>
          <span class="btn btn-link text-decoration-none text-muted" style="cursor: default">Input Tokens: {thread.totalInputTokens?.toLocaleString()}</span>
          <span class="btn btn-link text-decoration-none text-muted" style="cursor: default">Output Tokens: {thread.totalOutputTokens?.toLocaleString()}</span>
          <select class="form-select" aria-label="Default select example" bind:value={thread.model}>
            {#each models as model}
              <option value="{model}">{model}</option>
            {/each}
          </select>
          <button class="btn btn-primary updateButton" on:click|preventDefault={(x) => Meteor.call('Threads : Update Thread', thread._id, {..._.omit(thread, ['_id']), updatedAt: Date.now() } )}>Update Thread</button>
        </div>
      </details>

      <div class="chatMessages">
        {#each chatMessages as msg}
          <div class="chat-bubble {msg.role === 'user' ? 'sender' : 'responder'}">
            <div class="message-info">
              <span class="role">{msg.role === 'user' ? 'You' : 'AI'}, {M(new Date(msg.updatedAt)).fromNow()}</span>
              <span class="message-info-icons">
              <a href="" class="delete-btn" on:click|preventDefault={() => removeMessage(msg)}><SvgIcons iconName="circle-minus" /></a>
              <a href="" class="copy-btn" on:click|preventDefault={() => copyText(msg.content)}><SvgIcons iconName="copy-14" /></a>
              <a href="" class="reuse-btn" on:click|preventDefault={() => newContent = msg.content}><SvgIcons iconName="repeat-14" /></a>
              </span>
            </div>
            <div class="message-content">
              {@html parseMarkdown(msg.content)}
            </div>
              </div>
<!--                {scrollToBottom() ?? ''}-->
        {/each}
      </div>
    </div>
    <div class="input">
      <textarea class="font-monospace newMessage" style="background: black" name="" id="" cols="30" rows="10" bind:value={newContent}></textarea>
      <a href="#" class="" on:click|preventDefault={newMessage}><SvgIcons iconName="bubble-text" /></a>
    </div>
  </div>
{/if}
