<script>
  import {Route, active} from 'tinro';

  import ThreadMessages from "./Pages/ThreadMessages.svelte";
  import Portfolio from "./Pages/Portfolio.svelte";
  import Main from "./Pages/Main.svelte";
  import SvgIcons from "./Components/SvgIcons.svelte";
  import ThreadsList from "./Pages/ThreadsList.svelte";
  import NewThread from "./Pages/NewThread.svelte";

  import {SettingsCollection} from "../db/DatabaseCollection";
  import TextDiff from "./Pages/TextDiff.svelte";
  import Converter from "./Pages/Converter.svelte";

  let threadHandler = Meteor.subscribe('dynamicQuery', 'SettingsCollection', {type:'UI'})
  let darkMode = true, toggleTheme=(x) => x, toggleBookmarked = (x) => x

  let showBookmarked = false, selectedThread = ''

  $m: {
    let uiSettings = SettingsCollection.findOne({type:'UI'})
    darkMode = uiSettings?.darkMode ?? false
    document.body.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');

    toggleBookmarked = () => showBookmarked = !showBookmarked
    // console.log(showBookmarked)
    toggleTheme = () => {
      Meteor.call('Settings: Update Dark-Mode', !darkMode)
    }
  }

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
    grid-template-columns: 18em auto;
    overflow: hidden;
  }

  .navbar-brand {
    font-weight: 500;
    letter-spacing: 0.05em;
  }
  .separator {
    border-left: 1px solid;
    margin-left: 5px;
    padding-left: 5px;
  }
  .navOptions {
    background: var(--nav-background);
    color: var(--nav-text);
    padding-left: 5px;
    padding-right: 5px;
    border-radius: 3px;
    margin-right: 10px;
  }
  .navOptions li a {
    letter-spacing: 1px;
    color: var(--nav-text);
  }
  .navOptions li:has(.active) {
    /*padding-top: 3px;*/
    /*padding-bottom: 3px;*/
  }
  .navOptions li:has(.active) a {
    color: var(--nav-selected-text);
    background: var(--nav-selected-background);
    line-height: 16px;
    margin-top: 4px;
    border-radius: 3px;
    font-weight: 400;
  }
</style>

<nav class="navbar navbar-expand-lg sticky-top bg-body-tertiary" style="height: 3.5em !important">
  <div class="container-fluid" style="flex-direction: row">
    <a class="navbar-brand" href="/" style="color: rgb(255 76 0)">A.I.</a>
    <span class="navbar-toggler" style=""
          type="button" data-bs-toggle="collapse" data-bs-target="#navbarScroll" aria-controls="navbarScroll" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </span>
    <div class="collapse navbar-collapse" id="navbarScroll">
      <ul class="navbar-nav my-2 my-lg-0 navbar-nav-scroll navOptions" style="--bs-scroll-height: 100px;">
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/new" on:click={() => selectedThread=''}>New Thread</a> </li>
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/textDiff">Text-Diff</a> </li>
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/converter">Convert</a> </li>
        <!--        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/threads">Threads</a> </li>-->
        <!--        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/portfolio">Search</a> </li>-->
      </ul>
      <ul class="d-flex navbar-nav me-auto my-2 my-lg-0 navbar-nav-scroll" style="--bs-scroll-height: 100px;">
        <a class="nav-link" target="_blank" rel="noreferrer" href="https://platform.openai.com/usage">Usage <SvgIcons iconName="arrow-up-right" /> </a>
        <a class="nav-link" target="_blank" rel="noreferrer" href="https://platform.openai.com/docs/api-reference">API Ref <SvgIcons iconName="arrow-up-right" /> </a>
        <a class="nav-link" target="_blank" rel="noreferrer" href="https://chat.openai.com/">Chat GPT <SvgIcons iconName="arrow-up-right" /> </a>
        <a class="nav-link" target="_blank" rel="noreferrer" href="https://gemini.google.com/app">Gemini <SvgIcons iconName="arrow-up-right" /> </a>
        <a class="nav-link" target="_blank" rel="noreferrer" href="https://you.com/">You <SvgIcons iconName="arrow-up-right" /> </a>
      </ul>
      <form class="d-flex" role="search">
        <a href='#' on:click|preventDefault={toggleBookmarked} class="pe-pointer" style="color:{darkMode?'white':'black'}">
          <SvgIcons iconName="{showBookmarked ? 'bookmark-filled-lg' : 'bookmark-lg'}" />
        </a>
        <a href='#' on:click|preventDefault={() => toggleTheme(!darkMode)} class="pe-pointer" style="color:{darkMode?'white':'black'}">
          <SvgIcons iconName="brightness-down" />
        </a>
      </form>
    </div>
  </div>
</nav>
<div class="chatContainer" style="overflow: hidden !important; position: fixed">
  <ThreadsList {showBookmarked} {selectedThread} />
  <div class="threadDetailsContainer">
    <Route path="/" redirect="/new"/>
    <Route path="/threads" let:meta>    {#key meta?.query?.threadId} <ThreadMessages  {models}  {showBookmarked} details={meta} /> {/key}</Route>
    <Route path="/converter" let:meta>  <Converter details={meta} /></Route>
    <Route path="/portfolio" let:meta>  <Portfolio details={meta} /></Route>
    <Route path="/textDiff" let:meta>   <TextDiff details={meta} {models} /></Route>
    <Route path="/new" let:meta>        <NewThread details={meta} {models} /></Route>
    <Route fallback>
      <div  style="text-align: center">
        <h1>404 No page found</h1>
      </div>
    </Route>
  </div>
</div>









