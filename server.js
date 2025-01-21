const express = require('express');
const axios = require('axios');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Store scheduled tasks
const scheduledTasks = new Map();

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

// Schedule webhook message
app.post('/schedule-webhook', authenticateUser, async (req, res) => {
    try {
        const { webhookUrl, content, username, avatar_url, embeds, scheduleTime, repeatInterval } = req.body;
        const userId = req.user.id;
        const taskId = `${userId}-${Date.now()}`;

        const message = { content, username, avatar_url, embeds };
        const scheduleTimestamp = new Date(scheduleTime).getTime();

        if (scheduleTimestamp < Date.now()) {
            return res.status(400).json({ success: false, message: 'Cannot schedule messages in the past' });
        }

        let cronExpression;
        switch (repeatInterval) {
            case 'daily':
                cronExpression = `${new Date(scheduleTime).getMinutes()} ${new Date(scheduleTime).getHours()} * * *`;
                break;
            case 'weekly':
                cronExpression = `${new Date(scheduleTime).getMinutes()} ${new Date(scheduleTime).getHours()} * * ${new Date(scheduleTime).getDay()}`;
                break;
            case 'monthly':
                cronExpression = `${new Date(scheduleTime).getMinutes()} ${new Date(scheduleTime).getHours()} ${new Date(scheduleTime).getDate()} * *`;
                break;
            default:
                // One-time schedule
                setTimeout(async () => {
                    try {
                        await axios.post(webhookUrl, message);
                        scheduledTasks.delete(taskId);
                    } catch (error) {
                        console.error(`Failed to send scheduled message: ${error.message}`);
                    }
                }, scheduleTimestamp - Date.now());
                
                scheduledTasks.set(taskId, { userId, webhookUrl, message, scheduleTime, repeatInterval: null });
                return res.json({ success: true, message: 'Message scheduled successfully' });
        }

        // Set up recurring task
        const task = cron.schedule(cronExpression, async () => {
            try {
                await axios.post(webhookUrl, message);
            } catch (error) {
                console.error(`Failed to send scheduled message: ${error.message}`);
            }
        });

        scheduledTasks.set(taskId, { userId, webhookUrl, message, scheduleTime, repeatInterval, task });
        res.json({ success: true, message: 'Message scheduled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to schedule message' });
    }
});

// Get user's scheduled messages
app.get('/scheduled-messages', authenticateUser, (req, res) => {
    const userId = req.user.id;
    const userTasks = Array.from(scheduledTasks.entries())
        .filter(([_, task]) => task.userId === userId)
        .map(([id, task]) => ({
            id,
            webhookUrl: task.webhookUrl,
            scheduleTime: task.scheduleTime,
            repeatInterval: task.repeatInterval
        }));

    res.json({ success: true, tasks: userTasks });
});

// Delete scheduled message
app.delete('/scheduled-message/:taskId', authenticateUser, (req, res) => {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = scheduledTasks.get(taskId);
    if (!task || task.userId !== userId) {
        return res.status(404).json({ success: false, message: 'Scheduled message not found' });
    }

    if (task.task) {
        task.task.stop();
    }
    scheduledTasks.delete(taskId);

    res.json({ success: true, message: 'Scheduled message deleted successfully' });
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