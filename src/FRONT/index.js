/* eslint-disable no-undef */
const API_URL = "http://localhost:8080";

const modal = document.getElementById("modal");
const modalContent = document.getElementsByClassName('modal-content')[0];
const category = document.getElementById("category");
const question_txt = document.getElementById("question-text");
const questions = document.getElementById("questions");


//used to highligh correct answer
let currentPropositions = [];
let currentTryIndex;
let canPick = false;


function login() {
    const username = document.getElementById('username').value
    if (username.length > 0) {
        socket.open()
        socket.emit('join', username)
    } else {
        document.getElementById('username').focus()
    }
}



function pick(i) {
    if (!canPick) {
        return;
    }
    canPick = false;
    currentTryIndex = i
    socket.emit('pick', currentPropositions[i])
}

const socket = io(API_URL, {
    autoConnect: false,
    transports: ['websocket']
});

socket.on('invalid', err => {
    alert(err);
})

var isHost = false;

socket.on('wait', (players, _isHost) => {

    if (_isHost) { //sd it doesnt reset the host
        isHost = true;
    }
    //waiting updating status (1/x users)
    let html = `
    <div class="modal-top">
    Waiting for host to start the game`;

    for (let i = 0; i < players.length; i++) {
        html += `<div class="player ${i == 0 ? 'host' : ''}">` + players[i] + `${i == 0 ? '(host)' : ''}</div>`;
    }
    if (isHost) {
        //create a button dom element and add it to the html
        const button = document.createElement('button');
        button.innerHTML = 'Start Game';
        button.classList.add('modal-button');
        button.onclick = () => {
            socket.emit('start');
        }
        html += button.outerHTML;


    }
    html += `</div>`;

    modalContent.innerHTML = html;
})

socket.on('newTurn', q => {

    //wait before next round (to know if try was correct or not)
    setTimeout(() => {
        canPick = true;
        modal.style.display = "none";

        category.innerHTML = q.category;
        question_txt.innerHTML = q.text;
        questions.innerHTML = '';

        for (let i = 0; i < q.propositions.length; i++) {

            questions.innerHTML += `
            <div class="card" id="card${i}" onclick="pick('${i}')">
                <h3 class="title">${q.propositions[i]}</h3>
            </div>`
        }
        currentPropositions = q.propositions;

    }, 1000);
});

socket.on('result', result => {
    //highligh correct green
    document.getElementById("card" + currentPropositions.indexOf(result.correct)).style.borderColor = "green";
    //and wrong red
    if (result.wrong) {
        document.getElementById("card" + currentPropositions.indexOf(result.wrong)).style.borderColor = "red";
    }
})

socket.on('gameOver', score => {
    modalContent.innerHTML = "";
    score.sort((a, b) => { return b.points - a.points }).forEach(player => {
        modalContent.innerHTML += `<p class="modal-item">${player.username} : ${player.points}</p>`
    });
    modal.style.display = "block";
    socket.close();
})

