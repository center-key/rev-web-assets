//! rev-web-assets ~~ MIT License

console.log('Mock #1');

const oneElem =  globalThis.document.querySelector('#one');
const metaElem = globalThis.document.querySelector('meta[property=og\\:image]');
const imgElem =  globalThis.document.querySelector('img');

oneElem.classList.add('hide-bad');
const ogImage = metaElem.getAttribute('content');
const revved = !/mock1\.jpg/.test(imgElem.getAttribute('src'));
const msg = ogImage.startsWith('https://') ?
   '✓ Absolute URL' : 'Try setting: --meta-content-base=https://example.net';
console.log('Open Graph Image:', ogImage, revved ? '[revved]' : '[not revved]', msg);
