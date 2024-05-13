<script>
  export let message

</script>

<style>
  .heroMessage {
    padding: 10em 0;
    margin-top: 1em;
    /*width: 100%;*/
    font-size: 24px;
    font-weight: 500;
    letter-spacing: 1px;
  }
</style>

<div class="relative bg-gray-800 pt-10 pb-10 heroMessage rounded" style="margin:15px">
  <p class="mt-2 text-1xl font-bold tracking-tight black sm:text-4xl items-center text-center">{message}</p>
</div>
