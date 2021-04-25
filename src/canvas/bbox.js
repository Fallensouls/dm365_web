import { pic2CanvasCoor, canvas2PicCoor } from "@/canvas/util";

export function canvas2PicBBox(x, y, w, h, currentX, currentY, scale) {
  let [x1, y1] = canvas2PicCoor(x, y, currentX, currentY, scale);
  let [x2, y2] = canvas2PicCoor(x + w, y + h, currentX, currentY, scale);
  return [x1, y1, x2, y2];
}

export function drawBoundingBox(ctx, x, y, w, h) {
  ctx.strokeStyle = "#00FF7F";
  ctx.strokeRect(x, y, w, h);
}

export function drawMultipleBoundingBox(
  ctx,
  objectList,
  colorsMap,
  currentX,
  currentY,
  scale
) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1E90FF";
  ctx.font = "14px Arial";
  let x1, y1;
  let x2, y2;
  for (let i in objectList) {
    if (!objectList[i].display) {
      continue;
    }
    if (
      objectList[i].subimagex1 == 0 &&
      objectList[i].subimagey1 == 0 &&
      objectList[i].subimagex2 == 0 &&
      objectList[i].subimagey2 == 0
    ) {
      continue;
    }

    let color;
    if (colorsMap.has(objectList[i].title_cn)) {
      color = colorsMap.get(objectList[i].title_cn);
    } else {
      color = "#1E90FF";
    }
    ctx.strokeStyle = color;

    [x1, y1] = pic2CanvasCoor(
      objectList[i].subimagex1,
      objectList[i].subimagey1,
      currentX,
      currentY,
      scale
    );
    [x2, y2] = pic2CanvasCoor(
      objectList[i].subimagex2,
      objectList[i].subimagey2,
      currentX,
      currentY,
      scale
    );
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    if (objectList[i].title_cn != null) {
      let text = objectList[i].title_cn;
      let width = ctx.measureText(text).width;
      ctx.fillStyle = color;
      ctx.fillRect(x1 - 1, y1 - 20, width + 5, 20);
      ctx.fillStyle = "#000000";
      ctx.fillText(text, x1 - 1, y1 - 5);
    }
  }
}
