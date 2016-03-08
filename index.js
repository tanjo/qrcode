var qr = require('qr-image');
var fs = require('fs');

var text;
if (process.argv.length < 3) {
  console.log('WARNING: node index.js xxxxxx');
  text = "https://www.google.com/";
} else {
  text = process.argv[2];
}

var png = qr.image(text, { type: 'png' });
png.pipe(fs.createWriteStream('qr.png'));
