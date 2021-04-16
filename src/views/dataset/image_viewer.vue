<template>
	<div class="app-container">
    <div class="first">
         <div class="clip-image">
            <canvas
                id="canvas1" 
                class="canvas"
                ref="ctx"
                :width="clip.width"
                :height="clip.height"
            >
            </canvas>

            <canvas
                id="canvas2" 
                ref="ctx"
                :width="clip.width"
                :height="clip.height"
            >
            </canvas>

            <canvas
                id="canvas3" 
                ref="ctx"
                :width="clip.width"
                :height="clip.height"
                @mouseup="getOffset($event)"
                @mousemove='updateXY($event)'
                @mousedown="getOrigin($event)"
                @click="position($event)"   
            >
            </canvas>
         </div>
        
        <div class="property" style=" margin-top:13px">
          <span> 
            <el-button type="primary" size="mini"
             @click="cancel()">返回</el-button>
          </span>
          <span class="center">
              缩放倍率：{{scale}}
          </span>
        </div>

        <br>
        <div class="property">
          <el-tag>文件名 : {{image.filename}}</el-tag>
          <el-tag style="margin-left: 12px;">图片大小 : {{image.width}} * {{image.height}}</el-tag>
          <el-tag style="margin-left: 12px;">上传日期 : {{image.crtdate}} </el-tag>
          <el-tag style="margin-left: 12px;">更新日期 : {{image.upddate}} </el-tag>
        </div>
    </div>
  	
    <div class="second" style="margin-right:-4px;">
      <p style="text-align:center">已保存的目标</p>
      <el-table :data="objectlist"
            stripe
		    border
		    style="width: 100%">
			<el-table-column label="目标类别"
			    prop="title_cn"
			    align="center"
			    >
			</el-table-column>
			
			<el-table-column
                prop="objkeypoint"
                label="坐标点"
                align="center"
                >
            </el-table-column>
            
			<el-table-column label="操作"
			    align="center"
                width="230">
				<template slot-scope="scope">
                    <el-switch
                        v-model="scope.row.display"
                        active-text="显示"
                        inactive-text="不显示"
                        @change="display(scope.row.display)">
                    </el-switch>
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
import {getFile} from "@/api/node/file"
	export default {
    x: 0, // 点击canvas x 鼠标地址
    y: 0,// 点击canvas y 鼠标地址
    xV: 0, // 鼠标移动 x距离
    yV: 0, // 鼠标移动 y距离
    nX: 0, // 原始坐标点 图像 x
    nY: 0,// 原始坐标点 图像 y
    
    props: {
        src: {
            type: String,
            default: null
        },
        clip: {
          type: Object,
          default () {
            return  {width: '750px', height: '650px'}
           }
        }
    },
    data: () => ({
        image: [],
        imgsrc: null,
        img: null,
        objectlist:[],
        objectname:[],
        labels:[],
        tags:[],
        canvas1 : null,
        ctx1 : null,
        canvas2 : null,
        ctx2 : null,
        canvas3 : null,
        ctx3 : null,
        loading: false,
        scale: 1, //放大比例
        deg: 0 ,//旋转角度
        origin_x: 0, //鼠标按下时的起点坐标
        origin_y: 0,
        current_x: 0,
        current_y: 0,
        x: 0,  //记录鼠标移动过程中的坐标
        y: 0,
        offset_width: 0, //鼠标松开时，终点坐标相对于起点的变化值
        offset_height: 0,
        arr: [],
        points: [],
        colors:[
            '#DC143C',
            '#00BFFF',
            '#FFFF00',
            '#FF00FF',
            '#FF8C00',
            '#00FFFF',
            '#00FA9A',
            '#FFC0CB'
        ],
        }),
    methods: {
        async initTableData() {
            this.loading = true;
            this.image = await _image.getImage(this.$route.params.id);
            let response = await _dataset.getDatasetRelatedTags(this.image.datasetid);
            response.sort(function(a,b) {
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

            let objectlist = (await _image.getSubImages(this.$route.params.id))['content'];
            for (let o_id in objectlist){
                objectlist[o_id].display = true;
                if (objectlist[o_id].tags.length > 0) {
                    objectlist[o_id].title_cn = objectlist[o_id].tags[0].title_cn;
                    this.objectname[o_id] = objectlist[o_id].tags[0].title_cn;      
                }
                var x1 = objectlist[o_id].subimagex1;
                var x2 = objectlist[o_id].subimagex2;
                var y1 = objectlist[o_id].subimagey1;
                var y2 = objectlist[o_id].subimagey2;
                objectlist[o_id].objkeypoint = `left: ${x1} top: ${y1} right: ${x2} bottom: ${y2}`
                if (objectlist[o_id].shape.length > 0) {
                    let keypoint_str = "";
                    let shape = [];
                    var x, y;
                    for (let i in objectlist[o_id].shape) {
                        if (i % 2 == 0) {
                            shape.push([x, y]);
                            x = objectlist[o_id].shape[i];
                            keypoint_str = keypoint_str + "(" + String(x) + " ";
                        } else {
                            y = objectlist[o_id].shape[i];
                            keypoint_str = keypoint_str + String(y) + ") "; 
                        }
                    }
                    shape.splice(0, 1);
                    objectlist[o_id].shape = shape;
                    objectlist[o_id].objkeypoint = keypoint_str;
                }
            }
            this.objectlist = objectlist;
            this.objectname = Array.from(new Set(this.objectname));
            this.loading = false;             
        },
        
        initCanvas(){
            this.canvas1 = document.getElementById("canvas1");
            this.ctx1 = this.canvas1.getContext("2d");
            this.canvas2 = document.getElementById("canvas2");
            this.ctx2 = this.canvas2.getContext("2d");
            this.canvas3 = document.getElementById("canvas3");
            this.ctx3 = this.canvas3.getContext("2d");
        },
        
        cancel(){
            this.$router.replace("/dataset");
        },

        roll(){
            var _this = this;
            var canvas = this.canvas3;
            canvas.onmousedown = function (event) {
                var bbox = canvas.getBoundingClientRect();
                var x = event.clientX - bbox.left *(canvas.width / bbox.width)
                var y = event.clientY - bbox.top * (canvas.height / bbox.height)
                var px,py
                [px,py] = _this.changeToPicCoor(x,y)
                this.moveFlag = true;
                this.moveStartx = x;
                this.moveStarty = y;
                
            }
            canvas.onmousemove = function (event){
                var bbox = canvas.getBoundingClientRect();
                if (this.moveFlag) {
                    var moveDisx = event.clientX - bbox.left *(canvas.width / bbox.width) - this.moveStartx;
                    var moveDisy = event.clientY - bbox.top * (canvas.height / bbox.height) - this.moveStarty;
                    _this.drawImage(_this.img, -moveDisx, -moveDisy, _this.scale);
                    _this.showLines();
                    _this.showBoundingbox();
                    this.moveStartx += moveDisx
                    this.moveStarty += moveDisy
                }
            };

            canvas.onmouseup = function () {
                this.moveFlag = false;
                canvas.style.cursor = 'default';
            };
    
            canvas.onmousewheel = canvas.onwheel = function (event) {    //滚轮放大缩小
                if(!this.moveFlag)
                {
                    var wheelDelta = event.wheelDelta ? event.wheelDelta : (event.deltalY * (-40));  //获取当前鼠标的滚动情况
                    var bbox = canvas.getBoundingClientRect();
                    var x = event.clientX - bbox.left * (canvas.width / bbox.width)
                    var y = event.clientY - bbox.top * (canvas.height / bbox.height)
                    var scale_new;
                    if (wheelDelta > 0) { // 放大时，每次放大到原来的1.1倍
                        scale_new =_this.scale * 1.1; //注意，我的缩放是以左上角位置为中心进行缩放的，如果要以图片中心为缩放点，需要修改 imgX，imgY的值
                    } else {
                        if(_this.scale > 0.01) { // 缩小到原来的0.9倍
                            scale_new =_this.scale *0.9;
                        }
                    }
                    _this.drawImage(_this.img,x,y,scale_new,0,true);   //重新绘制图片
                    _this.showLines();
                    _this.showBoundingbox();
                    // event.preventDefault  && event.preventDefault(); // 阻止默认事件，可能在滚动的时候，浏览器窗口也会滚动
                    return false;
                }
            };
        },
        display(flag) {
            this.showLines();
            this.showBoundingbox();
        },
        showLines(){
            const {width, height} = this
            this.ctx2.clearRect(0,0,width,height);
            this.ctx2.beginPath();
            var px,py;
            this.ctx2.lineWidth = 4;
            this.ctx2.strokeStyle='#1E90FF';
            this.ctx2.font = "14px Arial";
            
            for (let i=0;i<this.objectlist.length;i++)
            {   
                if (this.objectlist[i].display == false || this.objectlist[i].shape.length == 0) {
                    continue
                }
                [px,py] = this.changeToCanvasCoor(this.objectlist[i].shape[0][0], this.objectlist[i].shape[0][1]);
                this.ctx2.moveTo(px,py);
                let px0 = px;
                let py0 = py;
                let px1 = px;
                let py1 = py;
                for (let j = 1; j < this.objectlist[i].shape.length; j++) {
                    [px,py] = this.changeToCanvasCoor(this.objectlist[i].shape[j][0], this.objectlist[i].shape[j][1])
                    this.ctx2.lineTo(px,py);
                    if (py1 > py) { 
                        py1 = py;
                        px1 = px;
                    }
                }
                this.ctx2.lineTo(px0, py0);
                
                if (this.objectlist[i].title_cn != null) {     
                    let text = this.objectlist[i].title_cn
                    let width = this.ctx2.measureText(text).width
                    this.ctx2.fillStyle="#1E90FF";
                    this.ctx2.fillRect(px1-1, py1-20, width+5,20)
                    this.ctx2.fillStyle="#000000";
                    this.ctx2.fillText(text, px1-1, py1-5)
                }
            }
            
            this.ctx2.closePath()
            this.ctx2.stroke();  //描边
        },
        showBoundingbox() {
            var x1, y1;
            var x2, y2;
            for(let i in this.objectlist){
                if (this.objectlist[i].subimagex1 == 0 && this.objectlist[i].subimagey1 == 0 
                    && this.objectlist[i].subimagex2 == 0 && this.objectlist[i].subimagey2 == 0) {
                    continue;
                }
                if (this.objectlist[i].display){
                    [x1,y1] = this.changeToCanvasCoor(this.objectlist[i].subimagex1, this.objectlist[i].subimagey1);
                    [x2,y2] = this.changeToCanvasCoor(this.objectlist[i].subimagex2, this.objectlist[i].subimagey2);
                    this.ctx2.strokeRect(x1, y1, x2-x1, y2-y1);
                    this.ctx2.strokeStyle='#1E90FF';
                    this.ctx2.font = "14px Arial";
                    if (this.objectlist[i].title_cn != null) {
                        let text = this.objectlist[i].title_cn
                        let width = this.ctx2.measureText(text).width
                        this.ctx2.fillStyle="#1E90FF";
                        this.ctx2.fillRect(x1-1, y1-20, width+5,20)
                        this.ctx2.fillStyle="#000000";
                        this.ctx2.fillText(text, x1-1, y1-5)
                    }
                }
            }
        },
        changeToPicCoor(x,y){   //将像素点换算回图片坐标系
            var picCoorX = -this.current_x/this.scale+x/this.scale
            var picCoorY = -this.current_y/this.scale+y/this.scale
            return [picCoorX,picCoorY]
        },
        changeToCanvasCoor(x,y){   //将像素点换算回图片坐标系
            var CanvasX = x*this.scale+this.current_x
            var CanvasY = y*this.scale+this.current_y
            return [CanvasX,CanvasY]
        },
        drawImage (img, x = 0, y = 0, scale = 1,deg = 0, isScale = false) {
            let {width, height, $options} = this
            // 图片尺寸
            let imgW = img.width
            let imgH = img.height
            var sx = $options.nX + $options.xV
            var sy = $options.nY + $options.yV
            this.ctx1.save()
            this.ctx1.clearRect(0, 0, width, height)
            // this.ctx1.translate( width / 2, height / 2, img)
            this.ctx1.rotate(deg)
            
            if (isScale) {
                this.current_x = x + (this.current_x-x)/this.scale*scale
                this.current_y = y + (this.current_y-y)/this.scale*scale
            } else {
                this.current_x = -x + this.current_x
                this.current_y = -y + this.current_y
            }
            
            this.ctx1.drawImage(img,0,0,imgW,imgH,this.current_x, this.current_y, imgW*scale,imgH*scale) //将图像画到画布上，规定左上角坐标(x,y)以及宽度、高度
            this.scale = scale
            this.ctx1.restore()
        },
        getOrigin:function(event){
            if(this.isLabel == true){
                this.origin_x = event.offsetX;
                this.origin_y = event.offsetY;
                this.Trigger = true;
            }
        },
        updateXY:function(event){
            if(this.isLabel == true){
                if(this.Trigger == true){
                    this.x = event.offsetX;
                    this.y = event.offsetY;
                    const {width, height} = this
                    if(this.x > this.origin_x && this.y > this.origin_y){
                        this.ctx3.clearRect(0,0,width,height);
                        this.ctx3.strokeStyle = '#00FF7F';
                        this.ctx3.strokeRect(this.origin_x,this.origin_y,this.x-this.origin_x,this.y-this.origin_y);
                    }
                    else if(this.x > this.origin_x && this.y < this.origin_y){
                        this.ctx3.clearRect(0,0,width,height);
                        this.ctx3.strokeStyle = '#00FF7F';
                        this.ctx3.strokeRect(this.origin_x,this.y,this.x-this.origin_x,this.origin_y-this.y);
                    }
                    else if(this.x < this.origin_x && this.y > this.origin_y){
                        this.ctx3.clearRect(0,0,width,height);
                        this.ctx3.strokeStyle = '#00FF7F';
                        this.ctx3.strokeRect(this.x,this.origin_y,this.origin_x-this.x,this.y-this.origin_y);
                    }
                    else{
                        this.ctx3.clearRect(0,0,width,height);
                        this.ctx3.strokeStyle = '#00FF7F';
                        this.ctx3.strokeRect(this.x,this.y,this.origin_x-this.x,this.origin_y-this.y);
                    }
                }
            }
        },
        getOffset:function(event){
            if(this.isLabel == true){
                if(event.offsetX > this.origin_x){
                    this.offset_width = event.offsetX - this.origin_x;
                }
                else{
                    this.offset_width = this.origin_x - event.offsetX;
                    this.origin_x = event.offsetX;
                }
                if(event.offsetY > this.origin_y){
                    this.offset_height = event.offsetY - this.origin_y;
                }
                else{
                    this.offset_height = this.origin_y - event.offsetY;
                    this.origin_y = event.offsetY;
                }
                this.Trigger = false;
                const {width, height} = this
                this.ctx3.clearRect(0,0,width,height);
                this.ctx2.strokeStyle = '#00FF7F';
                this.ctx2.strokeRect(this.origin_x,this.origin_y,this.offset_width,this.offset_height);
                var x1, y1;
                var x2, y2;
                [x1, y1] = this.changeToPicCoor(this.origin_x, this.origin_y);
                [x2, y2] = this.changeToPicCoor(this.offset_width+this.origin_x, this.offset_height+this.origin_y);
                var target = {
                    "title_cn": null,
                    "subimagey1": y1,
                    "subimagex1": x1,
                    "subimagex2": x2,
                    "subimagey2": y2,
                    "objkeypoint": `left: ${x1} top: ${y1} right: ${x2} bottom: ${y2}`,
                    "display": true
                }
                this.labelobjectlist.push(target);
                this.isLabel = false;
                this.canvas3.style.cursor = 'default';
            }
        },
        position:function(event){
            if(this.isLabelPoints == true){
                this.arr.push([event.offsetX, event.offsetY]);
                this.points.push(this.changeToPicCoor(event.offsetX, event.offsetY));
                this.ctx3.lineWidth = 4;
                this.ctx3.strokeStyle='#1E90FF';
                if(this.arr.length==1){
                    this.ctx3.beginPath();
                    this.ctx3.moveTo(event.offsetX, event.offsetY)
                }
                else{
                    this.ctx3.lineTo(event.offsetX, event.offsetY);
                    this.ctx3.stroke();   //描边
                }
            }
        },
         // 与canvas相关的绘图事件(包含显示图片、显示bounding box和用鼠标标注bounding box)
         drawOriginalImage(){
            //加载初始图片，将其显示在canvas上
            var imgObj = new Image();
            imgObj.src = this.imgsrc;
            imgObj.onload = function(){ 
                var cvs = document.getElementById('canvas1');
                var ctx = cvs.getContext('2d');
                ctx.drawImage(imgObj, 0, 0);
            }
            this.img = imgObj;
        },
         setCanvas(){
             const {$options, $refs, width, height} = this
              // 初始化 canvas的nX和nY
                Object.assign($options, {
                    nX: -width / 2,
                    nY: -height / 2
                })
            this.drawOriginalImage();
            this.showLines();
            this.showBoundingbox();
         }
    },

    computed: {
        width () {
             const {clip} = this
             return  parseFloat(clip.width.replace('px', ''))
        },
        height () {
            const {clip} = this
            return  parseFloat(clip.height.replace('px', ''))
        }
    },
    async mounted() { 
      // 动态设置canvas元素的宽和高
        const {clip} = this
        var w = (document.documentElement.clientWidth-260)*0.55;
        var h = 0.7*window.screen.height;
        clip.width = `${w}px`;
        clip.height = `${h}px`;
        let that = this;
        window.onresize = function temp() {
            var w = (document.documentElement.clientWidth-260)*0.55;
            var h = 0.7*window.screen.height;
            clip.width = `${w}px`;
            clip.height = `${h}px`;
            that.setCanvas();
        };
      this.initCanvas();
      await this.initTableData();
      this.setCanvas();
      this.roll();
    }   
};

</script>

<!--###############################################################################-->
<style lang="scss" scoped>
.first {
    width: 55%;
    float:left;
}
.second {
    width: 45%;
    float:left;
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
.property{
    position: relative;
    el-tag{
        float: left;
        text-align: center;
    }
     &>.right{
        float: right;
    }
    &>.center{
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
#canvas2{
     background:rgba(255,255,255,0);/*关键点*/ 
     position:absolute; 
     z-index:1;/*确保在遮盖的元素的上方*/ 
     top:0px; 
     left:0px; 
}

#canvas3{
     background:rgba(255,255,255,0);/*关键点*/ 
     position:absolute; 
     z-index:2;/*确保在遮盖的元素的上方*/ 
     top:0px; 
     left:0px; 
}

.clip-image{
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