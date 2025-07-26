<!-- src/modules/common/components/DataTable.vue -->
<template>
  <div class="data-table-wrapper">
    <!-- 表格工具栏 -->
    <div class="table-toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <el-input
            v-if="searchable"
            v-model="searchText"
            :placeholder="searchPlaceholder"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
            style="width: 300px"
        />
        <slot name="toolbar-left"></slot>
      </div>

      <div class="toolbar-right">
        <slot name="toolbar-right"></slot>
        <el-button
            v-if="exportable"
            @click="handleExport"
            :loading="exporting"
        >
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button
            v-if="refreshable"
            :icon="RefreshRight"
            @click="handleRefresh"
            circle
        />
      </div>
    </div>

    <!-- 表格主体 -->
    <el-table
        ref="tableRef"
        :data="displayData"
        :height="height"
        :max-height="maxHeight"
        :stripe="stripe"
        :border="border"
        :fit="fit"
        :show-header="showHeader"
        :highlight-current-row="highlightCurrentRow"
        :row-class-name="rowClassName"
        :row-style="rowStyle"
        :empty-text="emptyText"
        v-loading="loading"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
    >
      <!-- 选择列 -->
      <el-table-column
          v-if="selectable"
          type="selection"
          width="55"
          :selectable="selectableMethod"
      />

      <!-- 索引列 -->
      <el-table-column
          v-if="showIndex"
          type="index"
          label="#"
          width="60"
          :index="indexMethod"
      />

      <!-- 数据列 -->
      <el-table-column
          v-for="column in columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :align="column.align || 'left'"
          :sortable="column.sortable"
          :formatter="column.formatter"
          :show-overflow-tooltip="column.showOverflowTooltip !== false"
      >
        <template #default="scope" v-if="column.slot">
          <slot :name="column.slot" :row="scope.row" :index="scope.$index"></slot>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column
          v-if="$slots.actions || actions.length > 0"
          label="操作"
          :width="actionsWidth"
          :fixed="actionsFixed"
          :align="actionsAlign"
      >
        <template #default="scope">
          <slot name="actions" :row="scope.row" :index="scope.$index">
            <el-button
                v-for="action in getRowActions(scope.row, scope.$index)"
                :key="action.key || action.text"
                :type="action.type || 'primary'"
                :size="action.size || 'small'"
                :disabled="action.disabled"
                text
                @click="handleActionClick(action, scope.row, scope.$index)"
            >
              {{ action.text }}
            </el-button>
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="table-pagination" v-if="pagination">
      <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="pageSizes"
          :layout="paginationLayout"
          :total="total"
          :background="true"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, RefreshRight } from '@element-plus/icons-vue'

interface Column {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  sortable?: boolean | 'custom'
  formatter?: (row: any, column: any, cellValue: any, index: number) => any
  showOverflowTooltip?: boolean
  slot?: string
}

interface Action {
  key?: string
  text: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'large' | 'default' | 'small'
  disabled?: boolean | ((row: any, index: number) => boolean)
  handler?: (row: any, index: number) => void
  show?: boolean | ((row: any, index: number) => boolean)
}

interface Props {
  columns: Column[]
  data: any[]
  actions?: Action[]
  loading?: boolean
  height?: string | number
  maxHeight?: string | number
  stripe?: boolean
  border?: boolean
  fit?: boolean
  showHeader?: boolean
  highlightCurrentRow?: boolean
  emptyText?: string
  rowClassName?: string | ((data: { row: any; rowIndex: number }) => string)
  rowStyle?: object | ((data: { row: any; rowIndex: number }) => object)

  // 工具栏
  showToolbar?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  exportable?: boolean
  refreshable?: boolean

  // 功能列
  selectable?: boolean
  selectableMethod?: (row: any, index: number) => boolean
  showIndex?: boolean
  indexMethod?: (index: number) => number

  // 操作列
  actionsWidth?: number | string
  actionsFixed?: boolean | 'left' | 'right'
  actionsAlign?: 'left' | 'center' | 'right'

  // 分页
  pagination?: boolean
  pageSize?: number
  pageSizes?: number[]
  paginationLayout?: string
  total?: number
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [],
  loading: false,
  stripe: true,
  border: false,
  fit: true,
  showHeader: true,
  highlightCurrentRow: false,
  emptyText: '暂无数据',
  showToolbar: true,
  searchable: true,
  searchPlaceholder: '请输入搜索内容',
  exportable: true,
  refreshable: true,
  selectable: false,
  showIndex: false,
  actionsWidth: 180,
  actionsFixed: 'right',
  actionsAlign: 'center',
  pagination: true,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  paginationLayout: 'total, sizes, prev, pager, next, jumper',
  total: 0
})

const emit = defineEmits<{
  search: [value: string]
  export: []
  refresh: []
  'sort-change': [data: any]
  'selection-change': [selection: any[]]
  'row-click': [row: any, column: any, event: Event]
  'page-change': [page: number]
  'size-change': [size: number]
  action: [action: Action, row: any, index: number]
}>()

// 响应式数据
const tableRef = ref()
const searchText = ref('')
const exporting = ref(false)
const currentPage = ref(1)
const pageSize = ref(props.pageSize)
const selectedRows = ref<any[]>([])

// 计算显示的数据
const displayData = computed(() => {
  if (!props.pagination) {
    return props.data
  }

  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.data.slice(start, end)
})

// 获取行操作
const getRowActions = (row: any, index: number) => {
  return props.actions.filter(action => {
    if (typeof action.show === 'function') {
      return action.show(row, index)
    }
    return action.show !== false
  })
}

// 处理搜索
const handleSearch = (value: string) => {
  emit('search', value)
}

// 处理导出
const handleExport = async () => {
  exporting.value = true
  try {
    emit('export')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// 处理刷新
const handleRefresh = () => {
  emit('refresh')
}

// 处理排序
const handleSortChange = (data: any) => {
  emit('sort-change', data)
}

// 处理选择
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

// 处理行点击
const handleRowClick = (row: any, column: any, event: Event) => {
  emit('row-click', row, column, event)
}

// 处理操作点击
const handleActionClick = (action: Action, row: any, index: number) => {
  if (action.handler) {
    action.handler(row, index)
  }
  emit('action', action, row, index)
}

// 处理分页改变
const handleCurrentChange = (page: number) => {
  emit('page-change', page)
}

const handleSizeChange = (size: number) => {
  emit('size-change', size)
}

// 索引方法
const indexMethod = (index: number) => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

// 暴露方法
defineExpose({
  getSelectionRows: () => selectedRows.value,
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row: any, selected?: boolean) => {
    tableRef.value?.toggleRowSelection(row, selected)
  },
  toggleAllSelection: () => tableRef.value?.toggleAllSelection(),
  clearSort: () => tableRef.value?.clearSort(),
  doLayout: () => tableRef.value?.doLayout()
})
</script>

<style lang="scss" scoped>
.data-table-wrapper {
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 16px;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toolbar-left {
      flex: 1;
    }
  }

  .table-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}

// 表格主题适配
:deep(.el-table) {
  background: transparent;

  &::before {
    background-color: var(--ai-border);
  }

  .el-table__inner-wrapper {
    &::before {
      background-color: var(--ai-border);
    }
  }

  th.el-table__cell {
    background: var(--ai-bg-tertiary);
    color: var(--ai-text-primary);
    font-weight: 600;
  }

  .el-table__row {
    &:hover > td.el-table__cell {
      background-color: var(--ai-card-bg-hover);
    }
  }

  td.el-table__cell {
    color: var(--ai-text-secondary);
  }

  .el-table__empty-block {
    background: transparent;
  }
}
</style>