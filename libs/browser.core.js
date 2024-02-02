/**
 *@description: script browser核心库
 *@author: Xianxu
 *@date: 2024-02-02
 *@version: 3.0
 *@Copyright: Xianxu
 *@LastEditors: Xianxu
 *@LastEditTime: 2024-02-02
 */

const system = uni.getSystemInfoSync();
import {
	uuid
} from './tools/tools.js'

import {
	EventEmitter
} from './src/core/EventEmitter.js'

import {
	Proc
} from './src/core/proc.js'

import settingConfig from './config/settingConfig.js'

const proc = new Proc()

let _webviews = [];

let _self = null;
class WebView extends EventEmitter {

	get webviews() {
		return _webviews
	}
	set webviews(val) {
		if (Array.isArray(val) || !val || typeof val == 'string') return;
		_webviews.push(val)

	}

	rid() {
		return uuid(32)
	}


	constructor(component) {
		super()
		_self = this;
		this._self = component;
		//当前活动窗口
		this.activeWebview = null;

		// 初始化设置配置
		if (!this.state.data.settingConfig) {
			this.state.setData({
				settingConfig: settingConfig
			})
		}

		this.parent = null;

		this.height = system.screenHeight - system.statusBarHeight - 44;
		this.style = {
			top: system.statusBarHeight,
			width: '100%',
			height: this.height,
			bounce: 'vertical',
			userSelect: true,
			cachemode: 'cacheElseNetwork',
			hardwareAccelerated: true,
			plusrequire: 'ahead',
			videoFullscreen: 'landscape-primary',
			errorPage: '_www/static/html/error/error.html',
			progress: {
				color: '#4580ee',
				height: '2px'
			},
			scalable: true
		}

		plus.globalEvent.addEventListener('plusMessage', msg => {
			let data = msg.data.args.data;
			if (data.name == 'postMessage') {
				const info = data.arg;
				let jsonback = info.jsonback || {};
				if (info.from == 'webdata') {
					this.emit('WEB-MESSAGE', jsonback)
				} else if (info.from == 'web') {
					this.emit('POST-MESSAGE', jsonback)
					this.emit('WEB-ACTION', jsonback)
				}
			}
		});


	}
	
	setStyle(style){
		this.checkedActiveWebview().setStyle(style)
	}

	/**
	 * 状态管理
	 */
	get state() {
		return proc
	}

	set state(val) {
		proc.data = val;
	}


	createWebview(item) {
		if (!this._self || item.parent) {
			this.parent = this._self = item.parent;
		}

		return new Promise((res, rej) => {
			const id = item.uuid || uuid()

			let wv = plus.webview.create(this.getLocalServeUrl(item.url), id, {

				...this.style
			}, {
				id: id,
				active: item.active
			});

			if (!wv) {
				rej(true)
				return
			}
			// wv.appendJsFile('_www/static/sdk/uni.webview.js')
			wv.appendJsFile('_www/static/sdk/webview.1.5.4.js')
			wv.appendJsFile('_www/static/sdk/web-sdk.js')
			this.initProps(wv, item)
			let currentWebview = this._self.$scope
				.$getAppWebview();
			currentWebview.append(wv);
			// this.setActive(wv.id)
			this.addListener(wv)
			this.webviews = wv;
			this.emit('CREATE-WEBVIEW', wv)
			wv.hide()
			res(wv);
		})
	}

	initProps(wv, item) {
		if (item.visible) {
			wv.show()
		} else {
			wv.hide()
		}
		if (!item.active) {
			wv.pause()
		} else {
			wv.resume()
		}
	}



	/**
	 * @description 关闭指定窗口
	 * @param {Object} id 窗口id
	 */
	closeWindow(id) {
		_webviews.forEach((item, index) => {
			if (item.id == id) {

				item.close()
				_webviews.splice(index, 1)
			}
		})
		this.emit('CLOSE-WINDOW')
	}

