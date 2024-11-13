document.getElementById('userForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name || !email) {
        alert('Please fill in both Name and Email fields.');
        return;
    }

    const response = await window.api.addUser({ name, email });

    if (response.success) {
        alert('User added successfully!');
        document.getElementById('userForm').reset(); // Clear form inputs
        await loadUsers(); // Reload the user list
    } else {
        alert(`Error: ${response.error}`);
    }
});

async function loadUsers() {
    const response = await window.api.getUsers();
    const dataDisplay = document.getElementById('dataDisplay');

    if (response.success) {
        dataDisplay.innerHTML = response.users.map(
            (user) => `<div><strong>${user.name}</strong> (${user.email})</div>`
        ).join('');
    } else {
        dataDisplay.innerHTML = `<p>Error fetching users: ${response.error}</p>`;
    }
}

// Load users on page load
loadUsers();
