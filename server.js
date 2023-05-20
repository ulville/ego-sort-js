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

// TODO: Listen for emitted errors globally and act in a middleware
const sseChunk = (event, data) => {
  let sseId = (new Date()).getTime();
  return `id: ${sseId}\nevent: ${event}\ndata: ${data}\n\n`;
};

app.get('/events', async function(req, res) {
  console.log('Got /events');
  try {
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive'
    });
    res.flushHeaders();
  
    console.log('Starting... getTotalPage()');
    totalPage = await getTotalPage();
    res.write(sseChunk('totalPage', JSON.stringify({'totalPage': totalPage.toString()})));
    egoEmitter.on('pageResponse', (rP) => {
      res.write(sseChunk('respondedPage', JSON.stringify({'respondedPage': rP})));
    });
    const callback = (error) => {
      egoEmitter.removeListener('error', callback);
      throw error;
    };
    egoEmitter.on('error', callback);
    ego_result = await getExtensions(totalPage);
    res.end(sseChunk('done', JSON.stringify(ego_result)));
  } catch (error) {
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(Error.prototype).concat(Object.getOwnPropertyNames(new Error)), 4)
      .replace('\\n', '\n'));
    res.end(sseChunk('error', JSON.stringify({'error': JSON.stringify(
      error, Object.getOwnPropertyNames(Error.prototype).concat(Object.getOwnPropertyNames(new Error)), 4)})));
  }
});

app.get('/exit', (req, res) => {
  console.log('client wants us to exit');
  res.status(200).send('BYE!');
  server.close();
  process.exit(0);
});

const server = app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
