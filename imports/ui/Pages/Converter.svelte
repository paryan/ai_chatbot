<script>
  import DropZone from "../Components/DropZone.svelte";
  import _ from "lodash"

  let inputText = ''
  let markdown = ''
  let isRendered = false
  let selectInput = 'upload'
  import pretty from 'pretty'
  import mammoth from "mammoth"
  let fileInput, selectedFiles = []

  import {copyText} from "../../api/Utils";

  import TurndownService from 'turndown';
  const turndownService = new TurndownService({emDelimiter: '*'});
  import SvgIcons from "../Components/SvgIcons.svelte";
  import {onMount} from "svelte";

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


  onMount(() => { document.title = 'AI - Convert HTML to Markdown'; });

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

  function parseWordDocxFile(inputElement) {
    let files = inputElement?.target?.files || [];
    if (!files.length) return;
    let file = files[0];

    let reader = new FileReader();
    reader.onloadend = function(event) {
      let arrayBuffer = reader.result;

      mammoth.convertToHtml({arrayBuffer: arrayBuffer}).then(function (resultObject) {
        inputText = pretty(resultObject.value)
        selectInput = 'paste'
        markdown = turndownService.turndown(inputText)
      })

      // mammoth.convertToMarkdown({arrayBuffer: arrayBuffer}).then(function (resultObject) {
      //   markdown = resultObject.value
      //   // console.log(resultObject.value)
      // })
    };
    reader.readAsArrayBuffer(file);
  }

  let convertToMarkDown = () => {
    inputText = pretty(inputText)
    markdown = turndownService.turndown(inputText)
  }
  let convertToHTML = () => inputText = pretty(md.render(markdown))
  let debounced2MD = _.debounce(convertToMarkDown, 200, {trailing:true, leading:false, maxWait: 300})
  let debounced2HTML = _.debounce(convertToHTML, 200, {trailing:true, leading:false, maxWait: 300})

  $m:{
    // console.log(selectedFiles)
  }
</script>

<style>
.convertContainer {
  display: grid;
  grid-template-rows: auto 3em;
  grid-template-columns: repeat(2, 1fr);
  height: calc(100vh - 3.5em);
  padding: 10px;
  gap: 10px;
  width: calc(100vw - 18em);
  position: relative;
}
.convertContainer textarea {
  border: 1px solid grey;
  border-radius: 5px;
  padding: 10px;
  background: var(--bs-textarea);
}
.convertContainer pre {
  margin: 0;
  padding: 10px;
  white-space: break-spaces;
  border: 1px solid grey;
  border-radius: 5px;
  background: var(--converter-output);
  position: relative;
}
.buttonRow {
  grid-column-end: span 2;
  /*background: #0a8560;*/
  text-align: center;
}
::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 7px;
}

::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: rgba(0, 0, 0, .5);
  box-shadow: 0 0 1px rgba(255, 255, 255, .5);
}
.copyButton {
  position: absolute;
  right: 20px;
  top: 15px;
  color: #0a8560;
  /*color: white;*/
  cursor: pointer;
  line-height: 1;
  text-transform: uppercase;
  padding: 4px 5px 3px 5px;
  font-size: 12px;
  letter-spacing: 1px;
  border-radius: 3px;
  z-index: 100;
}
.copyButton:hover {
  background: #0a8560;
  color: white;
}
.docDownload {
  color: #0a5285;
  right: 45px;
}
.docDownload:hover {
  background: #0a5285;
  color: white;
}
.renderHtml {
  color: #a23f0b;
  right: 70px;
}
.renderHtml:hover {
  background: #a23f0b;
  color: white;
}
pre:focus-visible {
  outline: none;
}
.markdownBox {
  position: relative;
}
.renderBox {
  overflow-y: scroll;
  background: #fffbfb;
  border: 2px solid #c8c8c899;
  border-radius: 3px;
  padding: 10px;
}
</style>

<div class="convertContainer">
  {#if markdown}
    <div class="copyButton renderHtml {isRendered ? 'text-white' : ''}" style="background: {isRendered ? '#a23f0b' : ''}" on:click|preventDefault={() => {
      isRendered=!isRendered
    }}><SvgIcons iconName="html-14" /></div>
    <div class="copyButton docDownload" on:click|preventDefault={() => Export2Word(md.render(markdown))}><SvgIcons iconName="file-type-doc-14" /></div>
    <div class="copyButton" on:click={() => copyText(markdown)}><SvgIcons iconName="copy-14" /></div>
  {/if}
  <textarea name="" id="" cols="30" rows="10" bind:value={inputText} on:keyup={debounced2MD} placeholder="Input html here..."></textarea>
  {#if !isRendered}
  <textarea class="markdownBox" on:keyup={debounced2HTML} bind:value={markdown} placeholder="Input markdown here..."></textarea>
  {:else}
  <div class="renderBox">{@html inputText}</div>
  {/if}
  <div class="buttonRow"><DropZone placeholderText="Drop .docx files here or click to upload." bind:files={selectedFiles} on:uploadedFiles={(event) => parseWordDocxFile({target: {files: event.detail}})} accept=".docx" /></div>

</div>
