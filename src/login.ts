import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('username') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const loginButton = document.getElementById('loginButton') as HTMLButtonElement;
  const registerButton = document.getElementById('registerButton') as HTMLButtonElement;
  const loginContainer = document.getElementById('loginContainer') as HTMLDivElement;
  const loggedInContainer = document.getElementById('loggedInContainer') as HTMLDivElement;
  const logoutButton = document.getElementById('logoutButton') as HTMLButtonElement;

  const token = localStorage.getItem('token');
  
  if (token) {
    // If the user is logged in, show logout button
    loginContainer.style.display = 'none';
    loggedInContainer.style.display = 'block';
  } else {
    // If the user is not logged in, show login/register container
    loginContainer.style.display = 'block';
    loggedInContainer.style.display = 'none';
  }

  const register = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      alert('Registration successful. Please log in.');
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  const login = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to log in');
        return;
      }
      localStorage.setItem('token', data.token);
      window.location.href = '/index.html'; // Redirect to the main page
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.reload(); // Refresh the page to show the login/register section
  };

  loginButton.addEventListener('click', login);
  registerButton.addEventListener('click', register);
  logoutButton.addEventListener('click', logout);
});
