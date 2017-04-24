const fs = require('fs');
const path = require('path');
const express = require('express');
const favicon = require('serve-favicon');
const compression = require('compression');
const serialize = require('serialize-javascript');

const resolve = file => path.resolve(__dirname, file);

const isProd = process.env.NODE_ENV === 'production';
// 一些服务的版本信息
const serverInfo = `express/${require('express/package.json').version}` + 
    `vue-server-renderer/${require('vue-server-renderer/package.json').version}`;
const app = express();

let indexHTML;
let renderer;
// 在生产环境直接读取的是build后产生的文件
if(isProd){
    renderer = createRenderer(fs.readFileSync('./dist/server-bundle.js'), 'utf-8');
    indexHTML = parseIndex(fs.readFileSync('./dist/index.html'), 'utf-8');
}else{
    // 生产环境中通过setup-dev-server来通过回调把生成在内存中的文件赋值
    require('./build/setup-dev-server')(app, {
        bundleUpdated: bundle => {
            renderer = createRenderer(bundle);
        },
        indexUpdated: index => {
            indexHTML = parseIndex(index);
        }
    });
}
// 创建一个渲染器
const createRenderer = (bundle) => {
    return require('vue-server-renderer').createBundleRenderer(bundle, {
        cache: require('lru-cache')({
            max: 1000,
            maxAge: 1000 * 60 * 15
        }) 
    });
}
// 切割模版文件
const parseIndex = (template) => {
    const contentMaker = '<!-- APP -->';
    const index = template.indexOf(contentMaker);
    return {
        // html 头部
        header: template.slice(0, index),
        // html 尾部
        tail: template.slice(index + contentMaker.length)
    }
};
// 静态文件
const serve = (path, cache) => express.static(resolve(path), {
    maxAge: cache && isProd ? 60 * 60 * 24 * 30 : 0
});

// 加载和设置static
app.use(compression({ threshold: 0}));
app.use(favicon('./public/logo-48.png'));
app.use('/service-worker.js', serve('./servivce-worker.js'));
app.use('/dist', serve('./dist'));
app.use('/public', serve('./public'));
// 模拟api
app.use('/api/topstories.json', serve('./public/api/topstories.json'));
app.use('/api/newstories.json', serve('./public/api/newstories.json'));

app.get('/api/item/:id.json', (req, res, next) => {
    const id = req.params.id;
    const time = parseInt(Math.random() * (1487396700-1400000000+1)+1400000000);
    const item = {
        by: "zero" + id,
        descendants: 0,
        id: id,
        score: id - 13664000,
        time: time,
        title: `测试Item:${id} - ${time}`,
        type: 'story',
        url: `/api/item/${id}.json`
    }
    res.json(item);
});
// 处理所有的Get请求
app.get('*', (req, res) => {
    // 防止异步的renderer对象还没有生成
    if (!renderer) {
        return res.end('waiting for compilation.. refresh in a moment.')
    }
    // 设置请求头
    res.setHeader("Context-Type", "text/html");
    res.setHeader("Server", serverInfo);
    // 记录时间
    const s = Date.now();
    // 为renderToStream方法传入url，renderToStream会根据url寻找vue-router
    const context = { url: req.url };
    // 渲染我们的Vue实例作为流
    const renderStream = renderer.renderToStream(context);
    // 注册data之前事件把index.html的头部写入res
    renderStream.once('data', () => {
        res.write(indexHTML.head);
    })
    // 注册data中事件直接把ssr的html写出
    renderStream.on('data', chunk => {
        res.write(chunk);
    })
    // 注册end事件把已经挂载到context的vuex的State，
    // 通过`serialize-javascript`序列化成js字面量。
    // 其中挂载到window.__INSTAL_STATE__
    // 并且返回index.html尾部并结束这个请求
    // 最后输出这次ssr的时间
    renderStream.on('end', () => {
        if (context.initialState) {
            res.write(
                `<script>window.__INSTAL_STATE__=${
                    serialize(context.initialState)
                }</script>`
            );
        }
        res.end(indexHTML.tail);
        console.log(`whole request: ${Date.now() - s}ms`);
    })
    // 错误事件
    renderStream.on('error', err => {
        if (err && err.code === '404') {
            res.status(404).end('404 | Page Not Found');
            return;
        }
        // 告诉客服端发生了错误
        res.status(500).end('Internal Error 500');
        console.error(`error during render : ${req.url}`);
        console.error(err);
    })
});

const port = process.env.PORT || 8089
app.listen(port, () => {
    console.log(`server started at localhost:${port}`);
})

