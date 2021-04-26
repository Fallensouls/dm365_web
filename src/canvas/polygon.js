import { pic2CanvasCoor } from "@/canvas/util";

export function drawPolygonByCanvasCoors(ctx, x, y, isStart) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1E90FF";
  if (isStart) {
    ctx.beginPath();
    ctx.moveTo(x, y);
  } else {
    ctx.lineTo(x, y);
    ctx.stroke(); //描边
  }
}

export function drawPolygonByPicCoors(
  ctx,
  coordinates,
  canvas,
  isClosed = false
) {
  ctx.beginPath();
  let [x, y] = pic2CanvasCoor(
    coordinates[coordinates.length - 1][0],
    coordinates[coordinates.length - 1][1],
    canvas
  );
  ctx.moveTo(x, y);
  for (let i = 0; i < coordinates.length; i++) {
    [x, y] = pic2CanvasCoor(
      coordinates[coordinates.length - 1 - i][0],
      coordinates[coordinates.length - 1 - i][1],
      canvas
    );
    ctx.lineTo(x, y);
  }
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1E90FF";
  if (isClosed) {
    ctx.closePath();
  }
  ctx.stroke(); //描边
}

export function drawMultiplePolygon(ctx, objectList, colorsMap, canvas) {
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.font = "14px Arial";
  for (let i = 0; i < objectList.length; i++) {
    if (
      !objectList[i].display ||
      objectList[i].shape == null ||
      objectList[i].shape.length == 0
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

    let [px, py] = pic2CanvasCoor(
      objectList[i].shape[0][0],
      objectList[i].shape[0][1],
      canvas
    );
    ctx.moveTo(px, py);
    let px0 = px;
    let py0 = py;
    let px1 = px;
    let py1 = py;
    for (let j = 1; j < objectList[i].shape.length; j++) {
      [px, py] = pic2CanvasCoor(
        objectList[i].shape[j][0],
        objectList[i].shape[j][1],
        canvas
      );
      ctx.lineTo(px, py);
      if (py1 > py) {
        py1 = py;
        px1 = px;
      }
    }
    ctx.lineTo(px0, py0);

    if (objectList[i].title_cn != null) {
      let text = objectList[i].title_cn;
      let width = ctx.measureText(text).width;
      ctx.fillStyle = color;
      ctx.fillRect(px1 - 1, py1 - 20, width + 5, 20);
      ctx.fillStyle = "#000000";
      ctx.fillText(text, px1 - 1, py1 - 5);
    }
  }
  ctx.closePath();
  ctx.stroke(); //描边
}
