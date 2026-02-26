const QRCode = require('qrcode');

exports.generateQR = async (req, res) => {
  const url = 'http://localhost:3000/menu';  // Change to your production URL
  try {
    const qr = await QRCode.toDataURL(url);
    res.json({ qr });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};