	/**
	 * @description 关闭所有窗口
	 */
	closeAllWindow() {
		_webviews.forEach((webview, index) => {

			webview.close()
			_webviews.splice(index, 1)
		})
		_webviews = []
		this.emit('CLOSE-WINDOW-ALL')
	}

	/**
	 * @description 创建并打开新窗口
	 * @param {String} url 
	 * @param {VueCompoent} component 需要把webview添加到的组件
	 */
	openNewWindow(url, component) {

		let homePage = this.setWindowConfig(url, component)
		this.createWebview(homePage).then(window => {
			this.switchingWindow(window.id)
		})
	}

	/**
	 * 加载链接
	 * @param {Object} uniurl url
	 */
	loadURL(uniurl) {
		let url = this.getLocalServeUrl(uniurl)
		this.checkedActiveWebview().loadURL(url)
	}
	/**
	 * 获取url
	 */
	getURL() {
		let actionUrl = this.checkedActiveWebview().getURL()
		if (actionUrl.indexOf('http') == -1) {
			return ''
		}
		return actionUrl;
	}
	getLocalServeUrl(uniurl) {
		let str = 'ScriptBrowser://'
		if (uniurl.indexOf(str) > -1) {
			let url = uniurl.substring(str.length);
			return plus.io.convertLocalFileSystemURL('_www/static/' + url)

		}
		return uniurl
	}

	setWindowConfig() {
		let url = arguments[0],
			component = arguments[1],
			homePage = {
				uuid: uuid(32),
				url: url || this.state.data.settingConfig.defaultHome.url,
				parent: component
			}
		return homePage;
	}

	/**
	 * @description 创建后台窗口
	 * @param {String} url 
	 */
	openBGWindow(url, component) {
		let homePage = this.setWindowConfig(url, component)
		this.createWebview(homePage)
	}

	/**
	 * @description 切换活动窗口
	 * @param {string} id 窗口的id
	 */
	switchingWindow(id) {
		_webviews.forEach(item => {
			if (item.id == id) {
				item.active = true;
				this.setActive(id)
			}
		})
	}

	/**
	 * @description 获取截图
	 * @param {string} id webview的id
	 */
	getScreenBitmap(id) {
		return new Promise((res, rej) => {
			let bitmap = new plus.nativeObj.Bitmap(Math.random().toString(36).substring(2))
			let webview = plus.webview.getWebviewById(id);

			if (!webview) {
				rej(false)
				return
			}
			// 绘制页面截图
			webview.draw(bitmap, () => {
				res(bitmap.toBase64Data())
				bitmap.recycle()
				bitmap = null;
			}, (err) => {
				rej(err)
			});
		})
	}
	allRes = []
	initResArr = {
		js: [],
		css: [],
		img: [],
		iframe: [],
		video: []
	}


	// 事件监听
	addListener(wv) {

		// 监听触摸时间
		wv.addEventListener('touchstart', () => {
			this.setActive(wv.id)
		})
		// 监听页面加载完成事件
		wv.addEventListener('loaded', () => {
			// 获取网页截图，并保存到webview的img属性下
			setTimeout(() => {
				this.getScreenBitmap(wv.id).then(res => {
					wv.img = res;
				})
			}, 1000)
		})

		wv.addEventListener('loading', () => {
			this.allRes = [];
			this.emit('loading', wv)
		})

		wv.listenResourceLoading('', evt => {
			this.allRes.unshift(evt.url);
		})
	}

