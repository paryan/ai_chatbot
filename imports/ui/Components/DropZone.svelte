<script>
  let dragging = false;
  export let files = [], accept = ''
  export let placeholderText = 'Drop files here or click to upload.'
  let fileInput
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function uploadedFiles(list) {
    // console.log(list);
    dispatch('uploadedFiles', list)
  }

  function handleDragOver(event) {
    event.preventDefault();
    dragging = true;
  }

  function handleDragLeave(event) {
    event.preventDefault();
    dragging = false;
  }

  function handleDrop(event) {
    event.preventDefault();
    dragging = false;
    files = event.dataTransfer.files;

    if (accept) files = Array.from(files).filter(file => file.name.endsWith(accept) );

    uploadedFiles(files)
  }
  function handleClick(event) {
    event.preventDefault();
    files = event.target.files
    uploadedFiles(files)
  }
</script>

<style>
  .dropzone {
    padding: 5px;
    border: 2px dashed var(--dropzone-border);
    background-color: var(--dropzone-background);
    text-align: center;
    transition: background-color 0.3s;
    cursor: pointer;
    border-radius: 5px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    /*color: var(--nav-selected-text);*/
  }
  .dragging {
    background-color: var(--dropzone-background-hover);
    color: var(--nav-selected-text);
  }
  .fileUploader {
    display: none;
  }
</style>

<div class="dropzone {dragging ? 'dragging' : ''}"
     on:dragover={handleDragOver}
     on:dragleave={handleDragLeave}
     on:drop={handleDrop}
     on:click={() => fileInput.click()}
>
  <input type="file" class="fileUploader" accept="{accept}" bind:this={fileInput} on:change={handleClick}>
  {@html placeholderText}
</div>
