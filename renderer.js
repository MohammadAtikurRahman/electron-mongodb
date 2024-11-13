// Ensure the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('userForm');
    const dataDisplay = document.getElementById('dataDisplay');

    // Submit form event
    userForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent page reload

        // Get form data
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!name || !email) {
            alert('Please fill in both Name and Address fields.');
            return;
        }

        try {
            // Send data to the backend using the exposed API
            const response = await window.api.addUser({ name, email });

            if (response.error) {
                alert(`Error: ${response.error}`);
                return;
            }

            // Clear input fields after successful submission
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';

            // Add the new user to the displayed list
            addUserToDisplay(response);
        } catch (error) {
            console.error('Error submitting user:', error);
            alert('Failed to submit user.');
        }
    });

    // Fetch and display users when the app loads
    async function fetchAndDisplayUsers() {
        try {
            const users = await window.api.fetchUsers();
            users.forEach((user) => addUserToDisplay(user));
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Failed to fetch users.');
        }
    }

    // Add a user to the display
    function addUserToDisplay(user) {
        const userEntry = document.createElement('div');
        userEntry.classList.add('user-entry');
        userEntry.innerHTML = `
            <strong>Name:</strong> ${user.name}<br>
            <strong>Address:</strong> ${user.email}
        `;
        dataDisplay.appendChild(userEntry);
    }

    // Load users on page load
    fetchAndDisplayUsers();
});
