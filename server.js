// server.js - Your custom proxy with ChatGPT support
import { ChemicalServer } from "chemicaljs";
import express from "express";
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Chemical proxy configuration
const chemical = new ChemicalServer({
    default: "uv",
    uv: true,
    scramjet: true,
    ws: true,  // Enable WebSocket support
    transport: "libcurl",  // Better for ChatGPT
    // Optional: Block known tracking domains
    hostname_blacklist: [
        /doubleclick\.net/,
        /google-analytics\.com/
    ]
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for ChatGPT fallback (if needed)
app.get('/api/chat', express.json(), async (req, res) => {
    const { prompt, apiKey } = req.query;
    
    if (!apiKey) {
        return res.json({ 
            error: 'No API key provided. Get one at platform.openai.com/api-keys' 
        });
    }
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'ChatGPT API error' });
    }
});

// Handle WebSocket upgrades for ChatGPT
server.on('upgrade', (request, socket, head) => {
    const url = request.url || '';
    
    // Check if this is a ChatGPT WebSocket connection
    if (url.includes('chat.openai.com') || url.includes('wss://') || url.includes('backend-api')) {
        // Let Chemical handle it with WebSocket support
        if (chemical.ws?.handleUpgrade) {
            chemical.ws.handleUpgrade(request, socket, head);
        } else {
            socket.destroy();
        }
    } else {
        // Let Chemical handle other WebSocket connections
        if (chemical.ws?.handleUpgrade) {
            chemical.ws.handleUpgrade(request, socket, head);
        } else {
            socket.destroy();
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Proxy error:', err);
    res.status(500).send('Something broke!');
});

// Start the server
chemical.use(app);
chemical.listen(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 Your custom proxy is running!`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌍 Ready for deployment on Render`);
    console.log(`\n✨ Features enabled:`);
    console.log(`   ✅ Ultraviolet proxy engine`);
    console.log(`   ✅ Scramjet fallback engine`);
    console.log(`   ✅ WebSocket support for ChatGPT`);
    console.log(`   ✅ About:Blank cloaking ready`);
    console.log(`\n📝 Add your Render domain and free ZoneABC domain next!\n`);
});
