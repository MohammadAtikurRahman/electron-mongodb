document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('userForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const submitButton = userForm.querySelector('button[type="submit"]');
    const errorDisplay = document.getElementById('errorDisplay'); // Add an error section in HTML

    // Submit form event
    userForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Clear previous error messages
        errorDisplay.textContent = '';
        nameInput.disabled = true;
        emailInput.disabled = true;
        submitButton.disabled = true;

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (!name || !email) {
            showError('Please fill in all fields.');
            resetFormState();
            return;
        }

        try {
            const response = await window.api.addUser({ name, email });

            if (!response.success) {
                showError(response.error);
                resetFormState();
                return;
            }

            // Clear the form
            nameInput.value = '';
            emailInput.value = '';

            // Add the user to the display
            addUserToDisplay(response.user);
        } catch (error) {
            console.error('Error submitting user:', error);
            showError('An unexpected error occurred. Please try again.');
        } finally {
            // Re-enable inputs and button after completion
            resetFormState();
        }
    });

    // Function to show error messages
    function showError(message) {
        errorDisplay.textContent = message;
        errorDisplay.style.color = 'red';
    }

    // Function to reset the form state
    function resetFormState() {
        nameInput.disabled = false;
        emailInput.disabled = false;
        submitButton.disabled = false;
    }

    // Add user to the display
    function addUserToDisplay(user) {
        const userEntry = document.createElement('div');
        userEntry.classList.add('user-entry');
        userEntry.innerHTML = `
            <strong>Name:</strong> ${user.name}<br>
            <strong>Email:</strong> ${user.email}<br>
            <strong>Created At:</strong> ${new Date(user.createdAt).toLocaleString()}
        `;
        document.getElementById('dataDisplay').appendChild(userEntry);
    }
});
