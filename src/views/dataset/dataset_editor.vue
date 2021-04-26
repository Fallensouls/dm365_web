<template>
  <div class="app-container">
    <div class="actions">
      <div>
        <el-upload
          class="inline-block"
          action="/ndb/file"
          accept="image/jpeg,image/png"
          :http-request="handleFileUpload"
          :before-upload="beforeUpload"
          :on-preview="handlePreview"
          :on-remove="handleRemove"
          :before-remove="beforeRemove"
          multiple
          :limit="1"
          :on-exceed="handleExceed"
          :file-list="fileList"
        >
          <el-button slot="trigger" size="small" type="success"
            >上传图片</el-button
          >
          <el-button
            style="margin-left: 8px"
            type="primary"
            size="mini"
            @click="startLabel()"
            >{{
              showSelectColumn == false ? "批量标注" : "取消批量标注"
            }}</el-button
          >
          <el-select
            style="margin-left: 8px"
            v-model="selectedTags"
            :disabled="!showSelectColumn"
            multiple
            filterable
            placeholder="请选择"
          >
            <el-option
              v-for="item in datasetTags"
              :key="item.id"
              :label="item.title_cn"
              :value="item.id"
            >
              <span style="float: left">{{ item.title_cn }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{
                item.title_en
              }}</span>
            </el-option>
          </el-select>
          <el-button
            style="margin-left: 8px"
            type="primary"
            size="mini"
            :disabled="selectedTags.length == 0 || selectedImages.length == 0"
            @click="label()"
            >一键标注</el-button
          >
          <div slot="tip" class="el-upload__tip">
            只能上传jpg/png文件，且不超过2M
          </div>
        </el-upload>
      </div>
    </div>
    <el-table
      :data="imagelist"
      stripe
      style="width: 100%"
      border
      height:auto
      :default-sort="{ prop: 'upddate', order: 'descending' }"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="showSelectColumn" type="selection" width="55">
      </el-table-column>
      <el-table-column label="图片预览" align="center" sortable>
        <template slot-scope="scope">
          <el-image
            style="width: 100px; height: 100px"
            :src="
              `http://192.168.1.107:8080/ndb/file/${scope.row.storageobjectid}`
            "
            :preview-src-list="[
              `http://192.168.1.107:8080/ndb/file/${scope.row.storageobjectid}`
            ]"
            lazy
          >
          </el-image>
        </template>
      </el-table-column>
      <el-table-column label="图片名称" align="center" sortable>
        <template slot-scope="scope">
          <router-link :to="`/dataset/image/view/${scope.row.uuid}`">
            <el-button type="text" size="small" style="font-size: 14px">{{
              scope.row.uuid
            }}</el-button>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="宽" prop="width" width="100" align="center">
      </el-table-column>
      <el-table-column label="高" prop="height" width="100" align="center">
      </el-table-column>
      <el-table-column label="人工标注" width="150" align="center">
        <template slot-scope="scope">
          <el-tag
            :key="tag.id"
            v-for="(tag, index) in scope.row.tags"
            closable
            :disable-transitions="false"
            @close="handleDeleteTag(scope.row, index, tag)"
          >
            {{ tag.title_cn }}
          </el-tag>
          <el-select
            v-model="scope.row.inputTags"
            v-if="scope.row.inputVisible"
            value-key="id"
            multiple
            filterable
            placeholder="请选择"
          >
            <el-button
              :disabled="scope.row.inputTags.length == 0"
              class="new-tag"
              size="small"
              @click="addTags(scope.row)"
              >确认添加</el-button
            >
            <el-button size="small" @click="cancel(scope.row)">取消</el-button>
            <el-option
              v-for="(item, index) in datasetTags"
              :key="index"
              :label="item.title_cn"
              :value="item"
            >
              <span style="float: left">{{ item.title_cn }}</span>
            </el-option>
          </el-select>
          <el-button
            v-else
            class="button-new-tag"
            size="small"
            @click="showInput(scope.row)"
            >添加标注</el-button
          >
        </template>
      </el-table-column>
      <el-table-column label="系统推荐标注" width="150" align="center">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.recmdTags.length == 0"
            class="button-new-tag"
            size="small"
            @click="getRecmdLabels(scope.row)"
            >获取推荐标注</el-button
          >
          <el-tag
            v-else
            :key="tag.id"
            v-for="(tag, index) in scope.row.recmdTags"
            closable
            :disable-transitions="false"
            @close="rejectRecmdTag(scope.row, index, tag)"
          >
            {{ tag.title_cn }}
            <el-button
              size="mini"
              plain
              type="primary text"
              icon="el-icon-check"
              circle
              @click="selectRecmdTag(scope.row, index, tag)"
            ></el-button>
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建者" prop="crtuser" align="center" sortable>
      </el-table-column>
      <el-table-column label="创建日期" prop="crtdate" align="center" sortable>
      </el-table-column>
      <el-table-column label="更新者" prop="upduser" align="center" sortable>
      </el-table-column>
      <el-table-column label="更新日期" prop="upddate" align="center" sortable>
      </el-table-column>

      <el-table-column label="操作" align="center" min-width="120">
        <template slot-scope="scope">
          <router-link :to="`/dataset/image/edit/${scope.row.uuid}`">
            <el-button size="mini">编辑</el-button>
          </router-link>
          <el-button
            size="mini"
            type="danger"
            style="margin-left: 10px"
            @click="deleteImage(scope.$index, scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <br />

    <div class="block" style="margin-bottom: 30px; margin-left: 40%">
      <el-pagination
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-size="pagesize"
        layout="total, prev, pager, next, jumper"
        :total="imagecount"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script>
