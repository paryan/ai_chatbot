<script>
  import DropZone from "../Components/DropZone.svelte";
  import _ from "lodash"

  let inputText = ''
  let markdown = ''
  let selectInput = 'upload'
  import pretty from 'pretty'
  import mammoth from "mammoth"
  let fileInput, selectedFiles = []

  import {copyText} from "../../api/Utils";

  import TurndownService from 'turndown';
  const turndownService = new TurndownService({emDelimiter: '*'});
  import SvgIcons from "../Components/SvgIcons.svelte";
  import {onMount} from "svelte";

  onMount(() => { document.title = 'AI - Convert HTML to Markdown'; });

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

  let convert = () => {
    inputText = pretty(inputText)
    markdown = turndownService.turndown(inputText)

    // Meteor.call('convertToMarkdown', inputText, (err, data) => {
    //   markdown = data
    // })
  }
  let debounced = _.debounce(convert, 200, {trailing:true, leading:false, maxWait: 300})


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
  right: 10px;
  top: 10px;
  color: #0a8560;
  /*color: white;*/
  cursor: pointer;
  line-height: 1;
  text-transform: uppercase;
  padding: 4px 5px 3px 5px;
  font-size: 12px;
  letter-spacing: 1px;
  border-radius: 3px;
}
.copyButton:hover {
  background: #0a8560;
  color: white;
}
pre:focus-visible {
  outline: none;
}
</style>

<div class="convertContainer">

  <textarea name="" id="" cols="30" rows="10" bind:value={inputText} on:keyup={debounced} placeholder="Input text here..."></textarea>
  <pre contenteditable="true"><div class="copyButton" on:click={() => copyText(markdown)}><SvgIcons iconName="copy-14" /></div>{markdown}</pre>
  <div class="buttonRow"><DropZone bind:files={selectedFiles} on:uploadedFiles={(event) => parseWordDocxFile({target: {files: event.detail}})} accept=".docx" /></div>

</div>
