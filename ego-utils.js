// Copyright 2022 Ulvican Kahya

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const axios = require('axios').default;
axios.defaults.timeout = 15000;
const EventEmitter = require('events');
const fs = require('fs').promises;
let options = require('./options.json');
let respondedPage = 0;

const egoEmitter = new EventEmitter(); 

const saveAsLog = async (newResult) => {
  try {
    newResult.ranking = newResult.ranking.toString();
    newResult.total = newResult.total.toString();
    const logFile = await fs.readFile('./logs.json', 'utf8');
    let logs = JSON.parse(logFile);
    if (logs[logs.length -1].date !== newResult.date || logs[logs.length -1].ranking !== newResult.ranking || logs[logs.length -1].total !== newResult.total ) {
      logs.push(newResult);
      fs.writeFile('./logs.json', JSON.stringify(logs, null, '    '));
    }
    return Promise.resolve(logs);
  } catch (error){
    console.log(error);
    return Promise.reject(error);
  }
};

const getTotalPage = async () => {
  try {
    options.params.page = 1;
    const response = await axios.request(options);
    const totalPage = parseInt(response.data.numpages);
    console.log('Total Page:', totalPage);
    return Promise.resolve(totalPage);
  } catch (error) {
    console.error(error);
    console.log(error.name, error.message);
    return Promise.reject(error);
  }
};

const getPage = async (page) => {
  try {
    options.params.page = page;
    
    const response = await axios.request(options);
    respondedPage++;
    let ranking;
    const extensions = response.data['extensions'];
    for (let i = 0; i < extensions.length; i++) {
      const extension = extensions[i];
      if (extension['name'] === 'EasyEffects Preset Selector') {
        ranking = ((page - 1) * Number(options.params.n_per_page)) + i + 1;
      }
    }
    console.log('Page responded:', response.config.params.page, 
      'page count:', respondedPage);
    egoEmitter.emit('pageResponse', respondedPage);
    return Promise.resolve({'ranking': ranking, 'extNumOnPage': extensions.length});
  } catch (error) {
    egoEmitter.emit('error', error);
    return Promise.reject(error);
  }
};

const getExtensions = async (totalPage) => {
  let tasks = [];
  for (let i = 1; i < totalPage + 1; i++) {
    console.log(`sending ego request for page ${i} and adding it to tasks array`);
    tasks.push(getPage(i));
  }
  return Promise.all(tasks)
    .then(async (values) => {
      console.log('All pages responded!');
      const ranking = values.find(value => value.ranking).ranking;
      let totalExtensionNum = 0;
      values.forEach(val => {
        totalExtensionNum += val.extNumOnPage;
      });
      let result = {'extensionNumber': totalExtensionNum, 'ranking': ranking, 'respondedPage': respondedPage, 'finished': 'yes'};
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString() > 9 ? now.getMonth() + 1 : '0' + (now.getMonth() + 1).toString();
      const day = now.getDate().toString() > 9 ? now.getDate() : '0' + now.getDate().toString();
      const date = year + '-' + month + '-' + day;
      const newLogEntry = {date, ranking, 'total': totalExtensionNum};
      console.log('newLogEntry:', newLogEntry);
      try {
        const logs = await saveAsLog(newLogEntry);
        result['logs'] = logs;
        console.log(result);
        console.log(logs);
        return Promise.resolve(result);
        
      } catch (error) {
        egoEmitter.emit('error', error);
        return Promise.reject(error);        
      }

    }).catch((error) => {
      console.error(error);
      console.log(error.name, error.message);
      return Promise.reject(error);
    }).finally(() => {respondedPage = 0;});
};

// getTotalPage().then(x => getExtensions(x)).catch(x => console.log(x));

module.exports = {getTotalPage, getPage, getExtensions, egoEmitter};

