<script>

  import {ThreadsCollection} from "../../db/DatabaseCollection";
  import SvgIcons from "../Components/SvgIcons.svelte";
  const M = require('moment')
  import {router} from 'tinro';
  export let showBookmarked

  let isLoading = true, threads = [], threadCount = 0
  let Q = {isArchived:{$ne:true}}

  let threadHandler = Meteor.subscribe('dynamicQuery', 'ThreadsCollection', Q)

  $m: {
    if (showBookmarked) Q = {isArchived:{$ne:true}, bookmarkedMessages: {$gt:0}}
    else Q = {isArchived:{$ne:true}}

    isLoading = !threadHandler.ready();
    threads = ThreadsCollection.find( Q, { sort: { updatedAt:-1, createdAt: -1 } } ).fetch();
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
    grid-template-rows: auto 2em; /* Set the height for the top, middle, and bottom rows */
    grid-template-columns: 1fr;   /* Two columns, each taking half of the width */
    grid-template-areas:
    "threads"
    "threadCount";
    height: calc(100vh - 3.5em); /* Adjust the height as needed, here it's set to fill the viewport */
    gap: 10px; /* Optional: Adds space between grid rows and columns */
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
  }

  /* Styling to improve visibility and layout aesthetics */
  .thread-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 5px 0;
    padding: 5px;
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


</style>

<div class="threadsContainer">
  <div class="threads">
    {#each threads as thread}
      <div class="thread-meta" style="cursor: pointer;">
        <div class="thread-content text-decoration-none" on:click={() => router.goto('/threads?threadId=' + thread._id)}>
          <div class="thread-title text-truncate">{thread?.title ?? 'New Chat'}</div>
          <div class="thread-ts">
            {M(thread.updatedAt, 'x').format('MM/DD/YY')} :
            {M(thread.updatedAt, 'x').fromNow(true)} :
            {thread.model?.replace(/GPT[\-]*/i, 'v').replace('-turbo', '-T')}
            {#if thread.bookmarkedMessages}
              : <SvgIcons iconName="bookmark-filled" /> {thread.bookmarkedMessages.toLocaleString()}
            {/if}
          </div>
        </div>
        <div class="dropdown">
          <span class="dropdown-toggle noAfter" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="padding:0; margin: 0; "><SvgIcons iconName="dots-vertical" /></span>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" on:click|preventDefault={() => Meteor.call('Threads : Duplicate', thread._id)}>Duplicate</a></li>
            <li><a class="dropdown-item" href="#" on:click|preventDefault={() => Meteor.call('Threads : Update Thread', thread._id, {$set:{isArchived: true}})}>Archive</a></li>
<!--            <li><a class="dropdown-item" href="#">Rename</a></li>-->
<!--            <li><a class="dropdown-item" href="#">Delete</a></li>-->
          </ul>
        </div>
<!--        <div class="thread-options"><SvgIcons iconName="dots-vertical" /></div>-->
      </div>
    {/each}
  </div>
  <div class="threadCount text-muted text-center" style="font-size: .9rem;">{threadCount.toLocaleString()} Threads</div>
</div>
