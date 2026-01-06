// api/telegram/notify.js
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { type, title, description, url } = req.body;
    
    // Проверка конфигурации Telegram
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        console.warn('Telegram not configured - skipping notification');
        return res.json({ success: false, message: 'Telegram not configured' });
    }

    const message = `📢 *Новый ${type}*\n\n*${title}*\n${description}\n\n🔗 [Открыть на сайте](${url})`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            })
        });

        const result = await response.json();
        
        if (result.ok) {
            res.json({ success: true, message: 'Notification sent successfully' });
        } else {
            console.error('Telegram API error:', result);
            res.json({ success: false, message: result.description });
        }
    } catch (error) {
        console.error('Telegram error:', error);
        res.status(500).json({ error: 'Failed to send Telegram notification' });
    }
}
