const express = require('express');
const router = express.Router();

// Handle NFC scan redirects with location capture
router.get('/scan', (req, res) => {
  const { x, n, e } = req.query;
  
  // If no parameters, show error
  if (!x || !n || !e) {
    return res.status(400).send('Invalid NFC parameters');
  }
  
  // Serve the location capture page
  // The static file will handle the location capture and redirect
  res.redirect(`/scan-redirect.html?x=${x}&n=${n}&e=${e}`);
});

module.exports = router;