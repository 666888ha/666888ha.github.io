# 基础组件-表格自定义列

### 使用案例
```

  <!-- 自定义列弹框 -->
    <custom-column-dialog
      ref="customColumnDialogRef"
      :all-columns-config="allColumnsConfig"
      :table-columns="tableColumns"
      :required-columns="requiredColumns"
      custom-key-name="customerListKey"
      @confirm="handleColumnConfirm"
    />
```

### custom-column-dialog参数
* allColumnsConfig 列表所有的列字段， 类型为:Array,
* tableColumns 列表当前显示的列字段， 类型为:Array,
* requiredColumns 列表当前一定显示的列字段， 类型为:Array,操作列一定显示
* customKeyName 自定义列的key， 类型为:String,必填主要是为了控制自定义列的缓存每个列表的缓存key
