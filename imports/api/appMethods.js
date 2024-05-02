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
    // console.log(messages)
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
  'Threads : Duplicate Thread': async (_id) => {
    let NOW = Date.now()
    let EXST = await DB.ThreadsCollection.findOne({_id})
    let oldThreadId = EXST._id
    
    EXST.title = EXST.title + ' (Copy)'
    
    delete EXST._id
    let NEW_ID = await DB.ThreadsCollection.insert({ ...EXST, updatedAt: NOW, createdAt: NOW })
    
    let messages = await DB.MessagesCollection.find({threadId: oldThreadId}, { sort: { index: 1 } }).fetch()
    
    // console.log({OLD_ID:oldThreadId, NEW_ID})
    
    messages = messages.map(x => ({..._.omit(x, ['_id']), threadId: NEW_ID}))
    // console.log('messages', messages.length)
    // console.log(JSON.stringify(messages))
    
    for (let i = 0; i < messages.length; i++) {
      DB.MessagesCollection.insert(messages[i])
    }
  },
  'Threads : Duplicate Instructions': async (_id) => {
    
    let NOW = Date.now()
    let EXST = await DB.ThreadsCollection.findOne({_id})
    
    EXST.title = EXST.title + ' (Copy)'
    delete EXST._id
    let NEW_ID = await DB.ThreadsCollection.insert({ ...EXST, updatedAt: NOW, createdAt: NOW })
    
  },
  'Threads : Get Thread': async (Q) => {
    return DB.ThreadsCollection.findOne(Q) //?.[0]
  },
  'Threads : Update Thread': async (_id, update) => {
    return DB.ThreadsCollection.update({_id}, update)
  },
  'Messages : New Message': async (threadId, content, role, model, onlySendLatest) => {
    let NOW = Date.now()
    
    let newIndex = ( (await DB.MessagesCollection.findOne({threadId}, { sort: { index: -1 } }))?.index ?? 0 ) + 1
    
    await DB.MessagesCollection.insert({ threadId, role, content, model, index: newIndex, updatedAt: NOW, createdAt: NOW }) //?.[0]
    let allMessages = await DB.MessagesCollection.find({threadId, isHidden:{$ne:true}}, { sort: { index: 1 } }).fetch()
    await DB.ThreadsCollection.update({_id: threadId}, { $set: { updatedAt: NOW } })
    return onlySendLatest ? allMessages.slice(-1) : allMessages
  },
  'Messages : Update Message': async (threadId, _id, update) => {
    let NOW = Date.now()
    await DB.MessagesCollection.update({_id}, update)
    
    let count = await DB.MessagesCollection.find({threadId, isBookmarked: true}).count()
    await DB.ThreadsCollection.update({_id: threadId}, { $set: { bookmarkedMessages: count } })
    // console.log(threadId, count)
  },
  'Messages : Remove Message': async (threadId, _id) => {
    await DB.MessagesCollection.remove({_id})
    
    let count = await DB.MessagesCollection.find({threadId, isBookmarked: true}).count()
    await DB.ThreadsCollection.update({_id: threadId}, { $set: { bookmarkedMessages: count } })
  },
  'Settings: Update Dark-Mode': (darkMode) => DB.SettingsCollection.update({type:'UI'}, {$set:{type:'UI', darkMode}}, {upsert: true}),
  'AI: Token Counter': async (data, models) => {
    let response = {}
    for (let i = 0; i < models.length; i++) {
      let B = await callAPI.POST({
        endpoint: 'AI/OpenAI/token_counter?model=' + models[i],
        headers: { 'Content-Type': 'text/plain' },
        data
      })
      // console.log(i, models[i], B.tokens, B)
      response[models[i]] = B.tokens;
    }
    return _.chain(response).toPairs().map(x => ({model: _.startCase(x[0]).replace(/GPT/i, 'GPT').replace(/([0-9]) ([0-9])/gi, '$1.$2'), tokens: x[1]})).value()
  },
})
