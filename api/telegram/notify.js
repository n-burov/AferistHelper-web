// api/telegram/notify.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { type, title, description, url } = req.body;
    
    // Проверка конфигурации Telegram
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.warn('Telegram bot token not configured');
        return res.json({ success: false, message: 'Telegram bot not configured' });
    }

    // ID канала (можно задать через переменную окружения или хардкод)
    const CHAT_ID = process.env.TELEGRAM_CHANNEL_ID || '-1001648207680';
    
    const message = `📢 *Новый ${type} на сайте*\n\n*${title}*\n${description}\n\n🔗 [Открыть на сайте](${url})`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID, // Используем ID канала
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            })
        });

        const result = await response.json();
        
        if (result.ok) {
            console.log('Notification sent to channel successfully');
            res.json({ success: true, message: 'Notification sent to channel' });
        } else {
            console.error('Telegram API error:', result);
            
            // Особые ошибки для каналов
            if (result.description?.includes('not enough rights')) {
                res.json({ success: false, message: 'Бот не имеет прав для отправки в канал' });
            } else if (result.description?.includes('chat not found')) {
                res.json({ success: false, message: 'Канал не найден' });
            } else {
                res.json({ success: false, message: result.description });
            }
        }
    } catch (error) {
        console.error('Telegram error:', error);
        res.status(500).json({ error: 'Failed to send Telegram notification' });
    }
}
