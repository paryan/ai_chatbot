import {Meteor} from "meteor/meteor";
import {check} from "meteor/check";
import { TasksCollection } from '../db/TasksCollection';

Meteor.methods({
  'tasks.insert' (text) {
    check(text, String);

    TasksCollection.insert({ text, createdAt: new Date() })
  },

  'tasks.remove' (taskId) {
    check(taskId, String);

    TasksCollection.remove(taskId);
  },

  'tasks.setIsChecked' (taskId, isChecked) {
    check(taskId, String);
    check(isChecked, Boolean);

    TasksCollection.update(taskId, { $set: { isChecked } });
  }
})
