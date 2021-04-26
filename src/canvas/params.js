export class CanvasParams {
  constructor(currentX, currentY, scale) {
    this._currentX = currentX;
    this._currentY = currentY;
    this._scale = scale;
  }

  get currentX() {
    return this._currentX;
  }

  get currentY() {
    return this._currentY;
  }

  get scale() {
    return this._scale;
  }
}
