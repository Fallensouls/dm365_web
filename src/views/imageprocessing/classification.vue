<template>
  <div class="app-container">
    <div class="text" style="text-align: center">
      <h1>饮食图像识别</h1>
    </div>
    <el-row
      style="margin-top: 50px"
      type="flex"
      justify="center"
      align="middle"
    >
      <el-select
        size="small"
        v-model="modelSelect"
        placeholder="请选择识别模型"
        @change="loadModel"
      >
        <el-option
          v-for="(item, index) in modelSelectList"
          :key="item.model_name"
          :label="item.model_name"
          :value="index"
        >
        </el-option>
      </el-select>

      <el-select
        style="margin-left: 20px"
        size="small"
        v-model="sessionBackend"
        placeholder="请选择运行模型所用后端"
      >
        <el-option
          v-for="item in backendSelectList"
          :key="item.text"
          :label="item.text"
          :value="item.value"
        >
        </el-option>
      </el-select>

      <el-upload
        class="inline-block"
        accept="image/jpeg,image/png"
        action=""
        :http-request="handleFileUpload"
        :show-file-list="false"
      >
        <el-button
          slot="trigger"
          size="small"
          type="primary"
          :disabled="modelLoading || modelInitializing || modelLoadingError"
          >上传图片</el-button
        >
      </el-upload>
    </el-row>
    <el-progress
      style="margin-top: 20px"
      class="el-bg-inner-running"
      :text-inside="true"
      :stroke-width="24"
      :percentage="percentage"
    ></el-progress>
    <el-row style="margin-top: 120px" type="flex" justify="center">
      <el-col :span="6" class="canvas-container">
        <canvas
          id="input-canvas"
          :width="imageSize"
          :height="imageSize"
        ></canvas>
      </el-col>

      <el-col :span="6" class="output-container">
        <el-row class="inference-time-class">
          <span class="inference-time">Inference Time: </span>
          <span v-if="inferenceTime > 0" class="inference-time-value"
            >{{ inferenceTime.toFixed(1) }} ms
          </span>
          <span v-else>-</span>
        </el-row>
        <div
          v-for="i in [0, 1, 2, 3, 4]"
          :key="i"
          class="output-class"
          :class="{
            predicted: i === 0 && outputClasses[i].probability.toFixed(2) > 0
          }"
        >
          <div class="output-label">{{ outputClasses[i].name }}</div>
          <div
            class="output-bar"
            :style="{
              width: `${Math.round(180 * outputClasses[i].probability)}px`,
              background: `rgba(42, 106, 150, ${outputClasses[
                i
              ].probability.toFixed(2)})`,
              transition: `${
                outputClasses[i].probability != 0
                  ? 'width 0.2s ease-out'
                  : 'null'
              }`
            }"
          ></div>
          <div class="output-value">
            {{ Math.round(100 * outputClasses[i].probability) }}%
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import loadImage from "blueimp-load-image";
import { InferenceSession } from "onnxjs";
import { preprocess } from "@/onnx/process";
import { softmax } from "@/onnx/math";
import { predictClassesTopK } from "@/onnx/classes";
import { warmupModel, runModel } from "@/onnx/model";
import { getModels, getModelInfo } from "@/api/analyzer/model";

