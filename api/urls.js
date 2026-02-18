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
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Metodo no permitido' });
    }

    try {
        await connectDB();
        const urls = await Url.find().sort({ createdAt: -1 });
        res.json(urls);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
}