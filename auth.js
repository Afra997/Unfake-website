// Auth handlers for login, signup, and basic session management

document.addEventListener('DOMContentLoaded', function () {
	if (typeof window.sb === 'undefined') return;

	var signupForm = document.getElementById('signupForm');
	if (signupForm) {
		signupForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			var nameInput = document.getElementById('name');
			var emailInput = document.getElementById('email');
			var passwordInput = document.getElementById('password');

			var fullName = nameInput ? nameInput.value : null;
			var email = emailInput ? emailInput.value : '';
			var password = passwordInput ? passwordInput.value : '';

			var result = await window.sb.auth.signUp({
				email: email,
				password: password,
				options: { data: { full_name: fullName } }
			});

			if (result.error) {
				alert(result.error.message);
				return;
			}

			try {
				// Also upsert profile with full_name on first signup (safe under RLS insert policy)
				if (result.data && result.data.user && fullName) {
					await window.sb.from('profiles').upsert({ id: result.data.user.id, full_name: fullName }, { onConflict: 'id' });
				}
			} catch (e) {}

			alert('Check your email for a confirmation link!');
			// window.location.href = 'login.html';
		});
	}

	var loginForm = document.getElementById('loginForm');
	if (loginForm) {
		loginForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			var emailInput = document.getElementById('username'); // treat as email field
			var passwordInput = document.getElementById('password');

			var email = emailInput ? emailInput.value : '';
			var password = passwordInput ? passwordInput.value : '';

			var { data, error } = await window.sb.auth.signInWithPassword({ email: email, password: password });
			if (error) {
				var errorDiv = document.getElementById('login-error');
				if (errorDiv) {
					errorDiv.textContent = error.message;
					errorDiv.classList.remove('hidden');
				}
				return;
			}

			// Optionally fetch profile to route admins differently
			try {
				var userId = data.user.id;
				var { data: profile } = await window.sb.from('profiles').select('role').eq('id', userId).maybeSingle();
				if (profile && profile.role === 'admin') {
					window.location.href = 'admindash.html';
					return;
				}
			} catch (e) {}

			window.location.href = 'dashboard.html';
		});
	}

	// Basic logout handler if a link with text "Logout" is present
	document.querySelectorAll('a').forEach(function (anchor) {
		if (anchor.textContent && anchor.textContent.trim().toLowerCase() === 'logout') {
			anchor.addEventListener('click', async function (e) {
				try { await window.sb.auth.signOut(); } catch (err) {}
			});
		}
	});
});

