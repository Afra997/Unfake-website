// =================================================================
// UNFAKE - FINAL API DRIVEN SCRIPT
// =================================================================

// =================================================================
// UNFAKE - FINAL API DRIVEN SCRIPT
// =================================================================

// =================================================================
// UNFAKE - FINAL API DRIVEN SCRIPT
// =================================================================

const API_URL = 'http://localhost:5000/api';

// Helper to get the token
const getToken = () => localStorage.getItem('token');

// Main router to initialize the correct page
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // This is the final, correct router logic
    if (path.endsWith('/index.html')) {
        initializeGuestFeed();
    } 
    else if (path.endsWith('/login.html')) {
        initializeLoginPage();
    } 
    else if (path.endsWith('/dashboard.html')) {
        initializeDashboardPage();
    } 
    else if (path.endsWith('/submit.html')) {
        initializeSubmitPage();
    } 

    else if (path.endsWith('/signup.html')) { 
    initializeSignupPage();
    } 

    else if (path.endsWith('/admindash.html')) {
        initializeAdminDashboard();
    } 

    else if (path.endsWith('/adminfeed.html')) { // <-- ADD THIS NEW BLOCK
    initializeAdminFeedPage();
    }

    else if (path.endsWith('/admin.html')) {
        initializeAdminModerationPage();
    }
});

// =================================================================
// 1. LOGIN PAGE (`login.html`)
// (The rest of your code starts here)
// ...
// =================================================================
// 1. LOGIN PAGE (`login.html`)
// (The rest of your code starts here)
// ...

// =================================================================
// 1. LOGIN PAGE (`login.html`)
// (This code remains the same as before)
function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const userTypeSelector = document.getElementById('user-type-selector');
    const userTypeBtns = userTypeSelector.querySelectorAll('.user-type-btn');
    const userTypeInput = document.getElementById('user-type');
    userTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            userTypeBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            userTypeInput.value = btn.dataset.type;
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        errorDiv.classList.add('hidden');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Login failed!');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.user.role === 'admin') {
                window.location.href = 'admindash.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('Login Error:', error);
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    });
}

// =================================================================
// 2. USER DASHBOARD (`dashboard.html`)
// (This code remains the same as before)
async function initializeDashboardPage() {
    if (!getToken()) return window.location.href = 'login.html';
    
    const searchBar = document.querySelector('.search-bar');
    searchBar.addEventListener('keyup', handleSearch);

    try {
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        console.error('Failed to fetch posts:', error);
    }
}

function renderPosts(posts) {
    const feedContainer = document.querySelector('main');
    document.querySelectorAll('.post-container').forEach(post => post.remove());
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'bg-white p-6 rounded-xl shadow-lg mb-6 post-container';
        const trueVotes = post.trueVotes.length;
        const falseVotes = post.falseVotes.length;
        const totalVotes = trueVotes + falseVotes;
        const truePercentage = totalVotes === 0 ? 50 : Math.round((trueVotes / totalVotes) * 100);

        postElement.innerHTML = `
            <h3 class="text-xl font-semibold text-gray-900">${post.title}</h3>
            <p class="text-sm text-gray-500 mt-1">Source: <a href="${post.source}" target="_blank" class="text-sky-600 hover:underline">${post.source}</a></p>
            <p class="text-gray-700 my-4">${post.description}</p>
            <div class="mt-4">
                <div class="flex justify-between mb-1 text-xs font-bold">
                    <span class="text-green-600">TRUE VOTES (${trueVotes})</span>
                    <span class="text-red-600">FALSE VOTES (${falseVotes})</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5 relative">
                    <div class="vote-bar bg-gradient-to-r from-green-400 to-sky-500 h-2.5 rounded-full" style="width: ${truePercentage}%"></div>
                </div>
            </div>
            <div class="flex items-center gap-4 mt-4 justify-center">
                <button class="vote-btn bg-green-500 text-white w-32 px-4 py-2 rounded-lg font-semibold" data-post-id="${post._id}" data-vote-type="true">Vote True</button>
                <button class="vote-btn bg-red-500 text-white w-32 px-4 py-2 rounded-lg font-semibold" data-post-id="${post._id}" data-vote-type="false">Vote False</button>
                <div class="ml-auto text-sm text-right">
                    <span class="font-semibold">Admin Flag:</span> <strong class="text-gray-700">${post.adminFlag}</strong>
                </div>
            </div>
        `;
        feedContainer.appendChild(postElement);
    });
    addVoteListeners();
}

