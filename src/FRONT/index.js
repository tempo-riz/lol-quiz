/* eslint-disable no-undef */
const API_URL = "http://localhost:8080";

const modal = document.getElementById("modal");
const modalContent = document.getElementById('modal-content');
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


function join() {
    const username = document.getElementById('username').value
    if (username.length > 0) {
        modalContent.innerHTML = `
            <div class="modal-top">Room ID ?</div>
            <input id="room_id" class="modal-input" type="text" required>
            <button class="modal-button" onclick="join2('${username}')">join room</button>`
    } else {
        document.getElementById('username').focus()
    }
}

function join2(username) {
    const room_id = document.getElementById('room_id')
    if (room_id.value.length > 0) {
        socket.open()
        socket.emit('join', username, room_id.value)
    } else {
        document.getElementById('room_id').focus()
    }
}

function create() {
    const username = document.getElementById('username').value
    if (username.length > 0) {
        modalContent.innerHTML = `
            <div class="modal-top">How Many Rounds ?</div>
            <input id="nb_round" class="modal-input" type="number" value=5 required>
            <button class="modal-button" onclick="create2('${username}')">create room</button>`
    } else {
        document.getElementById('username').focus()
    }
}

function create2(username) {
    const nb_round = document.getElementById('nb_round')
    console.log("create2", username, nb_round.value);
    if (nb_round.value > 0) {
        socket.open()
        socket.emit('create', username, nb_round.value)
        console
    } else {
        document.getElementById('nb_round').focus()
    }
}

function pick(i) {
    audio_container.style.visibility = "hidden";
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

function copy(str) {
    navigator.clipboard.writeText(str);
}
socket.on('wait', (players, _isHost, roomId) => {

    if (_isHost) { //so it doesnt reset the host
        isHost = true;
    }
    //waiting updating status (1/x users)
    let html = `<div class="modal-top" onclick="copy('${roomId}')">Room ID: ${roomId} <i class="fa fa-copy"></i></div>`;
    for (let i = 0; i < players.length; i++) {
        html += `<div class="player ${i == 0 ? 'host' : ''}">` + players[i] + `${i == 0 ? ' (host)' : ''}</div>`;
    }
    if (isHost) {
        html += `<button class="start modal-button" onclick="socket.emit('start',false)">Start Game</button>`;
    }
    html += `</div>`;

    modalContent.innerHTML = html;
})

socket.on('error', (msg) => {
    alert(msg);
})

let audio;

function replayAudio() {
    audio.play();
    audio_container.style.visibility = "hidden";

}

socket.on('newTurn', (q, crt, max, players) => {
    sidePanel.style.display = "block";
    audio_container.style.visibility = "hidden";


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
    // socket.close();
    setTimeout(() => {

        modalContent.innerHTML = "";
        score.sort((a, b) => { return b.points - a.points }).forEach(player => {
            modalContent.innerHTML += `<p class="modal-item">${player.username} : ${player.points}</p>`
        });
        modalContent.innerHTML += `<button class="modal-button" onclick="socket.emit('start',true)">Play Again</button>`;
        modal.style.display = "block";
    }, 1000);
})

