const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.delete('/delete-webhook', async (req, res) => {
	try {
		const { webhookUrl } = req.body;
		const response = await axios.delete(webhookUrl);
		res.json({ success: true, message: 'Webhook deleted successfully' });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Failed to delete webhook' });
	}
});

function startServer(port) {
	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	}).on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			console.log(`Port ${port} is busy, trying ${port + 1}`);
			startServer(port + 1);
		}
	});
}

startServer(3000);