export default {
  data: () => ({
    // modelFilepath: string;
    sessionBackend: "webgl",
    modelSelect: null,
    model: new Blob(),
    modelSelectList: [],
    backendSelectList: [
      { text: "GPU-WebGL", value: "webgl" },
      { text: "CPU-WebAssembly", value: "wasm" }
    ],
    modelLoading: true,
    modelInitializing: true,
    modelLoadingError: false,
    sessionRunning: false,
    session: null,
    gpuSession: null,
    cpuSession: null,
    imageSize: 224,
    inferenceTime: 0,
    imageLoading: false,
    imageLoadingError: false,
    output: [],
    modelFile: new ArrayBuffer(0),
    percentage: 0,
    classes: {},
    outputClasses: [
      { name: "-", probability: 0, index: 0 },
      { name: "-", probability: 0, index: 0 },
      { name: "-", probability: 0, index: 0 },
      { name: "-", probability: 0, index: 0 },
      { name: "-", probability: 0, index: 0 }
    ]
  }),
  methods: {
    async getModelList() {
      let response = await getModels();
      this.modelSelectList = response.data;
    },

    async loadModel(index) {
      // fetch the model file to be used later
      this.$message.info("模型加载中");
      this.modelLoading = true;
      let modelFilepath = "/model.onnx";
      const res = await fetch(modelFilepath);
      this.modelFile = await res.arrayBuffer();
      let response = await getModelInfo(this.modelSelectList[index].info_url);
      let { class_name } = response.data;
      this.classes = class_name;
      // try {
      //   response = await gateway_service.get(this.modelSelectList[index].url, {
      //     responseType: "blob",
      //     timeout: 0,
      //     onDownloadProgress: (evt) => {
      //       this.percentage = Number(
      //         ((evt.loaded / model_size) * 100).toFixed(2)
      //       );
      //     },
      //   });
      // } catch (e) {
      //   this.modelLoadingError = true;
      //   that.$message.error("模型加载失败，请刷新重试");
      //   return;
      // }
      // this.model = new Blob([response.data]);
      try {
        await this.initSession();
      } catch (e) {
        this.$message.error("模型加载失败，请刷新重试");
        this.sessionBackend = "wasm";
      }
    },

    async runModel() {
      const element = document.getElementById("input-canvas");
      const ctx = element.getContext("2d");
      const imageData = ctx.getImageData(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
      const { data, width, height } = imageData;
      const preprocessedData = preprocess(data, width, height);
      let tensorOutput = null;
      [tensorOutput, this.inferenceTime] = await runModel(
        this.session,
        preprocessedData
      );
      this.output = tensorOutput.data;
      this.sessionRunning = false;
      this.outputClasses = this.getPredictedClass(this.output);
      console.log(this.outputClasses);
    },

    async initSession() {
      this.sessionRunning = false;
      this.modelLoadingError = false;
      if (this.sessionBackend === "webgl") {
        if (this.gpuSession) {
          this.session = this.gpuSession;
          return;
        }
        this.modelLoading = true;
        this.modelInitializing = true;
        this.gpuSession = new InferenceSession({
          backendHint: this.sessionBackend
        });
        this.session = this.gpuSession;
      }
      if (this.sessionBackend === "wasm") {
        if (this.cpuSession) {
          this.session = this.cpuSession;
          return;
        }
        this.modelLoading = true;
        this.modelInitializing = true;
        this.cpuSession = new InferenceSession({
          backendHint: this.sessionBackend
        });
        this.session = this.cpuSession;
      }
      try {
        await this.session.loadModel(this.modelFile);
      } catch (e) {
        this.modelLoading = false;
        this.modelInitializing = false;
        if (this.sessionBackend === "webgl") {
          this.gpuSession = undefined;
        } else {
          this.cpuSession = undefined;
        }
        throw new Error("Error: Backend not supported. ");
      }
      this.modelLoading = false;
      // warm up session with a sample tensor. Use setTimeout(..., 0) to make it an async execution so
      // that UI update can be done.
      if (this.sessionBackend === "webgl") {
        setTimeout(() => {
          warmupModel(this.session, [1, 3, this.imageSize, this.imageSize]);
          this.modelInitializing = false;
        }, 0);
      } else {
        await warmupModel(this.session, [1, 3, this.imageSize, this.imageSize]);
        this.modelInitializing = false;
      }
    },

    async onSessionBackendChange(backend) {
      this.sessionBackend = backend;
      this.clearAll();
      try {
        await this.initSession();
      } catch (e) {
        this.modelLoadingError = true;
        if (this.modelSelect === null) {
          this.$message.warning("请选择需要加载的模型");
        } else {
          this.$message.error("当前设备不支持使用" + backend);
        }
      }
      return backend;
    },

    getPredictedClass(res) {
      if (!res || res.length === 0) {
        const empty = [];
        for (let i = 0; i < 5; i++) {
          empty.push({ name: "-", probability: 0, index: 0 });
        }
        return empty;
      }
      const output = softmax(res);
      const topk = predictClassesTopK(output, this.classes, 5);
      return topk;
    },

    handleFileUpload(upload) {
      this.loadImageToCanvas(upload.file);
    },

    loadImageToCanvas(url) {
      if (!url) {
        this.clearAll();
        return;
      }
      this.imageLoading = true;
      loadImage(
        url,
        img => {
          if (img.type === "error") {
            this.imageLoadingError = true;
            this.imageLoading = false;
          } else {
            // load image data onto input canvas
            const element = document.getElementById("input-canvas");
            if (element) {
              const ctx = element.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                this.imageLoadingError = false;
                this.imageLoading = false;
                this.sessionRunning = true;
                this.output = [];
                this.inferenceTime = 0;
                // session predict
                this.$nextTick(function() {
                  setTimeout(() => {
                    this.runModel();
                  }, 10);
                });
              }
            }
          }
        },
        {
          maxWidth: this.imageSize,
          maxHeight: this.imageSize,
          cover: true,
          crop: true,
          canvas: true,
          crossOrigin: "Anonymous"
        }
      );
    },

    beforeDestroy() {
      this.session = undefined;
      this.gpuSession = undefined;
      this.cpuSession = undefined;
    },

    clearAll() {
      this.sessionRunning = false;
      this.inferenceTime = 0;
      this.imageLoading = false;
      this.imageLoadingError = false;
      this.output = [];
      const element = document.getElementById("input-canvas");
      if (element) {
        const ctx = element.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      }
    }
  },
  async mounted() {
    try {
      await this.getModelList();
    } catch (e) {
      this.$message.error("模型加载失败，请刷新重试");
    }
  }
};
</script>

