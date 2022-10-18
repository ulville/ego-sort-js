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

const ProgressBarRequests = new ProgressBar(
  document.getElementById('progress-bar-requests'), 
  document.getElementById('percentage-label-requests')); 
const ProgressBarResponses = new ProgressBar(
  document.getElementById('progress-bar-responds'),
  document.getElementById('percentage-label-responds'));
let totalPage;

const exitButton = document.getElementById('exit-button');

function getTotalPage() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      const res = JSON.parse(this.response);
      console.log(res);
      totalPage = res.totalPage;
      document.getElementById('total-page-label').innerHTML = 'Total Page Number:';
      document.getElementById('total-page-num').innerHTML = totalPage;
      pollForRemoteResponses('run');
    }
    else if (this.readyState == 4 && this.status != 200){
      const err = JSON.parse(this.response);
      console.log(err);
      document.getElementById('window-content').innerHTML = 
      `<h2>${this.status} ${this.statusText}</h2>
      <p>Name: ${err.name}</p>
      <p>Message: ${err.message}</p>
      <textarea rows="10" cols="55">
      ${JSON.stringify(err)}
      </textarea>`;
    }
  };
  xhttp.open('GET', 'numpage', true);
  xhttp.send();
}
function pollForRemoteResponses(query) {

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      const res = JSON.parse(this.response);
      console.log(res);
      if (res.respondedPage) {
        const respondedPage = parseInt(res.respondedPage);
        const respondedPagePercent = (respondedPage * 100) / parseInt(totalPage);
        ProgressBarResponses.progressPercent = respondedPagePercent;
        ProgressBarResponses.update();
        console.log('responded pages %', respondedPagePercent);
        
      } else if (res.requestedPage) {
        const requestedPage = parseInt(res.requestedPage);
        const requestedPagePercent = (requestedPage * 100) / parseInt(totalPage);
        ProgressBarRequests.progressPercent = requestedPagePercent;
        ProgressBarRequests.update();
        console.log('requested page %', requestedPagePercent);
      }
      if (!res.finished) {
        pollForRemoteResponses('getext');
      } 
      else 
      {
        document.getElementById('ranking-label').innerHTML = 'Ranking: ';
        document.getElementById('ranking').innerHTML = res.ranking;
        document.getElementById('extension-num-label').innerHTML = 'Total Extension Number: ';
        document.getElementById('extension-num').innerHTML = res.extensionNumber;
        const logs = res.logs;
        let tableHTML = '<table border=\'1\'>';
        tableHTML += '<tr><th>Date</th><th>Ranking</th><th>Total</th></tr>';
        for (let x in logs) {
          tableHTML += '<tr><td>' + logs[x].date + '</td><td>' + logs[x].ranking + '</td><td>' + logs[x].total + '</td></tr>';
        }
        tableHTML += '</table>';
        document.getElementById('table-container').innerHTML = tableHTML;
      }
    }
    else if (this.readyState == 4 && this.status != 200){
      const err = JSON.parse(this.response);
      console.log(err);
      document.getElementById('window-content').innerHTML = 
      `<h2>${this.status} ${this.statusText}</h2>
      <p>Name: ${err.name}</p>
      <p>Message: ${err.message}</p>
      <textarea rows="10" cols="55">
      ${JSON.stringify(err)}
      </textarea>`;
    }
  };
  xhttp.open('GET', query, true);
  xhttp.send();
}

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
getTotalPage();

// eslint-disable-next-line no-unused-vars
// let demo = () => {let stahp1 = false;
//   let stahp2 = false;
//   let count1 = 0;
//   let count2 = 0;
//   const myInterval1 = setInterval(() => {
//     if (!stahp1) {
//       count1 ++;
//       ProgressBarRequests.progressPercent = count1;
//       ProgressBarRequests.update();
//       console.log('count1', count1);
//       if (count1 >= 100) {
//         count1 = 0;
//         stahp1 = true;
//         clearInterval(myInterval1);
//         const myInterval2 = setInterval(() => {
//           if (!stahp2) {
//             count2 ++;
//             ProgressBarResponses.progressPercent = count2;
//             ProgressBarResponses.update();
//             console.log('count2', count2);
//             if (count2 >= 100) {
//               count2 = 0;
//               stahp2 = true;
//               clearInterval(myInterval2);
//             }
//           }
//           console.log('myInterval2', myInterval2);
//         }, 60);
//       }
//     }
//     console.log('myInterval1', myInterval1);
//   }, 60);};


// demo();