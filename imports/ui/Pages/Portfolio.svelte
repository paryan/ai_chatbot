<script>
  import {meta} from 'tinro';
  const route = meta();
  export let details
  console.log(details)
</script>

<h1>Portfolio introduction</h1>
<h1>My URL is {route.url}!</h1>
<h1>My URL is {$route.url}!</h1>
<h1>My URL is {details.url}!</h1>
