import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
    alias: { type: String, required: true, unique: true },
    originalUrl: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

let Url = global.Url || mongoose.model('Url', urlSchema);
global.Url = Url;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(process.env.MONGODB_URI);
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo no permitido' });
    }

    try {
        await connectDB();

        const { originalUrl, alias } = req.body;

        if (!originalUrl) {
            return res.status(400).json({ error: 'URL requerida' });
        }

        const urlRegex = /^(https?:\/\/)/;
        if (!urlRegex.test(originalUrl)) {
            return res.status(400).json({ error: 'URL invalida' });
        }

        let finalAlias = alias;
        if (!finalAlias) {
            finalAlias = Math.random().toString(36).substring(2, 8);
        }

        if (!/^[a-zA-Z0-9-_]+$/.test(finalAlias)) {
            return res.status(400).json({ error: 'Alias invalido' });
        }

        const existing = await Url.findOne({ alias: finalAlias });
        if (existing) {
            return res.status(400).json({ error: 'Alias ya existe' });
        }

        const newUrl = new Url({
            alias: finalAlias,
            originalUrl: originalUrl
        });

        await newUrl.save();

        const domain = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';

        res.status(201).json({
            success: true,
            alias: finalAlias,
            shortUrl: `${domain}/${finalAlias}`,
            originalUrl: originalUrl
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
}