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

        <canvas
          id="tempLabelCanvas"
          ref="ctx"
          :width="clip.width"
          :height="clip.height"
          @mouseup="handleMouseUp($event)"
          @mousemove="handleMouseMove($event)"
          @mousedown="handleMouseDown($event)"
          @click="labelPolygon($event)"
        >
        </canvas>
      </div>

      <div class="property" style=" margin-top:13px">
        <span>
          <el-button type="primary" size="mini" @click="labelBbox()"
            >标注边框</el-button
          >
          <el-button
            type="primary"
            size="mini"
            @click="labelSegm()"
            :disabled="isLabelPolygon && picPolygon.length < 3"
            >{{
              isLabelPolygon == false ? "标注轮廓" : "完成轮廓标注"
            }}</el-button
          >
          <el-button
            type="primary"
            size="mini"
            @click="cancel()"
            :disabled="!isLabelBBox && !isLabelPolygon"
            >取消</el-button
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
      <el-table
        :data="objectList"
        stripe
        height="300"
        border
        style="width: 100%"
      >
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
            <el-switch
              v-model="scope.row.display"
              active-text="显示"
              inactive-text="不显示"
              @change="display()"
            >
            </el-switch>

            <el-button
              size="small"
              type="text"
              style="margin-left:10px"
              @click="changeAnnotation(scope.$index, scope.row)"
              :disabled="!scope.row.change"
              >保存</el-button
            >
            <el-button
              size="small"
              type="text"
              style="margin-left:10px"
              @click="deleteAnnotation(scope.$index, scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="property" style=" margin-top:20px">
        <span class="center">待保存的目标</span>
      </div>
      <div style="margin-top:58px">
        <el-table
          :data="labelObjectList"
          stripe
          height="300"
          style="width:100%"
          border
        >
          <el-table-column
            label="目标类别"
            prop="title_cn"
            align="center"
            width="200"
          >
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.title_cn"
                filterable
                placeholder="请选择"
                @change="handleSelectTag($event, scope.row)"
              >
                <el-option
                  v-for="item in datasetTags"
                  :key="item.id"
                  :label="item.title_cn"
                  :value="item"
                >
                  <span style="float: left">{{ item.title_cn }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{
                    item.title_en
                  }}</span>
                </el-option>
              </el-select>
            </template>
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
              <el-switch
                v-model="scope.row.display"
                active-text="显示"
                inactive-text="不显示"
                @change="display()"
              >
              </el-switch>
              <el-button
                size="small"
                type="text"
                style="margin-left:10px"
                @click="saveAnnotation(scope.$index, scope.row)"
                >保存</el-button
              >
              <el-button
                size="small"
                type="text"
                style="margin-left:10px"
                @click="removeAnnotation(scope.$index, scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import * as _dataset from "@/api/dm365/dataset";
import * as _image from "@/api/dm365/image";
import * as _tag from "@/api/dm365/tag";
import { getFile } from "@/api/node/file";

import { CanvasParams } from "@/canvas/params";
import { getOriginXY, updateXY, getPolygon } from "@/canvas/event";
import {
  canvas2PicCoor,
  pic2CanvasCoor,
  isPointSelected,
  clearCanvas,
  drawImage,
  drawPoint,
  updateCurrentXY,
  randomColorize
} from "@/canvas/util";

import {
  drawBoundingBox,
  drawMultipleBoundingBox,
  canvas2PicBBox
} from "@/canvas/bbox";

