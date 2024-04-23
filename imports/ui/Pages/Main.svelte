<script>
  import Task from '../Components/Task.svelte';
  import { TasksCollection } from '../../db/DatabaseCollection';
  import TaskForm from "../Components/TaskForm.svelte";

  let incompleteCount, pendingTasksTitle = '', tasks = [], isLoading = true, hideCompleted = false

  const setHideCompleted = (value) => { hideCompleted = value }
  const hideCompletedFilter = { isChecked: { $ne: true } };

  const handler = Meteor.subscribe('dynamicQuery', 'TasksCollection', {}, {});

  $m: {
    isLoading = !handler.ready();
    const pendingOnlyFilter = { ...hideCompletedFilter };
    tasks = TasksCollection.find(
      hideCompleted ? pendingOnlyFilter : {},
      { sort: { createdAt: -1 } }
    ).fetch();

    incompleteCount = TasksCollection.find(hideCompletedFilter).count();
    pendingTasksTitle = `${ incompleteCount ? ` (${incompleteCount})` : '' }`;
  }

</script>

<div class="">
  <header>
    <div class="app-bar">
      <div class="app-header">

        <div class="main">
          <TaskForm />

          <div class="filter">
            <button on:click={() => setHideCompleted(!hideCompleted)}>
              {hideCompleted ? 'Show All' : 'Hide Completed'}
            </button>
          </div>

          {#if isLoading}
            <div class="loading">loading...</div>
          {/if}

          <ul class="tasks">
            {#each tasks as task (task._id)}
              <Task task={task} />
            {/each}
          </ul>
        </div>

      </div>
    </div>
  </header>
</div>



