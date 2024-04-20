<script>
  export let message

</script>

<style>
  .heroMessage {
    padding: 10em 0;
    margin-top: 1em;
  }
</style>

<div class="relative bg-gray-800 pt-10 pb-10 heroMessage rounded shadow shadow-inner" style="margin:15px">
  <p class="mt-2 text-1xl font-bold tracking-tight black sm:text-4xl items-center text-center">{message}</p>
</div>