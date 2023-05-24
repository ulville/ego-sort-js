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

class ProgressBar {
  constructor(progressWidget, percentageLabel){
    this.progressPercent = 0;
    this.progressWidget = progressWidget;
    this.percentageLabel = percentageLabel;
    this.update();
  }

  update(){
    this.progressWidget.style.width = (this.progressPercent).toFixed().toString() + '%';
    this.percentageLabel.innerHTML = this.progressPercent.toFixed().toString() + '%';
    if (this.progressPercent === 100) {
      this.progressWidget.style.width = undefined;
      this.progressWidget.classList.add('animate');
      this.progressWidget.classList.add('finished');
    }
  }
}

const ProgressBarResponses = new ProgressBar(
  document.getElementById('progress-bar-responds'),
  document.getElementById('percentage-label-responds'));
  
const exitButton = document.getElementById('exit-button');
const loader = document.getElementsByClassName('loader')[0];

let totalPage;

const eventSource = new EventSource('/events');

eventSource.addEventListener('totalPage', (event) => {
  const data = JSON.parse(event.data);
  console.log('id:' , event.lastEventId);
  console.log('event:' , event.type);
  console.log('data:', data);

  loader.style.display = 'none';
  totalPage = data.totalPage;
  document.getElementById('total-page-label').innerHTML = 'Total Page Number:';
  document.getElementById('total-page-num').innerHTML = totalPage;
});

eventSource.addEventListener('respondedPage', (event) => {
  const data = JSON.parse(event.data);
  console.log('id:' , event.lastEventId);
  console.log('event:' , event.type);
  console.log('data:', data);
  
  const respondedPage = parseInt(data.respondedPage);
  const respondedPagePercent = (respondedPage * 100) / parseInt(totalPage);
  ProgressBarResponses.progressPercent = respondedPagePercent;
  ProgressBarResponses.update();
  console.log('responded pages %', respondedPagePercent);
});

eventSource.addEventListener('done', (event) => {
  const data = JSON.parse(event.data);
  console.log('id:' , event.lastEventId);
  console.log('event:' , event.type);
  console.log('data:', data);

  document.getElementById('ranking-label').innerHTML = 'Ranking: ';
  document.getElementById('ranking').innerHTML = data.ranking;
  document.getElementById('extension-num-label').innerHTML = 'Total Extension Number: ';
  document.getElementById('extension-num').innerHTML = data.extensionNumber;
  const logs = data.logs;
  let tableHTML = '<table>';
  tableHTML += '<tr><th>Date</th><th>Ranking</th><th>Total</th></tr>';
  for (let x in logs.reverse()) {
    tableHTML += '<tr><td>' + logs[x].date + '</td><td>' + logs[x].ranking + '</td><td>' + logs[x].total + '</td></tr>';
  }
  tableHTML += '</table>';
  document.getElementById('table-container').innerHTML = tableHTML;
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  const error = JSON.parse(data.error);
  console.error(error);
  document.getElementById('window-content').innerHTML = 
      `<h2>Server-Side Event Error</h2>
      <p>Name: ${error.name}</p>
      <p>Message: ${error.message}</p>
      <textarea rows="10" cols="55">
      ${JSON.stringify(error,undefined, 4).replaceAll('\\n', '\n')}
      </textarea>`;
  eventSource.close();
}); 

function exitServer() {
  console.log('exit button pressed');
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      console.log('exited');
      document.body.innerHTML = '';
    }
  };
  xhttp.open('GET', 'exit', true);
  xhttp.send();
}

exitButton.addEventListener('click', () => {exitServer();});
