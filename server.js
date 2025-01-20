const express = require('express');
const axios = require('axios');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.use(express.json());
app.use(express.static('public'));

// CORS middleware with proper configuration for Supabase
app.use((req, res, next) => {
	const allowedOrigins = [
		'http://localhost:3000',
		'http://localhost:3001',
		'http://localhost:3002',
		'http://localhost:3003',
		process.env.SUPABASE_URL
	];
	
	const origin = req.headers.origin;
	if (allowedOrigins.includes(origin)) {
		res.header('Access-Control-Allow-Origin', origin);
	}
	
	res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.header('Access-Control-Allow-Credentials', 'true');
	
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1];
	if (!token) {
		return res.status(401).json({ error: 'No token provided' });
	}

	try {
		const { data: { user }, error } = await supabase.auth.getUser(token);
		if (error) throw error;
		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({ error: 'Invalid token' });
	}
};

// Public route for webhook deletion
app.delete('/delete-webhook', async (req, res) => {
	try {
		const { webhookUrl } = req.body;
		const response = await axios.delete(webhookUrl);
		res.json({ success: true, message: 'Webhook deleted successfully' });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Failed to delete webhook' });
	}
});

// Protected route for webhook message sending
app.post('/send-webhook', authenticateUser, async (req, res) => {
	try {
		const { webhookUrl, message } = req.body;
		const response = await axios.post(webhookUrl, message);
		res.json({ success: true, message: 'Message sent successfully' });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Failed to send message' });
	}
});

// Add endpoint to provide Supabase credentials
app.get('/config', (req, res) => {
	res.json({
		supabaseUrl: process.env.SUPABASE_URL,
		supabaseKey: process.env.SUPABASE_ANON_KEY
	});
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