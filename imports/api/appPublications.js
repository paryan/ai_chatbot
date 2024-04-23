import { Meteor } from 'meteor/meteor';
import DB from '/imports/db/DatabaseCollection';

Meteor.publish('tasks', function publishTasks() {
  return DB.TasksCollection.find();
});

Meteor.publish('dynamicQuery', (collectionName, query = {}, options = {}) => {
  return DB[collectionName].find(query, options)
})

