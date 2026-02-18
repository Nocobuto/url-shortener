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
    try {
        await connectDB();

        const { alias } = req.query;

        const url = await Url.findOne({ alias });

        if (!url) {
            return res.status(404).send(`
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                text-align: center;
                                padding: 100px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                            }
                            h1 { font-size: 72px; margin: 0; }
                            p { font-size: 24px; }
                        </style>
                    </head>
                    <body>
                        <h1>404</h1>
                        <p>URL no encontrada</p>
                        <p><a href="/" style="color: white;">Volver al inicio</a></p>
                    </body>
                </html>
            `);
        }

        url.clicks += 1;
        await url.save();

        res.redirect(307, url.originalUrl);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error del servidor');
    }
}