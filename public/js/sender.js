// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
	const { data: { session } } = await supabase.auth.getSession();
	if (!session) {
		window.location.href = '/';
	}
});

async function sendWebhookMessage() {
	const webhookUrl = document.getElementById('webhookUrl').value.trim();
	const username = document.getElementById('username').value.trim();
	const avatarUrl = document.getElementById('avatarUrl').value.trim();
	const message = document.getElementById('message').value.trim();
	const embedTitle = document.getElementById('embedTitle').value.trim();
	const embedColor = document.getElementById('embedColor').value.trim();
	const embedDescription = document.getElementById('embedDescription').value.trim();

	if (!webhookUrl) {
		showMessage('Please enter a webhook URL', false);
		return;
	}

	if (!message && !embedTitle && !embedDescription) {
		showMessage('Please enter a message or embed content', false);
		return;
	}

	const payload = {
		webhookUrl,
		message: {
			content: message,
			username: username || undefined,
			avatar_url: avatarUrl || undefined
		}
	};

	if (embedTitle || embedDescription) {
		payload.message.embeds = [{
			title: embedTitle || undefined,
			description: embedDescription || undefined,
			color: embedColor ? parseInt(embedColor.replace('#', ''), 16) : undefined
		}];
	}

	try {
		const response = await fetch('/send-webhook', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.getAuthToken()}`
			},
			body: JSON.stringify(payload)
		});

		const data = await response.json();
		if (data.success) {
			showMessage('Message sent successfully!', true);
			clearForm();
		} else {
			throw new Error(data.message || 'Failed to send message');
		}
	} catch (error) {
		showMessage(error.message || 'Failed to send message', false);
	}
}

function showMessage(text, isSuccess) {
	const messageDiv = document.getElementById('message');
	messageDiv.textContent = text;
	messageDiv.className = 'message ' + (isSuccess ? 'success' : 'error');
	setTimeout(() => {
		messageDiv.textContent = '';
		messageDiv.className = 'message';
	}, 3000);
}

function clearForm() {
	document.getElementById('message').value = '';
	document.getElementById('embedTitle').value = '';
	document.getElementById('embedColor').value = '';
	document.getElementById('embedDescription').value = '';
}