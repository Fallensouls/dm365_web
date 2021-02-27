<template>
	<div class="app-container member-detail"
	    v-loading="loading"
	    element-loading-text="拼命加载中"
	    element-loading-spinner="el-icon-loading"
	    element-loading-background="rgba(0, 0, 0, 0.8)">

		<el-row class="pdlr"
		    type="flex"
		    :gutter="10">
			<el-col :span="4">数据集名称</el-col>
			<el-col :span="10">
				<el-input v-model="newdataset.name"
				    placeholder="请输入数据集名称" /></el-col>
			<el-col :span="10" />
		</el-row>

		<el-row class="pdlr"
		    type="flex"
		    :gutter="10">
			<el-col :span="4">数据集描述</el-col>
			<el-col :span="10">
				<el-input v-model="newdataset.description"
				    placeholder="请输入数据集描述" /></el-col>
			<el-col :span="10" />
		</el-row>

		<el-row class="pdlr"
		    type="flex"
		    :gutter="10">
			<el-col :span="4">选择类别标签</el-col>
			<el-col :span="10">
				<el-table
					ref="multipleTable"
					:data="taglist"
					height="400"
					tooltip-effect="dark"
					style="width: 30%"
					@selection-change="handleSelectionChange">
					<el-table-column
					type="selection"
					width="55">
					</el-table-column>
					<el-table-column
					label="类别名称"
					width="120">
					<template slot-scope="scope">{{ scope.row.title_en }}</template>
					</el-table-column>
					
				</el-table>
				</el-col>
		<el-col :span="10" />
		</el-row>

		<div class="detail-line" />
		<el-button size="small" @click="handleCancel">取消</el-button>
		<el-button  size="small" @click="handleSubmit"
		    type="primary">提交</el-button>
	</div>
</template>
<script>
	import { service } from "../../utils/auth";
	export default {
		data() {
			return {
				newdataset:{},
				taglist:[],
				multipleSelection: [],
				selectedId: [],
				loading: false
			};
		},
		
		methods: {
			initData() {
				service.get("/tag").then(response =>{
					this.taglist = response.data;
				});
			},
			handleCancel() {
				this.$router.replace("/dataset");
			},
			handleSubmit() {
				service.post("/dataset", this.newdataset).then(response =>{
					this.newdataset = {};
					var datasetid = response.data.id;
					for(var i in this.multipleSelection){
						this.selectedId.push(this.multipleSelection[i].id);
					}
					this.selectedId.push("'" + datasetid+ "'");
					var algorithms = 'SelectImage.py';
					service.post("/tasks", {
						"id": Date.now(),
						"code": "0005",
						"inputs":"[" + this.selectedId + "]",
						"algorithms": algorithms
					}).then(rs =>{
							this.$router.replace("/dataset");
						});		
					});
			},
			toggleSelection(rows) {
				if (rows) {
				rows.forEach(row => {
					this.$refs.multipleTable.toggleRowSelection(row);
				});
				} else {
				this.$refs.multipleTable.clearSelection();
				}
			},
			handleSelectionChange(val) {
				this.multipleSelection = val;
				// for(var i in this.multipleSelection){
				// 	console.log(this.multipleSelection[i].id);
				// }
     		 }

		},
		created() {
			this.initData();
		},
		
	};
</script>
<style lang="scss" scoped>
	.el-row {
		margin-bottom: 5px;
		&:last-child {
			margin-bottom: 0;
		}
	}
	.member-detail {
		font-size: 16px;
		line-height: 2.5em;
	}
	.username {
		font-size: 28px;
		line-height: 1.5em;
	}
	.avatar {
		height: 90px;
		width: 90px;
		background-color: #ccc;
	}
	.pdlr {
		padding: 0 10px;
		.el-select {
			width: 100%;
		}
	}
	.detail-line {
		display: block;
		background-color: #999;
		height: 2px;
		margin: 10px 0;
	}
	.el-row--flex {
		flex-wrap: wrap;
	}
	.gray {
		color: #999;
	}
</style>
