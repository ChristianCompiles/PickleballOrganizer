// Initialize local storage if doesn't exist
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify({}));
}

// DOM Elements
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const welcomeMessage = document.getElementById('welcome-message');
const playerNameInput = document.getElementById('player-name');
const skillLevelSelect = document.getElementById('skill-level');
const addPlayerBtn = document.getElementById('add-player-btn');
const playersList = document.getElementById('players-list');
const presentPlayersList = document.getElementById('present-players');
const vacantPlayersList = document.getElementById('vacant-players');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Current user state
let currentUser = null;

// Tab functionality
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to current tab and content
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        // If switching to court tab, refresh the columns
        if (tabId === 'court-tab') {
            displayColumnPlayers();
        }
    });
});

// Login functionality
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    
    if (!users[username]) {
        alert('User not found.');
        return;
    }
    
    if (users[username].password !== password) {
        alert('Incorrect password.');
        return;
    }
    
    currentUser = username;
    welcomeMessage.textContent = `Welcome, ${username}!`;
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    
    // Initialize columns if not present
    initializeUserData();
    
    // Load player data
    displayPlayers();
    
    // Clear form
    usernameInput.value = '';
    passwordInput.value = '';
});

// Register functionality
registerBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    
    if (users[username]) {
        alert('Username already exists.');
        return;
    }
    
    // Create new user with initialized data structure
    users[username] = {
        password: password,
        players: [],
        columns: {
            present: [],
            vacant: []
        },
        courts: [], // Initialize courts array
        allMatchesFinished: false // Track if all matches are finished
    };
    
    // Save to local storage
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Registration successful! You can now log in.');
    usernameInput.value = '';
    passwordInput.value = '';
});

// Initialize user data structure if needed
function initializeUserData() {
    const users = JSON.parse(localStorage.getItem('users'));
    
    // Add columns property if it doesn't exist
    if (!users[currentUser].columns) {
        users[currentUser].columns = {
            present: [],
            vacant: []
        };
    }

    // Add courts array if it doesn't exist
    if (!users[currentUser].courts) {
        users[currentUser].courts = [];
    }
    
    // Add allMatchesFinished property if it doesn't exist
    if (users[currentUser].allMatchesFinished === undefined) {
        users[currentUser].allMatchesFinished = false;
    }

    localStorage.setItem('users', JSON.stringify(users));
}

// Logout functionality
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    appContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
});

// Add player functionality
addPlayerBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    const skillLevel = skillLevelSelect.value;
    
    if (!playerName) {
        alert('Please enter a player name.');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    
    // Add new player
    const newPlayer = {
        name: playerName,
        skillLevel: skillLevel,
        id: Date.now() // Simple unique ID
    };
    
    users[currentUser].players.push(newPlayer);
    
    // Also add to present column by default
    users[currentUser].columns.present.push(newPlayer.id);
    
    // Save to local storage
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update display
    displayPlayers();
    
    // Clear input
    playerNameInput.value = '';
});

// Display players
function displayPlayers() {
    playersList.innerHTML = '';
    
    const users = JSON.parse(localStorage.getItem('users'));
    const players = users[currentUser].players;
    
    if (players.length === 0) {
        playersList.innerHTML = '<p class="empty-message">No players added yet.</p>';
        return;
    }
    
    players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        playerItem.innerHTML = `
            <div class="player-info">
                <span>${player.name}</span>
                <span class="skill-level">${player.skillLevel}</span>
            </div>
            <button class="remove-btn action-btn" data-id="${player.id}">Remove</button>
        `;
        
        playersList.appendChild(playerItem);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const playerId = parseInt(e.target.getAttribute('data-id'));
            deletePlayer(playerId);
        });
    });
}

