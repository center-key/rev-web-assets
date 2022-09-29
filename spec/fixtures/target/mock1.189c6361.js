//! rev-web-assets ~~ MIT License

console.log('Mock #1');

document.querySelector('#one').classList.add('hide-bad');

const ogImage = document.querySelector('meta[property=og\\:image]').getAttribute('content');
const revved = !/mock1\.jpg/.test(document.querySelector('img').getAttribute('src'));
const msg = ogImage.startsWith('https://') ?
   '✓ Absolute URL' : 'Try setting: --meta-content-base=https://example.net';
console.log('Open Graph Image:', ogImage, revved ? '[revved]' : '[not revved]', msg);
