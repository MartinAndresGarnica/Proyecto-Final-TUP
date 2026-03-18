const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.get('/test', (req, res) => res.json({ok: true}));

const server = app.listen(3001, () => {
  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/test',
    method: 'GET',
    headers: {
      'Origin': 'http://evil.com'
    }
  }, (res) => {
    console.log("CORS isolation Headers:");
    console.log(res.headers);
    server.close();
  });
  req.end();
});
