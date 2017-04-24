const path = require('path')
const webpack = require('webpack')
const MFS = require('memory-fs')
const clientConfig = require('./webpack.client.config')
const serverConfig = require('./webpack.server.config')

module.exports = function setupDevServer (app, opts) {
    clientConfig.entry.app = ['webpack-hot-middleware/client', clientConfig.entry.app]
    clientConfig.output.filename = '[name].js'
    clientConfig.plugins.push(
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    )

    // dev middlemare
    const clientCompiler = webpack(clientConfig)
    const devMiddleware = require('webpack-dev-middleware')(clientCompiler, {
        publicPath: clientConfig.output.publicPath,
        stats: {
            colors: true,
            chunks: false
        }
    })
    app.use(devMiddleware)
    // 在client-webpack转换完成时获取devMiddleware的fileSystem。
    // 读取生成的index.html并通过传入的opt的回调设置到server.js里
    clientCompiler.plugin('done', () => {
        const fs = devMiddleware.fileSystem
        const filePath = path.join(clientConfig.output.path, 'index.html')
        fs.stat(filePath, (err, stats) => {
            if (stats && stats.isFile()){
                fs.readFile(filePath, 'utf-8', (err, data) => {
                    opts.indexUpdated(data)
                })
            } else {
                console.error(err)
            }
        })
    })
    app.use(require('webpack-hot-middleware')(clientCompiler))

    const serverCompiler = webpack(serverConfig)
    const mfs = new MFS()
    const outputPath = path.join(serverConfig.output.path, serverConfig.output.filename)
    // 把server-webpack生成的文件重定向到内存中
    serverCompiler.outputFileSystem = mfs
    // 设置文件重新编译监听并通过opt的回调设置到server.js
    serverCompiler.watch({}, (err, stats) => {
        if (err) throw err
        stats = stats.toJson()
        stats.errors.forEach(err => console.error(err))
        stats.warnings.forEach(err => console.warn(err))
        mfs.readFile(outputPath, 'utf-8', (err, data) => {
            opts.bundleUpdated(data)
        })
    })
}