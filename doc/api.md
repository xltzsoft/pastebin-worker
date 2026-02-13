# API 参考文档

## GET `/`

返回首页。

## **GET** `/<name>[.<ext>]` 或 `/<name>/<filename>`

获取名为 `<name>` 的粘贴内容。默认返回粘贴的原始内容。

`Content-Type` 头根据粘贴的文件名推断 MIME 类型，如果没有文件名则设为 `text/plain;charset=UTF-8`。如果提供了 `<ext>`，Worker 会根据 `<ext>` 推断 MIME 类型并修改 `Content-Type`。如果上传时包含文件名，Worker 会根据文件名推断 MIME 类型。

`Content-Disposition` 头默认设为 `inline`，可通过 `?a` 查询参数覆盖为 `attachment`。如果粘贴上传时带有文件名，或请求 URL 中设置了 `<filename>`，则 `Content-Disposition` 会附加 `filename*` 指示文件名。如果粘贴已加密，文件名会附加 `.encrypted` 后缀。

如果粘贴已加密，会设置 `X-PB-Encryption-Scheme` 响应头表示加密方案。

如果上传时指定了 `lang` 参数，会设置 `X-PB-Highlight-Language` 响应头表示语法高亮语言。

- `?a=`：可选。设置 `Content-Disposition` 为 `attachment`。

- `?mime=<mime>`：可选。指定 MIME 类型，覆盖 `<ext>` 的推断效果。如果指定了 `lang` 则无效（此时 MIME 类型始终为 `text/html`）。

示例：`GET /abcd?lang=js`，`GET /abcd?mime=application/json`。

如果出错，Worker 返回非 `200` 的状态码：

- `404`：未找到指定名称的粘贴。
- `500`：意外异常。

使用示例：

```shell
$ curl https://pb.stzo.cn/i-p-
https://web.archive.org/web/20210328091143/https://mp.weixin.qq.com/s/5phCQP7i-JpSvzPEMGk56Q

$ curl https://pb.stzo.cn/~panty.jpg | feh -

$ curl 'https://pb.stzo.cn/~panty.jpg?mime=image/png' -w '%{content_type}' -o /dev/null -sS
image/png

$ curl 'https://pb.stzo.cn/kf7Z/panty.jpg?mime=image/png' -w '%{content_type}' -o /dev/null -sS
image/png
```

## GET `/<name>:<passwd>`

返回编辑名为 `<name>`、密码为 `<passwd>` 的粘贴的网页。

如果出错，Worker 返回非 `200` 的状态码：

- `404`：未找到指定名称的粘贴。
- `500`：意外异常。

## GET `/u/<name>`

重定向到名为 `<name>` 的粘贴中记录的 URL。

如果出错，Worker 返回非 `302` 的状态码：

- `404`：未找到指定名称的粘贴。
- `500`：意外异常。

使用示例：

```shell
$ firefox https://pb.stzo.cn/u/i-p-

$ curl -L https://pb.stzo.cn/u/i-p-
```

## GET `/d/<name>`

返回显示名为 `<name>` 的粘贴内容的网页。如果粘贴已加密，可以在 URL 后附加解密密钥以在浏览器中解密。

如果出错，Worker 返回非 `302` 的状态码：

- `404`：未找到指定名称的粘贴。
- `500`：意外异常。

使用示例：

```shell
$ firefox https://pb.stzo.cn/d/i-p-
```

## GET `/m/<name>`

获取名为 `<name>` 的粘贴的元数据。

如果出错，Worker 返回非 `200` 的状态码：

- `404`：未找到指定名称的粘贴。
- `500`：意外异常。

使用示例：

```shell
$ curl -L https://pb.stzo.cn/m/i-p-
{
  "lastModifiedAt": "2025-05-05T10:33:06.114Z",
  "createdAt": "2025-05-01T10:33:06.114Z",
  "expireAt": "2025-05-08T10:33:06.114Z",
  "sizeBytes": 4096,
  "location": "KV",
  "filename": "a.jpg",
  "encryptionScheme": "AES-GCM"
}
```

字段说明：

