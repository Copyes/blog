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
        
    });
}