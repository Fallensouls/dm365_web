<template>
  <div class="app-container">
    <div class="first">
      <div class="clip-image">
        <canvas
          id="imageCanvas"
          class="canvas"
          ref="ctx"
          :width="clip.width"
          :height="clip.height"
        >
        </canvas>

        <canvas
          id="labelCanvas"
          ref="ctx"
          :width="clip.width"
          :height="clip.height"
        >
        </canvas>
      </div>

      <div class="property" style=" margin-top:13px">
        <span>
          <el-button type="primary" size="mini" @click="cancel()"
            >返回</el-button
          >
        </span>
        <span class="center"> 缩放倍率：{{ scale }} </span>
        <span class="right">
          <el-button type="primary" size="mini" @click="reset()"
            >重置</el-button
          ></span
        >
      </div>

      <br />
      <div class="property">
        <el-tag>文件名 : {{ image.filename }}</el-tag>
        <el-tag style="margin-left: 12px;"
          >图片大小 : {{ image.width }} * {{ image.height }}</el-tag
        >
        <el-tag style="margin-left: 12px;"
          >上传日期 : {{ image.crtdate }}
        </el-tag>
        <el-tag style="margin-left: 12px;"
          >更新日期 : {{ image.upddate }}
        </el-tag>
      </div>
    </div>

    <div class="second" style="margin-right:-4px;">
      <p style="text-align:center">已保存的目标</p>
      <el-table :data="objectList" stripe border style="width: 100%">
        <el-table-column label="目标类别" prop="title_cn" align="center">
        </el-table-column>

        <el-table-column
          prop="objkeypoint"
          label="坐标点"
          align="center"
          width="300"
        >
        </el-table-column>

        <el-table-column label="操作" align="center" width="250">
          <template slot-scope="scope">
            <el-row>
              <el-switch
                v-model="scope.row.display"
                active-text="显示"
                inactive-text="不显示"
                @change="display()"
              >
              </el-switch>
            </el-row>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import * as _dataset from "@/api/dm365/dataset";
import * as _image from "@/api/dm365/image";
import * as _tag from "@/api/dm365/tag";
import { getFile } from "@/api/node/file";

import { CanvasParams } from "@/canvas/params";
import {
  clearCanvas,
  drawImage,
  updateCurrentXY,
  randomColorize
} from "@/canvas/util";
import { drawMultipleBoundingBox } from "@/canvas/bbox";
import { drawMultiplePolygon } from "@/canvas/polygon";

