const express = require('express');
const multer = require('multer');
const tf = require('@tensorflow/tfjs-node');
const nsfwjs = require('nsfwjs');

const app = express();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

let model;

// Load model once
(async () => {
  console.log('Loading NSFW model...');
  model = await nsfwjs.load();
  console.log('NSFW model loaded');
})();

app.get('/', (req, res) => {
  res.send('NSFW API online');
});

app.post('/scan', upload.single('image'), async (req, res) => {
  try {
    if (!model) {
      return res.status(503).json({ error: 'Model not ready' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const image = tf.node.decodeImage(req.file.buffer, 3);
    const predictions = await model.classify(image);
    image.dispose();

    res.json({
      safe: predictions.every(
        p => p.className !== 'Porn' && p.className !== 'Hentai'
      ),
      predictions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scan failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
