// canvas坐标系换算至图片坐标系
export function canvas2PicCoor(x, y, currentX, currentY, scale) {
  let picX = -currentX / scale + x / scale;
  let picY = -currentY / scale + y / scale;
  return [picX, picY];
}

// 图片坐标系换算至canvas坐标系
export function pic2CanvasCoor(x, y, currentX, currentY, scale) {
  let canvasX = x * scale + currentX;
  let canvasY = y * scale + currentY;
  return [canvasX, canvasY];
}

export function clearCanvas(ctx, canvasWidth, canvasHeight) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

export function drawImage(ctx, img, currentX, currentY, scale = 1, deg = 0) {
  // 图片尺寸
  let imgW = img.width;
  let imgH = img.height;

  ctx.save();
  ctx.rotate(deg);

  ctx.drawImage(
    img,
    0,
    0,
    imgW,
    imgH,
    currentX,
    currentY,
    imgW * scale,
    imgH * scale
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
