# Knit Your String

屏幕上的热敏小票机。用鼠标点键盘，或直接用电脑键盘输入，按 PRINT，小票从出票口匀速滑出。版式和 u9e1 相同：上面是字母的十字针图纸，勾选 Print knitting pattern 后再加一张对称的摩尔斯图，底部是点阵原文。小票可以下载成 PNG。

页面是纯静态文件，没有打印服务，也不会请求本机端口。

## 在线

部署到 Vercel 后的地址：<https://knityourstring.vercel.app>

## 本地打开

用浏览器直接打开项目里的 `index.html`。

也可以在项目目录起一个静态服务：

```bash
python3 -m http.server 8080
```

然后打开 <http://127.0.0.1:8080>。
