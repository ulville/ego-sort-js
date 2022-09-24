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
let options = require('./options.json');
let respondedPage = 0;

const egoEmitter = new EventEmitter(); 

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

// ihtiyacım olanlar: Anlık lazım{1- Kaç sayfa cevap verdi}, 2- ranking kaç, 3- extension sayısı,  

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
    egoEmitter.emit('pageError', error);
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
    .then((values) => {
      console.log('All pages responded!');
      const ranking = values.find(value => value.ranking).ranking;
      let totalExtensionNum = 0;
      values.forEach(val => {
        totalExtensionNum += val.extNumOnPage;
      });
      const result = {'extensionNumber': totalExtensionNum, 'ranking': ranking, 'respondedPage': respondedPage, 'finished': 'yes'};
      console.log(result);
      return Promise.resolve(result);

    }).catch((error) => {
      console.error(error);
      console.log(error.name, error.message);
      return Promise.reject(error);
    }).finally(() => {respondedPage = 0;});
};

// getTotalPage().then(x => getExtensions(x)).catch(x => console.log(x));

module.exports = {getTotalPage, getPage, getExtensions, egoEmitter};

