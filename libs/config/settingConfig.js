/**
 *@description: 设置配置
 *@author: Xianxu
 *@date: 2024-02-02
 *@version: 3.0
 *@Copyright: Xianxu
 *@LastEditors: Xianxu
 *@LastEditTime: 2024-02-02
 */

export default {
	pullLoad: false, //下拉刷新
	videoPLay: false, //外部播放器打开
	resLog: false, //是否记录资源日志
	dormancy: false, //后台窗口休眠
	downloadCurrent: 0, //下载器选择
	redirect: true, //是允许重定向
	clipboard: true, //访问剪切板
	defaultHome: {
		title: '开源夸克主页',
		url: 'ScriptBrowser://html/quarkHomePage/index.html',
		uuid: 'eh34bx88',
		visible: true,
		active: true,
		parent: null
	}, //默认主页
	location: false,
	cookies: false,
	clipboard: true, //访问剪切板
	timer: true, //使用定时器
	addScript: true, //动态添加脚本
	nonstandardTag: true, //添加非标准节点
	otherWebsite: false, //跳转第三方网站
	fingerprint: false, //指纹追踪
	autoDownload: false, //自动下载
	lastPage: true,
	bingImage: false, //每日背景
	langCurrnt: 0,
	blank: false, //全部新窗口打开页面
	language: [{
		label: '中文',
		code: 'zh-Hans'
	}, {
		label: 'English',
		code: 'en'
	}]
}