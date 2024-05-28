<script>

  import {ThreadsCollection, MessagesCollection} from "../../db/DatabaseCollection";
  import SvgIcons from "../Components/SvgIcons.svelte";
  import {meta} from 'tinro';
  import HeroMessage from "../Components/HeroMessage.svelte";
  import _ from "lodash";
  import M from 'moment'
  // import {marked} from 'marked';

  import markdownit from 'markdown-it'
  import hljs from 'highlight.js';

  const md = markdownit({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {}
      }

      return ''; // use external default escaping
    }
  })


  let inputTokens = 0, lastStatus = ''

  const route = meta();
  export let showBookmarked
  export let details, models

  import { onMount, tick } from 'svelte';
  import {copyText} from "../../api/Utils";
  import ChatTime from "../Components/ChatTime.svelte";
  import SingleChatMessage from "../Components/SingleChatMessage.svelte";

  function Export2Word(HTML, filename = ''){
    let preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    let postHtml = "</body></html>";
    let html = preHtml+HTML+postHtml;

    let blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });

    // Specify link url
    let url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);

    // Specify file name
    filename = filename?filename+'.doc':'document.doc';

    // Create download link element
    let downloadLink = document.createElement("a");

    document.body.appendChild(downloadLink);

    if(navigator.msSaveOrOpenBlob ){
      navigator.msSaveOrOpenBlob(blob, filename);
    }else{
      // Create a link to the file
      downloadLink.href = url;

      // Setting the file name
      downloadLink.download = filename;

      //triggering the function
      downloadLink.click();
    }

    document.body.removeChild(downloadLink);
  }

  async function docx_download(inputText, filename='document') {

    Export2Word(inputText, 'doc.doc')

  }

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
      lastStatus = 'Processing...'
      inputTokens = 0
      Meteor.call('AI: Chat Completion', thread.model, messages, async (err1, aiMsg) => {

        if(!aiMsg?.content) {
          lastStatus = 'Failed'
          console.log(aiMsg)
        }
        thread.totalInputTokens = aiMsg?.prompt_tokens ?? thread.totalInputTokens
        thread.totalOutputTokens = aiMsg?.completion_tokens ?? thread.totalOutputTokens
        thread.totalTokens = aiMsg?.total_tokens ?? thread.totalTokens

        await Meteor.call('Threads : Update Thread', thread._id, { $set: {
            totalInputTokens: aiMsg?.prompt_tokens ?? thread.totalInputTokens,
            totalOutputTokens: aiMsg?.completion_tokens ?? thread.totalOutputTokens,
            totalTokens: aiMsg?.total_tokens ?? thread.totalTokens,
            updatedAt: Date.now() } })

        await Meteor.call('Messages : New Message', thread._id, aiMsg.content, aiMsg.role, thread.model, async () => {
          await tick(); // Ensures the DOM updates with the new message
          scrollToBottom()
          lastStatus = ''
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

    totalOutputTokens = _.chain(thread).get('instructions').filter(x => x.role === 'assistant').map('tokens').compact().sum().value()
    totalInputTokens  = _.chain(thread).get('instructions').filter(x => x.role !== 'assistant').map('tokens').compact().sum().value()
    totalTokens       = _.chain(thread).get('instructions').map('tokens').compact().sum().value()

  }

  $: chatMessages, scrollToBottom();

  function addCopyButtons(html, mid) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const codeBlocks = tempDiv.querySelectorAll('pre code');
    codeBlocks.forEach((block, index) => {
      const copyButton = document.createElement('button');
      copyButton.innerText = 'Copy';
      copyButton.className = 'copy-button';

      const pre = block.parentElement;
      pre.style.position = 'relative';
      pre.appendChild(copyButton);
      let cid = 'code_'+mid+'_'+index
      pre.innerHTML = pre.innerHTML.replace('<code', '<code id="' + cid + '" ')
      pre.innerHTML = pre.innerHTML.replace('<button class="copy-button">Copy</button>', '<button class="copy-button" onclick="copyCodeText(\'' + cid + '\')">Copy</button>')
    });

    return tempDiv.innerHTML;
  }

  function copyRichText(mid) {
    let content = document.getElementById(mid).innerHTML
    content = content.replace(/<h1>/g, '<h1 style="font-size: 20px; margin: 5px 0 10px 0; padding: 0;">')
                     .replace(/<h2>/g, '<h2 style="font-size: 16px; margin: 5px 0 10px 0; padding: 0;">')
                     .replace(/<h3>/g, '<h3 style="font-size: 14px; margin: 5px 0 10px 0; padding: 0;">')

    content = `<div style="font-family: Calibri; font-size: 12px">${content}</div>`
    function listener(e) {
      e.clipboardData.setData("text/html", content);
      e.clipboardData.setData("text/plain", content);
      e.preventDefault();
    }
    document.addEventListener("copy", listener);
    document.execCommand("copy");
    document.removeEventListener("copy", listener);
  }
</script>

<style>
  .messagesContainer {
    padding-bottom: 0;
    margin-bottom: 0;
    grid-template-rows: calc(100vh - 4em - 8em) 8em;
    height: calc(100vh - 4em);
    margin-top: 0px;
    /*overflow: hidden;*/
  }
  .threadMeta {
    background: var(--bs-threadMeta);
    /*margin: 0 10px;*/
    padding: 5px;
    position: absolute;
    border-radius: 5px;
    border: 1px solid var(--bs-threadMetaBorder);
    width: calc(100vw - 18em);
    box-shadow: 5px 2px 10px 0px var(--bs-threadMetaShadow);
    resize: vertical;
    z-index: 1000;
    border-radius: 0px;
    border-width: 2px 0px 0px 0px;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
  }
  .threadMeta summary {
    display: block;
    padding-left: 12px;
  }
  .instructionsContainer {
    height: calc(100vh - 18em);
    max-height: 50%;
    overflow-y: scroll;
    margin-top: 5px;
  }
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
    height: calc(100vh - 11.5em);
    padding: 70px 10px 10px 10px;
    display: flex;
    flex-direction: column;
    /*max-width: 800px; !* or your preferred max width *!*/
    margin: auto;
    border-bottom: 1px solid #d0cfcf;
  }


  .messagesContainer .instructions {
    border: 0;
  }
  .userMessage0 {
    grid-template-rows: 1em 1.5em;
  }

  .secondLabel {
    margin-left: 10px;
    border-left: 1px solid #bfbdbd;
    padding-left: 10px;
  }


</style>

<svelte:head>
  <script>
    function copyCodeText (cid) {
      const textArea = document.createElement('textarea');
      textArea.value = document.getElementById(cid).innerText

      // Avoid scrolling to bottom
      textArea.style.top = '0'; textArea.style.left = '0'; textArea.style.position = 'fixed';

      document.body.appendChild(textArea); textArea.focus(); textArea.select();

      try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        if (!successful) console.log('Fallback: Copying text command was ' + msg);
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);

    }
  </script>
