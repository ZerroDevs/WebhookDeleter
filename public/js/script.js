async function deleteWebhook() {
	const webhookUrl = document.getElementById('webhookUrl').value.trim();
	const messageDiv = document.getElementById('message');
	
	if (!webhookUrl) {
		showMessage('Please enter a webhook URL', false);
		return;
	}

	if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
		showMessage('Invalid Discord webhook URL', false);
		return;
	}

	try {
		const response = await fetch('/delete-webhook', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ webhookUrl })
		});

		const data = await response.json();
		showMessage(data.message, data.success);
		
		if (data.success) {
			document.getElementById('webhookUrl').value = '';
		}
	} catch (error) {
		showMessage('Failed to delete webhook', false);
	}
}

function showMessage(message, isSuccess) {
	const messageDiv = document.getElementById('message');
	messageDiv.textContent = message;
	messageDiv.className = 'message ' + (isSuccess ? 'success' : 'error');
	setTimeout(() => {
		messageDiv.textContent = '';
		messageDiv.className = 'message';
	}, 3000);
}