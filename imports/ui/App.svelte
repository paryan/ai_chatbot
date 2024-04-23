<script>
  import {Route, active} from 'tinro';

  import ThreadMessages from "./Pages/ThreadMessages.svelte";
  import Portfolio from "./Pages/Portfolio.svelte";
  import Main from "./Pages/Main.svelte";
  import SvgIcons from "./Components/SvgIcons.svelte";
  import Threads from "./Pages/Threads.svelte";
  import NewThread from "./Pages/NewThread.svelte";

  let darkMode = true;

  function toggleTheme(value) {
    darkMode = value;
    document.body.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
  }
  toggleTheme(true)

  let models = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']

</script>

<style>
  :global(.active){
    font-weight: bold;
    /*text-decoration: underline;*/
    text-decoration: none;
  }
  a {outline : none}
  .navbar-toggler, .navbar-toggler:focus, .navbar-toggler:active {
    border: 0 !important;
  }
  .chatContainer {
    display: grid;
    grid-template-columns: 15em auto;
  }

</style>

<nav class="navbar navbar-expand-lg sticky-top bg-body-tertiary" style="height: 3.5em !important">
  <div class="container-fluid" style="flex-direction: row">
    <a class="navbar-brand" href="#">AI Chat</a>
    <span class="navbar-toggler" style=""
          type="button" data-bs-toggle="collapse" data-bs-target="#navbarScroll" aria-controls="navbarScroll" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </span>
    <div class="collapse navbar-collapse" id="navbarScroll">
      <ul class="navbar-nav me-auto my-2 my-lg-0 anavbar-nav-scroll" style="--bs-scroll-height: 100px;">
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/new">New Thread</a> </li>
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/threads">Threads</a> </li>
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/portfolio">Resume</a> </li>
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/portfolio">Search</a> </li>
      </ul>
      <form class="d-flex" role="search">
        <a href='#' on:click|preventDefault={() => toggleTheme(!darkMode)} class="pe-pointer" style="color:{darkMode?'white':'black'}">
          <SvgIcons iconName="brightness-down" />
        </a>
      </form>
    </div>
  </div>
</nav>
<div class="chatContainer">
  <Threads />
  <div class="threadDetailsContainer">
    <Route path="/" redirect="/new"/>
    <Route path="/threads" let:meta>    {#key meta?.query?.threadId} <ThreadMessages  {models}  details={meta} /> {/key}</Route>
    <Route path="/portfolio" let:meta>  <Portfolio details={meta} /></Route>
    <Route path="/new" let:meta>        <NewThread details={meta} {models} /></Route>
    <Route fallback>
      <div  style="text-align: center">
        <h1>404 No page found</h1>
      </div>
    </Route>
  </div>
</div>