async function handleSearch(e) {
    const searchTerm = e.target.value.trim();
    const url = searchTerm ? `${API_URL}/posts/search?q=${searchTerm}` : `${API_URL}/posts`;
    try {
        const response = await fetch(url);
        const posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        console.error('Search failed:', error);
    }
}

function addVoteListeners() {
    document.querySelectorAll('.vote-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const clickedButton = e.target;
            const postId = clickedButton.dataset.postId;
            const voteType = clickedButton.dataset.voteType;
            const postContainer = clickedButton.closest('.post-container');
            try {
                const response = await fetch(`${API_URL}/posts/${postId}/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                    body: JSON.stringify({ voteType })
                });
                if (!response.ok) throw new Error((await response.json()).message);
                const updatedPost = await response.json();
                const trueVotes = updatedPost.trueVotes.length;
                const falseVotes = updatedPost.falseVotes.length;
                const totalVotes = trueVotes + falseVotes;
                const newPercentage = totalVotes === 0 ? 50 : Math.round((trueVotes / totalVotes) * 100);
                postContainer.querySelector('.vote-bar').style.width = `${newPercentage}%`;
                postContainer.querySelector('.text-green-600').textContent = `TRUE VOTES (${trueVotes})`;
                postContainer.querySelector('.text-red-600').textContent = `FALSE VOTES (${falseVotes})`;
                postContainer.querySelectorAll('.vote-btn').forEach(btn => {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                });
            } catch (error) {
                console.error('Vote Error:', error);
                alert(`Error: ${error.message}`);
            }
        });
    });
}

// =================================================================
// 3. SUBMIT POST PAGE (`submit.html`)
// (This code remains the same as before)
function initializeSubmitPage() {
    const newsForm = document.getElementById('newsForm');
    if (!newsForm) return;

    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const source = document.getElementById('source').value;
        const description = document.getElementById('description').value;

        try {
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ title, source, description })
            });
            if (!response.ok) throw new Error((await response.json()).message);
            alert('Your post has been submitted and is pending admin review. Thank you!');
            e.target.reset();
        } catch (error) {
            console.error('Submit Error:', error);
            alert(`Submission failed: ${error.message}`);
        }
    });
}

// =================================================================
// NEW: SIGNUP PAGE (`signup.html`)
// =================================================================
function initializeSignupPage() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // This will stop the page from reloading!

        // Note: Your form has 'name', 'email', 'password'. The backend expects 'username'.
        // We will use the 'name' field as the 'username'.
        const username = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Signup failed!');
            }

            alert('Signup successful! Please log in.');
            window.location.href = 'login.html'; // Redirect to login page

        } catch (error) {
            console.error('Signup Error:', error);
            alert(`Signup failed: ${error.message}`);
        }
    });
}

// =================================================================
// 4. ADMIN DASHBOARD (`admindash.html`) - FULLY IMPLEMENTED
// =================================================================
async function initializeAdminDashboard() {
    if (!getToken()) return window.location.href = 'login.html';
    
    // --- 1. Fetch Stats (no change) ---
    try {
        const response = await fetch(`${API_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const stats = await response.json();
        document.querySelector('.stat-card:nth-child(1) p:last-child').textContent = stats.totalUsers;
        document.querySelector('.stat-card:nth-child(2) p:last-child').textContent = stats.pendingPosts;
        document.querySelector('.stat-card:nth-child(3) p:last-child').textContent = stats.flaggedTrue;
        document.querySelector('.stat-card:nth-child(4) p:last-child').textContent = stats.flaggedFalse;
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
    }

    // --- 2. User Table Logic (with the fix) ---
    const fetchUsers = async (query = '') => {
        try {
            // THIS LINE IS NOW CORRECTED
            const response = await fetch(`${API_URL}/admin/users?q=${query}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            renderUsers(await response.json());
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };
    fetchUsers();
    // This selector needs the id="user-management" on the user table div in your HTML
    document.querySelector('#user-management .search-bar').addEventListener('keyup', (e) => fetchUsers(e.target.value.trim()));

    // --- 3. All Posts Table Logic (no change) ---
    const fetchAllPosts = async (query = '') => {
        try {
            const response = await fetch(`${API_URL}/admin/posts?q=${query}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            renderAllPosts(await response.json());
        } catch (error) {
            console.error('Failed to fetch all posts:', error);
        }
    };
    fetchAllPosts(); // Initial fetch
    document.getElementById('post-search-bar').addEventListener('keyup', (e) => fetchAllPosts(e.target.value.trim()));

    initializeAdminLog(); 
    initializeUserPieChart(); 
}

function renderUsers(users) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = ''; // Clear existing rows
    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'border-b table-row';
        const statusClass = user.status.includes('banned') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
        
        let actionButtons;
        if (user.status.includes('banned')) {
            actionButtons = `<button class="user-action-btn bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded" data-user-id="${user._id}" data-action="unban">Unban</button>`;
        } else {
            actionButtons = `
                <button class="user-action-btn bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1 px-3 rounded" data-user-id="${user._id}" data-action="temp-ban">Temp Ban</button>
                <button class="user-action-btn bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded" data-user-id="${user._id}" data-action="perm-ban">Perm Ban</button>
            `;
        }

        row.innerHTML = `
            <td class="p-3 font-medium">${user.email}</td>
            <td class="p-3 font-medium text-center">${user.trueVotesCount || 0} : ${user.falseVotesCount || 0}</td>
            <td class="p-3"><span class="${statusClass} text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">${user.status}</span></td>
            <td class="p-3 text-center space-x-2">${actionButtons}</td>
        `;
        tableBody.appendChild(row);
    });
    addUserActionListeners();
}

function addUserActionListeners() {
    document.querySelectorAll('.user-action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const { userId, action } = e.target.dataset;
            const newStatusMap = {
                'unban': 'active',
                'temp-ban': 'temp-banned',
                'perm-ban': 'perm-banned'
            };
            const newStatus = newStatusMap[action];

            try {
                const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                    body: JSON.stringify({ status: newStatus })
                });
                if (!response.ok) throw new Error((await response.json()).message);
                
                // Re-fetch all users to update the table
                const userResponse = await fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
                const users = await userResponse.json();
                renderUsers(users);

            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    });
}