// Display players in columns
function displayColumnPlayers() {
    presentPlayersList.innerHTML = '';
    vacantPlayersList.innerHTML = '';
    
    const users = JSON.parse(localStorage.getItem('users'));
    const players = users[currentUser].players;
    const presentIds = users[currentUser].columns.present;
    const vacantIds = users[currentUser].columns.vacant;
    
    // Helper function to get player by ID
    const getPlayerById = (id) => players.find(player => player.id === id);
    
    // Display present players
    if (presentIds.length === 0) {
        presentPlayersList.innerHTML = '<p class="empty-message">No players present.</p>';
    } else {
        // Add King of Hill controls if we have enough players
        if (presentIds.length >= 4) {
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'koth-controls';
            
            // Check if all matches are finished to show proper button
            const allFinished = checkAllMatchesFinished();
            
            controlsDiv.innerHTML = `
                <div class="court-management">
                    <div class="court-input-group">
                        <label for="num-courts">Number of Courts:</label>
                        <input type="number" id="num-courts" min="1" max="10" value="${users[currentUser].courts.length || 1}">
                    </div>
                    <button id="setup-courts-btn" class="action-btn">Setup Courts</button>
                    <button id="create-teams-btn" class="action-btn">Create Balanced Teams</button>
                    ${allFinished ? '<button id="create-next-round-btn" class="action-btn">Create Next Round</button>' : ''}
                </div>
            `;
            presentPlayersList.appendChild(controlsDiv);

            // Add event listeners
            setTimeout(() => {
                document.getElementById('setup-courts-btn').addEventListener('click', setupCourts);
                document.getElementById('create-teams-btn').addEventListener('click', createBalancedTeams);
                
                if (allFinished) {
                    document.getElementById('create-next-round-btn').addEventListener('click', createNextRound);
                }
            }, 0);
        }

        // Display courts if they exist
        if (users[currentUser].courts && users[currentUser].courts.length > 0) {
            displayCourts();
        } else {
            // Just display present players as usual
            presentIds.forEach(playerId => {
                const player = getPlayerById(playerId);
                if (player) {
                    const playerItem = document.createElement('div');
                    playerItem.className = 'player-item';
                    
                    playerItem.innerHTML = `
                        <div class="player-info">
                            <span>${player.name}</span>
                            <span class="skill-level">${player.skillLevel}</span>
                        </div>
                        <button class="move-right-btn action-btn" data-id="${player.id}">Move to Vacant</button>
                    `;
                    
                    presentPlayersList.appendChild(playerItem);
                }
            });
        }
    }
    
    // Display vacant players
    if (vacantIds.length === 0) {
        vacantPlayersList.innerHTML = '<p class="empty-message">No players in vacant.</p>';
    } else {
        vacantIds.forEach(playerId => {
            const player = getPlayerById(playerId);
            if (player) {
                const playerItem = document.createElement('div');
                playerItem.className = 'player-item';
                
                playerItem.innerHTML = `
                    <div class="player-info">
                        <span>${player.name}</span>
                        <span class="skill-level">${player.skillLevel}</span>
                    </div>
                    <button class="move-left-btn action-btn" data-id="${player.id}">Move to Present</button>
                `;
                
                vacantPlayersList.appendChild(playerItem);
            }
        });
    }
    
    // Add event listeners for move buttons
    document.querySelectorAll('.move-right-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const playerId = parseInt(e.target.getAttribute('data-id'));
            movePlayer(playerId, 'present', 'vacant');
        });
    });
    
    document.querySelectorAll('.move-left-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const playerId = parseInt(e.target.getAttribute('data-id'));
            movePlayer(playerId, 'vacant', 'present');
        });
    });
}

// Setup courts based on number input
function setupCourts() {
    const numCourts = parseInt(document.getElementById('num-courts').value);
    if (isNaN(numCourts) || numCourts < 1) {
        alert('Please enter a valid number of courts.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users'));
    const presentIds = users[currentUser].columns.present;
    
    // Need at least 4 players to create courts
    if (presentIds.length < 4) {
        alert('Need at least 4 players to set up courts.');
        return;
    }

    // Initialize courts array
    users[currentUser].courts = Array(numCourts).fill(null).map((_, index) => ({
        courtNumber: index + 1,
        team1: [],
        team2: [],
        winner: null,
        status: 'waiting' // waiting, playing, finished
    }));
    
    // Reset all matches finished flag
    users[currentUser].allMatchesFinished = false;

    localStorage.setItem('users', JSON.stringify(users));
    displayColumnPlayers();
}

