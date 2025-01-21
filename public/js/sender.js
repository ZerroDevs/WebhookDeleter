let templates = [];

// Load templates from localStorage
function loadTemplates() {
	const savedTemplates = localStorage.getItem('webhookTemplates');
	if (savedTemplates) {
		templates = JSON.parse(savedTemplates);
		updateTemplateSelect();
	}
}

// Update template select dropdown
function updateTemplateSelect() {
	const select = document.getElementById('templateSelect');
	select.innerHTML = '<option value="">Select a template</option>';
	templates.forEach((template, index) => {
		const option = document.createElement('option');
		option.value = index;
		option.textContent = template.name;
		select.appendChild(option);
	});
}

// Save current form as template
function saveTemplate() {
	const templateName = document.getElementById('templateName').value;
	if (!templateName) return;

	const template = {
		name: templateName,
		webhookUrl: document.getElementById('webhookUrl').value,
		username: document.getElementById('username').value,
		avatarUrl: document.getElementById('avatarUrl').value,
		message: document.getElementById('message').value,
		embedTitle: document.getElementById('embedTitle').value,
		embedColor: document.getElementById('embedColor').value,
		embedDescription: document.getElementById('embedDescription').value,
		embedImage: document.getElementById('embedImage').value,
		embedThumbnail: document.getElementById('embedThumbnail').value
	};

	templates.push(template);
	localStorage.setItem('webhookTemplates', JSON.stringify(templates));
	updateTemplateSelect();
	document.getElementById('templateName').value = '';
	document.getElementById('saveTemplate').checked = false;
}

// Load template into form
document.getElementById('templateSelect').addEventListener('change', function() {
	const selectedTemplate = templates[this.value];
	if (!selectedTemplate) return;

	document.getElementById('webhookUrl').value = selectedTemplate.webhookUrl;
	document.getElementById('username').value = selectedTemplate.username;
	document.getElementById('avatarUrl').value = selectedTemplate.avatarUrl;
	document.getElementById('message').value = selectedTemplate.message;
	document.getElementById('embedTitle').value = selectedTemplate.embedTitle;
	document.getElementById('embedColor').value = selectedTemplate.embedColor;
	document.getElementById('embedDescription').value = selectedTemplate.embedDescription;
	document.getElementById('embedImage').value = selectedTemplate.embedImage;
	document.getElementById('embedThumbnail').value = selectedTemplate.embedThumbnail;
});

// Delete selected template
function deleteTemplate() {
	const select = document.getElementById('templateSelect');
	const index = select.value;
	if (index === '') return;

	templates.splice(index, 1);
	localStorage.setItem('webhookTemplates', JSON.stringify(templates));
	updateTemplateSelect();
}

// Preview message
function previewMessage() {
	const preview = document.getElementById('preview');
	const message = {
		content: document.getElementById('message').value,
		username: document.getElementById('username').value,
		avatar_url: document.getElementById('avatarUrl').value,
		embeds: [{
			title: document.getElementById('embedTitle').value,
			description: document.getElementById('embedDescription').value,
			color: parseInt(document.getElementById('embedColor').value.replace('#', ''), 16),
			image: { url: document.getElementById('embedImage').value },
			thumbnail: { url: document.getElementById('embedThumbnail').value }
		}]
	};

	preview.innerHTML = `<pre>${JSON.stringify(message, null, 2)}</pre>`;
	preview.classList.add('show');
}

// Schedule message
async function scheduleMessage() {
	const scheduleTime = document.getElementById('scheduleTime').value;
	const repeatInterval = document.getElementById('repeatInterval').value;
	if (!scheduleTime) {
		showMessage('Please select a schedule time', 'error');
		return;
	}

	const message = {
		webhookUrl: document.getElementById('webhookUrl').value,
		content: document.getElementById('message').value,
		username: document.getElementById('username').value,
		avatar_url: document.getElementById('avatarUrl').value,
		embeds: [{
			title: document.getElementById('embedTitle').value,
			description: document.getElementById('embedDescription').value,
			color: document.getElementById('embedColor').value,
			image: { url: document.getElementById('embedImage').value },
			thumbnail: { url: document.getElementById('embedThumbnail').value }
		}],
		scheduleTime,
		repeatInterval
	};

	try {
		const response = await fetch('/schedule-webhook', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${await getAuthToken()}`
			},
			body: JSON.stringify(message)
		});

		const data = await response.json();
		showMessage(data.message, data.success ? 'success' : 'error');
	} catch (error) {
		showMessage('Failed to schedule message', 'error');
	}
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
	loadTemplates();
});

// Save template when checkbox is checked
document.getElementById('saveTemplate').addEventListener('change', function() {
	if (this.checked) {
		saveTemplate();
	}
});
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