// =================================================================
// HELPER FUNCTIONS FOR THE NEW POSTS TABLE
// =================================================================
function renderAllPosts(posts) {
    const tableBody = document.querySelector('#all-posts-management table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = ''; // Clear existing rows

    posts.forEach(post => {
        const row = document.createElement('tr');
        row.className = 'border-b table-row';
        const statusClass = post.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
        const flagClass = post.adminFlag === 'true' ? 'text-green-600' : post.adminFlag === 'false' ? 'text-red-600' : 'text-gray-500';

        row.innerHTML = `
            <td class="p-3 font-medium" title="${post.title}">${post.title.substring(0, 30)}...</td>
            <td class="p-3">${post.submittedBy?.username || 'N/A'}</td>
            <td class="p-3"><span class="${statusClass} text-xs font-medium px-2.5 py-0.5 rounded-full">${post.status}</span></td>
            <td class="p-3 font-semibold ${flagClass}">${post.adminFlag}</td>
            <td class="p-3 text-center">
                <button class="post-action-btn bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded" data-post-id="${post._id}" data-action="delete">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    addPostActionListeners();
}

function addPostActionListeners() {
    document.querySelectorAll('.post-action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const { postId, action } = e.target.dataset;
            if (action === 'delete') {
                if (!confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) return;
                try {
                    const response = await fetch(`${API_URL}/admin/posts/${postId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    if (!response.ok) throw new Error((await response.json()).message);
                    
                    // To refresh the list, we simply re-trigger the search
                    document.getElementById('post-search-bar').dispatchEvent(new Event('keyup'));
                    alert('Post deleted successfully.');
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
        });
    });
}

