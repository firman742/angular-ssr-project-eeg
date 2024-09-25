import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// Buat koneksi ke database MySQL
const db = mysql.createConnection({
  host: 'localhost', // Ganti dengan host database Anda
  user: 'root', // Ganti dengan username database Anda
  password: '', // Ganti dengan password database Anda
  database: 'eeg_data', // Ganti dengan nama database Anda
});

// Coba koneksi ke database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

// Fungsi untuk membuat aplikasi Express
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  // Middleware
  server.use(cors({
    origin: 'https://siap-belajar.taudashabulquran.com', // Ganti dengan domain frontend
    optionsSuccessStatus: 200
  }));
  server.use(bodyParser.json({ limit: '50mb' }));

  // API untuk mengambil data hasil EEG berdasarkan eeg_classification
  server.get('/api/eeg-result/:classificationId', (req, res) => {
    const classificationId = req.params.classificationId; // Ambil classification ID dari parameter URL

    const query = `
    SELECT
      s.nama AS kode_test,
      s.created_at AS tanggal,
      TIMESTAMPDIFF(MINUTE, s.end_time, s.start_time) AS jam,
      s.teacher AS guru,
      s.nis,
      si.nama AS nama_siswa,
      si.kode_disabilitas AS level,
      e.classification_result AS hasil_klasifikasi,
      e.probability AS probabilitas
    FROM
      eeg_classification e
    JOIN
      sessions s ON e.session_id = s.id
    WHERE
      e.id = ?;
  `;

    // Eksekusi query di database
    db.query(query, [classificationId], (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Pastikan untuk memberi tipe hasil query sebagai array
      const resultArray = results as Array<any>; // Ubah ini menjadi tipe yang sesuai jika perlu

      if (resultArray.length === 0) {
        return res.status(404).json({ error: 'Data not found' });
      }

      // Kirim hasil query sebagai respons API
      return res.json(resultArray[0]); // Mengirim hanya satu hasil (karena classification ID unik)
    });
  });

  // Endpoint API untuk mengambil data dari database
  server.get('/api/data', (req, res) => {
    const query = 'SELECT * FROM siswa'; // Ganti dengan nama tabel Anda

    db.query(query, (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error fetching data' });
      }
      return res.json(results);
    });
  });




  // API untuk menyimpan data sesi
  server.post('/api/sessions', (req, res) => {
    const { siswaId, deviceId, startTime, endTime, status, createdAt } = req.body;

    const query = 'INSERT INTO sessions (siswa_id, device_id, start_time, end_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [siswaId, deviceId, startTime, endTime, status, createdAt], (err, result) => {
      if (err) throw err;
      res.send({ success: true, sessionId: result });
    });
  });

  // API untuk menyimpan data klasifikasi EEG
  server.post('/api/eeg-classification', (req, res) => {
    const { sessionId, classificationResult, probability, createdAt } = req.body;

    const query = 'INSERT INTO eeg_classification (session_id, classification_result, probability, created_at) VALUES (?, ?, ?, ?)';
    db.query(query, [sessionId, classificationResult, probability, createdAt], (err, result) => {
      if (err) throw err;
      res.send({ success: true, message: 'EEG classification saved successfully!' });
    });
  });

  // API untuk menerima data EEG Signal dari frontend
  server.post('/api/eeg-signal', (req, res) => {
    const { sessionId, deviceId, eegValues } = req.body;
    const query = 'INSERT INTO eeg_signals (session_id, device_id, timestamp, eeg_values, created_at) VALUES ?';

    const values = eegValues.map((eeg: any) => [
      sessionId,
      deviceId,
      new Date(),
      JSON.stringify(eeg.eegValue), // Simpan sebagai JSON
      new Date(),
    ]);

    db.query(query, [values], (err, result) => {
      if (err) throw err;
      res.send({ success: true, message: 'EEG data saved successfully!' });
    });
  });

  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // Semua route reguler menggunakan Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

// Fungsi untuk menjalankan server
function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
