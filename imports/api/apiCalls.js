import axios  from 'axios';
const OS = require('os')
import _ from 'lodash';

module.exports = {
  POST: async ({endpoint, headers={}, data} ={}) => {
    try {
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://' + OS.hostname +  ':3010/' + endpoint,
        headers,
        data : data
      }
      
      let response = await axios.request(config)
      return response.data
      
    } catch (e) {
      console.log(e);
    }
  },
  GET: async ({endpoint, headers={}} ={}) => {
    try {
      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://' + OS.hostname +  ':3010/' + endpoint,
        headers
      };
      let response = await axios.request(config)
      return response.data
    } catch (e) {
      console.log(e);
    }
  }
}