// =================================================================
// 5. ADMIN MODERATION PAGE (`admin.html`) - FULLY IMPLEMENTED
// =================================================================
async function initializeAdminModerationPage() {
    if (!getToken()) return window.location.href = 'login.html';

    const fetchPendingPosts = async (query = '') => {
        try {
            const response = await fetch(`${API_URL}/admin/pending-posts?q=${query}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const posts = await response.json();
            renderPendingPosts(posts);
        } catch (error) {
            console.error('Failed to fetch pending posts:', error);
        }
    };

    fetchPendingPosts();
    document.querySelector('.search-bar').addEventListener('keyup', (e) => fetchPendingPosts(e.target.value.trim()));
}

function renderPendingPosts(posts) {
    const mainContainer = document.querySelector('main');
    // Clear old posts
    mainContainer.querySelectorAll('.moderation-card').forEach(card => card.remove());

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-xl shadow-lg mb-6 border-l-4 border-yellow-400 moderation-card transition-all';
        card.innerHTML = `
            <h3 class="text-xl font-bold text-gray-900">${post.title}</h3>
            <p class="text-sm text-gray-500 my-2">Source: <a href="${post.source}" target="_blank" class="text-sky-600 hover:underline">${post.source}</a> | User: <span class="font-semibold">${post.submittedBy.email}</span></p>
            <p class="text-gray-700 bg-gray-50 p-3 rounded-lg">${post.description}</p>
            <div class="flex items-center gap-3 mt-4">
                <button class="action-btn bg-sky-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-sky-600" data-post-id="${post._id}" data-action="approve-only">Approve</button>
                <button class="action-btn bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600" data-post-id="${post._id}" data-action="flag-true">Flag True</button>
                <button class="action-btn bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600" data-post-id="${post._id}" data-action="flag-false">Flag False</button>
                <button class="action-btn bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600" data-post-id="${post._id}" data-action="delete">Delete</button>
            </div>
            <div class="flex items-center gap-3 mt-2">
                <button class="action-btn bg-red-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-800" data-user-id="${post.submittedBy._id}" data-action="ban-user">Ban User</button>
            </div>
        `;
        mainContainer.appendChild(card);
    });
    addModerationActionListeners();
}

function addModerationActionListeners() {
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const { postId, userId, action } = e.target.dataset;
            const card = e.target.closest('.moderation-card');

            try {
                let response;
                switch (action) {
                    case 'approve-only': // <-- ADD THIS NEW CASE
                    response = await fetch(`${API_URL}/admin/posts/${postId}/moderate`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                    body: JSON.stringify({ status: 'approved' }) // Only sends the status
                    });
                    break;
                    case 'flag-true':
                        response = await fetch(`${API_URL}/admin/posts/${postId}/moderate`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                            body: JSON.stringify({ status: 'approved', adminFlag: 'true' })
                        });
                        break;
                    case 'flag-false':
                        response = await fetch(`${API_URL}/admin/posts/${postId}/moderate`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                            body: JSON.stringify({ status: 'approved', adminFlag: 'false' })
                        });
                        break;
                    case 'delete':
                        if (!confirm('Are you sure you want to delete this post?')) return;
                        response = await fetch(`${API_URL}/admin/posts/${postId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${getToken()}` }
                        });
                        break;
                    case 'ban-user':
                        if (!confirm('Are you sure you want to permanently ban this user?')) return;
                        response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                            body: JSON.stringify({ status: 'perm-banned' })
                        });
                        alert('User has been banned.');
                        return; // Don't remove the card, just confirm the action
                }

                if (!response.ok) throw new Error((await response.json()).message);
                card.remove(); // Remove the card from the UI on success
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    });
}

// // =================================================================
// 6. GUEST HOMEPAGE FEED (`index.html`)
// =================================================================
async function initializeGuestFeed() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        
        const posts = await response.json();
        const feedContainer = document.getElementById('guest-feed-container');
        
        // Clear the "Loading..." message
        feedContainer.innerHTML = ''; 

        if (posts.length === 0) {
            feedContainer.innerHTML = '<p class="text-gray-500">No posts have been approved yet. Check back later!</p>';
            return;
        }

        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'bg-white p-6 rounded-xl shadow-lg mb-6 post-card';

            // Simplified HTML for guests - no vote buttons
            postElement.innerHTML = `
                <h4 class="text-xl font-semibold text-gray-900">${post.title}</h4>
                <div class="mt-4">
                    <div class="flex justify-between mb-1 text-xs font-bold"><span class="text-green-600">TRUE VOTES</span><span class="text-red-600">FALSE VOTES</span></div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-gradient-to-r from-green-400 to-sky-500 h-2.5 rounded-full" style="width: ${calculatePercentage(post.trueVotes.length, post.falseVotes.length)}%"></div></div>
                </div>
                <p class="mt-4 text-sm text-gray-600"><strong>Admin Status:</strong> 
                    <span class="${post.adminFlag === 'true' ? 'text-green-600' : post.adminFlag === 'false' ? 'text-red-600' : 'text-gray-700'} font-semibold">
                        ${post.adminFlag.charAt(0).toUpperCase() + post.adminFlag.slice(1)}
                    </span>
                </p>
            `;
            feedContainer.appendChild(postElement);
        });

    } catch (error) {
        console.error('Guest feed error:', error);
        const feedContainer = document.getElementById('guest-feed-container');
        feedContainer.innerHTML = '<p class="text-red-500">Could not load posts at this time. Please try again later.</p>';
    }
}

// Make sure this helper function is also present in your file (usually at the very end)
function calculatePercentage(trueVotes, falseVotes) {
    const total = trueVotes + falseVotes;
    if (total === 0) return 50; // Default to 50% if no votes
    return Math.round((trueVotes / total) * 100);
}


// Chart.js remains static for now, as implementing a backend for it is more advanced
const statsChartCanvas = document.getElementById('statsChart');
if (statsChartCanvas) {
    const ctx = statsChartCanvas.getContext('2d');
    new Chart(ctx, { type: 'line', data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'True Flags', data: [12, 19, 3, 5, 2, 3, 9], borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', tension: 0.4, fill: true }, { label: 'False Flags', data: [8, 10, 15, 12, 11, 18, 14], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.4, fill: true }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Weekly Flagging Activity' } }, scales: { y: { beginAtZero: true } } } });
}


// =================================================================
// 7. ADMIN FEED PAGE (`adminfeed.html`) - NEW
// =================================================================
async function initializeAdminFeedPage() {
    if (!getToken()) return window.location.href = 'login.html';

    const searchBar = document.querySelector('.search-bar');
    searchBar.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.trim();
        // We can just reuse the user search endpoint for this
        const url = searchTerm ? `${API_URL}/posts/search?q=${searchTerm}` : `${API_URL}/posts`;
        fetchAndRenderAdminFeed(url);
    });

    // Initial fetch
    fetchAndRenderAdminFeed(`${API_URL}/posts`);
}

async function fetchAndRenderAdminFeed(url) {
    try {
        const response = await fetch(url); // No token needed for public feed
        const posts = await response.json();
        renderAdminFeedPosts(posts);
    } catch (error) {
        console.error('Failed to fetch admin feed posts:', error);
    }
}

function renderAdminFeedPosts(posts) {
    const feedContainer = document.querySelector('main');
    // Clear old posts
    feedContainer.querySelectorAll('.post-container').forEach(post => post.remove());

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'bg-white p-6 rounded-xl shadow-lg mb-6 post-container';
        
        const flagClass = post.adminFlag === 'true' ? 'text-green-600' : post.adminFlag === 'false' ? 'text-red-600' : 'text-gray-500';

        postElement.innerHTML = `
            <h3 class="text-xl font-semibold text-gray-900">${post.title}</h3>
            <p class="text-sm text-gray-500 my-2">
    Source: <a href="${post.source}" target="_blank" class="text-sky-600 hover:underline">${post.source}</a> | User: <span class="font-semibold">${post.submittedBy?.username || 'N/A'}</span>
</p>
            <p class="text-gray-700 my-4">${post.description}</p>
            <p class="text-sm font-medium">Current Flag: <strong class="${flagClass}">${post.adminFlag}</strong></p>
            
            <div class="flex items-center gap-3 mt-4">
                <button class="admin-feed-btn bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600" data-post-id="${post._id}" data-action="flag-true">Flag True</button>
                <button class="admin-feed-btn bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600" data-post-id="${post._id}" data-action="flag-false">Flag False</button>
                <button class="admin-feed-btn bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600" data-post-id="${post._id}" data-action="delete">Delete</button>
            </div>
            
            <!-- Hidden reason box for this specific post -->
            <div class="flag-reason-box hidden mt-3" data-post-id="${post._id}">
                <textarea class="w-full p-2 border border-gray-300 rounded-lg mb-2" rows="2" placeholder="Add reason for flag..."></textarea>
                <button class="submit-reason-btn bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-sky-700">Submit Reason</button>
            </div>
        `;
        feedContainer.appendChild(postElement);
    });

    addAdminFeedActionListeners();
}

function addAdminFeedActionListeners() {
    // Listener for Flag True/False and Delete buttons
    document.querySelectorAll('.admin-feed-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            const { postId, action } = e.target.dataset;
            const postContainer = e.target.closest('.post-container');

            if (action === 'delete') {
                if (!confirm('Are you sure you want to delete this post permanently?')) return;
                try {
                    const response = await fetch(`${API_URL}/admin/posts/${postId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    if (!response.ok) throw new Error('Failed to delete');
                    postContainer.remove(); // Remove from UI on success
                } catch (error) {
                    alert('Error deleting post.');
                }
            } else { // It's a flag action
                // Show the reason box for this post
                const reasonBox = postContainer.querySelector('.flag-reason-box');
                reasonBox.classList.remove('hidden');
                // Store the action on the submit button for later use
                reasonBox.querySelector('.submit-reason-btn').dataset.action = action;
            }
        });
    });

    // Listener for the "Submit Reason" buttons
    document.querySelectorAll('.submit-reason-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            const reasonBox = e.target.closest('.flag-reason-box');
            const postId = reasonBox.dataset.postId;
            const action = e.target.dataset.action; // Get the action we stored
            const reason = reasonBox.querySelector('textarea').value;

            if (!reason) return alert('Please provide a reason for the flag.');

            const adminFlag = action === 'flag-true' ? 'true' : 'false';

            try {
                const response = await fetch(`${API_URL}/admin/posts/${postId}/moderate`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                    body: JSON.stringify({ adminFlag, adminReason: reason })
                });
                if (!response.ok) throw new Error('Failed to update flag.');
                
                // Success! Hide the reason box and refresh the feed to show the change
                reasonBox.classList.add('hidden');
                alert('Post flag updated successfully!');
                fetchAndRenderAdminFeed(`${API_URL}/posts`);

            } catch (error) {
                alert('Error updating flag.');
            }
        });
    });
}

