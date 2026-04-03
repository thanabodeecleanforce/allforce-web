const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

exports.lineLoginAuth = functions.https.onRequest(async (req, res) => {
    // อนุญาตให้หน้าเว็บเรียกใช้งานข้ามโดเมนได้ (CORS)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const code = req.body.code;
    if (!code) {
        return res.status(400).send({ error: 'ไม่พบรหัส Code จาก LINE' });
    }

    try {
        // 1. นำ Code ไปแลกเป็นตั๋วผ่านทาง (Access Token) จาก LINE
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://all-force.com/login.html', // ⚠️ ลิงก์ต้องตรงกับที่ตั้งไว้ใน LINE Developers
            client_id: '2009681620',       // ⚠️ เปลี่ยนเป็น Channel ID ของคุณ
            client_secret: '1c6bb3fcce22ddd62f8f3637cc12a73e'   // ⚠️ เปลี่ยนเป็น Channel Secret ของคุณ
        });

        const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', tokenParams);
        const accessToken = tokenResponse.data.access_token;

        // 2. นำตั๋วผ่านทาง ไปขอดึงข้อมูลโปรไฟล์ลูกค้า (ชื่อ, รูปโปรไฟล์)
        const profileResponse = await axios.get('https://api.line.me/v2/profile', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const lineProfile = profileResponse.data;
        const lineUserId = lineProfile.userId;

        // 3. สร้างรหัสประจำตัวลูกค้าใน Firebase (ถ้าเป็นลูกค้าใหม่)
        const firebaseUid = `line:${lineUserId}`;
        try {
            await admin.auth().getUser(firebaseUid);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                await admin.auth().createUser({
                    uid: firebaseUid,
                    displayName: lineProfile.displayName,
                    photoURL: lineProfile.pictureUrl
                });
            }
        }

        // 4. สร้าง "กุญแจผี (Custom Token)" แล้วส่งกลับไปให้หน้าเว็บเพื่อล็อกอิน
        const customToken = await admin.auth().createCustomToken(firebaseUid);
        res.status(200).send({ customToken: customToken });

    } catch (error) {
        console.error("Error connecting to LINE:", error.response ? error.response.data : error.message);
        res.status(500).send({ error: 'เกิดข้อผิดพลาดในการยืนยันตัวตนกับ LINE' });
    }
});