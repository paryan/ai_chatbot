<script>
  import {Route, active} from 'tinro';

  import Contacts from "./Pages/Contacts.svelte";
  import Portfolio from "./Pages/Portfolio.svelte";
  import Main from "./Pages/Main.svelte";
  import SvgIcons from "./Components/SvgIcons.svelte";

  let pendingTasksTitle = ''

  let darkMode = true;

  function toggleTheme() {
    darkMode = !darkMode;
    document.body.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
  }
  toggleTheme()

</script>

<style>
  :global(.active){font-weight: bold; text-decoration: underline}
  a {outline : none}
</style>

<nav class="navbar navbar-expand-lg sticky-top bg-body-tertiary">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">Utils</a>
    <span class="navbar-toggler" style=""
          type="button" data-bs-toggle="collapse" data-bs-target="#navbarScroll" aria-controls="navbarScroll" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </span>
    <div class="collapse navbar-collapse" id="navbarScroll">
      <ul class="navbar-nav me-auto my-2 my-lg-0 anavbar-nav-scroll" style="--bs-scroll-height: 100px;">
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/todos">To Dos</a> </li>
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/contacts">Contacts</a> </li>
        <li class="nav-item"> <a class="nav-link" exact use:active active-class="active" href="/portfolio">Portfolio</a> </li>

        <!--        <li class="nav-item dropdown">-->
        <!--          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">-->
        <!--            Link-->
        <!--          </a>-->
        <!--          <ul class="dropdown-menu">-->
        <!--            <li><a class="dropdown-item" href="#">Action</a></li>-->
        <!--            <li><a class="dropdown-item" href="#">Another action</a></li>-->
        <!--            <li><hr class="dropdown-divider"></li>-->
        <!--            <li><a class="dropdown-item" href="#">Something else here</a></li>-->
        <!--          </ul>-->
        <!--        </li>-->
        <!--        <li class="nav-item"> <a class="nav-link disabled" aria-disabled="true">Link</a> </li>-->
      </ul>
      <form class="d-flex" role="search">
        <a href='#' on:click|preventDefault={toggleTheme} class="pe-pointer" style="color:{darkMode?'white':'black'}">
          <SvgIcons iconName="brightness-down" />
        </a>
      </form>
    </div>
  </div>
</nav>

<Route path="/" redirect="/todos"/>
<Route path="/todos">               <Main /></Route>
<Route path="/portfolio" let:meta>  <Portfolio details={meta} /></Route>
<Route path="/contacts" let:meta>   <Contacts /></Route>
<Route fallback>
  <div  style="text-align: center">
    <h1>404 No page found</h1>
  </div>
</Route>






