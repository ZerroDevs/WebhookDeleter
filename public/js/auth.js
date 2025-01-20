let supabase;
let authToken = null;

async function initSupabase() {
	try {
		console.log('Initializing Supabase...');
		const response = await fetch('/config');
		const { supabaseUrl, supabaseKey } = await response.json();
		console.log('Got Supabase config:', { supabaseUrl });
		
		supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
		console.log('Supabase client created');
		
		await checkUser();
		initAuthListener();
	} catch (error) {
		console.error('Error initializing Supabase:', error);
	}
}

async function signInWithDiscord() {
	console.log('Attempting Discord sign in...');
	if (!supabase) {
		console.error('Supabase not initialized');
		return;
	}

	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'discord',
			options: {
				redirectTo: `${window.location.origin}`,
				scopes: 'identify email'
			}
		});

		if (error) {
			console.error('Sign in error:', error.message);
			throw error;
		}
		
		console.log('Sign in initiated:', data);
	} catch (error) {
		console.error('Error signing in:', error);
	}
}

function updateUserProfile(user) {
	const headerRight = document.querySelector('.header-right');
	const loginBtn = document.getElementById('loginBtn');
	
	if (user) {
		if (loginBtn) loginBtn.style.display = 'none';
		
		// Create user profile if it doesn't exist
		if (!document.querySelector('.user-profile')) {
			const userProfile = document.createElement('div');
			userProfile.className = 'user-profile';
			userProfile.innerHTML = `
				<img src="${user.user_metadata.avatar_url}" alt="User avatar">
				<span>${user.user_metadata.full_name}</span>
				<div class="dropdown-menu">
					<button onclick="signOut()">Log Out</button>
				</div>
			`;
			headerRight.appendChild(userProfile);

			// Add click listener for dropdown
			userProfile.addEventListener('click', (e) => {
				const dropdown = userProfile.querySelector('.dropdown-menu');
				dropdown.classList.toggle('show');
				e.stopPropagation();
			});

			// Close dropdown when clicking outside
			document.addEventListener('click', () => {
				const dropdown = document.querySelector('.dropdown-menu');
				if (dropdown) dropdown.classList.remove('show');
			});
		}
	} else {
		// Remove user profile if exists
		const userProfile = document.querySelector('.user-profile');
		if (userProfile) userProfile.remove();
		if (loginBtn) loginBtn.style.display = 'block';
	}
}

async function signOut() {
	try {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	} catch (error) {
		console.error('Error signing out:', error);
	}
}

async function checkUser() {
	if (!supabase) {
		console.error('Supabase not initialized in checkUser');
		return;
	}

	try {
		console.log('Checking user session...');
		const { data: { session }, error } = await supabase.auth.getSession();
		
		if (error) {
			console.error('Session error:', error);
			return;
		}

		if (session) {
			console.log('User session found');
			authToken = session.access_token;
			updateUserProfile(session.user);
			
			const lockedFeatures = document.querySelectorAll('.feature-card.locked');
			lockedFeatures.forEach(card => {
				card.classList.remove('locked');
				const btn = card.querySelector('.feature-btn');
				if (btn) {
					btn.removeAttribute('disabled');
					btn.textContent = 'Try Now';
					btn.onclick = () => window.location.href = 'webhook-sender.html';
				}
			});
		} else {
			console.log('No user session found');
			updateUserProfile(null);
		}
	} catch (error) {
		console.error('Error checking user:', error);
	}
}

window.getAuthToken = () => authToken;

function initAuthListener() {
	if (!supabase) {
		console.error('Supabase not initialized in initAuthListener');
		return;
	}
	
	console.log('Initializing auth listener...');
	supabase.auth.onAuthStateChange((event, session) => {
		console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
		
		if (event === 'SIGNED_IN') {
			authToken = session.access_token;
			checkUser();
		} else if (event === 'SIGNED_OUT') {
			authToken = null;
			window.location.href = '/';
		}
	});
}

document.addEventListener('DOMContentLoaded', initSupabase);