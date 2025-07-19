/**
 * purpose: proxy to get original high res images from drive. doesn't do anything unless u run server.js
 * to run this:
 * install node.js + dependencies (express and node-fetch)
 * run server locally w/ server.js
 * server is on localhost:3000
 * to use proxy in HTML, change image urls from https://drive.google.com/thumbnail?id=FILE_ID to http://localhost:3000/FILE_ID
 */

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(404).send('Image not found');
    }

    res.setHeader('Content-Type', response.headers.get('content-type'));
    response.body.pipe(res);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
