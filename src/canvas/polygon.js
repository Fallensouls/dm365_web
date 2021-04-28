import { pic2CanvasCoor, drawPoint, drawLine } from "@/canvas/util";

export function drawPolygonByPicCoors(ctx, coordinates, canvas, isClosed) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1E90FF";
  ctx.fillStyle = "#1E90FF";
  ctx.beginPath();
  let [x, y] = pic2CanvasCoor(
    coordinates[coordinates.length - 1][0],
    coordinates[coordinates.length - 1][1],
    canvas
  );
  let x0 = x;
  let y0 = y;
  let locStart, locEnd;
  for (let i = 0; i < coordinates.length; i++) {
    drawPoint(ctx, x, y);
    locStart = [x, y];
    [x, y] = pic2CanvasCoor(
      coordinates[coordinates.length - 1 - i][0],
      coordinates[coordinates.length - 1 - i][1],
      canvas
    );
    locEnd = [x, y];
    drawLine(ctx, locStart, locEnd);
  }
  drawPoint(ctx, x, y);
  if (isClosed) {
    ctx.lineTo(x0, y0);
  }
  ctx.stroke(); //描边
}

export function drawMultiplePolygon(ctx, objectList, colorsMap, canvas) {
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
    ctx.fillStyle = color;

    let [px, py] = pic2CanvasCoor(
      objectList[i].shape[0][0],
      objectList[i].shape[0][1],
      canvas
    );
    ctx.beginPath();
    let px0 = px;
    let py0 = py;
    let px1 = px;
    let py1 = py;
    let locStart, locEnd;
    for (let j = 1; j < objectList[i].shape.length; j++) {
      drawPoint(ctx, px, py);
      locStart = [px, py];
      [px, py] = pic2CanvasCoor(
        objectList[i].shape[j][0],
        objectList[i].shape[j][1],
        canvas
      );
      locEnd = [px, py];
      if (py1 > py) {
        py1 = py;
        px1 = px;
      }
      drawLine(ctx, locStart, locEnd);
    }
    drawPoint(ctx, px, py);
    ctx.lineTo(px0, py0);
    ctx.closePath();
    ctx.stroke(); //描边
    if (objectList[i].title_cn != null) {
      let text = objectList[i].title_cn;
      let width = ctx.measureText(text).width;
      ctx.fillRect(px1 - 1, py1 - 20, width + 5, 20);
      ctx.fillStyle = "#000000";
      ctx.fillText(text, px1 - 1, py1 - 5);
    }
  }
}
