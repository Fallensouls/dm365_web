// canvas坐标系换算至图片坐标系
export function canvas2PicCoor(x, y, canvas) {
  let picX = -canvas.currentX / canvas.scale + x / canvas.scale;
  let picY = -canvas.currentY / canvas.scale + y / canvas.scale;
  return [picX, picY];
}

// 图片坐标系换算至canvas坐标系
export function pic2CanvasCoor(x, y, canvas) {
  let canvasX = x * canvas.scale + canvas.currentX;
  let canvasY = y * canvas.scale + canvas.currentY;
  return [canvasX, canvasY];
}

export function clearCanvas(ctx, canvasWidth, canvasHeight) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

export function updateCurrentXY(
  x,
  y,
  canvasW,
  canvasH,
  imgW,
  imgH,
  oldScale,
  canvas
) {
  let { currentX, currentY, scale } = canvas;
  if (oldScale !== scale) {
    currentX = x + ((currentX - x) / oldScale) * scale;
    currentY = y + ((currentY - y) / oldScale) * scale;
  } else {
    currentX = -x + currentX;
    currentY = -y + currentY;
  }
  let w = canvasW - scale * imgW;
  let h = canvasH - scale * imgH;
  if (currentX < w) {
    currentX = w;
  }
  if (currentX > 0) {
    currentX = 0;
  }
  if (currentY < h) {
    currentY = h;
  }
  if (currentY > 0) {
    currentY = 0;
  }
  return [currentX, currentY];
}

export function drawImage(ctx, img, canvas) {
  // 图片尺寸
  let imgW = img.width;
  let imgH = img.height;

  ctx.save();

  ctx.drawImage(
    img,
    0,
    0,
    imgW,
    imgH,
    canvas.currentX,
    canvas.currentY,
    imgW * canvas.scale,
    imgH * canvas.scale
  ); //将图像画到画布上，规定左上角坐标(x,y)以及宽度、高度
  ctx.restore();
}

export function randomColorize(tagSet) {
  let colorsMap = new Map();
  let colors = randomColor({
    luminosity: "light",
    count: tagSet.length,
    hue: "random"
  });
  for (let i = 0; i < tagSet.length; i++) {
    colorsMap.set(tagSet[i], colors[i]);
  }
  return colorsMap;
}

var randomColor = require("randomcolor"); // import the script