- `lastModifiedAt`：字符串。粘贴最后修改时间的 ISO 格式时间戳。
- `createdAt`：字符串。粘贴创建时间的 ISO 格式时间戳。
- `expireAt`：字符串。粘贴过期时间的 ISO 格式时间戳。
- `sizeBytes`：整数。粘贴内容的字节大小。
- `filename`：可选字符串。粘贴的文件名。
- `location`：字符串，值为 "KV" 或 "R2"。表示粘贴内容存储在 Cloudflare KV 还是 R2 对象存储中。
- `encryptionScheme`：可选字符串。目前仅支持 "AES-GCM"。粘贴使用的加密方案。

## GET `/a/<name>`

返回将名为 `<name>` 的粘贴中存储的 Markdown 文件转换后的 HTML。Markdown 转换遵循 GitHub Flavored Markdown (GFM) 规范，由 [remark-gfm](https://github.com/remarkjs/remark-gfm) 提供支持。

语法高亮由 [prism.js](https://prismjs.com/) 提供。LaTeX 数学公式由 [MathJax](https://www.mathjax.org) 提供支持。

如果出错，Worker 返回非 `200` 的状态码：

- `404`：未找到指定名称的粘贴。
- `500`：意外异常。

使用示例：

```md
# 一级标题

这是 `test.md` 的内容

<script>
alert("脚本应被移除")
</script>

## 二级标题

| abc | defghi |
| :-: | -----: |
| bar |    baz |

**粗体**，`等宽字体`，_斜体_，~~删除线~~，[链接](https://github.com)

- A
- A1
- A2
- B

![Panty](https://pb.stzo.cn/~panty.jpg)

1. 第一
2. 第二

> 引用

$$
\int_{-\infty}^{\infty} e^{-x^2} = \sqrt{\pi}
$$
```

```shell
$ curl -Fc=@test.md -Fn=test-md https://pb.stzo.cn

$ firefox https://pb.stzo.cn/a/~test-md
```

## **HEAD** `/*`

请求粘贴但不返回正文。接受与所有 `GET` 请求相同的参数，返回相同的 `Content-Type`、`Content-Disposition`、`Content-Length` 和缓存控制头。注意：`/a/<name>`、`?lang=<lang>` 返回的 `Content-Length` 是粘贴原始内容的长度，而非实际 HTML 页面的长度。

## **POST** `/`

上传粘贴。通过 form-data 传递参数：

- `c`：必填。粘贴的**内容**，文本或二进制。大小不超过 10 MB。其 `Content-Disposition` 中的 `filename` 会在获取粘贴时保留。

- `e`：可选。粘贴的**过期时间**。过期后粘贴将被永久删除。值为整数或浮点数，后跟可选的时间单位（默认为秒）。支持的单位：`s`（秒）、`m`（分钟）、`h`（小时）、`d`（天）。例如 `360.24` 表示 360.24 秒；`25d` 表示 25 天。实际过期时间可能因管理员设置的限制而缩短。未指定时使用默认过期时间。

- `s`：可选。**密码**，用于修改和删除粘贴。未指定时 Worker 会自动生成随机字符串作为密码。

- `n`：可选。自定义粘贴**名称**。未指定时 Worker 会生成随机字符串（默认 4 个字符）作为名称。获取自定义名称的粘贴时需要在名称前加 `~`。名称至少 3 个字符，可包含字母、数字和 `+_-[]*$=@,;/` 字符。

- `p`：可选。**私密模式**标志。如果设置为任何值，粘贴名称将为 24 个字符长。如果指定了 `n` 则无效。

- `encryption-scheme`：可选。上传粘贴时使用的加密方案。获取粘贴时会作为 `X-PB-Encryption-Scheme` 响应头返回。注意：这不是后端执行的加密方案。

- `lang`：可选。用于语法高亮的语言。应为 [highlight.js 文档](https://github.com/highlightjs/highlight.js/blob/main/SUPPORTED_LANGUAGES.md) 中列出的小写语言名称。获取粘贴时会作为 `X-PB-Highlight-Language` 响应头返回。

`POST` 方法默认返回 JSON 字符串，如果没有错误，例如：

```json
{
  "url": "https://pb.stzo.cn/abcd",
  "manageUrl": "https://pb.stzo.cn/abcd:w2eHqyZGc@CQzWLN=BiJiQxZ",
  "expirationSeconds": 1209600,
  "expireAt": "2025-05-05T10:33:06.114Z"
}
```

字段说明：

- `url`：字符串。获取粘贴的 URL。使用自定义名称时形如 `https://pb.stzo.cn/~myname`。
- `manageUrl`：字符串。用于更新和删除粘贴的 URL，即 `url` 后加 `:` 和密码。
- `expirationSeconds`：整数。过期秒数。
- `expireAt`：字符串。粘贴过期时间的 ISO 格式时间戳。

如果出错，Worker 返回非 `200` 的状态码：

- `400`：请求格式错误。
- `409`：名称已被使用。
- `413`：内容过大。
- `500`：意外异常。

使用示例：

```shell
$ curl -Fc="kawaii" -Fe=300 -Fn=hitagi https://pb.stzo.cn  # 上传文本
{
  "url": "https://pb.stzo.cn/~hitagi",
  "manageUrl": "https://pb.stzo.cn/~hitagi:22@-OJWcTOH2jprTJWYadmDv",
  "expirationSeconds": 300,
  "expireAt": "2025-05-05T10:33:06.114Z"
}

$ curl -Fc=@panty.jpg -Fn=panty -Fs=12345678 https://pb.stzo.cn   # 上传文件
{
  "url": "https://pb.stzo.cn/~panty",
  "manageUrl": "https://pb.stzo.cn/~panty:12345678",
  "expirationSeconds": 1209600,
  "expireAt": "2025-05-05T10:33:06.114Z"
}

# 因为 `curl` 将某些字符作为字段分隔符，如果字段包含分号或逗号，
# 需要用双引号包裹
$ curl -Fc=@panty.jpg -Fn='"hi/hello;g,ood"' -Fs=12345678 https://pb.stzo.cn
{
  "url": "https://pb.stzo.cn/~hi/hello;g,ood",
  "manageUrl": "https://pb.stzo.cn/~hi/hello;g,ood:QJhMKh5WR6z36QRAAn5Q5GZh",
  "expirationSeconds": 1209600,
  "expireAt": "2025-05-05T10:33:06.114Z"
}
```

## **PUT** `/<name>:<passwd>`

更新名为 `<name>`、密码为 `<passwd>` 的粘贴。通过 form-data 传递参数：

- `c`：必填。与 `POST` 方法相同。
- `e`：可选。与 `POST` 方法相同。注意：过期时间会重新计算。
- `s`：可选。与 `POST` 方法相同。

`PUT` 方法的返回值与 `POST` 方法相同。

如果出错，Worker 返回非 `200` 的状态码：

- `400`：请求格式错误。
- `403`：密码不正确。
- `404`：未找到指定名称的粘贴。
- `413`：内容过大。
- `500`：意外异常。

使用示例：

```shell
$ curl -X PUT -Fc="kawaii~" -Fe=500 https://pb.stzo.cn/~hitagi:22@-OJWcTOH2jprTJWYadmDv
{
  "url": "https://pb.stzo.cn/~hitagi",
  "manageUrl": "https://pb.stzo.cn/~hitagi:22@-OJWcTOH2jprTJWYadmDv",
  "expirationSeconds": 500,
  "expireAt": "2025-05-05T10:33:06.114Z"
}

$ curl -X PUT -Fc="kawaii~" https://pb.stzo.cn/~hitagi:22@-OJWcTOH2jprTJWYadmDv
{
  "url": "https://pb.stzo.cn/~hitagi",
  "manageUrl": "https://pb.stzo.cn/~hitagi:22@-OJWcTOH2jprTJWYadmDv",
  "expirationSeconds": 500,
  "expireAt": "2025-05-05T10:33:06.114Z"
}
```

## DELETE `/<name>:<passwd>`

删除名为 `<name>`、密码为 `<passwd>` 的粘贴。删除可能需要几秒钟在全球同步。

如果出错，Worker 返回非 `200` 的状态码：

- `403`：密码不正确。
- `404`：未找到指定名称的粘贴。
- `500`：意外异常。

使用示例：

```shell
$ curl -X DELETE https://pb.stzo.cn/~hitagi:22@-OJWcTOH2jprTJWYadmDv
粘贴将在几秒内被删除

$ curl https://pb.stzo.cn/~hitagi
未找到
```