// Create balanced teams based on skill levels
function createBalancedTeams() {
    const users = JSON.parse(localStorage.getItem('users'));
    const players = users[currentUser].players;
    const presentIds = users[currentUser].columns.present;
    const presentPlayers = presentIds.map(id => players.find(p => p.id === id))
                                    .filter(p => p !== undefined);
    
    if (presentPlayers.length < 4) {
        alert('Need at least 4 players to create teams.');
        return;
    }

    // Sort players by skill level
    presentPlayers.sort((a, b) => parseFloat(b.skillLevel) - parseFloat(a.skillLevel));
    
    // Create teams with balanced skill distribution
    const teams = [];
    for (let i = 0; i < Math.floor(presentPlayers.length / 2); i++) {
        const team = [
            presentPlayers[i],
            presentPlayers[presentPlayers.length - 1 - i]
        ];
        teams.push(team);
    }

    // Assign teams to courts
    const courts = users[currentUser].courts;
    if (!courts || courts.length === 0) {
        alert('Please set up courts first.');
        return;
    }

    // Reset all courts
    courts.forEach(court => {
        court.team1 = [];
        court.team2 = [];
        court.winner = null;
        court.status = 'waiting';
    });

    // Assign teams to courts (as many as we can fill)
    for (let i = 0; i < Math.min(courts.length, Math.floor(teams.length / 2)); i++) {
        courts[i].team1 = teams[i*2].map(player => player.id);
        courts[i].team2 = teams[i*2+1].map(player => player.id);
        courts[i].status = 'playing';
    }
    
    // Reset all matches finished flag
    users[currentUser].allMatchesFinished = false;

    // Save to local storage
    localStorage.setItem('users', JSON.stringify(users));
    displayColumnPlayers();
}

// Check if all active matches are finished
function checkAllMatchesFinished() {
    const users = JSON.parse(localStorage.getItem('users'));
    const courts = users[currentUser].courts;
    
    if (!courts || courts.length === 0) {
        return false;
    }
    
    // Find all courts that have teams playing
    const activeCourts = courts.filter(court => 
        court.team1.length > 0 && court.team2.length > 0);
    
    if (activeCourts.length === 0) {
        return false;
    }
    
    // Check if all active courts have finished their matches
    const allFinished = activeCourts.every(court => court.status === 'finished');
    
    // Update the flag in user data
    users[currentUser].allMatchesFinished = allFinished;
    localStorage.setItem('users', JSON.stringify(users));
    
    return allFinished;
}

// Create next round of games with winning teams AND losing teams
function createNextRound() {
    const users = JSON.parse(localStorage.getItem('users'));
    const courts = users[currentUser].courts;
    const players = users[currentUser].players;
    
    // Collect all winning teams and losing teams
    const winningTeams = [];
    const losingTeams = [];
    
    courts.forEach(court => {
        if (court.status === 'finished' && court.winner !== null) {
            const winningTeam = court.winner === 0 ? court.team1 : court.team2;
            const losingTeam = court.winner === 0 ? court.team2 : court.team1;
            
            if (winningTeam.length === 2) {
                winningTeams.push({
                    courtNumber: court.courtNumber,
                    players: winningTeam
                });
            }
            
            if (losingTeam.length === 2) {
                losingTeams.push({
                    courtNumber: court.courtNumber,
                    players: losingTeam
                });
            }
        }
    });
    
    // Need at least 2 winning teams to create matches for winners
    if (winningTeams.length < 2) {
        alert('Need at least 2 winning teams to create the next round.');
        return;
    }
    
    // Sort teams by court number for predictable assignment
    winningTeams.sort((a, b) => a.courtNumber - b.courtNumber);
    losingTeams.sort((a, b) => a.courtNumber - b.courtNumber);
    
    // Reset all courts first
    courts.forEach(court => {
        court.team1 = [];
        court.team2 = [];
        court.winner = null;
        court.status = 'waiting';
    });
    
    // Helper function to create teams with split teammates
    function createTeamsWithSplitTeammates(teams, startCourtIndex) {
        if (teams.length < 2) return;
        
        // Create arrays to hold each position from the teams
        const playerPosition1 = [];
        const playerPosition2 = [];
        
        // Split each team into positions
        teams.forEach(team => {
            playerPosition1.push(team.players[0]);
            playerPosition2.push(team.players[1]);
        });
        
        // Helper function to shuffle array
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        
        // Shuffle each position group separately
        shuffleArray(playerPosition1);
        shuffleArray(playerPosition2);
        
        // Assign to courts - each player from position1 gets paired with a player from position2
        let courtIndex = startCourtIndex;
        for (let i = 0; i < Math.floor(teams.length / 2); i++) {
            if (courtIndex < courts.length) {
                // First court gets 2 players from position1 and 2 players from position2
                courts[courtIndex].team1 = [playerPosition1[i*2], playerPosition2[i*2]];
                courts[courtIndex].team2 = [playerPosition1[i*2+1], playerPosition2[i*2+1]];
                courts[courtIndex].status = 'playing';
                courtIndex++;
            }
        }
    }
    
    // Determine how many courts to use for winners vs losers
    const totalCourts = courts.length;
    const winnerCourts = Math.min(Math.floor(winningTeams.length / 2), totalCourts);
    
    // Assign winner teams to first set of courts
    createTeamsWithSplitTeammates(winningTeams, 0);
    
    // Assign loser teams to next set of courts
    if (losingTeams.length >= 2) {
        createTeamsWithSplitTeammates(losingTeams, winnerCourts);
    }
    
    // Reset all matches finished flag
    users[currentUser].allMatchesFinished = false;
    
    // Save to local storage
    localStorage.setItem('users', JSON.stringify(users));
    displayColumnPlayers();
}

