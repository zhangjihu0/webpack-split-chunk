## 1. webpack代码分割方式
- entry配置：通过多个entry文件来实现
- 动态加载（按需加载）：通过主动使用import来动态加载
```
   1. 如果遇到了import 会把这个import的模块单独放到一个代码块里，这个代码块会单独生成一个文件
   2. 首次加载的时候只需要加载main.js,当遇到import语句的时候，会向服务器发送一个jsonp请求，请求被分割出去异步代码，然后会合并到modules,然后去加载这个新的模块，并且把模块的exports导出对象向后传递

```
- 抽取公共代码：使用splitChunks 配置来抽取代码
```
    webpack将会基于以下条件自动分割代码块：
    1.新的代码块被共享或者来自node_modules文件夹
    2.新的代码块大于30kb（在min+giz之前）
    3.按需加载代码块的请求数量应该小于等于5
    4.页面初始化时加载代码块的请求数量应该小于等3

    optimization:{
        splitChunks:{
            caacheGroups:{//设置缓存组用来抽取满足不同规则的chunk,下面以生成common为例
                vendors:{
                    chunks:"inital",//指定分割的类型，默认3种选项 all async initial
                    name:"vendors", //可以通过'name'配置项来控制切割之后代码块的命名，给多个分割之后的代码块分配相同的名称，所有的vendor模块被放到一个共享的代码块中，不过这会导致多余的代码
                    test:/node_modules/,条件
                    priority:-10,//优先级，一个chunk很可能满足多个缓存组，会被抽取到优先级高的缓存组中，为了能够让自定义缓存组有更高的优先级（默认0），默认缓存组的priority属性为负值
                },
                commons:{
                    chunks:'initial',
                    name:'commons',
                    minSize:0, //最小提取字节数
                    minChunks:1,//最小被几个chunk引用
                    priority:-20,
                    reuseExistingChunk:true, //如果改chunk中引用了已经被抽取的chunk,直接引用该chunk,不会重复打包代码
                }

            }
        }
    }
```


## 2. 基础概念
### entry
- 入口，webpack 执行构建的第一步将从entry开始，可抽象成输入
### module
- 模块，在webpack里一切皆模块，一个模块对应着一个文件。webpack 会从配置的entry开始递归找出所有依赖的模块
### chunk
- 代码块，一个chunk 由多个模块组合而成，用于代码合并与分割
### bundle
- bundle就是webpack打包后的各个文件，一般和chunk是一对一的关系，bundle是由chunk编译打包后的产出的



