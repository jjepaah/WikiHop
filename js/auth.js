// Handle username submission
window.updateUserUI = function(user) {
    const authSection = document.getElementById('auth-section');
    const gameSetupSection = document.getElementById('game-setup-section');
    const currentUsernameEl = document.getElementById('current-username');
    const logoutBtn = document.getElementById('logout-btn');
    const signinBtn = document.getElementById('signin-btn');
    
    if (user && user.username) {
        authSection?.classList.add('hidden');
        gameSetupSection?.classList.remove('hidden');
        if (currentUsernameEl) {
            currentUsernameEl.textContent = user.username;
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
        if (signinBtn) {
            signinBtn.style.display = 'none';
        }
    } else if (user === 'guest') {
        // Guest mode
        authSection?.classList.add('hidden');
        gameSetupSection?.classList.remove('hidden');
        if (currentUsernameEl) {
            currentUsernameEl.textContent = 'Guest';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
        if (signinBtn) {
            signinBtn.style.display = 'block';
        }
        window.isGuestMode = true;
    } else {
        authSection?.classList.remove('hidden');
        gameSetupSection?.classList.add('hidden');
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
        if (signinBtn) {
            signinBtn.style.display = 'none';
        }
        window.isGuestMode = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('auth-section');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const showLoginBtn = document.getElementById('show-login-btn');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Toggle between register and login forms
    showLoginBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm?.classList.add('hidden');
        loginForm?.classList.remove('hidden');
    });
    
    showRegisterBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm?.classList.add('hidden');
        registerForm?.classList.remove('hidden');
    });
    
    // Handle registration
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
    const registerError = document.getElementById('register-error');
    
    const handleRegister = async () => {
        const username = registerUsernameInput?.value.trim();
        const password = registerPasswordInput?.value;
        const confirmPassword = registerConfirmPasswordInput?.value;
        
        // Clear previous errors
        registerError.textContent = '';
        registerError.classList.add('hidden');
        
        // Validation
        if (!username || !password || !confirmPassword) {
            registerError.textContent = 'All fields are required';
            registerError.classList.remove('hidden');
            return;
        }
        
        if (username.length < 3 || username.length > 20) {
            registerError.textContent = 'Username must be 3-20 characters';
            registerError.classList.remove('hidden');
            return;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            registerError.textContent = 'Username can only contain letters, numbers, and underscores';
            registerError.classList.remove('hidden');
            return;
        }
        
        if (password.length < 6) {
            registerError.textContent = 'Password must be at least 6 characters';
            registerError.classList.remove('hidden');
            return;
        }
        
        if (password !== confirmPassword) {
            registerError.textContent = 'Passwords do not match';
            registerError.classList.remove('hidden');
            return;
        }
        
        // Disable button while processing
        registerSubmitBtn.disabled = true;
        registerSubmitBtn.textContent = 'Creating account...';
        
        const result = await window.registerUser(username, password);
        
        if (result.success) {
            window.updateUserUI(result.user);
            registerUsernameInput.value = '';
            registerPasswordInput.value = '';
            registerConfirmPasswordInput.value = '';
        } else {
            registerError.textContent = result.error;
            registerError.classList.remove('hidden');
        }
        
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.textContent = 'Create Account';
    };
    
    registerSubmitBtn?.addEventListener('click', handleRegister);
    registerConfirmPasswordInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleRegister();
        }
    });
    
    // Handle login
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    
    const handleLogin = async () => {
        const username = loginUsernameInput?.value.trim();
        const password = loginPasswordInput?.value;
        
        // Clear previous errors
        loginError.textContent = '';
        loginError.classList.add('hidden');
        
        if (!username || !password) {
            loginError.textContent = 'Username and password are required';
            loginError.classList.remove('hidden');
            return;
        }
        
        // Disable button while processing
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = 'Logging in...';
        
        const result = await window.loginUser(username, password);
        
        if (result.success) {
            window.updateUserUI(result.user);
            loginUsernameInput.value = '';
            loginPasswordInput.value = '';
        } else {
            loginError.textContent = result.error;
            loginError.classList.remove('hidden');
        }
        
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Login';
    };
    
    loginSubmitBtn?.addEventListener('click', handleLogin);
    loginPasswordInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin();
        }
    });
    
    // Clear errors when typing
    [registerUsernameInput, registerPasswordInput, registerConfirmPasswordInput].forEach(input => {
        input?.addEventListener('input', () => registerError?.classList.add('hidden'));
    });
    
    [loginUsernameInput, loginPasswordInput].forEach(input => {
        input?.addEventListener('input', () => loginError?.classList.add('hidden'));
    });
    
    // Handle logout
    logoutBtn?.addEventListener('click', async () => {
        const confirmLogout = confirm('Are you sure you want to logout?');
        if (confirmLogout) {
            await window.signOutUser();
        }
    });
    
    // Handle play as guest
    const playAsGuestBtn = document.getElementById('play-as-guest-btn');
    playAsGuestBtn?.addEventListener('click', () => {
        window.updateUserUI('guest');
    });
    
    // Handle sign in button (for guests)
    const signinBtn = document.getElementById('signin-btn');
    signinBtn?.addEventListener('click', () => {
        window.isGuestMode = false;
        const authSection = document.getElementById('auth-section');
        const gameSetupSection = document.getElementById('game-setup-section');
        authSection?.classList.remove('hidden');
        gameSetupSection?.classList.add('hidden');
    });
});
