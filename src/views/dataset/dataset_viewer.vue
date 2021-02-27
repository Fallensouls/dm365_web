<template>
	<div class="app-container">
		<div class="actions">
            <div>
                <el-input size="small"
                    v-model="searchTxt"
                    placeholder="请输入搜索内容"
                    prefix-icon="el-icon-search" />
            </div>
        </div>
            <el-table 
                :data="imagelist"
                stripe
                style="width: 100%"
                border
                height:auto
                :default-sort="{prop: 'upddate', order: 'descending'}">
                <el-table-column label="图片预览"
                  align="center"
                  sortable
                  >
                <template slot-scope="scope">
                  <el-image 
                    style="width: 100px; height: 100px" 
                    :src="`http://47.114.104.84:8080/ndb/file/${scope.row.storageobjectid}`" 
                    :preview-src-list="[`http://47.114.104.84:8080/ndb/file/${scope.row.storageobjectid}`]"
                    lazy> 
                  </el-image>
                </template>
              </el-table-column>
                <el-table-column label="图片名称"
                    align="center"
                    sortable
                    >
                    <template slot-scope="scope">
                    <router-link :to="`/dataset/image/view/${scope.row.uuid}`">
                      <el-button type="text" size="mini" style="font-size:14px">{{scope.row.uuid}}</el-button>
                    </router-link>	
                  </template>
                </el-table-column>
                <el-table-column label="宽"
                    prop="width"
                    width="100"
                    align="center"
                    >
                </el-table-column>
                <el-table-column label="高"
                    prop="height"
                    width="100"
                    align="center"
                    >
                </el-table-column>  
                <el-table-column label="创建者"
                    prop="crtuser"
                    align="center"
                    sortable
                    >
                </el-table-column>
                <el-table-column label="创建日期"
                    prop="crtdate"
                    align="center"
                    sortable
                    >
                </el-table-column>
                <el-table-column label="更新者"
                    prop="upduser"
                    align="center"
                    sortable
                    >
                </el-table-column>
                <el-table-column label="更新日期"
                    prop="upddate"
                    align="center"
                    sortable
                    >
                </el-table-column>
                
            </el-table>
            <br>
            <div class="block" style="margin-bottom:30px; margin-left:40%">
                <el-pagination
                    @current-change="handleCurrentChange"
                    :current-page="currentPage"
                    :page-size="pagesize"
                    layout="total, prev, pager, next, jumper"
                    :total="imagecount">
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
			imagelist: [],
      imagecount:null,
			loading: true,
			searchTxt: null,
      currentPage:1,
			pagesize: 20
		}),
		methods: {
			async initTableData() {
        this.loading = true;
        this.imagecount = await _dataset.getDatasetImageCount(this.$route.params.id);
        this.fetchData();
      },
      
      async fetchData() {
        let offset = (this.currentPage - 1) * 20;
        let limit = 20;
        let imagelist = (await _dataset.getImagesByDataset(this.$route.params.id, offset, limit))["content"];
        for (let i in imagelist) {
          imagelist[i].inputVisible = false;
          imagelist[i].inputTags = [];
          imagelist[i].recmdTags = [];
        }
        this.imagelist = imagelist;
        this.loading = false;
      },

			handleCurrentChange(currentPage){
        this.currentPage = currentPage;
        this.fetchData();
      },
		},
		mounted() {
			this.initTableData();
		}
	};
</script>




<!--###############################################################################-->
<style lang="scss" scoped>
.first {
    width: 70%;
    float:left;
    
}
.second {
    width: 30%;
    float:left;
    
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
  }

  .el-select {
    width: 150px;
  }
  .el-input {
    width: 250px;
	  // margin-left: 12px;
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
    span{
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
        line-height: 20px;
        }
}

</style>