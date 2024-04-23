<script>
  import {meta} from 'tinro';
  const route = meta();
  export let details
  console.log(details)
</script>
<style>
  code {
    display: block;
  }
</style>
<h1>Portfolio introduction</h1>
<pre>{JSON.stringify({details, $route, route}, '', '    ')}</pre>
