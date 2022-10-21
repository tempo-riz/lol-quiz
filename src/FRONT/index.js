/* eslint-disable no-undef */
const API_URL = "http://localhost:8080";

const modal = document.getElementById("modal");
const modalContent = document.getElementsByClassName('modal-content')[0];
// const category = document.getElementById("category");
const question_txt = document.getElementById("question-text");
const questions = document.getElementById("questions");
const sidePanel = document.getElementById("side-panel");
const round = document.getElementById("round");
const score = document.getElementById("score");
const audio_container = document.getElementById("audio_container");


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
    console.log("pick", i);
    canPick = false;
    currentTryIndex = i
    socket.emit('pick', currentPropositions[i])
    audio_container.style.visibility = "hidden";

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
    let html = `<div class="modal-top"> Waiting for host to start the game </div>`;

    for (let i = 0; i < players.length; i++) {
        html += `<div class="player ${i == 0 ? 'host' : ''}">` + players[i] + `${i == 0 ? '(host)' : ''}</div>`;
    }
    if (isHost) {
        html += `<button class="start modal-button" onclick="socket.emit('start')">Start Game</button>`;
    }
    html += `</div>`;

    modalContent.innerHTML = html;
})

let audio;

function replayAudio() {
    audio.play();
    audio_container.style.visibility = "hidden";

}

socket.on('newTurn', (q, crt, max, players) => {
    sidePanel.style.display = "block";

    console.log(q.type);
    if (q.type == "Voiceline" || q.type == "Sfx") {
        //stop previous audio
        if (audio) {
            audio.pause();
        }
        audio = new Audio(q.src);
        audio.onended = () => {
            audio_container.style.visibility = "visible";
            // audio_container.onclick = replayAudio
        }
        setTimeout(() => {
            audio.play()
        }, 1500);
    }

    //wait before next round (to know if try was correct or not)
    setTimeout(() => {

        canPick = true;
        modal.style.display = "none";
        round.innerHTML = `${crt} of ${max}`;


        // category.innerHTML = q.type;
        question_txt.innerHTML = q.question;
        questions.innerHTML = '';

        for (let i = 0; i < q.propositions.length; i++) {

            questions.innerHTML += `
            <div class="card" id="card${i}" onclick="pick('${i}')">
                <h3 class="title">${q.propositions[i]}</h3>
            </div>`
        }
        currentPropositions = q.propositions;
        score.innerHTML = '';
        for (const p of players) {
            score.innerHTML += `<div class="player-score" id="user_${p.username}">${p.username} : ${p.points}</div>`;
        }

    }, 1000);
});

socket.on('result', (result, username) => {
    //highligh correct green
    document.getElementById("card" + currentPropositions.indexOf(result.correct)).style.borderColor = "green";

    //and wrong red
    if (result.wrong) {
        document.getElementById("card" + currentPropositions.indexOf(result.wrong)).style.borderColor = "red";
        document.getElementById("user_" + username).style.borderColor = "red";

    } else {
        document.getElementById("user_" + username).style.borderColor = "green";

    }
})

socket.on('gameOver', score => {
    socket.close();
    setTimeout(() => {

        modalContent.innerHTML = "";
        score.sort((a, b) => { return b.points - a.points }).forEach(player => {
            modalContent.innerHTML += `<p class="modal-item">${player.username} : ${player.points}</p>`
        });
        modal.style.display = "block";
    }, 1000);
})