	/**
	 * 获取资源嗅探
	 */
	getRES() {
		let Resource = JSON.parse(JSON.stringify(this.initResArr));
		for (let i = 0, len = this.allRes.length; i < len; i++) {
			if (/.*\.(jpg|png|jpeg|bmp|ico|gif|GIF|webp)\b/.test(this.allRes[i])) {
				let obj = {
					type: 'img',
					url: this.allRes[i]
				};
				Resource.img.unshift(obj);
			}
			if (/.*\.(js)\b/.test(this.allRes[i])) {
				let obj = {
					type: 'js',
					url: this.allRes[i]
				};
				Resource.js.unshift(obj);
			}
			if (/.*\.(css)\b/.test(this.allRes[i])) {
				let obj = {
					type: 'css',
					url: this.allRes[i]
				};
				Resource.css.unshift(obj);
			}
			if (/.*\.(html)\b/.test(this.allRes[i])) {
				let obj = {
					type: 'iframe',
					url: this.allRes[i]
				};
				Resource.iframe.unshift(obj);
			}

			if (/.*\.(mp4|m4v|m3u8|webm)\b/.test(this.allRes[i])) {
				let obj = {
					type: 'video',
					url: this.allRes[i]
				};
				Resource.video.unshift(obj);
			}
		}
		return Resource;
	}
	/**
	 * @description 分屏
	 */
	splitScreen() {
		if (_webviews.length < 2) {
			// this.createWebview(this.homePage)
		}
		_webviews.forEach((webview, index) => {
			let height = this.height / 2,
				top = index * height + system.statusBarHeight
			webview.setStyle({
				height: height,
				top: top * index + system.statusBarHeight
			})
		})
	}


	/**
	 * 安装插件
	 * @param {Object} p
	 */
	plusInstall(plusFunc) {
		if (typeof plusFunc !== 'function') return;
		plusFunc(this)
	}
	/**
	 * @description 设置当前活动的webview
	 */
	setActive(id) {
		_webviews.forEach(webview => {
			if (webview.id == id) {
				// 活动的webivew更改通知
				this.emit('ACTIVE-WEBVIEW', webview)
				this.activeWebview = webview
				this.state.setData({
					activeWebview: webview
				})
				webview.active = true;
				webview.resume()
				webview.show('zoom-out', 300)

			} else {
				webview.active = false;
				webview.pause()
				webview.hide('fade-out', 300)
			}
		})
	}

	/**
	 * @description 查询活动的webview
	 */
	checkedActiveWebview() {
		return _webviews.find(item => item.active)
	}

	/**
	 * @description 查询显示的webview
	 */
	checkedVisibleWebview() {
		return _webviews.find(item => _webviews[i].isVisible())

	}

	/**
	 * 显示webview
	 */
	show() {
		let webview = this.checkedActiveWebview()
		if (webview) {
			webview.show()
			webview.resume()
		}

	}
	/**
	 * 隐藏webview
	 */
	hide() {
		let webview = this.checkedActiveWebview()
		if (webview) {
			webview.hide();
			webview.pause()
		}

	}
	/**
	 * @description 全屏
	 */
	full() {
		let webview = this.checkedActiveWebview()
		if (!webview) return
		if (!plus.navigator.isFullscreen()) {
			plus.navigator.setFullscreen(true);
			webview.setStyle({
				height: '100%',
				width: '100%',
				top: 0
			})
		} else {
			plus.navigator.setFullscreen(false);
			webview.setStyle(this.style)
		}
		return plus.navigator.isFullscreen();
	}
	/**
	 * 返回上一页
	 */
	back() {
		return new Promise((res, rej) => {
			let webview = this.checkedActiveWebview()
			if (!webview) {
				res(false)
				return
			}
			webview.canBack && webview.canBack((event) => {
				if (event.canBack) {
					webview.back()
					res(true)
				} else {
					res(false)
				}
			})
		})
	}
	/**
	 * 前进到之前一页
	 */
	forward() {
		return new Promise((res, rej) => {
			let webview = this.checkedActiveWebview()
			if (!webview) {
				res(false)
				return
			}
			webview.canForward && webview.canForward((event) => {
				if (event.canForward) {
					webview.forward()
					res(true)
				} else {
					res(false)
				}
			})
		})

	}

}

export {
	WebView
}