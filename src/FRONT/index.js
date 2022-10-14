/* eslint-disable no-undef */
const API_URL = "http://0.0.0.0:8080";

const modal = document.getElementById("modal");
const modalContent = document.getElementsByClassName('modal-content')[0];
const category = document.getElementById("category");
const question_txt = document.getElementById("question-text");
const questions = document.getElementById("questions");


//used to highligh correct answer
let currentPropositions = [];
let currentTryIndex;
let canPick = false;

function login_jwt() {
    const token = document.getElementById('token').value
    auth(token)
}

function login() {
    const username = document.getElementById('username_login').value
    const pwd = document.getElementById('password_login').value

    fetch(`${API_URL}/login`, {
        method: 'POST', //
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: pwd
        }
        ) // body data type must match "Content-Type" header
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data.token)
            auth(data.token)
        });
}

function signup() {
    const username = document.getElementById('username_signup').value
    const pwd = document.getElementById('password_signup').value

    fetch(`${API_URL}/signup`, {
        method: 'POST', //
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: pwd
        }
        ) // body data type must match "Content-Type" header
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data.token)
            auth(data.token)
        });
}

function auth(token) {
    socket.open()
    socket.emit('auth', token)
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

socket.on('wait', status => {
    //waiting updating status (1/x users)
    modalContent.innerHTML = `
    <div class="modal-top">
    Waiting players : ${status}
    </div>`
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