export default {
  props: {
    src: {
      type: String,
      default: null
    },
    clip: {
      type: Object,
      default() {
        return { width: "750px", height: "650px" };
      }
    }
  },
  data: () => ({
    image: [],
    imgsrc: null,
    img: null,
    objectList: [],
    tagSet: [], // 不重复的标签名称集合
    datasetTags: [], // 数据集所包含的所有标签，用于提供选择
    imageCanvas: null, // 绘制原始图像的canvas层
    imgCtx: null,
    labelCanvas: null, // 绘制确定标注的canvas层
    labelCtx: null,
    loading: false,
    scale: 1, //放大比例
    deg: 0, //旋转角度
    originX: 0, //鼠标按下时的起点坐标
    originY: 0,
    currentX: 0,
    currentY: 0,
    colorsMap: null
  }),

  methods: {
    // canvas code
    initCanvas() {
      this.imageCanvas = document.getElementById("imageCanvas");
      this.imgCtx = this.imageCanvas.getContext("2d");
      this.labelCanvas = document.getElementById("labelCanvas");
      this.labelCtx = this.labelCanvas.getContext("2d");
    },

    setCanvas() {
      const { $options, $refs, width, height } = this;
      // 初始化 canvas的nX和nY
      Object.assign($options, {
        nX: -width / 2,
        nY: -height / 2
      });
      this.drawOriginalImage();
      this.drawAnnotations();
    },

    reset() {
      this.currentX = 0;
      this.currentY = 0;
      this.scale = 1;
      let { width, height } = this;
      clearCanvas(this.imgCtx, width, height);
      clearCanvas(this.labelCtx, width, height);
      this.drawOriginalImage();
      this.drawAnnotations();
    },

    // 保证平移和缩放时图像和标注的不变性
    handlePanAndZoom() {
      var _this = this;
      var canvas = this.labelCanvas;
      canvas.onmousedown = function(event) {
        if (_this.isLabelBBox || _this.isLabelPolygon) {
          return;
        }
        var bbox = canvas.getBoundingClientRect();
        var x = event.clientX - bbox.left * (canvas.width / bbox.width);
        var y = event.clientY - bbox.top * (canvas.height / bbox.height);
        this.moveFlag = true;
        this.moveStartx = x;
        this.moveStarty = y;
      };
      canvas.onmousemove = function(event) {
        var bbox = canvas.getBoundingClientRect();
        if (this.moveFlag) {
          var moveDisx =
            event.clientX -
            bbox.left * (canvas.width / bbox.width) -
            this.moveStartx;
          var moveDisy =
            event.clientY -
            bbox.top * (canvas.height / bbox.height) -
            this.moveStarty;
          _this.drawImage(_this.img, -moveDisx, -moveDisy, _this.scale);
          _this.drawAnnotations();
          this.moveStartx += moveDisx;
          this.moveStarty += moveDisy;
        }
      };

      canvas.onmouseup = function() {
        this.moveFlag = false;
      };

      canvas.onmousewheel = canvas.onwheel = function(event) {
        //滚轮放大缩小
        if (!this.moveFlag) {
          var wheelDelta = event.wheelDelta
            ? event.wheelDelta
            : event.deltalY * -40; //获取当前鼠标的滚动情况
          var bbox = canvas.getBoundingClientRect();
          var x = event.clientX - bbox.left * (canvas.width / bbox.width);
          var y = event.clientY - bbox.top * (canvas.height / bbox.height);
          var scale_new;
          if (wheelDelta > 0) {
            // 放大时，每次放大到原来的1.1倍
            scale_new = _this.scale * 1.1; //注意，我的缩放是以左上角位置为中心进行缩放的，如果要以图片中心为缩放点，需要修改 imgX，imgY的值
          } else {
            if (_this.scale > 0.01) {
              // 缩小到原来的0.9倍
              scale_new = _this.scale * 0.9;
            }
          }
          _this.drawImage(_this.img, x, y, scale_new, 0, true); //重新绘制图片
          _this.drawAnnotations();
          // event.preventDefault  && event.preventDefault(); // 阻止默认事件，可能在滚动的时候，浏览器窗口也会滚动
        }
      };
    },

    // image
    drawOriginalImage() {
      //加载初始图片，将其显示在canvas上
      var imgObj = new Image();
      imgObj.src = this.imgsrc;
      imgObj.onload = function() {
        var cvs = document.getElementById("imageCanvas");
        var ctx = cvs.getContext("2d");
        ctx.drawImage(imgObj, 0, 0);
      };
      this.img = imgObj;
    },

    drawImage(img, x = 0, y = 0, scale = 1, deg = 0, isScale = false) {
      let { width, height } = this;
      clearCanvas(this.imgCtx, width, height);
      let params = new CanvasParams(this.currentX, this.currentY, scale);
      [this.currentX, this.currentY] = updateCurrentXY(
        x,
        y,
        width,
        height,
        img.width,
        img.height,
        this.scale,
        params
      );
      params = new CanvasParams(this.currentX, this.currentY, scale);
      drawImage(this.imgCtx, img, params);
      this.scale = scale;
    },

    drawBoundingBoxes() {
      let params = new CanvasParams(this.currentX, this.currentY, this.scale);
      drawMultipleBoundingBox(
        this.labelCtx,
        this.objectList,
        this.colorsMap,
        params
      );
    },

    drawPolygons() {
      let params = new CanvasParams(this.currentX, this.currentY, this.scale);
      drawMultiplePolygon(
        this.labelCtx,
        this.objectList,
        this.colorsMap,
        params
      );
    },

    // draw all annotations, including bboxes and polygons
    drawAnnotations() {
      const { width, height } = this;
      clearCanvas(this.labelCtx, width, height);
      this.drawBoundingBoxes();
      this.drawPolygons();
    },

    // data
    async initData() {
      this.loading = true;
      this.image = await _image.getImage(this.$route.params.id);
      let response = await _dataset.getDatasetRelatedTags(this.image.datasetid);
      response.sort(function(a, b) {
        return a.title_en > b.title_en;
      });
      this.datasetTags = response;

      response = await getFile(this.image.storageobjectid);
      const blob = new Blob([response]);
      if (!blob) {
        this.$notify({
          title: "警告",
          message: "无法获取文件！",
          type: "warning"
        });
      }
      this.imgsrc = URL.createObjectURL(blob);
      await this.getObjectList();
      this.loading = false;
    },

    async getObjectList() {
      let objectList = (await _image.getSubImages(this.$route.params.id))[
        "content"
      ];
      for (let i in objectList) {
        objectList[i].display = true;
        if (objectList[i].tags.length > 0) {
          objectList[i].title_cn = objectList[i].tags[0].title_cn;
          this.tagSet[i] = objectList[i].tags[0].title_cn;
        }
        var x1 = objectList[i].subimagex1;
        var x2 = objectList[i].subimagex2;
        var y1 = objectList[i].subimagey1;
        var y2 = objectList[i].subimagey2;
        objectList[
          i
        ].objkeypoint = `left: ${x1} top: ${y1} right: ${x2} bottom: ${y2}`;
        if (objectList[i].shape.length > 0) {
          let keypoint_str = "";
          let shape = [];
          var x, y;
          for (let j in objectList[i].shape) {
            if (j % 2 == 0) {
              shape.push([x, y]);
              x = objectList[i].shape[j];
              keypoint_str = keypoint_str + "(" + String(x) + " ";
            } else {
              y = objectList[i].shape[j];
              keypoint_str = keypoint_str + String(y) + ") ";
            }
          }
          shape.push([x, y]);
          shape.splice(0, 1);
          objectList[i].shape = shape;
          objectList[i].objkeypoint = keypoint_str;
        }
      }
      this.objectList = objectList;
      this.tagSet = Array.from(new Set(this.tagSet));
      this.colorsMap = randomColorize(this.tagSet);
    },

    cancel() {
      this.$router.replace("/dataset");
    },

    display() {
      this.drawAnnotations();
    }
  },

  computed: {
    width() {
      const { clip } = this;
      return parseFloat(clip.width.replace("px", ""));
    },
    height() {
      const { clip } = this;
      return parseFloat(clip.height.replace("px", ""));
    }
  },
  async mounted() {
    // 动态设置canvas元素的宽和高
    const { clip } = this;
    var w = (document.documentElement.clientWidth - 260) * 0.55;
    var h = 0.7 * window.screen.height;
    clip.width = `${w}px`;
    clip.height = `${h}px`;
    let that = this;
    window.onresize = function temp() {
      var w = (document.documentElement.clientWidth - 260) * 0.55;
      var h = 0.7 * window.screen.height;
      clip.width = `${w}px`;
      clip.height = `${h}px`;
      that.setCanvas();
    };
    this.initCanvas();
    await this.initData();
    this.setCanvas();
    this.handlePanAndZoom();
  }
};
</script>

