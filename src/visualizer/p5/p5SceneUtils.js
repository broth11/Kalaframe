export function mountCanvas(p, getHost, isCurrent) {
  const host = getHost();
  const canvas = p.createCanvas(host.clientWidth, host.clientHeight);
  canvas.parent(host);
  if (!isCurrent()) {
    p.remove();
    return false;
  }
  host.querySelectorAll("canvas").forEach((element) => {
    if (element !== canvas.elt) element.remove();
  });
  return true;
}

export function resizeCanvasToHost(p, getHost) {
  const host = getHost();
  p.resizeCanvas(host.clientWidth, host.clientHeight);
}

export function drawGradient(p, top, bottom) {
  p.noStroke();
  for (let y = 0; y < p.height; y += 4) {
    const amount = y / Math.max(1, p.height);
    p.fill(
      p.lerp(top[0], bottom[0], amount),
      p.lerp(top[1], bottom[1], amount),
      p.lerp(top[2], bottom[2], amount),
    );
    p.rect(0, y, p.width, 4);
  }
}