// Display courts with teams
function displayCourts() {
    const users = JSON.parse(localStorage.getItem('users'));
    const players = users[currentUser].players;
    const courts = users[currentUser].courts;
    
    const courtsContainer = document.createElement('div');
    courtsContainer.className = 'courts-container';
    
    // Helper function to get player by ID
    const getPlayerById = (id) => players.find(player => player.id === id);
    
    // Function to display team
    const displayTeam = (teamIds) => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team';
        
        teamIds.forEach(playerId => {
            const player = getPlayerById(playerId);
            if (player) {
                const playerSpan = document.createElement('span');
                playerSpan.className = 'team-player';
                playerSpan.innerHTML = `${player.name} <span class="skill-level">${player.skillLevel}</span>`;
                teamDiv.appendChild(playerSpan);
            }
        });
        
        return teamDiv;
    };
    
    courts.forEach((court, index) => {
        const courtDiv = document.createElement('div');
        courtDiv.className = `court ${court.status}`;
        courtDiv.innerHTML = `<h3>Court ${court.courtNumber}</h3>`;
        
        const matchDiv = document.createElement('div');
        matchDiv.className = 'match';
        
        // Team 1
        if (court.team1.length > 0) {
            const team1Div = displayTeam(court.team1);
            team1Div.classList.add('team1');
            matchDiv.appendChild(team1Div);
            
            // vs
            const vsDiv = document.createElement('div');
            vsDiv.className = 'vs';
            vsDiv.textContent = 'vs';
            matchDiv.appendChild(vsDiv);
            
            // Team 2
            const team2Div = displayTeam(court.team2);
            team2Div.classList.add('team2');
            matchDiv.appendChild(team2Div);
            
            courtDiv.appendChild(matchDiv);
            
            // Controls if match is in progress
            if (court.status === 'playing') {
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'court-controls';
                controlsDiv.innerHTML = `
                    <div class="winner-controls">
                        <button class="team1-win-btn action-btn" data-court="${index}">Team 1 Wins</button>
                        <button class="team2-win-btn action-btn" data-court="${index}">Team 2 Wins</button>
                    </div>
                `;
                courtDiv.appendChild(controlsDiv);
            }
            
            // Show winner if match is finished
            if (court.status === 'finished' && court.winner !== null) {
                const winnerDiv = document.createElement('div');
                winnerDiv.className = 'winner-announcement';
                winnerDiv.innerHTML = `
                    <span>Winner: Team ${court.winner + 1}</span>
                `;
                courtDiv.appendChild(winnerDiv);
            }
        } else {
            // Empty court
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-court';
            emptyDiv.textContent = 'Court available';
            courtDiv.appendChild(emptyDiv);
        }
        
        courtsContainer.appendChild(courtDiv);
    });
    
    // Add waiting players section
    const waitingPlayersDiv = document.createElement('div');
    waitingPlayersDiv.className = 'waiting-players';
    waitingPlayersDiv.innerHTML = '<h3>Waiting to Play</h3>';
    
    // Get players not on any court
    const allCourtPlayers = new Set();
    courts.forEach(court => {
        court.team1.forEach(id => allCourtPlayers.add(id));
        court.team2.forEach(id => allCourtPlayers.add(id));
    });
    
    const waitingPlayers = users[currentUser].columns.present.filter(id => !allCourtPlayers.has(id));
    
    if (waitingPlayers.length === 0) {
        waitingPlayersDiv.innerHTML += '<p class="empty-message">No players waiting.</p>';
    } else {
        const waitingList = document.createElement('div');
        waitingList.className = 'waiting-list';
        
        waitingPlayers.forEach(playerId => {
            const player = getPlayerById(playerId);
            if (player) {
                const playerItem = document.createElement('div');
                playerItem.className = 'player-item';
                
                playerItem.innerHTML = `
                    <div class="player-info">
                        <span>${player.name}</span>
                        <span class="skill-level">${player.skillLevel}</span>
                    </div>
                    <button class="move-right-btn action-btn" data-id="${player.id}">Move to Vacant</button>
                `;
                
                waitingList.appendChild(playerItem);
            }
        });
        
        waitingPlayersDiv.appendChild(waitingList);
    }
    
    courtsContainer.appendChild(waitingPlayersDiv);
    
    presentPlayersList.appendChild(courtsContainer);
    
    // Add event listeners for win buttons
    document.querySelectorAll('.team1-win-btn, .team2-win-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const courtIndex = parseInt(e.target.getAttribute('data-court'));
            const winningTeam = e.target.classList.contains('team1-win-btn') ? 0 : 1;
            recordMatchResult(courtIndex, winningTeam);
        });
    });
    
    // Add event listeners for move buttons (waiting players)
    document.querySelectorAll('.move-right-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const playerId = parseInt(e.target.getAttribute('data-id'));
            movePlayer(playerId, 'present', 'vacant');
        });
    });
}

