import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import App from "../imports/ui/App.svelte"
import NotFound from "../imports/ui/Pages/NotFound.svelte"

// Create index route
FlowRouter.route('/', {
  name: 'index',
  action() {
    // Do something here
    // After route is followed
    this.render('App');
  }
});

// Create 404 route (catch-all)
FlowRouter.route('*', {
  action() {
    // Show 404 error page
    this.render('NotFound');
  }
});