</svelte:head>

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
        {#each chatMessages as msg, idx}
          <SingleChatMessage
            {msg} {idx} {removeMessage} {copyRichText} {copyText} {Export2Word} {bookmarkMessage}
            on:reAsk={(d) => newContent = d.detail ?? '' }
          />
        {/each}
      </div>
    </div>
    {#if !showBookmarked}
      <div class="input">
        <textarea
          class="font-monospace newMessage"
          placeholder="Enter prompt"
          bind:value={newContent}
          on:keydown={checkForSubmit}
          on:keyup={_.debounce(() => Meteor.call('AI: Calculate Tokens', newContent, thread.model, (err, data) => {
            inputTokens = data ?? 0
          }), 1000, {trailing:true, leading:false, maxWait: 1000})}
        ></textarea>
        <button class="btn btn-link text-decoration-none text-muted" style="padding: 0" href="#" on:click|preventDefault={newMessage}><SvgIcons iconName="square-rounded-arrow-up" /></button>
        <span class="status"><span class="label">Input Tokens:</span> {inputTokens}{#if lastStatus}<span class="label secondLabel">Status:</span> {lastStatus}{/if}</span>
      </div>
      {:else}
      <div class="text-center text-muted">Disable bookmark filter for sending new messages.</div>
    {/if}
  </div>
{/if}
