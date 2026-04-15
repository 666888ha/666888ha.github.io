# 基础组件-详情表单框


### 使用案例
```

<base-desc label-width="150px">
    // 多行时使用 el-row标签 type为flex
    <el-row type="flex">
         <base-desc-item label="姓名">
           王某某
         </base-desc-item>
         <base-desc-item label="年龄">
           18
         </base-desc-item>
         <base-desc-item label="性别">
           男
         </base-desc-item>
    </el-row>

    // 单行直接使用即可
    <base-desc-item label="个人介绍">
        爱好等...
    </base-desc-item>

    <base-desc-item label="ID" required>
        NO.123456789
    </base-desc-item>
</base-desc>
```

### base-desc参数
* labelWidth label宽度, 类型为:String, 默认为 150px 
* labelSuffix label名后冒号, 类型为:String, 默认为： 


### base-desc-item参数
* labelWidth label宽度, 类型为:String,不写时使用父级labelWidth
* label label名, 类型为:String 
* required 会在label前加 红色星号
