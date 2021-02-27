<template>
  <div class="app-container">
    <div class="actions">
      <div>
        <el-button size="small" type="primary" @click="showCreateDialog = true" v-hasPermi="['dm365:dataset:add']"
          >新增数据集</el-button
        >
        <router-link :to="`/dataset/create`">
          <el-button size="small" type="primary">生成数据集</el-button>
        </router-link>
        <el-button size="small" type="primary" @click="showTagDialog = true" v-hasPermi="['dm365:tag:query']"
          >查看类别标签</el-button
        >
        <el-input
          size="small"
          v-model="searchTxt"
          placeholder="请输入搜索内容"
          prefix-icon="el-icon-search"
        />
      </div>
    </div>

    <el-dialog title="创建数据集" :visible.sync="showCreateDialog">
      <el-form :model="newdataset">
        <el-form-item label="数据集名称" :label-width="formLabelWidth">
          <el-input v-model="newdataset.name" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="数据集描述" :label-width="formLabelWidth">
          <el-input
            v-model="newdataset.description"
            auto-complete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showCreateDialog = false">取 消</el-button>
        <el-button type="primary" @click="handleCreateDataset()"
          >确 定</el-button
        >
      </div>
    </el-dialog>

    <el-table
      :data="Datasetlist"
      stripe
      style="width: 100%"
      border
      v-loading="loading"
      :default-sort="{ prop: 'crtdate', order: 'deascending' }"
    >
      <el-table-column label="数据集名称" sortable align="center">
        <template slot-scope="scope">
          <router-link :to="`/dataset/view/${scope.row.uuid}`">
            <el-button type="text" size="small" style="font-size: 14px">{{
              scope.row.name
            }}</el-button>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="图片数量" sortable prop="count" align="center">
      </el-table-column>
      <el-table-column label="类别数量" prop="tagcount" align="center" sortable>
      </el-table-column>
      <el-table-column label="创建日期" sortable prop="crtdate" align="center">
      </el-table-column>
      <el-table-column label="更新日期" sortable prop="upddate" align="center">
      </el-table-column>
      <el-table-column label="说明" prop="description" align="center">
      </el-table-column>
      <el-table-column label="操作" align="center" width="400">
        <template slot-scope="scope">
          <router-link :to="`/dataset/edit/${scope.row.uuid}`">
            <el-button size="mini" style="margin-left: 8px" v-hasPermi="['dm365:dataset:edit']">编辑</el-button>
          </router-link>
          <el-button
            size="mini"
            type="primary"
            style="margin-left: 8px"
            @click="findDatasetRelatedTags(scope.row)"
            >类别标签</el-button
          >

          <el-upload
            class="inline-block"
            action="/analyze/dataset/import"
            accept="application/x-zip-compressed"
            :show-file-list="false"
            :http-request="handleFileUpload"
            :before-upload="beforeUpload"
            :limit="1"
          >
            <el-button
              size="mini"
              type="primary"
              style="margin-left: 8px"
              @click="importDataset(scope.row)"
              v-hasPermi="['dm365:dataset:import']"
              >导入</el-button
            >
          </el-upload>

          <el-button
            size="mini"
            type="primary"
            style="margin-left: 8px"
            @click="exportDataset(scope.row)"
            v-hasPermi="['dm365:dataset:export']"
            >导出</el-button
          >

          <el-button
            size="mini"
            type="danger"
            style="margin-left: 8px"
            @click="deleteDataset(scope.$index, scope.row)"
            v-hasPermi="['dm365:dataset:remove']"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- <el-dialog title="导入数据集" :visible.sync="showImportDialog">
      <el-form :model="importdatasetpath">
        <div style="margin-left: 20px">
          <el-radio-group v-model="import_format" size="small">
            <el-radio-button label="VOC"></el-radio-button>
            <el-radio-button label="COCO"></el-radio-button>
          </el-radio-group>

          <el-radio-group
            v-model="import_condition"
            size="small"
            style="margin-left: 20px"
          >
            <el-radio-button label="导入图片及标注"></el-radio-button>
            <el-radio-button label="仅导入图片"></el-radio-button>
          </el-radio-group>
        </div>
        <div style="margin-top: 20px">
          <el-form-item label="标注文件路径" :label-width="formLabelWidth">
            <el-input
              v-model="importdatasetpath.annopath"
              auto-complete="off"
            ></el-input>
          </el-form-item>
          <el-form-item label="图片路径" :label-width="formLabelWidth">
            <el-input
              v-model="importdatasetpath.imagepath"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showImportDialog = false">取 消</el-button>
        <el-button type="primary" @click="handleImport()">确 定</el-button>
      </div>
    </el-dialog> -->

    <el-dialog title="导出数据集" :visible.sync="showExportDialog">
      <el-form :model="exportConfig">
        <div style="margin-left: 20px">
          <el-radio-group v-model="exportConfig.exportFormat" size="small">
            <el-radio-button label="CLS"></el-radio-button>
            <el-radio-button label="VOC"></el-radio-button>
            <el-radio-button label="COCO"></el-radio-button>
          </el-radio-group>
        </div>
        <div style="margin-top: 20px">
          <el-form-item label="测试集大小" :label-width="formLabelWidth">
            <el-input
              v-model="exportConfig.testSize"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showExportDialog = false">取 消</el-button>
        <el-button type="primary" @click="handleExport()">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="数据集类别一览"
      :visible.sync="showlabelDialog"
      width="25%"
      top="5vh"
    >
      <div>
        <el-button
          size="small"
          type="primary"
          style="margin-left: 10px"
          @click="showSelectTagDialog = true"
          >添加类别标签</el-button
        >
      </div>

      <el-table
        :data="
          taglist.slice((currentpage - 1) * pagesize, currentpage * pagesize)
        "
        stripe
        height:auto
        style="width: 80%; margin-left: 30px; margin-top: 10px"
        border
        :default-sort="{ prop: 'title_en', order: 'ascending' }"
      >
        <el-table-column label="类别英文名" prop="title_en" align="center">
        </el-table-column>
        <el-table-column label="类别中文名" prop="title_cn" align="center">
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="danger"
              style="margin-left: 10px"
              @click="deleteDatasetTagRelation(scope.$index, scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="block" style="margin-top: 10px; margin-left: 30%">
        <el-pagination
          @current-change="handleCurrentchange"
          :current-page="currentpage"
          :page-size="pagesize"
          layout=" prev, pager, next"
          :total="tagcount"
        >
        </el-pagination>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" type="primary" @click="close()"
          >确 定</el-button
        >
      </span>
    </el-dialog>

    <el-dialog title="添加类别标签" :visible.sync="showAddTagDialog">
      <el-form :model="newTag">
        <div style="margin-top: 20px">
          <el-form-item label="标签中文名" :label-width="formLabelWidth">
            <el-input v-model="newTag.title_cn" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="标签英文名" :label-width="formLabelWidth">
            <el-input v-model="newTag.title_en" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="描述" :label-width="formLabelWidth">
            <el-input
              v-model="newTag.description"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showAddTagDialog = false">取 消</el-button>
        <el-button type="primary" @click="addNewTag()">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="类别一览"
      :visible.sync="showTagDialog"
      width="25%"
      top="5vh"
    >
      <div>
        <!-- <el-input
				size="small"
				style="margin-left:30px; width:180px"
				placeholder="请输入新增类别"
				v-model="tag"
				>
				</el-input> -->
        <!-- <el-button size="small" style="margin-left:10px;" @click="updateClasses()">更 新</el-button> -->
        <el-button
          size="small"
          type="primary"
          style="margin-left: 10px"
          @click="showAddTagDialog = true"
          v-hasPermi="['dm365:tag:add']"
          >添 加</el-button
        >
      </div>

      <el-table
        :data="tags.slice((currentpage - 1) * pagesize, currentpage * pagesize)"
        stripe
        height:auto
        style="width: 80%; margin-left: 30px; margin-top: 10px"
        border
        :default-sort="{ prop: 'title_en', order: 'ascending' }"
      >
        <el-table-column label="类别英文名" prop="title_en" align="center">
        </el-table-column>
        <el-table-column label="类别中文名" prop="title_cn" align="center">
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="danger"
              style="margin-left: 10px"
              @click="deleteTag(scope.$index, scope.row)"
              v-hasPermi="['dm365:tag:remove']"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="block" style="margin-top: 10px; margin-left: 30%">
        <el-pagination
          @current-change="handleCurrentchange"
          :current-page="currentpage"
          :page-size="pagesize"
          layout=" prev, pager, next"
          :total="tagCount"
        >
        </el-pagination>
      </div>
    </el-dialog>

    <el-dialog
      title="类别一览"
      :visible.sync="showSelectTagDialog"
      width="25%"
      top="5vh"
    >
      <el-table
        ref="multipleTable"
        :data="tags.slice((currentpage - 1) * pagesize, currentpage * pagesize)"
        stripe
        height:auto
        style="width: 80%; margin-left: 30px; margin-top: 10px"
        border
        :default-sort="{ prop: 'title_en', order: 'ascending' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"> </el-table-column>
        <el-table-column label="类别英文名" prop="title_en" align="center">
        </el-table-column>
        <el-table-column label="类别中文名" prop="title_cn" align="center">
        </el-table-column>
      </el-table>

      <div class="block" style="margin-top: 10px; margin-left: 30%">
        <el-pagination
          @current-change="handleCurrentchange"
          :current-page="currentpage"
          :page-size="pagesize"
          layout=" prev, pager, next"
          :total="tagcount"
        >
        </el-pagination>
      </div>
      <div style="margin-top: 20px">
        <el-button @click="toggleSelection(tags)">全选</el-button>
        <el-button @click="showSelectTagDialog = false">取消</el-button>
        <el-button @click="addDatasetTagRelation()">添加</el-button>
      </div>
    </el-dialog>

    <br />
    <div class="block" style="margin-bottom: 30px; margin-left: 40%">
      <el-pagination
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-size="pagesize"
        layout="total, prev, pager, next, jumper"
        :total="Datasetcount"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script>