import { drawPolygonByPicCoors, drawMultiplePolygon } from "@/canvas/polygon";

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
    labelObjectList: [],
    tagSet: [], // 不重复的标签名称集合
    datasetTags: [], // 数据集所包含的所有标签，用于提供选择
    imageCanvas: null, // 绘制原始图像的canvas层
    imgCtx: null,
    labelCanvas: null, // 绘制确定标注的canvas层
    labelCtx: null,
    tempLabelCanvas: null, // 绘制临时标注的canvas层
    tmpLabelCtx: null,
    loading: false,
    scale: 1, //放大比例
    deg: 0, //旋转角度
    isLabelBBox: false,
    isLabelPolygon: false,
    trigger: false, //触发器，指示当前是否需要监听鼠标移动事件
    originX: 0, //鼠标按下时的起点坐标
    originY: 0,
    currentX: 0,
    currentY: 0,
    canvasPolygon: [],
    picPolygon: [],
    colorsMap: null
  }),
  methods: {
    // canvas code
    initCanvas() {
      this.imageCanvas = document.getElementById("imageCanvas");
      this.imgCtx = this.imageCanvas.getContext("2d");
      this.labelCanvas = document.getElementById("labelCanvas");
      this.labelCtx = this.labelCanvas.getContext("2d");
      this.tempLabelCanvas = document.getElementById("tempLabelCanvas");
      this.tmpLabelCtx = this.tempLabelCanvas.getContext("2d");
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
      clearCanvas(this.tmpLabelCtx, width, height);
      this.drawOriginalImage();
      this.drawAnnotations();
    },

    // 保证平移和缩放时图像和标注的不变性
    handlePanAndZoom() {
      var _this = this;
      var canvas = this.tempLabelCanvas;
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
        let move = _this.checkMoveObject(x, y);
        if (move) {
          this.moveI = move[0];
          this.moveJ = move[1];
          this.moveObjectFlag = true;
          this.moveFlag = false;
        }
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
          if (_this.picPolygon.length > 0) {
            let { width, height } = _this;
            clearCanvas(_this.tmpLabelCtx, width, height);
            let params = new CanvasParams(
              _this.currentX,
              _this.currentY,
              _this.scale
            );
            drawPolygonByPicCoors(
              _this.labelCtx,
              _this.picPolygon,
              params,
              false
            );
          }
          this.moveStartx += moveDisx;
          this.moveStarty += moveDisy;
        }
        if (this.moveObjectFlag) {
          var x = event.clientX - bbox.left * (canvas.width / bbox.width);
          var y = event.clientY - bbox.top * (canvas.height / bbox.height);
          _this.moveObject(x, y, this.moveI, this.moveJ);
          _this.drawAnnotations();
        }
      };

      canvas.onmouseup = function() {
        if (this.moveFlag) {
          this.moveFlag = false;
        }
        if (this.moveObjectFlag) {
          this.moveObjectFlag = false;
          _this.finishMoveObject(this.moveI);
        }
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
          if (_this.picPolygon.length > 0) {
            let { width, height } = _this;
            clearCanvas(_this.tmpLabelCtx, width, height);
            let params = new CanvasParams(
              _this.currentX,
              _this.currentY,
              _this.scale
            );
            drawPolygonByPicCoors(
              _this.labelCtx,
              _this.picPolygon,
              params,
              false
            );
          }
          // event.preventDefault  && event.preventDefault(); // 阻止默认事件，可能在滚动的时候，浏览器窗口也会滚动
        }
      };
    },

    checkMoveObject(x, y) {
      let params = new CanvasParams(this.currentX, this.currentY, this.scale);
      let [px, py] = canvas2PicCoor(x, y, params);
      let objectList = this.objectList.concat(this.labelObjectList);
      let src = [px, py];
      for (let i in objectList) {
        // is bbox or not
        let coordinates = [];
        if (this.isBox(objectList[i].shape)) {
          // 检查四个顶点即可
          coordinates.push([
            objectList[i].subimagex1,
            objectList[i].subimagey1
          ]);
          coordinates.push([
            objectList[i].subimagex1,
            objectList[i].subimagey2
          ]);
          coordinates.push([
            objectList[i].subimagex2,
            objectList[i].subimagey1
          ]);
          coordinates.push([
            objectList[i].subimagex2,
            objectList[i].subimagey2
          ]);
        } else {
          // 检查多边形的所有顶点
          coordinates = objectList[i].shape;
        }
        for (let j in coordinates) {
          let target = [coordinates[j][0], coordinates[j][1]];
          if (isPointSelected(src, target)) {
            this.labelCtx.fillStyle = "#1E90FF";
            let [cx, cy] = pic2CanvasCoor(target[0], target[1], params);
            drawPoint(this.labelCtx, cx, cy);
            this.tempLabelCanvas.style.cursor = "move";
            return [i, j];
          }
        }
      }
      return false;
    },

    moveObject(x, y, moveI, moveJ) {
      let params = new CanvasParams(this.currentX, this.currentY, this.scale);
      let [px, py] = canvas2PicCoor(x, y, params);
      let object;
      if (moveI < this.objectList.length) {
        object = this.objectList[moveI];
      } else {
        moveI -= this.objectList.length;
        object = this.labelObjectList[moveI];
      }
      if (this.isBox(object.shape)) {
        switch (moveJ) {
          case "0":
            object.subimagex1 = px;
            object.subimagey1 = py;
            break;
          case "1":
            object.subimagex1 = px;
            object.subimagey2 = py;
            break;
          case "2":
            object.subimagex2 = px;
            object.subimagey1 = py;
            break;
          case "3":
            object.subimagex2 = px;
            object.subimagey2 = py;
        }
      } else {
        object.shape[moveJ][0] = px;
        object.shape[moveJ][1] = py;
      }
    },

    finishMoveObject(moveI) {
      this.tempLabelCanvas.style.cursor = "default";
      let object;
      if (moveI < this.objectList.length) {
        object = this.objectList[moveI];
        object.change = true;
      } else {
        moveI -= this.objectList.length;
        object = this.labelObjectList[moveI];
      }
      if (this.isBox(object.shape)) {
        object.objkeypoint = `left: ${object.subimagex1} top: ${
          object.subimagey1
        } right: ${object.subimagex2} bottom: ${object.subimagey2}`;
      } else {
        let keypointStr = "";
        for (let i in object.shape) {
          keypointStr =
            keypointStr +
            "(" +
            String(object.shape[i][0]) +
            "  " +
            String(object.shape[i][1]) +
            ")" +
            "  ";
        }
        object.objkeypoint = keypointStr;
      }
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

    handleMouseDown: function(event) {
      if (this.isLabelBBox) {
        [this.originX, this.originY] = getOriginXY(event);
        this.trigger = true;
      }
    },

    handleMouseMove: function(event) {
      if (this.isLabelBBox && this.trigger) {
        let [x, y, w, h] = updateXY(this.originX, this.originY, event);
        const { width, height } = this;
        clearCanvas(this.tmpLabelCtx, width, height);
        drawBoundingBox(this.tmpLabelCtx, x, y, w, h);
      }
      if (this.isLabelPolygon && this.picPolygon.length > 0) {
        const { width, height } = this;
        clearCanvas(this.tmpLabelCtx, width, height);
        let params = new CanvasParams(this.currentX, this.currentY, this.scale);
        drawPolygonByPicCoors(this.tmpLabelCtx, this.picPolygon, params, false);
        this.tmpLabelCtx.moveTo(
          this.canvasPolygon[this.canvasPolygon.length - 1][0],
          this.canvasPolygon[this.canvasPolygon.length - 1][1]
        );
        this.tmpLabelCtx.lineTo(event.offsetX, event.offsetY);
        this.tmpLabelCtx.stroke();
      }
    },

    handleMouseUp: function(event) {
      if (this.isLabelBBox) {
        let [x, y, w, h] = updateXY(this.originX, this.originY, event);
        this.trigger = false;
        const { width, height } = this;
        clearCanvas(this.tmpLabelCtx, width, height);
        drawBoundingBox(this.labelCtx, x, y, w, h);
        let params = new CanvasParams(this.currentX, this.currentY, this.scale);
        let [x1, y1, x2, y2] = canvas2PicBBox(x, y, w, h, params);
        let target = {
          title_cn: null,
          subimagey1: y1,
          subimagex1: x1,
          subimagex2: x2,
          subimagey2: y2,
          objkeypoint: `left: ${x1} top: ${y1} right: ${x2} bottom: ${y2}`,
          display: true
        };
        this.labelObjectList.push(target);
        this.isLabelBBox = false;
        this.tempLabelCanvas.style.cursor = "default";
      }
    },

    // bbox
    isBox(shape) {
      return shape == null || shape.length == 0;
    },

    drawBoundingBoxes(objectList) {
      let params = new CanvasParams(this.currentX, this.currentY, this.scale);
      drawMultipleBoundingBox(
        this.labelCtx,
        objectList,
        this.colorsMap,
        params
      );
    },

    // polygon
    labelPolygon: function(event) {
      if (this.isLabelPolygon) {
        let params = new CanvasParams(this.currentX, this.currentY, this.scale);
        getPolygon(this.canvasPolygon, this.picPolygon, params, event);
        drawPolygonByPicCoors(this.tmpLabelCtx, this.picPolygon, params, false);
      }
    },

    cancel() {
      if (this.isLabelBBox) {
        this.isLabelBBox = false;
        this.tempLabelCanvas.style.cursor = "default";
        return;
      }
      this.canvasPolygon.pop();
      this.picPolygon.pop();
      const { width, height } = this;
      clearCanvas(this.tmpLabelCtx, width, height);
      if (this.picPolygon.length == 0) {
        this.isLabelPolygon = false;
        this.tempLabelCanvas.style.cursor = "default";
      } else {
        let params = new CanvasParams(this.currentX, this.currentY, this.scale);
        drawPolygonByPicCoors(this.tmpLabelCtx, this.picPolygon, params, false);
      }
    },

    finishPolygon() {
      this.trigger = false;
      const { width, height } = this;
      clearCanvas(this.tmpLabelCtx, width, height);
      let params = new CanvasParams(this.currentX, this.currentY, this.scale);
      drawPolygonByPicCoors(this.labelCtx, this.picPolygon, params, true);
      var keypointStr = "";
      for (var i in this.picPolygon) {
        keypointStr =
          keypointStr +
          "(" +
          String(this.picPolygon[i][0]) +
          "  " +
          String(this.picPolygon[i][1]) +
          ")" +
          "  ";
      }
      var target = {
        title_cn: null,
        id: null,
        objkeypoint: keypointStr,
        shape: this.picPolygon,
        display: true
      };
      this.labelObjectList.push(target);
      this.tempLabelCanvas.style.cursor = "default";
      this.canvasPolygon = [];
      this.picPolygon = [];
    },

    drawPolygons(objectList) {
      let params = new CanvasParams(this.currentX, this.currentY, this.scale);
      drawMultiplePolygon(this.labelCtx, objectList, this.colorsMap, params);
    },

    // draw all annotations, including bboxes and polygons
    drawAnnotations() {
      const { width, height } = this;
      clearCanvas(this.labelCtx, width, height);
      let objectList = this.objectList.concat(this.labelObjectList);
      this.drawBoundingBoxes(objectList);
      this.drawPolygons(objectList);
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
        objectList[i].change = false;
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

    async updateObjectList() {
      this.loading = true;
      this.objectList = [];
      await this.getObjectList();
      this.drawAnnotations();
      this.loading = false;
    },

    // 删除已保存的标注
    async deleteAnnotation(index, row) {
      this.loading = true;
      await _image.deleteImage(row.uuid);
      this.loading = false;
      this.objectList.splice(index, 1);
      this.drawAnnotations();
    },

    // 去除未保存的本地标注
    removeAnnotation(index, row) {
      this.labelObjectList.splice(index, 1);
      this.drawAnnotations();
    },

    handleSelectTag(tag, row) {
      row.title_cn = tag.title_cn;
      row.id = tag.id;
    },

    async saveAnnotation(index, row) {
      if (!row.id) {
        this.$message({
          message: "请选择类别名称再进行保存",
          type: "warning"
        });
        return;
      }
      row.parentid = this.$route.params.id;
      row.datasetid = this.image.datasetid;
      let shape = [];
      for (let i in row.shape) {
        shape.push(row.shape[i][0]);
        shape.push(row.shape[i][1]);
      }
      row.shape = shape;
      let imageid = await _image.addImage(row);
      let tag = { id: row.id };
      await _image.addSingleTagToImage(imageid, tag);
      this.labelObjectList.splice(index, 1);
      this.updateObjectList();

      // 添加到标注历史表
      var annotation = {
        imageid: imageid,
        tagid: row.id,
        parentid: null
      };
      await _image.addAnnotation(annotation);
    },

    async changeAnnotation(index, row) {
      await _image.updateImage(row.uuid, row);
      row.change = false;
    },

    // events
    labelBbox() {
      this.isLabelBBox = true;
      this.tempLabelCanvas.style.cursor = "crosshair";
    },

    labelSegm() {
      this.isLabelPolygon = !this.isLabelPolygon;
      if (this.isLabelPolygon) {
        this.tempLabelCanvas.style.cursor = "crosshair";
      } else {
        this.finishPolygon();
      }
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

#tempLabelCanvas {
  background: rgba(255, 255, 255, 0); /*关键点*/
  position: absolute;
  z-index: 2; /*确保在遮盖的元素的上方*/
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
