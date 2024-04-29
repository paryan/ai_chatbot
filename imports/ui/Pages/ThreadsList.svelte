<script>

  import {ThreadsCollection} from "../../db/DatabaseCollection";
  import SvgIcons from "../Components/SvgIcons.svelte";
  const M = require('moment')
  import {router, Route} from 'tinro';
  export let showBookmarked

  export let selectedThread //= document.baseURI?.replace(/.*\/threads\?threadId=(.*)/, '$1')

  let isLoading = true, threads = [], threadCount = 0

  // let fromNow = (x) => M(new Date(x)).fromNow(true)

  $m: {
    let Q = {isArchived:{$ne:true}}
    let options = { sort: { isPinned: -1, updatedAt:-1, createdAt: -1 } }

    // fromNow = (x) => M(new Date(x)).fromNow(true)

    // selectedThread = document.baseURI?.replace(/.*\/threads\?threadId=(.*)/, '$1')
    let threadHandler = Meteor.subscribe('dynamicQuery', 'ThreadsCollection', Q, options)

    if (showBookmarked) Q = {isArchived:{$ne:true}, bookmarkedMessages: {$gt:0}}
    else Q = {isArchived:{$ne:true}}

    isLoading = !threadHandler.ready();
    threads = ThreadsCollection.find( Q, options ).fetch();
    threads = threads.map(x => ({...x, fromNow: M(x.updatedAt, 'x').fromNow(true)?.match(/seconds/) ? 'Now' : M(x.updatedAt, 'x').fromNow(true) }))
    threadCount = threads.length
  }

</script>

<style>
  :root{
    --thread-content-width: 15em;
  }
  .chatContainer {
    display: grid;
    grid-template-columns: 10em auto;
  }
  .threadsContainer {
    display: grid;
    grid-template-rows: auto 3em; /* Set the height for the top, middle, and bottom rows */
    grid-template-columns: 1fr;   /* Two columns, each taking half of the width */
    grid-template-areas:
    "threads"
    "threadCount";
    height: calc(100vh - 3.5em); /* Adjust the height as needed, here it's set to fill the viewport */
    /*gap: 10px; !* Optional: Adds space between grid rows and columns *!*/
    backdrop-filter: brightness(1.5);
    border-right: var(--bs-threads-border);
  }

  .newThread {
    grid-area: newThread; /* Assigning the grid area */
  }

  .resumes {
    grid-area: resumes; /* Assigning the grid area */
  }

  .threads {
    grid-area: threads; /* Assigning the grid area to take all available space */
    overflow-y: auto; /* Adds scrolling to this section if the content overflows */
  }

  .threadCount {
    grid-area: threadCount; /* Assigning the grid area */
    width: 100%; /* Ensures it stretches across the bottom */
    border-top: var(--bs-threads-border);
    /*padding-top: 6px;*/
    background: var(--bs-threads-background);
    height: 3.5em;
    display: flex;
    align-items: center; /* Vertically centers the child elements */
    justify-content: center; /* Optionally centers horizontally as well */
    user-select: none;
  }

  /* Styling to improve visibility and layout aesthetics */
  .thread-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    /*margin: 5px 0;*/
    padding: 8px 5px;
    font-size: 14px;
    border-bottom: 1px solid rgba(128, 128, 128, 0.24);
  }

  .thread-content {
    display: flex;
    flex-direction: column;
    width: var(--thread-content-width);
    min-width: var(--thread-content-width);
    max-width: var(--thread-content-width);
  }

  .thread-options {
    /* Adjust this as necessary for your icons */
  }
  .thread-ts {
    font-size: 80%;
  }

  .selectedThread {
    background-color: var(--bs-selected-thread);
    font-weight: 600;
  }

</style>

<div class="threadsContainer">
  <div class="threads">
    {#each threads as thread}
      <div class="thread-meta {selectedThread === thread._id ? 'selectedThread' : ''}" style="cursor: pointer;">
        <div class="thread-content text-decoration-none" on:click={() => {
          selectedThread = thread._id
          router.goto('/threads?threadId=' + thread._id)
        }}>
          <div class="thread-title text-truncate">{thread?.title ?? 'New Chat'}</div>
          <div class="thread-ts">
            {M(thread.createdAt, 'x').format('MM/DD/YY')} :
            { thread.fromNow } :
            {thread.model?.replace(/GPT[\-]*/i, 'v').replace('-turbo', '-T')}
            {#if thread.bookmarkedMessages}
              : <SvgIcons iconName="bookmark-filled" /> {thread.bookmarkedMessages.toLocaleString()}
            {/if}
            {#if thread.onlySendLatest}<span style="position: relative; top: -2px"><SvgIcons iconName="analyze-14" /></span>{/if}
            {#if thread.isPinned}<span style="position: relative; top: -2px"><SvgIcons iconName="pinned-filled-14" /></span>{/if}
          </div>
        </div>
        <div class="dropdown">
          <span class="dropdown-toggle noAfter" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="padding:0; margin: 0; "><SvgIcons iconName="dots-vertical" /></span>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" on:click|preventDefault={() => Meteor.call('Threads : Update Thread', thread._id, {[thread.isPinned ? '$unset' : '$set']:{isPinned: true}})}>{thread.isPinned ? 'Unpin' : 'Pin To Top'}</a></li>
            <li><a class="dropdown-item" href="#" on:click|preventDefault={() => Meteor.call('Threads : Duplicate Instructions', thread._id)}>Duplicate Instructions Only</a></li>
            <li><a class="dropdown-item" href="#" on:click|preventDefault={() => Meteor.call('Threads : Duplicate Thread', thread._id)}>Duplicate Thread</a></li>
            <li><a class="dropdown-item" href="#" on:click|preventDefault={() => Meteor.call('Threads : Update Thread', thread._id, {$set:{isArchived: true}})}>Archive</a></li>
          </ul>
        </div>
<!--        <div class="thread-options"><SvgIcons iconName="dots-vertical" /></div>-->
      </div>
    {/each}
  </div>
  <span class="threadCount text-muted text-center align-middle" style="font-size: .9rem;">{threadCount.toLocaleString()} Threads</span>
</div>