// =================================================================
// NEW: ADMIN DASHBOARD USER PIE CHART
// =================================================================
async function initializeUserPieChart() {
    const ctx = document.getElementById('userPieChart');
    if (!ctx) return; // Don't run if the canvas isn't on the page

    try {
        const response = await fetch(`${API_URL}/admin/user-chart-stats`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to fetch chart data');

        const data = await response.json();

        new Chart(ctx, {
            type: 'doughnut',
            position: 'right', // The chart type you wanted!
            data: {
                labels: [
                    'Active (Established)',
                    'Active (New)',
                    'Temp Banned',
                    'Perm Banned'
                ],
                datasets: [{
                    label: 'User Status',

                    // The order of data MUST match the order of labels
                    data: [
                        data.oldActive,
                        data.newActive,
                        data.tempBanned,
                        data.permBanned
                    ],
                    backgroundColor: [
                        '#0ea5e9', // sky-500 for Old Active
                        '#67e8f9', // cyan-300 for New Active
                        '#f59e0b', // amber-500 for Temp Banned
                        '#ef4444'  // red-500 for Perm Banned
                    ],
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                
                plugins: {
                    legend: {
                        position: 'right', // Place labels at the bottom like your example
                    },
                    title: {
                        display: false,
                        text: 'User Distribution by Status',
                        position: 'bottom',
                    }
                }
            }
        });

    } catch (error) {
        console.error('Failed to initialize user pie chart:', error);
        // Optionally display an error message on the canvas
    }
}

// =================================================================
// ADMIN ACTIVITY LOG (This was the missing function)
// =================================================================
async function initializeAdminLog() {
    // First, check if the log list element exists on the page
    const logList = document.getElementById('admin-log-list');
    if (!logList) return; // If not, stop running to prevent errors

    try {
        const response = await fetch(`${API_URL}/admin/logs`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (!response.ok) throw new Error('Failed to fetch logs');
        
        const logs = await response.json();
        logList.innerHTML = ''; // Clear loading message

        if (logs.length === 0) {
            logList.innerHTML = '<li>No admin actions have been logged yet.</li>';
            return;
        }

        logs.forEach(log => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 rounded-lg flex justify-between items-center';
            
            const actionText = `<span class="font-semibold">${log.admin.username}</span>: ${log.details}`;
            const timeText = `<span class="text-xs text-gray-500">${new Date(log.createdAt).toLocaleString()}</span>`;

            li.innerHTML = `<div>${actionText}</div><div>${timeText}</div>`;
            logList.appendChild(li);
        });

    } catch (error) {
        console.error('Failed to load admin logs:', error);
        logList.innerHTML = '<li class="text-red-500">Could not load logs.</li>';
    }
}
