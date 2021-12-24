const webpack = require('./zfpack'); //webpack5
const webpackOptions = require('./webpack.config');

webpack(webpackOptions, (error, stats) => {
    if (error) {
        console.log(error)
    } else { //把结果变成JSON进行输出
        stats.toJson({
            hash: true,
            assets: false
        })
        console.log()
    }
})