import * as _dataset from "@/api/dm365/dataset";
import * as _tag from "@/api/dm365/tag";
import {importDataset, exportDataset, downloadDataset} from "@/api/analyzer/dataset";
import {queryTask} from "@/api/analyzer/task";

export default {
  data: () => ({
    Datasetlist: [],
    taglist: [],
    tag: null,
    newTag: {},
    tagcount: null,
    tagCount: null,
    datasetid: null,
    tags: [],
    selectedTags: [],
    // flag: true,
    newdataset: {},
    importdatasetpath: {},
    exportConfig: { exportFormat: "VOC", testSize: 0.2 },
    Datasetcount: null,
    loading: false,
    showCreateDialog: false,
    showAddTagDialog: false,
    showTagDialog: false,
    showSelectTagDialog: false,
    showImportDialog: false,
    showExportDialog: false,
    showlabelDialog: false,
    searchTxt: null,
    currentpage: 1,
    currentPage: 1,
    pagesize: 10,
    formLabelWidth: "120px",
    row: null,
    import_condition: "导入图片及标注",
    export_condition: "使用当前设置",
  }),
  methods: {
    async initTableData() {
      this.loading = true;
      this.Datasetcount = await _dataset.getDatasetCount();
      
      let offset = (this.currentPage - 1) * 20
      let limit = 20
      let datasetList = (await _dataset.getDatasets(offset, limit))["content"];
      for (let i in datasetList) {
        let dataset = datasetList[i];
        dataset.count = await _dataset.getDatasetImageCount(datasetList[i].uuid);
        dataset.tagcount = await _dataset.getDatasetTagCount(datasetList[i].uuid);
      }
      this.Datasetlist = datasetList;
      await this.getTagsInfo();
      
      this.loading = false;
    },

    async getTagsInfo() {
      this.tagCount = await _tag.getTagCount();
      this.tags = (await _tag.getTags())["content"];
    },

    async addNewTag() {
      await _tag.addTag(this.newTag);
      await this.getTagsInfo();
      this.newTag = {};
      this.showAddTagDialog = false;
    },

    handleCurrentChange(currentPage) {
      this.currentPage = currentPage;
    },

    handleCurrentchange(currentpage) {
      this.currentpage = currentpage;
    },

    async handleCreateDataset() {
      await _dataset.addDataset(this.newdataset);
      this.initTableData();
      this.newdataset = {};
      this.showCreateDialog = false;
    },

    async getDatasetRelatedTags(datasetid) {
      let res = await _dataset.getDatasetRelatedTags(datasetid);
      res.sort(function (a, b) {
        return a.title_en > b.title_en;
      });
      this.taglist = res;
      this.tagcount = this.taglist.length;
    },

    async findDatasetRelatedTags(row) {
      // 用于查看一个数据集的tag列表
      this.showlabelDialog = true;
      this.datasetid = row.uuid;
      await this.getDatasetRelatedTags(row.uuid);
    },

    toggleSelection(rows) {
      if (rows) {
        rows.forEach((row) => {
          this.$refs.multipleTable.toggleRowSelection(row);
        });
      } else {
        this.$refs.multipleTable.clearSelection();
      }
    },
    handleSelectionChange(tags) {
      this.selectedTags = tags;
    },
    async addDatasetTagRelation() {
      await _dataset.addDatasetRelatedTag(this.datasetid, this.selectedTags);
      await this.getDatasetRelatedTags(this.datasetid);
      
      this.selectedTags = [];
      this.showSelectTagDialog = false;
    },
    close() {
      this.showlabelDialog = false;
      this.currentpage = 1;
    },
    closeTagDialog() {
      this.showTagDialog = false;
    },

    async deleteDatasetTagRelation(index, row) {
      await _dataset.deleteDatasetRelatedTag(this.datasetid, row.id);
      await this.getDatasetRelatedTags(this.datasetid);
    },

    deleteDataset(index, row) {
      this.$confirm("此操作将删除该数据集, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.handleDeleteDataset(index, row);
          this.$message({
            type: "success",
            message: "删除成功!",
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    deleteTag(index, row) {
      this.$confirm("此操作将删除该标签, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.handleDeleteTag(index, row);
          this.$message({
            type: "success",
            message: "删除成功!",
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },

    importDataset(row) {
      this.row = row;
    },
    exportDataset(row) {
      this.row = row;
      this.showExportDialog = true;
    },
    handleImport() {
      this.importdatasetpath = [];
      this.showImportDialog = false;
    },
    async handleExport() {
      let response = await exportDataset(this.row.uuid, this.row.name, this.exportConfig.testSize, this.exportConfig.exportFormat);      
      if (response.status == 202) {
        let url = response.headers["location"];
        this.queryExportResult(url);
      } else {
        this.$message.error(`导出失败`);
      }

      this.exportConfig = { exportFormat: "VOC", testSize: 0.2 };
      this.showExportDialog = false;
    },

    async queryExportResult(url) {
      let response = await queryTask(url);
      if (response.data.state) {
        setTimeout(() => {
          this.queryExportResult(url);
        }, 2000);
      } else {
        let filename = response.data["filename"];
        response = await downloadDataset(filename);
        let headers = response.headers; //下载后文件名
        filename = headers["content-disposition"]
          .split(";")[1]
          .split("filename=")[1];
        const blob = new Blob([response.data], { type: "application/json" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(link.href);
      }
    },
    
    async handleDeleteDataset(index, row) {
      await _dataset.deleteDataset(row.id);
      this.initTableData();
    },

    async handleDeleteTag(index, row) {
      await _tag.deleteTag(row.id);
      this.getTagsInfo();
    },

    beforeUpload(file) {
      const isLt200M = file.size / 1024 / 1024 < 200;
      if (!isLt200M) {
        this.$message.error("上传图片大小不能超过 200MB!");
      }
      return isLt200M;
    },

    async handleFileUpload(upload) {
      let formData = new FormData();
      formData.append("file", upload.file);
      formData.append("datasetid", this.row.uuid);

      let config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      let response = await importDataset(formData);
      if (response.status == 202) {
        let url = response.headers["location"];
        this.queryImportResult(url);
      } else {
        this.$message.error(`导入失败`);
      }
      
      this.fileList = [];
    },

    async queryImportResult(url) {
      let response = await queryTask(url);
      if (response.data.state) {
        setTimeout(() => {
          this.queryImportResult(url);
        }, 2000);
      } else {
        this.initTableData();
        this.$message.success(`导入成功`);
      }
    },
  },

  mounted() {
    this.initTableData();
  },
};
</script>




<!--###############################################################################-->
<style lang="scss" scoped>
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
.parentElement {
  position: relative;
}
.childElement {
  position: absolute;
  width: 100%;
  z-index: 1;
  text-align: center;
}
</style>