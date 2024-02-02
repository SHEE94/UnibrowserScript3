/**
 * 引用 Android 系统库，示例如下：
 * import { Context } from "android.content.Context";
 * [可选实现，按需引入]
 */

/* 引入 interface.uts 文件中定义的变量 */
import { MyApiOptions, MyApiResult, MyApi, MyApiSync } from '../interface.uts';

/* 引入 unierror.uts 文件中定义的变量 */
import { MyApiFailImpl } from '../unierror';

/**
 * 引入三方库
 * [可选实现，按需引入]
 *
 * 在 Android 平台引入三方库有以下两种方式：
 * 1、[推荐] 通过 仓储 方式引入，将 三方库的依赖信息 配置到 config.json 文件下的 dependencies 字段下。详细配置方式[详见](https://uniapp.dcloud.net.cn/plugin/uts-plugin.html#dependencies)
 * 2、直接引入，将 三方库的aar或jar文件 放到libs目录下。更多信息[详见](https://uniapp.dcloud.net.cn/plugin/uts-plugin.html#android%E5%B9%B3%E5%8F%B0%E5%8E%9F%E7%94%9F%E9%85%8D%E7%BD%AE)
 *
 * 在通过上述任意方式依赖三方库后，使用时需要在文件中 import，如下示例：
 * import { LottieAnimationView } from 'com.airbnb.lottie.LottieAnimationView'
 */

/**
 * UTSAndroid 为平台内置对象，不需要 import 可直接调用其API，[详见](https://uniapp.dcloud.net.cn/uts/utsandroid.html#utsandroid)
 */


/**
 * 异步方法
 *
 * uni-app项目中（vue/nvue）调用示例：
 * 1、引入方法声明 import { myApi } from "@/uni_modules/uts-api"
 * 2、方法调用
 * myApi({
 *   paramA: false,
 *   complete: (res) => {
 *      console.log(res)
 *   }
 * });
 * uni-app x项目（uvue）中调用示例：
 * 1、引入方法及参数声明 import { myApi, MyApiOptions } from "@/uni_modules/uts-api";
 * 2、方法调用
 * let options = {
 *   paramA: false,
 *   complete: (res : any) => {
 *     console.log(res)
 *   }
 * } as MyApiOptions;
 * myApi(options);
 *
 */
export const myApi : MyApi = function (options : MyApiOptions) {
  if (options.paramA == true) {
    // 返回数据
    const res : MyApiResult = {
      fieldA: 85,
      fieldB: true,
      fieldC: 'some message'
    };
    options.success?.(res);
    options.complete?.(res);
  } else {
    // 返回错误
    const err = new MyApiFailImpl(9010001);
    options.fail?.(err)
    options.complete?.(err)
  }
}

/**
 * 同步方法
 *
 * uni-app项目中（vue/nvue）调用示例：
 * 1、引入方法声明 import { myApiSync } from "@/uni_modules/uts-api"
 * 2、方法调用 myApiSync(true)
 *
 * uni-app x项目（uvue）中调用示例：
 * 1、引入方法及参数声明 import { myApiSync } from "@/uni_modules/uts-api";
 * 2、方法调用 myApiSync(true)
 */
export const myApiSync : MyApiSync = function (paramA : boolean) : MyApiResult {
  // 返回数据，根据插件功能获取实际的返回值
  const res : MyApiResult = {
    fieldA: 85,
    fieldB: paramA,
    fieldC: 'some message'
  };
  return res;
}

/**
 * 更多插件开发的信息详见：https://uniapp.dcloud.net.cn/plugin/uts-plugin.html
 */
