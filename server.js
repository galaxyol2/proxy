// server.js - Fixed version for Render
import { ChemicalServer } from "chemicaljs";
import express from "express";
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

// Chemical proxy configuration - FIXED
const chemical = new ChemicalServer({
    default: "uv",
    uv: true,
    scramjet: true
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for ChatGPT fallback
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

// IMPORTANT FIX: ChemicalJS mounts differently
app.use((req, res, next) => {
    // Let Chemical handle proxy requests
    if (req.url.startsWith('/service/') || req.url.includes('bare')) {
        return chemical.handleRequest(req, res);
    }
    next();
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 Your custom proxy is running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`\n✨ Features enabled:`);
    console.log(`   ✅ Ultraviolet proxy engine`);
    console.log(`   ✅ Scramjet fallback engine`);
    console.log(`   ✅ ChatGPT API fallback`);
    console.log(`   ✅ About:Blank cloaking ready`);
});
