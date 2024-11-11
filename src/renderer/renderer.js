// src/renderer/renderer.js
document.getElementById('userForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;

    try {
        const response = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, address }),
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fetchData(); // Fetch and display the latest data after submission
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert('Error: Could not submit data');
    }
});

// Function to fetch and display data
async function fetchData() {
    try {
        const response = await fetch('http://localhost:3000/api/users');
        const data = await response.json();
        
        const displayArea = document.getElementById('dataDisplay');
        displayArea.innerHTML = '<h2>Submitted Users</h2>';
        
        data.forEach(user => {
            displayArea.innerHTML += `<p><strong>Name:</strong> ${user.name} <br><strong>Address:</strong> ${user.address}</p><hr>`;
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Initial fetch to display existing data on page load
fetchData();
