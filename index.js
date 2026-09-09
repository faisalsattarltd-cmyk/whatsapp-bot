const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "arslan123";
const OPENAI_KEY = process.env.OPENAI_API_KEY;
app.get('/', (req,res)=> res.send('Bot Running'));
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else res.sendStatus(403);
});
app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || msg.type!== 'text') return res.sendStatus(200);
    const from = msg.from;
    const text = msg.text.body;
    const aiRes = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tum ek helpful WhatsApp assistant ho. Roman Urdu me short reply do." },
        { role: "user", content: text }
      ]
    }, { headers: { Authorization: `Bearer ${OPENAI_KEY}` } });
    const reply = aiRes.data.choices[0].message.content;
    const headers = { Authorization: `Bearer ${TOKEN}` };
    const url = `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`;
    await axios.post(url, { messaging_product: "whatsapp", to: from, text: { body: reply } }, { headers });
    if (from!== ADMIN_NUMBER) {
      const alertMsg = `🔔 NEW ALERT\nCustomer: ${from}\nBola: ${text}\nAI Reply: ${reply}`;
      await axios.post(url, { messaging_product: "whatsapp", to: ADMIN_NUMBER, text: { body: alertMsg } }, { headers });
    }
    res.sendStatus(200);
  } catch(e) { res.sendStatus(200); }
});
app.listen(process.env.PORT || 3000);
