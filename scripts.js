/**
 * UNFAKE - Main Scripts File
 * This file handles interactivity for all pages.
 * It is wrapped in a DOMContentLoaded listener to ensure the HTML is loaded before the script runs.
 */
const supabaseUrl = 'https://ucrghvoeejswrmgmyoat.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcmdodm9lZWpzd3JtZ215b2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzAwNzEsImV4cCI6MjA2ODcwNjA3MX0.vFtRrtAOcs9xp5mr8FLFAS-oqnSyhPyfBSYVZaz9zJI';
// Avoid shadowing the global `supabase` from the CDN
const sb = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {

    //================================================
    // 0. AUTH HELPERS, GUARDS, AND LOGOUT
    //================================================
    const requireAuthOnPages = ['dashboard.html', 'submit.html', 'profile.html', 'admin.html', 'admindash.html'];

    function getCurrentPathName() {
        return window.location.pathname.split('/').pop();
    }

    async function getSessionAndUser() {
        const { data: sessionData } = await sb.auth.getSession();
        const session = sessionData ? sessionData.session : null;
        const user = session ? session.user : null;
        return { session, user };
    }

    function isAdminUser(user) {
        if (!user) return false;
        // Expect role in user.user_metadata.role === 'admin'.
        const role = user.user_metadata && user.user_metadata.role;
        return role === 'admin';
    }

    // Guard protected pages
    (async () => {
        const current = getCurrentPathName();
        if (requireAuthOnPages.includes(current)) {
            const { user } = await getSessionAndUser();
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            // Admin-only pages
            if ((current === 'admin.html' || current === 'admindash.html') && !isAdminUser(user)) {
                alert('Admin access required.');
                window.location.href = 'dashboard.html';
                return;
            }
        }
    })();

    // Logout links
    document.querySelectorAll('a').forEach(a => {
        if (a.textContent && a.textContent.trim().toLowerCase() === 'logout') {
            a.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await sb.auth.signOut();
                } catch {}
                window.location.href = 'index.html';
            });
        }
    });

    //================================================
    // 1. LOGIN PAGE LOGIC (`login.html`)
    //================================================
    const loginForm = document.getElementById('loginForm');
    

    // This 'if' block ensures this code only runs on the login page
    if (loginForm) {
        const userTypeSelector = document.getElementById('user-type-selector');
        const userTypeBtns = userTypeSelector.querySelectorAll('.user-type-btn');
        const userTypeInput = document.getElementById('user-type');

        // This is the CLICK event that makes the role selector work
        userTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 1. Remove 'selected' class from all buttons
                userTypeBtns.forEach(b => b.classList.remove('selected'));
                
                // 2. Add 'selected' class to the button that was just clicked
                btn.classList.add('selected');
                
                // 3. Update the hidden input's value to match the selected role
                userTypeInput.value = btn.dataset.type;
            });
        });

        // This is the SUBMIT event that logs in with Supabase
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('username').value; // Treat "username" field as email
            const password = document.getElementById('password').value;
            const selectedRole = userTypeInput.value;
            const errorDiv = document.getElementById('login-error');

            errorDiv.classList.add('hidden');
            errorDiv.textContent = '';

            const { data, error } = await sb.auth.signInWithPassword({ email, password });
            if (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
                return;
            }

            const user = data.user;
            const admin = isAdminUser(user);
            if (selectedRole === 'admin' && !admin) {
                errorDiv.textContent = 'You are not an admin. Contact support to request access.';
                errorDiv.classList.remove('hidden');
                return;
            }

            if (admin) {
                window.location.href = 'admindash.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }


    //================================================
    // 2. USER DASHBOARD LOGIC (`dashboard.html`)
    //================================================
    
    // Logic for all 'Vote' buttons on the page
    document.querySelectorAll('.post-container').forEach(postContainer => {
        const voteButtons = postContainer.querySelectorAll('.vote-btn');
        const voteBar = postContainer.querySelector('.vote-bar');
        if (!voteBar) return;
        let trueVotes = parseInt(voteBar.getAttribute('data-true'));
        let falseVotes = parseInt(voteBar.getAttribute('data-false'));
        const totalVotes = () => trueVotes + falseVotes;
        voteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Disable both buttons
                voteButtons.forEach(b => {
                    b.disabled = true;
                    b.classList.add('opacity-50', 'cursor-not-allowed');
                });
                // Update vote counts
                if (btn.classList.contains('bg-green-500')) {
                    trueVotes++;
                } else if (btn.classList.contains('bg-red-500')) {
                    falseVotes++;
                }
                // Update bar
                const percent = totalVotes() === 0 ? 0 : Math.round((trueVotes / totalVotes()) * 100);
                voteBar.style.width = percent + '%';
                voteBar.setAttribute('data-true', trueVotes);
                voteBar.setAttribute('data-false', falseVotes);
            });
        });
    });

    // Logic for all 'Why?' links to toggle admin reasons
    document.querySelectorAll('.reason-toggle').forEach(button => {
        button.addEventListener('click', (e) => {
            // Find the parent post container, then the specific reason div within it
            const reasonDiv = e.target.closest('.post-container').querySelector('.admin-reason');
            if (reasonDiv) {
                // Toggle the 'show' class to trigger the CSS transition
                reasonDiv.classList.toggle('show');

                // Change button text based on state
                if (reasonDiv.classList.contains('show')) {
                    e.target.textContent = '(Hide)';
                } else {
                    e.target.textContent = '(Why?)';
                }
            }
        });
    });


    //================================================
    // 3. ADMIN DASHBOARD CHART LOGIC (`admindash.html`)
    //================================================
    const statsChartCanvas = document.getElementById('statsChart');

    // This 'if' block ensures this code only runs on the admin dashboard page
    if (statsChartCanvas) {
        const ctx = statsChartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'True Flags',
                    data: [12, 19, 3, 5, 2, 3, 9],
                    borderColor: '#22c55e', // Tailwind green-500
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4, // Makes the line smoother
                    fill: true,
                    pointBackgroundColor: '#22c55e',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBorderWidth: 2,
                }, {
                    label: 'False Flags',
                    data: [8, 10, 15, 12, 11, 18, 14],
                    borderColor: '#ef4444', // Tailwind red-500
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBorderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true, // Prevents chart from stretching
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 14 }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Weekly Flagging Activity',
                        font: { size: 18, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e5e7eb' // gray-200
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }


    //================================================
    // 4. ADMIN DASHBOARD LOGIC (`admindash.html`)
    //================================================
    // Call this when the signup form is submitted
    async function signUpUser(email, password, fullName) {
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName || null,
                    role: 'user'
                }
            }
        });
        if (error) {
        alert(error.message);
        } else {
        alert('Check your email for a confirmation link!');
        // Optionally redirect to login page
        // window.location.href = 'login.html';
        }
    }



    //================================================
    // 4. GLOBAL ICON RENDERING
    //================================================
    // This function finds all `data-feather` attributes and replaces them with SVG icons.
    // It should be called after the DOM is fully loaded.
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    //================================================
    // 5. ADMIN MODERATION LOGIC (`admin.html`)
    //================================================
    const moderationCards = document.querySelectorAll('.moderation-card');
    moderationCards.forEach(card => {
        // Flag True
        card.querySelectorAll('.flag-btn.bg-green-500').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.textContent = 'Flagged True';
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
                // Show reason box
                const reasonBox = card.querySelector('.flag-reason-box');
                reasonBox.classList.remove('hidden');
                reasonBox.dataset.flagType = 'true';
            });
        });
        // Flag False
        card.querySelectorAll('.flag-btn.bg-red-500').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.textContent = 'Flagged False';
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
                // Show reason box
                const reasonBox = card.querySelector('.flag-reason-box');
                reasonBox.classList.remove('hidden');
                reasonBox.dataset.flagType = 'false';
            });
        });
        // Reason submit
        card.querySelectorAll('.submit-reason-btn').forEach(submitBtn => {
            submitBtn.addEventListener('click', () => {
                const reasonBox = submitBtn.closest('.flag-reason-box');
                const textarea = reasonBox.querySelector('textarea');
                const reason = textarea.value.trim();
                if (!reason) {
                    alert('Please enter a reason.');
                    return;
                }
                // Save reason to localStorage by post title (for demo)
                const postTitle = card.querySelector('h3').textContent;
                const flagType = reasonBox.dataset.flagType;
                localStorage.setItem('flagReason_' + postTitle, JSON.stringify({reason, flagType}));
                reasonBox.classList.add('hidden');
                textarea.value = '';
                alert('Reason submitted!');
            });
        });
    });

    // Show flag reasons on index.html and dashboard.html
    if (document.body && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('dashboard.html'))) {
        document.querySelectorAll('.post-container').forEach(card => {
            const postTitle = card.querySelector('h3, .post-title');
            if (!postTitle) return;
            const reasonData = localStorage.getItem('flagReason_' + postTitle.textContent);
            if (reasonData) {
                const {reason, flagType} = JSON.parse(reasonData);
                let reasonDiv = card.querySelector('.flag-reason-display');
                if (!reasonDiv) {
                    reasonDiv = document.createElement('div');
                    reasonDiv.className = 'flag-reason-display bg-sky-100 text-sky-800 rounded p-2 mt-2';
                    card.appendChild(reasonDiv);
                }
                reasonDiv.textContent = `Flagged ${flagType === 'true' ? 'True' : 'False'}: ${reason}`;
            }
        });
    }

    // SIGNUP PAGE LOGIC
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = (document.getElementById('name') && document.getElementById('name').value) || null;

            const { error } = await sb.auth.signUp({
                email,
                password,
                options: { data: { full_name: name, role: 'user' } }
            });

            if (error) {
                alert(error.message);
            } else {
                alert('Check your email for a confirmation link!');
                // window.location.href = 'login.html';
            }
        });
    }

    // SUBMIT PAGE LOGIC
    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
        newsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const title = document.getElementById('title').value;
            const source = document.getElementById('source').value;
            const description = document.getElementById('description').value;

            const { user } = await (async () => {
                const { data } = await sb.auth.getUser();
                return { user: data && data.user ? data.user : null };
            })();

            if (!user) {
                alert('Please log in to submit a post.');
                window.location.href = 'login.html';
                return;
            }

            const { error } = await sb.from('posts').insert([
                {
                    title: title,
                    source: source,
                    description: description,
                    user_id: user.id
                }
            ]);

            if (error) {
                alert('Error submitting post: ' + error.message);
            } else {
                alert('Your post has been submitted and is pending admin review. Thank you!');
                e.target.reset();
            }
        });
    }

});