import * as _dataset from "@/api/dm365/dataset";
import * as _image from "@/api/dm365/image";
import * as _tag from "@/api/dm365/tag";

export default {
  data: () => ({
    fileList: [],
    imagelist: [],
    image: [],
    taglist: [],
    datasetTags: [], // 数据集所包含的所有标签，用于提供选择
    selectedImages: [],
    selectedTags: [],
    imagecount: null,
    loading: true,
    searchTxt: null,
    currentPage: 1,
    pagesize: 20,
    formLabelWidth: "120px",
    width: 0,
    height: 0,
    showSelectColumn: false,
    inputVisible: false,
    inputValue: ""
  }),
  methods: {
    async initTableData() {
      this.loading = true;
      this.imagecount = await _dataset.getDatasetImageCount(
        this.$route.params.id
      );
      this.fetchData();
    },

    async fetchData() {
      let offset = (this.currentPage - 1) * 20;
      let limit = 20;
      let imagelist = (await _dataset.getImagesByDataset(
        this.$route.params.id,
        offset,
        limit
      ))["content"];
      for (let i in imagelist) {
        imagelist[i].inputVisible = false;
        imagelist[i].inputTags = [];
        imagelist[i].recmdTags = [];
      }
      this.imagelist = imagelist;
      this.loading = false;

      await this.getDatasetRelatedTags(this.$route.params.id);
    },

    async getDatasetRelatedTags(datasetid) {
      let res = await _dataset.getDatasetRelatedTags(datasetid);
      res.sort(function(a, b) {
        return a.title_en > b.title_en;
      });
      this.datasetTags = res;
    },

    handleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },
    beforeUpload(file) {
      console.log(file);
      const isJPG = file.type === "image/jpeg";
      const isPNG = file.type === "image/png";
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!(isJPG || isPNG)) {
        this.$message.error("上传图片只能是 JPG 或 PNG 格式!");
      }
      if (!isLt2M) {
        this.$message.error("上传图片大小不能超过 2MB!");
      }
      return (isJPG || isPNG) && isLt2M;
    },
    async handleFileUpload(upload) {
      // 新增一张图片
      let formData = new FormData();
      formData.append("file", upload.file);

      let config = {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      };
      let response = await _image.uploadImage(formData);
      var src = URL.createObjectURL(upload.file);
      var imgObj = new Image();
      imgObj.src = src;
      let that = this;
      imgObj.onload = async function() {
        that.width = imgObj.width;
        that.height = imgObj.height;
        let nodeid = response.uuid;
        var image = {
          storageobjectid: nodeid,
          datasetid: that.$route.params.id,
          width: that.width,
          height: that.height
        };
        await _image.addImage(image);
        that.initTableData();
      };
      this.fileList = [];
    },

    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePreview(file) {
      console.log(file);
    },
    handleExceed(files, fileList) {
      this.$message.warning(
        `当前限制选择 3 个文件，本次选择了 ${
          files.length
        } 个文件，共选择了 ${files.length + fileList.length} 个文件`
      );
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`确定移除 ${file.name}？`);
    },
    deleteImage(index, row) {
      this.$confirm("此操作将删除该图片, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.handleDelete(index, row);
          this.$message({
            type: "success",
            message: "删除成功!"
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除"
          });
        });
    },

    async handleDelete(index, row) {
      this.loading = true;
      await _image.deleteImage(row.uuid);
      this.loading = false;
      this.imagelist.splice(index, 1);
    },

    startLabel() {
      this.showSelectColumn = !this.showSelectColumn;
      if (!this.showSelectColumn) {
        this.selectedTags = [];
        this.selectedImages = [];
      }
    },
    async label() {
      let relations = [];
      let imageidList = this.selectedImages.map(image => image.uuid);
      let tagidList = this.selectedTags;
      for (let i in imageidList) {
        for (let j in tagidList) {
          let relation = { imageid: imageidList[i], tagid: tagidList[j] };
          relations.push(relation);
        }
      }
      await _image.batchTag(relations);
      this.$message({
        type: "success",
        message: "一键标注成功!"
      });

      this.showSelectColumn = false;
      this.selectedTags = [];
      this.selectedImages = [];
    },
    handleSelectTag(tags) {
      this.selectedTags = tags;
    },
    handleSelectionChange(images) {
      this.selectedImages = images;
    },
    async handleDeleteTag(row, index, tag) {
      await _image.deleteTagInImage(row.uuid, tag.id);
      row.tags.splice(index, 1);
    },
    showInput(row) {
      row.inputVisible = true;
    },
    async addTags(row) {
      await _image.addTagsToImage(row.uuid, row.inputTags);
      row.tags = row.tags.concat(row.inputTags);
      row.inputVisible = false;
      row.inputTags = [];
    },
    cancel(row) {
      row.inputVisible = false;
      row.inputTags = [];
    },
    getRecmdLabels(row) {
      let index = Math.floor(Math.random() * this.datasetTags.length);
      row.recmdTags = row.recmdTags.concat(this.datasetTags[index]);
    },
    async selectRecmdTag(row, index, tag) {
      await _image.addSingleTagToImage(row.uuid, tag);
      row.tags.push(tag);
      row.recmdTags.splice(index, 1);
    },
    rejectRecmdTag(row, index, tag) {
      row.recmdTags.splice(index, 1);
    }
  },
  mounted() {
    this.initTableData();
  }
};
</script>

<!--###############################################################################-->
<style lang="scss" scoped>
.el-tag + .el-tag {
  margin-top: 10px;
}
.button-new-tag {
  margin-top: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}
.new-tag {
  margin-left: 25px;
  margin-top: 10px;
  margin-bottom: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}
.first {
  width: 75%;
  float: left;
}
.second {
  width: 25%;
  float: left;
}
.anchor {
  cursor: pointer;
  font-size: 16px;
}
.actions {
  font-size: 13px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  .el-button {
    margin-right: 8px;
    font-size: 13px;
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
.inline-block {
  display: inline-block;
}
.property {
  position: relative;
  span {
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
    line-height: 20px;
  }
}
</style>
