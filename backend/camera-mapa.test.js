const { test } = require('node:test');
const assert = require('node:assert/strict');

test('mapa: zoom ancorado, limites, arraste proporcional e pinça', async () => {
  const { ampliarCamera, cameraInicial, gestoCamera, limitarCamera, pontoNoMapa } = await import('../src/data/camera-mapa.ts');
  const c = ampliarCamera(cameraInicial, 2, { x: .25, y: .75 });
  assert.deepEqual(c, { zoom: 2, x: 75, y: 217.5 });
  assert.equal(c.x + .25 * 600 / c.zoom, .25 * 600);
  assert.deepEqual(ampliarCamera(c, .2), cameraInicial);
  assert.deepEqual(limitarCamera({ zoom: 8, x: -500, y: 1000 }), { zoom: 4, x: 0, y: 435 });
  assert.deepEqual(pontoNoMapa({ x: 500, y: 290 }, 1000, 580), { x: .5, y: .5 });
  const centro = ampliarCamera(cameraInicial, 2);
  const arraste = gestoCamera(centro, [{ x: 150, y: 145 }], [{ x: 180, y: 165 }], 300, 290);
  assert.deepEqual(arraste, { zoom: 2, x: 120, y: 125 });
  const pinca = gestoCamera(cameraInicial, [{ x: 100, y: 145 }, { x: 200, y: 145 }], [{ x: 50, y: 145 }, { x: 250, y: 145 }], 300, 290);
  assert.deepEqual(pinca, centro);
  assert.deepEqual(gestoCamera(centro, [{ x: 0, y: 0 }], [{ x: 3000, y: -3000 }], 300, 290), { zoom: 2, x: 0, y: 290 });
  assert.equal(gestoCamera(c, [], [], 0, 0), c);
});
