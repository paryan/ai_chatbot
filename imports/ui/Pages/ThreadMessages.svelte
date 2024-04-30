<script>

  import {ThreadsCollection, MessagesCollection} from "../../db/DatabaseCollection";
  import SvgIcons from "../Components/SvgIcons.svelte";
  import {meta} from 'tinro';
  import HeroMessage from "../Components/HeroMessage.svelte";
  import _ from "lodash";
  import M from 'moment'
  // import {marked} from 'marked';

  import { Marked } from "marked";
  import { markedHighlight } from "marked-highlight";
  import hljs from 'highlight.js';

  const marked = new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang, info) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        let value = hljs.highlight(code, { language }).value;
        return hljs.highlight(code, { language }).value;
      }
    })
  );


  const route = meta();
  export let showBookmarked
  // Optionally set marked options
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Line breaks
    sanitize: false, // Do NOT use sanitize in production without proper XSS mitigation
    async: true,
  });

  const parseMarkdown = content => {
    let markDown = content
    let mapping
    _.range(3).map(x => markDown = markDown.replace(new RegExp('<h' + (x+1) + '>', 'ig'), '<h' + (x+3) + '>').replace(new RegExp('</h' + (x+1) + '>', 'ig'), '</h' + (x+3) + '>'))



    return markDown
  }


  export let details, models

  import { onMount, tick } from 'svelte';
  import {copyText} from "../../api/Utils";
  import ChatTime from "../Components/ChatTime.svelte";

  onMount(() => { document.title = 'AI - Threads'; });

  let isLoading = true, thread = {}, threadCopy = {}, chatMessages = [], newContent = ''
  // let noThread = true
  let threadQuery = details?.query?.threadId ? {_id: details?.query?.threadId} : {noThread: true}
  let chatQuery = details?.query?.threadId ? {threadId: details?.query?.threadId} : {noThread: true}

  $m: {
    if (showBookmarked) chatQuery = details?.query?.threadId ? {threadId: details?.query?.threadId, isBookmarked: true} : {noThread: true}
    else chatQuery = details?.query?.threadId ? {threadId: details?.query?.threadId } : {noThread: true}

    // console.log('Messages', showBookmarked, chatQuery)
  }

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

  let totalInputTokens = 0, totalOutputTokens = 0, totalTokens = 0, instructionsList
  let addInstructions = (x) => x, removeInstructions = (x) => x

  let showMeta = false

  onMount(() => {
    Meteor.subscribe('dynamicQuery', 'ThreadsCollection', threadQuery, () => {
      isLoading = false;
      thread = ThreadsCollection.findOne( threadQuery );
      document.title = 'AI: ' + (thread?.title ?? 'Threads')
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

  function checkForSubmit(event) {
    if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault(); // Prevents the default action of inserting a newline
      newMessage(); // Call the function to handle submission
    }
  }

  let newMessage = () => {
    if (!newContent.trim()) return
    Meteor.call('Messages : New Message', thread._id, newContent, 'user', thread.model, thread.onlySendLatest, async (err, data) => {
      await tick(); // Ensures the DOM updates with the new message
      scrollToBottom()
      let messages = [...thread.instructions, ...data]
      newContent = ''
      Meteor.call('AI: Chat Completion', thread.model, messages, async (err1, aiMsg) => {
        // console.log(messages, aiMsg)
        thread.totalInputTokens = aiMsg.prompt_tokens
        thread.totalOutputTokens = aiMsg.completion_tokens
        thread.totalTokens = aiMsg.total_tokens
        // console.log({totalInputTokens: aiMsg.prompt_tokens, totalOutputTokens: aiMsg.completion_tokens, updatedAt: Date.now() })
        await Meteor.call('Threads : Update Thread', thread._id, { $set: {
            totalInputTokens: aiMsg.prompt_tokens,
            totalOutputTokens: aiMsg.completion_tokens,
            totalTokens: aiMsg.total_tokens,
            updatedAt: Date.now() } })
        await Meteor.call('Messages : New Message', thread._id, aiMsg.content, aiMsg.role, thread.model, async () => {
          await tick(); // Ensures the DOM updates with the new message
          scrollToBottom()
        })
      })

      // console.log(data, messagesContainer, messagesContainer?.scrollTop, messagesContainer?.scrollHeight)
    })
  }
  // let removeMessage   = async (msg) => Meteor.call('Messages : Remove Message', thread._id, msg._id)
  let removeMessage   = async (msg) => Meteor.call('Messages : Update Message', thread._id, msg._id, { $set: { isHidden: !msg.isHidden } })
  let bookmarkMessage = async (msg) => Meteor.call('Messages : Update Message', thread._id, msg._id, { $set: { isBookmarked: !msg.isBookmarked } })
  let fromNow = (x) => M().fromNow()

  $m: {

    chatMessages = MessagesCollection.find( chatQuery, { sort: { index: 1 } } ).fetch();

    fromNow = (x) => M(x).fromNow()

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

    totalOutputTokens = _.chain(thread.instructions).filter(x => x.role === 'assistant').map('tokens').compact().sum().value()
    totalInputTokens  = _.chain(thread.instructions).filter(x => x.role !== 'assistant').map('tokens').compact().sum().value()
    totalTokens       = _.chain(thread.instructions).map('tokens').compact().sum().value()

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
    background: var(--bs-threadMeta);
    margin: 0 10px;
    padding: 5px;
    position: absolute;
    border-radius: 5px;
    border: 1px solid var(--bs-threadMetaBorder);
    width: calc(100vw - 16.25em);
    box-shadow: 0 2px 5px 0px var(--bs-threadMetaShadow);
    resize: vertical;
  }

  .threadMeta summary {
    display: block;
    padding-left: 12px;
  }

  .instructionsContainer {
    height: calc(100vh - 15em);
    max-height: 50%;
    overflow-y: scroll;
    margin-top: 5px;
  }

  /*@media screen and (max-width: 2056px) {*/
  /*  .instructionsContainer {*/
  /*    height: calc(100vw - 57.5vw);*/
  /*  }*/
  /*}*/

  .newThreadControls {
    border-top: 1px solid rgba(128, 128, 128, 0.46);
    margin: 5px 10px 0 10px;
    padding: 10px 0 5px 0;
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
  details[open] {
    background: var(--bs-threadMetaOpen);
  }
  details[open] .userMessage, details[open] .assistantMessage, details[open] .systemMessage {
    background: var(--role-message) !important;
    border: 1px solid var(--role-border);
  }
  details[open] summary {
    /*padding-left: 12px;*/
  }
  .newMessage {
    padding: 6px 7px;
    background: var(--bs-textarea);
    border-radius: 5px;
  }
  .chatMessages {
    overflow-y: scroll;
    height: calc(100vh - 9em);
    padding: 40px 10px 10px 10px;
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
    color: #fff;
    max-width: 70%;
    min-width: 20%;
  }

  .sender {
    align-self: flex-end;
    /*background-color: var(--bs-responder-bubble); !* Blue for sender *!*/
  }

  .responder {
    align-self: flex-start;
  }
  .responder .message-content {
    background-color: var(--bs-responder-bubble);
    padding: 5px 10px;
    border-radius: 10px;
  }

  .sender .message-content {
    background-color: var(--bs-sender-bubble);
    padding: 5px 10px;
    border-radius: 10px;
  }

  .isHidden {
    cursor: pointer;
  }

  /* Message info (role, time, delete) */
  .message-info {
    font-size: 0.8rem; /* Smaller text for message info */
    /*display: flex;*/
    /*justify-content: space-between; !* Spreads out the info across the bubble *!*/
    padding-bottom: 4px; /* Space between info and message content */
    /*margin-bottom: 4px; !* Space between info and message content *!*/
    border-bottom: 1px solid white;
    display: grid;
    grid-template-columns: auto 8em;
    margin: 0 10px 0 5px;
  }

  .responder .message-info {
    color: var(--bs-responder-info-text);
    border-bottom: 1px solid var(--bs-responder-info-text);
    user-select: none;
  }

  .sender .message-info {
    color: var(--bs-sender-info-text);
    border-bottom: 1px solid var(--bs-sender-info-text);
    user-select: none;
  }

  .message-info-icons, .message-info-icons a {
    text-align: right;
    color: var(--bs-responder-info-text) !important;
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
    font-size: 0.9rem; /* Regular text size for message content */
    margin-top: 10px;
    color: var(--bs-responder-content-text);
  }

  /* Optional: styling for hover state on delete button */
  .delete-btn:hover {
    opacity: 0.8;
  }

  .messagesContainer .instructions {
    border: 0;
  }

  .userMessage0 {
    grid-template-rows: 1em 1.5em;
  }
</style>
{#if !thread}
  <div class="user-select-none" style="margin: 10px"> ◀ Select a Thread</div>
{:else if isLoading}
  <HeroMessage message="Loading..." />
{:else}
  <div class="messagesContainer">
    <div class="threadsBox">
      <details class="threadMeta" open="{showMeta}">
        <summary class="font-monospace" on:click|preventDefault={() => showMeta=!showMeta}>
          {thread.title}
          <span class="text-muted">[ {thread?.model?.toUpperCase()} ]</span>
          <span class="text-muted">
            [ Tokens {thread.totalTokens?.toLocaleString() ?? 0} :
            Input {thread.totalInputTokens?.toLocaleString()} :
            Output {thread.totalOutputTokens?.toLocaleString()} ]
          </span>
          {#if thread.onlySendLatest}<span style="position: relative; top: -2px"><SvgIcons iconName="analyze" /></span>{/if}
        </summary>
        <div class="instructionsContainer">
          <div class="instructions">
            <div class="userMessage userMessage0">
              <label for="userMessage0" class="font-monospace messageLabel" data-tokens="" style="cursor: pointer;">Title</label>
              <textarea id="userMessage0" class="font-monospace" rows="10" cols="20" style="height:30px;" autofocus="" placeholder="Enter Title" bind:value={thread.title}></textarea>
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
                  class="font-monospace messageTextArea"
                  rows="5" cols="20"
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
          <div class="form-check form-switch btn btn-link text-decoration-none text-muted text-start">
            <input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault" bind:checked={thread.onlySendLatest}>
            <label class="form-check-label  text-start" for="flexSwitchCheckDefault">Send Latest Only</label>
          </div>
          <span class="btn btn-link text-decoration-none text-muted" style="cursor: default">Input Tokens: {totalInputTokens?.toLocaleString()}</span>
          <span class="btn btn-link text-decoration-none text-muted" style="cursor: default">Output Tokens: {totalOutputTokens?.toLocaleString()}</span>
          <select class="form-select" aria-label="Default select example" bind:value={thread.model}>
            {#each models as model}
              <option value="{model}">{model}</option>
            {/each}
          </select>
          <button class="btn btn-primary updateButton" on:click|preventDefault={(x) =>
            Meteor.call('Threads : Update Thread', thread._id, {..._.omit(thread, ['_id']), updatedAt: Date.now() }, () => {showMeta=false} )}>Update Thread</button>
        </div>
      </details>

      <div class="chatMessages">
        {#each chatMessages as msg}
          <div class="chat-bubble {msg.role === 'user' ? 'sender' : 'responder'}">
            <div class="message-info">
              <span class="role">
                {msg.role === 'user' ? 'You' : 'AI'}, <ChatTime timestamp={msg.updatedAt} />
                {msg.role === 'user' ? '' : ': ' + msg.model?.replace(/-/g, ' ')?.replace(/gpt /i, 'GPT ')?.replace(/turbo/, 'Turbo')}
                {msg.role === 'user' || msg.isHidden ? '' : ': ' + ((msg.content?.match(/\b[-?(\w+)?]+\b/gi) ?? [])?.length?.toLocaleString() ?? '0') + ' Words'}
                {msg.role === 'user' || msg.isHidden ? '' : ': ' + (msg.content?.length?.toLocaleString() ?? '0') + ' Chars'}
              </span>
              <span class="message-info-icons">
                {#if msg.role !== 'user'}<a href="" class="markdown-btn" title="Show Markdown Version" on:click|preventDefault={() => msg.showMarkDown = !msg.showMarkDown}><SvgIcons iconName="{msg.showMarkDown ? 'markdown': 'markdown-off'}" /></a>{/if}
                <a href="" class="delete-btn" title="Delete Message" on:click|preventDefault={() => removeMessage(msg)}><SvgIcons iconName="{ msg.isHidden ? 'eye-closed' : 'eye-14' }" /></a>
                <a href="" class="copy-btn"   title="Copy to clipboard" on:click|preventDefault={() => copyText(msg.content)}><SvgIcons iconName="copy-14" /></a>
                <a href="" class="reuse-btn"  title="Add to Input Box" on:click|preventDefault={() => newContent = msg.content}><SvgIcons iconName="repeat-14" /></a>
                <a href="" class="reuse-btn"  title="Bookmark" on:click|preventDefault={() => bookmarkMessage(msg)}><SvgIcons iconName="{msg.isBookmarked ? 'bookmark-filled' : 'bookmark'}" /></a>
              </span>
            </div>
            <div class="message-content font-monospace {msg.isHidden ? 'isHidden' : ''}"  on:click={() => { if(msg.isHidden) msg.tempShow=!msg.tempShow }}>
              {#if msg.isHidden && !msg.tempShow}
                <span>[Hidden]</span>
              {:else}
                <span>{#if msg.showMarkDown}<pre style="white-space:break-spaces">{msg.content}</pre>{:else} {#await marked.parse(msg.content)}{:then parsedContent}{@html parseMarkdown(parsedContent)}{:catch error}{error}{/await}{/if}</span>
              {/if}
            </div>
              </div>
<!--                {scrollToBottom() ?? ''}-->
        {/each}
      </div>
    </div>
    {#if !showBookmarked}
      <div class="input">
        <textarea class="font-monospace newMessage" placeholder="Enter text" bind:value={newContent} on:keydown={checkForSubmit}></textarea>
        <button class="btn btn-link text-decoration-none text-muted" style="padding: 0" href="#" on:click|preventDefault={newMessage}><SvgIcons iconName="square-rounded-arrow-up" /></button>
      </div>
      {:else}
      <div class="text-center text-muted">Disable bookmark filter for sending new messages.</div>
    {/if}
  </div>
{/if}
