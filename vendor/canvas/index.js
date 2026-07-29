class DOMMatrix {
  constructor(init = undefined) {
    this._init = init;
  }
}

class Path2D {
  constructor(path = "") {
    this.path = path;
  }
}

class CanvasRenderingContext2D {}

class ImageData {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

function createCanvas(width = 1, height = 1) {
  return {
    width,
    height,
    getContext() {
      return null;
    },
    toBuffer() {
      return Buffer.alloc(0);
    },
  };
}

module.exports = {
  DOMMatrix,
  Path2D,
  CanvasRenderingContext2D,
  ImageData,
  createCanvas,
};
