import {Meteor} from "meteor/meteor";
const _ = require('lodash')
const DB = require('../db/DatabaseCollection');

const callAPI = require('./apiCalls')

Meteor.methods({
  'tasks.insert' (text) {
    check(text, String);

    DB.TasksCollection.insert({ text, createdAt: new Date() })
  },

  'tasks.remove' (taskId) {
    check(taskId, String);
    
    DB.TasksCollection.remove(taskId);
  },

  'tasks.setIsChecked' (taskId, isChecked) {
    check(taskId, String);
    check(isChecked, Boolean);
    
    DB.TasksCollection.update(taskId, { $set: { isChecked } });
  },
  'AI: Calculate Tokens': async (data, model) => {
    return (await callAPI.POST({
      endpoint: 'AI/OpenAI/token_counter?model=' + model,
      headers: { 'Content-Type': 'text/plain' },
      data
    }))?.tokens ?? 0
  },
  'AI: Chat Completion': async (model, messages) => {
    return (await callAPI.POST({
      endpoint: 'AI/OpenAI/chat',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({model, messages})
    }))
  },
  'Threads : New Thread': async (record) => {
    let NOW = Date.now()
    return DB.ThreadsCollection.insert({ ...record, updatedAt: NOW, createdAt: NOW }) //?.[0]
  },
  'Threads : Get Thread': async (Q) => {
    return DB.ThreadsCollection.findOne(Q) //?.[0]
  },
  'Threads : Update Thread': async (_id, update) => {
    return DB.ThreadsCollection.update({_id}, update)
  },
  'Messages : New Message': async (threadId, content, role, model) => {
    let NOW = Date.now()
    
    let newIndex = ( (await DB.MessagesCollection.findOne({threadId}, { sort: { index: -1 } }))?.index ?? 0 ) + 1
    
    await DB.MessagesCollection.insert({ threadId, role, content, model, index: newIndex, updatedAt: NOW, createdAt: NOW }) //?.[0]
    let allMessages = await DB.MessagesCollection.find({threadId}, { sort: { index: 1 } }).fetch()
    await DB.ThreadsCollection.update({_id: threadId}, { $set: { updatedAt: NOW } })
    return allMessages
  },
  'Messages : Remove Message': (_id) => DB.MessagesCollection.remove({_id}),
})
