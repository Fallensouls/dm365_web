import { canvas2PicCoor } from "@/canvas/util";

// 获取画框开始时对应的xy坐标
export function getOriginXY(event) {
  return [event.offsetX, event.offsetY];
}

export function updateXY(originX, originY, event) {
  let x = originX;
  let y = originY;
  let width, height;
  if (event.offsetX > originX) {
    width = event.offsetX - originX;
  } else {
    width = originX - event.offsetX;
    x = event.offsetX;
  }
  if (event.offsetY > originY) {
    height = event.offsetY - originY;
  } else {
    height = originY - event.offsetY;
    y = event.offsetY;
  }
  return [x, y, width, height];
}

export function getPolygon(canvasPolygon, picPolygon, canvas, event) {
  canvasPolygon.push([event.offsetX, event.offsetY]);
  picPolygon.push(canvas2PicCoor(event.offsetX, event.offsetY, canvas));
}