<style lang="scss" scoped>
.el-select {
  width: 220px;
  size: auto;
}
.el-button {
  margin-left: 20px;
  text-align: center;
  font-size: auto;
}
.image-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 95%;
}
.image-uploader .el-upload:hover {
  border-color: #409eff;
}
.image-uploader-icon {
  font-size: 60px;
  color: #8c939d;
  width: 95%;
  height: 700px;
  line-height: 600px;
  text-align: center;
}
.image {
  width: 95%;
  height: 700px;
  display: block;
}
.image-loading {
  line-height: 600px;
  text-align: center;
  font-size: 40px;
}
.image-result {
  border: 1px dashed #d9d9d9;
  font-size: 40px;
  color: #d9d9d9;
  width: 95%;
  height: 700px;
  line-height: 600px;
  text-align: center;
  display: block;
}
.image-panel {
  padding: 80px 0px 80px 0px;
  margin: auto;
  background-color: white;
  position: relative;
  width: 85%;
  height: 100%;
  & .loading-indicator {
    position: absolute;
    top: 5px;
    left: 5px;
  }
}
.inputs {
  margin: auto;
  background: #f5f5f5;
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
  align-items: center;
  border-radius: 2px;
  display: inline-flex;
  height: 40px;
  font-size: 14px;
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1), color 1ms;
  padding: 0 16px;
}
.inputs:focus,
.inputs:hover {
  position: relative;
  background: rgba(0, 0, 0, 0.12);
}
.input-label {
  font-family: var(--font-sans-serif);
  font-size: 16px;
  color: var(--color-blue);
  text-align: left;
  user-select: none;
  cursor: default;
}
.canvas-container {
  position: relative;
  text-align: center;
  & #input-canvas {
    background: #eeeeee;
    margin-top: 40px;
  }
}
.output-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  & .inference-time-class {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    & .inference-time {
      text-align: right;
      width: 200px;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-family: var(--font-sans-serif);
      font-size: 20px;
      color: black;
    }
    & .inference-time-value {
      color: var(--color-blue);
      text-align: left;
      margin-left: 20px;
      font-family: var(--font-sans-serif);
      font-size: 20px;
    }
  }
  & .output-class {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 5px 0;
    margin-top: 20px;
    & .output-label {
      text-align: right;
      width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: var(--font-sans-serif);
      font-size: 20px;
      color: black;
      padding: 0 16px;
      border-right: 6px solid var(--color-blue-lighter);
    }
    & .output-bar {
      height: 16px;
      transition: width 0.2s ease-out;
      color: var(--color-blue-light);
    }
    & .output-value {
      text-align: left;
      margin-left: 20px;
      font-family: var(--font-sans-serif);
      font-size: 20px;
      color: black;
    }
  }
  & .output-class.predicted {
    & .output-label {
      color: var(--color-blue);
      border-left-color: var(--color-blue);
    }
    & .output-value {
      color: var(--color-blue);
    }
  }
}
.inline-block {
  display: inline-block;
}
.el-progress {
  margin-left: 25%;
  width: 50%;
}
.el-bg-inner-running >>> .el-progress-bar__innerText {
  color: #000000;
  font-size: 14px;
}
.el-bg-inner-running >>> .el-progress-bar__outer {
  height: 24px !important;
  border: 1px solid #78335f;
  background-color: transparent;
}
/* 渐变进度条 */
.el-bg-inner-running >>> .el-progress-bar__inner {
  background-color: unset;
  background-image: linear-gradient(to right, #3587d8, #6855ff);
}
.el-bg-inner-error >>> .el-progress-bar__inner {
  background-image: linear-gradient(to right, #3587d8, #fb3a7e);
}
.el-bg-inner-done >>> .el-progress-bar__inner {
  background-image: linear-gradient(to right, #3587d8, #53ff54);
}
</style>