// Record match result and update court status
function recordMatchResult(courtIndex, winningTeam) {
    const users = JSON.parse(localStorage.getItem('users'));
    const court = users[currentUser].courts[courtIndex];
    
    court.winner = winningTeam;
    court.status = 'finished';
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Check if all matches are finished now
    checkAllMatchesFinished();
    
    displayColumnPlayers();
}

// Move player between columns
function movePlayer(playerId, fromColumn, toColumn) {
    const users = JSON.parse(localStorage.getItem('users'));
    
    // Remove from source column
    users[currentUser].columns[fromColumn] = users[currentUser].columns[fromColumn].filter(
        id => id !== playerId
    );
    
    // Add to destination column
    users[currentUser].columns[toColumn].push(playerId);
    
    // Also remove player from any courts
    if (users[currentUser].courts) {
        users[currentUser].courts.forEach(court => {
            court.team1 = court.team1.filter(id => id !== playerId);
            court.team2 = court.team2.filter(id => id !== playerId);
            
            // If a team now has only 1 player, reset the court
            if (court.team1.length < 2 || court.team2.length < 2) {
                court.team1 = [];
                court.team2 = [];
                court.status = 'waiting';
                court.winner = null;
            }
        });
    }
    
    // Save to local storage
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update display
    displayColumnPlayers();
}

// Delete player
function deletePlayer(playerId) {
    const users = JSON.parse(localStorage.getItem('users'));
    
    // Find and remove player from players array
    users[currentUser].players = users[currentUser].players.filter(
        player => player.id !== playerId
    );
    
    // Remove from columns
    Object.keys(users[currentUser].columns).forEach(columnKey => {
        users[currentUser].columns[columnKey] = users[currentUser].columns[columnKey].filter(
            id => id !== playerId
        );
    });
    
    // Remove from courts
    if (users[currentUser].courts) {
        users[currentUser].courts.forEach(court => {
            court.team1 = court.team1.filter(id => id !== playerId);
            court.team2 = court.team2.filter(id => id !== playerId);
            
            // If a team now has only 1 player, reset the court
            if (court.team1.length < 2 || court.team2.length < 2) {
                court.team1 = [];
                court.team2 = [];
                court.status = 'waiting';
                court.winner = null;
            }
        });
    }
    
    // Save to local storage
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update displays
    displayPlayers();
    displayColumnPlayers();
}