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


const PORT = 5000;

const express = require('express');
const {getTotalPage, getExtensions, egoEmitter} = require('./ego-utils');

let totalPage;
let ego_result;

const app = express();
app.use(express.static('public'));

app.get('/exit', (req, res) => {
  console.log('client wants us to exit');
  res.status(200).send('BYE!');
  server.close();
  process.exit();
});

app.get('/numpage', async (req, res) => {
  try {
    console.log('wow! client wants total page!');
    totalPage = await getTotalPage();
    res.json({'totalPage': totalPage.toString()});
  } catch (error) {
    res.status(500).send(error);
  }  
});

app.get('/run', async (req, res) => {
  try {
    console.log('Starting getExtensions');
    res.json({'requestedPage': totalPage.toString()});
    ego_result = await getExtensions(totalPage);
    console.log('Finished awaiting getExtensions. We got ego_result');
  } catch (error) {
    // res.status(500).send(error);
  }  
});

app.get('/getext', async (req, res) => {
  try {
    console.log('client said getext');
    console.log('EGO_RESULT:', ego_result);
    if (ego_result === undefined) {
      const pageRespondedPromise = new Promise((resolve, reject) => {
        egoEmitter.on('pageResponse', (respondedPage) => resolve(respondedPage));
        egoEmitter.on('pageError', (err) => reject(err));
      });
      const numberOfRespondedPages = await pageRespondedPromise;
      console.log('page responded event emitted:', numberOfRespondedPages);
      res.json({'respondedPage': numberOfRespondedPages});
    } else {
      console.log('Sending finished flag');
      const result = ego_result;
      res.json(result);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

const server = app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));



