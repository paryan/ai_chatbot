<script>
  import moment from 'moment';
  import { onMount, onDestroy } from 'svelte';

  export let timestamp;  // Pass the timestamp as a prop
  export let hideAgo = true

  let fromNow;
  let interval;

  function updateFromNow() {
    fromNow = moment(new Date(timestamp)).fromNow(hideAgo);
  }

  onMount(() => {
    updateFromNow();  // Initialize the relative time
    interval = setInterval(updateFromNow, 60000);  // Update every minute
  });

  onDestroy(() => {
    clearInterval(interval);  // Clear interval when component is destroyed
  });
</script>

<span>{fromNow}</span>
