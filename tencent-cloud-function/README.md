# 腾讯云 CloudBase 接口部署说明

这个文件夹是「泡腾丸子主题点菜单」的数据收集后端。

## 1. 创建云开发环境

进入腾讯云控制台，搜索并打开「云开发 CloudBase」。

创建一个环境，选择免费/基础套餐即可。

## 2. 创建数据库集合

在 CloudBase 控制台里打开「数据库」，新建集合：

`submissions`

权限先选择「仅创建者可读写」也可以，因为云函数会用服务端权限写入。

## 3. 创建云函数

打开「云函数」，新建函数：

- 函数名：`paowanzi-menu-api`
- 运行环境：`Node.js`
- 触发方式：HTTP 访问

把本文件夹里的两个文件上传进去：

- `index.js`
- `package.json`

部署函数。

## 4. 开启 HTTP 访问

在函数详情里找到 HTTP 访问地址，通常长得像：

`https://xxxx.service.tcloudbase.com/paowanzi-menu-api`

复制这个地址。

网站会自动请求：

- `https://xxxx.service.tcloudbase.com/paowanzi-menu-api?action=submit`
- `https://xxxx.service.tcloudbase.com/paowanzi-menu-api?action=submissions`

## 5. 填回网站代码

打开网站里的：

- `index.html`
- `admin.html`

把这行：

`const API_BASE_URL = "PASTE_TENCENT_CLOUD_API_URL_HERE";`

替换成你的 HTTP 访问地址，例如：

`const API_BASE_URL = "https://xxxx.service.tcloudbase.com/paowanzi-menu-api";`

然后提交并推送到 GitHub。

## 6. 测试

打开首页提交一份测试点单，再打开：

`https://ptwanzi.github.io/paowanzi-menu/admin.html`

如果后台出现数据，就完成了。
