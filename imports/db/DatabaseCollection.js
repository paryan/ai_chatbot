import { Mongo } from 'meteor/mongo';

export const TasksCollection = new Mongo.Collection('tasks');
export const ResumesCollection = new Mongo.Collection('Resumes');
export const ThreadsCollection = new Mongo.Collection('Threads');
export const MessagesCollection = new Mongo.Collection('Messages');
