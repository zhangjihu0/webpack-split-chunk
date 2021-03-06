const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const babylon = require('babylon'); //用源代码转成语法树
const types = require('babel-types'); //用来判断摸个节点是否是指定类型，或者用来生成一个新节点
const traverse = require('babel-traverse').default //用来遍历语法树的节点，并且对节点进行增删改查
const generator = require('babel-generator').default//用来把语法树重新变成代码

const { join, dirname } = require('path').posix; //为了保证在不同的操作系统下的唯一性
//不同操作系统分隔符不一样，

const mainTemplate = fs.readFileSync('./main.ejs', 'utf8');
const chunkTemplate = fs.readFileSync('./chunk.ejs', 'utf8');
class Compiler {
    constructor(config) {
        this.config = config;
    }
    run() {
        //1.找到入口文件
        let { entry } = this.config;
        this.entry = entry; //这是我们入口，其实也是个路径，相对于项目根目录的路径
        this.modules = {}; //这里存放着我们所有的模块

        this.chunks = { //这里放着所有的代码块
            main: {

            }
        }
        //{main:{'./src/index.js':code},src_hello_js:{'./src/hello.js':code} }

        this.buildModule(entry, 'main');
        this.emitFiles() //完成后，根据this.modules对象产出一个bundle
    }
    buildModule(moduleId, chunkId) { //把模块的ID传进来
        //源代码->babylon->语法树->traverse遍历树的所有节点，找到我们想要的节点-> types生成新的节点替换 老节点->generator重新生成代码
        let originalSource = fs.readFileSync(moduleId, 'utf-8');
        const ast = babylon.parse(originalSource, {
            plugins: ['dynamicImport'] //
        });
        const dependencies = [];//声明一个依赖的数组，里面放着本模块所依赖的模块ID数组
        traverse(ast, {
            CallExpression: (nodePath) => {
                if (nodePath.node.callee.name == 'require') {
                    let node = nodePath.node;
                    node.callee.name = '__webpack_require__';
                    let moduleName = node.arguments[0].value;
                    //moduleId = ./src/index.js=>src +hello.js
                    let dependencyModuleId = './' + join(dirname(moduleId), moduleName);
                    //./hello.js=>./src/hello.js
                    dependencies.push(dependencyModuleId);
                    node.arguments = [types.stringLiteral(dependencyModuleId)]
                } else if (types.isImport(nodePath.node.callee)) {
                    let node = nodePath.node;
                    let moduleName = node.arguments[0].value;//异步加载的模块名


                    let dependencyModuleId = './' + join(dirname(moduleId), moduleName);
                    // ./src/hello.js=> src_hello_js
                    let dependencyChunkId = dependencyModuleId.slice(2).replace(/\/|\./g, '_') + ".js"

                    nodePath.replaceWithSourceString(`
                        __webpack_require__.e("${dependencyChunkId}").then(__webpack_require__.t.bind(__webpack_require__,"${dependencyModuleId}"))
                    `)
                    //此代码依赖的代码也会放在分割出去的代码块中
                    this.buildModule(dependencyModuleId, dependencyChunkId)

                }
            }
        })
        let { code } = generator(ast);

        (this.chunks[chunkId] = this.chunks[chunkId] || {})[moduleId] = code;
        // this.modules[moduleId] = code; //属性名就是模块ID值 就是这个模块对应的代码
        //递归编译
        dependencies.forEach(dependency => this.buildModule(dependency))
    }
    emitFiles() {
        let { output } = this.config;
        Object.keys(this.chunks).forEach(chunkId => {
            if (chunkId == 'main') {
                let outputFile = join(output.path, output.filename);
                let bundle = ejs.compile(mainTemplate)({
                    entry: this.entry,
                    modules: this.chunks[chunkId]
                })
                fs.writeFileSync(outputFile, bundle, 'utf8')
            } else {
                let outputFile = join(output.path, chunkId);
                let bundle = ejs.compile(chunkTemplate)({
                    chunkId,
                    modules: this.chunks[chunkId]
                });
                fs.writeFileSync(outputFile, bundle, 'utf8')
            }
        })
    }
}



function webpack(webpackOptions, callback) {
    let compiler = new Compiler(webpackOptions);
    compiler.run(callback);
    return compiler;
}

module.exports = webpack;