<!--###############################################################################-->
<style lang="scss" scoped>
.first {
  width: 55%;
  float: left;
}
.second {
  width: 45%;
  float: left;
}
.anchor {
  cursor: pointer;
  font-size: 16px;
}
.actions {
  margin-bottom: 8px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  .el-button {
    margin-right: 8px;
  }

  .el-select {
    width: 150px;
  }
  .el-input {
    width: 250px;
    margin-left: 12px;
  }
  .el-row {
    margin-bottom: 20px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .el-col {
    border-radius: 4px;
  }
  .bg-purple-dark {
    background: #99a9bf;
  }
  .bg-purple {
    background: #d3dce6;
  }
  .bg-purple-light {
    background: #e5e9f2;
  }
  .grid-content {
    border-radius: 4px;
    min-height: 36px;
  }
  .row-bg {
    padding: 10px 0;
    background-color: #f9fafc;
  }
}
.property {
  position: relative;
  el-tag {
    float: left;
    text-align: center;
  }
  & > .right {
    float: right;
  }
  & > .center {
    position: absolute;
    z-index: -9;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    text-align: center;
    height: 20px;
    line-height: 28px;
  }
}
#labelCanvas {
  background: rgba(255, 255, 255, 0); /*关键点*/
  position: absolute;
  z-index: 1; /*确保在遮盖的元素的上方*/
  top: 0px;
  left: 0px;
}

.clip-image {
  position: relative;
  width: 98%;
  .canvas {
    position: relative;
    box-shadow: 0 0 3px #333;
  }
  input {
    display: none;
  }
  .base64-hidden {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    height: auto;
    z-index: -999;
    opacity: 0;
  }
}
</style>
