<script>
  import { TasksCollection } from '../../db/TasksCollection';
  export let task;

  const toggleChecked = () => Meteor.call('tasks.setIsChecked', task._id, !task.isChecked);

  const deleteThisTask = () => Meteor.call('tasks.remove', task._id);

</script>


<div class="flex items-start">
  <div class="flex h-5 items-center">
    <input id={task._id} readonly checked={!!task.isChecked} on:click={toggleChecked} type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
  </div>
  <div class="ml-3 text-sm mx-auto">
    <label for={task._id} class="font-medium text-gray-700">{ task.text }</label>
  </div>
  <div class="text-sm mr-2">
    <button class="delete" on:click={deleteThisTask}>🗑</button>
  </div>

<!--  <div class="ml-3 flex h-5 items-center">-->
<!--    <button type="button" class="-m-2 p-2 text-gray-400 hover:text-gray-500 delete" on:click={deleteThisTask}>-->
<!--      <span class="sr-only">Close panel</span>-->
<!--      <svg class="h-4 w-4" x-description="Heroicon name: outline/x-mark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">-->
<!--        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>-->
<!--      </svg>-->
<!--    </button>-->
<!--  </div>-->

</div>


<!--<li>-->
<!--  <input type="checkbox" readonly checked={!!task.isChecked} on:click={toggleChecked} />-->
<!--  <span>{ task.text }</span>-->
<!--  <button class="delete" on:click={deleteThisTask}>&times;</button>-->
<!--</li>-->
