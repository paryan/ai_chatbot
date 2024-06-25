<script>
  import {copyText} from "../../api/Utils";
  import SvgIcons from "./SvgIcons.svelte";

  import markdownit from 'markdown-it'
  import hljs from 'highlight.js';
  import ChatTime from "./ChatTime.svelte";

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  function reAsk() { dispatch('reAsk', msg.content) }

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

  export let msg = {}, idx,
    removeMessage = (x) => x,
    copyRichText = (x) => x,
    Export2Word = (x) => x,
    bookmarkMessage = (x) => x

  let newContent

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

</script>

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

<style>
  .chat-bubble {
    display: grid;
    grid-template-columns: 50px auto;
    /*background: #efefef;*/
    gap: 10px;
    padding: 10px;
  }
  .chat-bubble:hover {
    border-radius: 5px;
    background: var(--ai_chat_background-hover);
  }
  .chat-bubble:hover .message-options {
    box-shadow: var(--ai_chat_options_shadow);
  }
  .chat-bubble:hover .message-options * {
    color: var(--ai_chat_options_color-hover);
  }
  .user-icon {
    width: 50px;
    height: 50px;
    background-color: #ccc;
    border-radius: 5px;
    background-image: url('/userIcon.png');
    background-size: contain;
  }
  .user-icon-ai {
    background-image: url('/aiIcon.png');
    background-size: contain;
  }
  .message-container {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1.75em auto;
  }
  .message-header {
    display: grid;
    grid-template-columns: 1fr auto;
    position: relative;
    font-weight: 600;
  }
  .message-info {
    font-size: 12px;
  }
  .message-info .role {
    font-size: 16px;
  }
  .message-info .remaining {
    color: rgb(128 128 128);
    font-weight: 500;
    margin-left: 0.5em;
  }
  .message-info .remaining .subInfo {
    color: rgb(128 128 128);
    font-weight: 400;
    margin-left: .5em;
  }
  .message-content {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    /*border-top: 1px solid #e6e1e1;*/
    /*padding-top: 3px;*/
    /*margin-top: 5px;*/
  }
  .message-options {
    text-align: right;
    position: absolute;
    right: -6px;
    top: -7px;
    display: flex;
    width: 13em;
    justify-content: space-between;
    /*background: white;*/
    line-height: 1;
    padding: 2px 10px 5px 10px;
    border-radius: 5px;

  }
  .message-options * {
    color: var(--ai_chat_options_color);
  }
  .message-options.user-options {
    width: 9em;
  }
  .isHidden {
    cursor: pointer;
  }

</style>


<div class="chat-bubble">
  <div class="user-icon {msg.role === 'user' ? 'user-icon-user' : 'user-icon-ai' }" >

  </div>
  <div class="message-container">
    <div class="message-header">
      <div class="message-info">
        <span class="role">{msg.role === 'user' ? 'You' : msg.role === 'user' ? '' : msg.model?.replace(/-/g, ' ')?.replace(/gpt /i, 'GPT ')?.replace(/turbo/, 'Turbo')}</span>
        <span class="remaining">
          <ChatTime timestamp={msg.updatedAt} hideAgo = {false} />
          {#if msg.role !== 'user'}
            <span class="subInfo">
              [
                {msg.role === 'user' || msg.isHidden ? '' : ((msg.content?.match(/\b[-?(\w+)?]+\b/gi) ?? [])?.length?.toLocaleString() ?? '0') + ' Words'}
                {msg.role === 'user' || msg.isHidden ? '' : ': ' + (msg.content?.length?.toLocaleString() ?? '0') + ' Chars'}
              ]
            </span>
          {/if}
        </span>
      </div>
      <div class="message-options {msg.role === 'user' ? 'user-options' : ''}">
        {#if msg.role !== 'user'}<a href="#" class="markdown-btn" data-flow="top" data-tooltip="Show Markdown Version" on:click|preventDefault={() => msg.showMarkDown = !msg.showMarkDown}><SvgIcons iconName="{msg.showMarkDown ? 'markdown': 'markdown-off'}" /></a>{/if}
        <a href="" class="hide-btn"   data-flow="top" data-tooltip="Hide Message"   on:click|preventDefault={() => removeMessage(msg)}><SvgIcons iconName="{ msg.isHidden ? 'eye-closed' : 'eye-14' }" /></a>
        <a href="" class="copy-rich"  data-flow="top" data-tooltip="Copy Rich Text" on:click|preventDefault={() => copyRichText('messageId-'+ idx)}><SvgIcons iconName="blockquote-14" /></a>
        <a href="" class="copy-btn"   data-flow="top" data-tooltip="Copy Raw Text"  on:click|preventDefault={() => copyText(msg.content)}><SvgIcons iconName="copy-14" /></a>
        <a href="" class="dnld-btn"   data-flow="top" data-tooltip="Download .Doc"  on:click|preventDefault={() => Export2Word(md.render(msg.content))}><SvgIcons iconName="file-type-doc-14" /></a>
        <a href="" class="reuse-btn"  data-flow="top" data-tooltip="Ask Again"      on:click|preventDefault={() => reAsk(msg.content)}><SvgIcons iconName="repeat-14" /></a>
        <a href="" class="reuse-btn"  data-flow="left" data-tooltip="Bookmark"       on:click|preventDefault={() => bookmarkMessage(msg)}><SvgIcons iconName="{msg.isBookmarked ? 'bookmark-filled' : 'bookmark'}" /></a>

      </div>
    </div>
    <div class="message-content font-monospace" id="messageId-{idx}"  on:click={() => { if(msg.isHidden) msg.tempShow=!msg.tempShow }}>
      {#if msg.isHidden && !msg.tempShow}
        <span class="{msg.isHidden || !msg.tempShow ? 'isHidden' : ''}">[Hidden]</span>
      {:else}
        <span class="{msg.showMarkDown ? '' : 'markdown-body'} {msg.isHidden && msg.tempShow ? 'isHidden' : ''}">
          {#if msg.showMarkDown}
            <pre style="white-space:break-spaces">{msg.content}</pre>
          {:else}
            {@html addCopyButtons(md.render(msg.content), 'messageId-'+ idx)}
          {/if}
        </span>
      {/if}
    </div>
  </div>
</div>
