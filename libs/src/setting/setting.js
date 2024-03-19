/**
 *@description: 设置类插件
 *@author: Xianxu
 *@date: 2024-02-02
 *@version: 3.0
 *@Copyright: Xianxu
 *@LastEditors: Xianxu
 *@LastEditTime: 2024-02-02
 */
import {
	initVueI18n,
	I18n
} from '@dcloudio/uni-i18n'
import messages from '../../locale/index'

const {
	t,
	setLocale
} = initVueI18n(messages)

import Bookmark from './bookmark.js'
import History from './history.js'
import {
	EVENT_TYPE
} from '../../tools/types.js'
import SettingConfig from '../../config/settingConfig.js'
import websiteSetting from '../../config/websiteSetting.js'
const settingConfig = JSON.parse(JSON.stringify(SettingConfig))
const ua =
	'Mozilla/5.0 (Linux; Android; V1923A Build/N2G47O; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Mobile Safari/537.36 SCRIPT/3.0';

let _self = null;

class Setting {

	read = false;
	constructor(wv) {
		this.wv = wv;
		_self = this;
		this._settingConfig = uni.getStorageSync('settingConfig') || settingConfig;

		// 初始化设置状态
		this.wv.state.setData({
			settingConfig: this._settingConfig,
		})
		this.full = false;
		this.wvSettingEvent();

		if (this._settingConfig.defaultHome) {
			this.wv.homePage = this._settingConfig.defaultHome
		}

		this.userAgent = uni.getStorageSync('UA') || ua;

		this.listenerEvent();

		uni.onKeyboardHeightChange((res) => {
			let height = res.height;
			if (height > 0) {
				this.wv.setStyle({
					height: '100%',
					top: this.full ? 0 : uni.getSystemInfoSync().statusBarHeight
				})
			} else {
				this.wv.setStyle({
					height: this.full ? '100%' : this.wv.height,
					top: this.full ? 0 : uni.getSystemInfoSync().statusBarHeight,
				})
			}
		})
		setLocale(this.settingConfig.language[this.settingConfig.langCurrnt].code);
	}
	alertCount = true;

	listenerEvent() {
		const loading = () => {
			_self.alertCount = true
		}

		const listen = () => {
			let blacklist = this.wv.state.data.blackUrls || []
			this.wv.activeWebview.addEventListener('loading', loading)
			let activeWebview = this.wv.activeWebview;

			const overrideUrlLoading = (f) => {
				this.wv.activeWebview.overrideUrlLoading({
					match: '^(http|file|ftp|blob|ws|wss).*',
					mode: 'allow'
				}, (e) => {
					if (!this.alertCount) return;
					this.alertCount = false;
					let overrurl = e.url;
					if (f) {
						this.wv.emit('overrideUrlLoading', overrurl);
					}

				})
			}

			let loadingOverri = true;
			// 开启跳转第三方网址

			const getStrOrigin = (val) => {
				let text = '';
				if (val && typeof val === 'string') {
					const reg = /((https|http|ftp|file):\/\/)([A-Za-z0-9\-.]+)(:[0-9]+){0,1}/g;
					const arr = val.match(reg);
					if (arr && arr.length > 0) {
						text = arr[0];
					}
				}
				return text;
			}
			activeWebview.overrideUrlLoading({}, (e) => {
				if (!loadingOverri) return;
				loadingOverri = false;

				let url = e.url;
				if (!this.overrideUrl(this.wv, url)) {
					return;
				}

				let reg = new RegExp('^(http|file|ftp|blob|ws|wss).*', 'g')
				if (!reg.test(url)) {
					this.wv.emit('overrideUrlLoading', url);
					return;
				}

				let currentUrl = activeWebview.getURL();

				let $URL = getStrOrigin(url);
				// 获取网页单独设置信息
				let websiteSettingConfig = this.websiteSettingConfig(currentUrl);
				if (this.settingConfig.otherWebsite || websiteSettingConfig.otherWebsite) {
					if (currentUrl.indexOf($URL) > -1) {
						overrideUrlLoading();
						this.wv.loadURL(url);
					} else {
						// 黑名单网址
						for (let i of blacklist) {
							let reg = new RegExp(i, 'g');
							if (reg.test(url)) {
								return;
							}
						}
						// 确认跳转第三方网址
						const confirm = (res) => {
							if (res.confirm) {
								overrideUrlLoading(true);
								this.wv.loadURL(url);
							} else {
								uni.showActionSheet({
									itemList: [t('setting.black.title'), t(
										'history.tips.3'), t(
										'history.tips.4')],
									success: (res) => {
										if (res.tapIndex == 0) {
											blacklist.push(getStrOrigin(
												url))
											this.wv.state.data.blackUrls =
												blacklist;
										} else if (res.tapIndex == 1) {
											this.wv.openNewWindow(url)
										} else if (res.tapIndex == 2) {
											this.wv.openBGWindow(url)
										}
									}
								})
							}
						}

						uni.showModal({
							title: t('browser.tips.10'),
							content: `${t('privacy.otherWebsite')}: ${url}`,
							success: (res) => {
								confirm(res)
							}
						})
					}
				};
				if (!this.settingConfig.otherWebsite && !websiteSettingConfig.otherWebsite) {

					if (!this.overrideUrl(this.wv, url)) {
						return;
					}
					for (let i of blacklist) {
						let reg = new RegExp(i, 'g')
						if (reg.test(url)) {
							return;
						}
					}
					let reg = new RegExp('^(http|file|ftp|blob|ws|wss).*', 'g')
					if (!reg.test(url)) {
						this.wv.emit('overrideUrlLoading', url);
						return;
					}
					overrideUrlLoading(true);
					this.wv.loadURL(url);

				}
			})


		}

		if (this.wv.activeWebview) {
			listen()
		} else {
			this.wv.state.watch('activeWebview', () => {
				this.wv.activeWebview.removeEventListener('loading', loading);
				listen();
			})
		}

		// 后台休眠
		const dormancy = () => {
			if (this.settingConfig.dormancy) {
				this.wv.webviews.forEach(wvItem => {
					wvItem.pause()
				})
				this.wv.on(EVENT_TYPE['ACTIVE-WEBVIEW'], wv => {
					wv.restore()
				})
			} else {
				this.wv.webviews.forEach(wvItem => {
					wvItem.restore()
				})
			}
		}

		// 后台窗口休眠
		this.wv.state.getData('settingConfig', (config) => {
			dormancy()
		})

		if (this.settingConfig.lastPage) {
			this.wv.state.getData('activeWebview', (activeWebview) => {
				this.saveLastPageInfo(activeWebview)
			})
		}
		// 定位权限
		this.wv.state.getData('activeWebview', (activeWebview) => {
			if (!activeWebview) return;
			let nwv = activeWebview.nativeInstanceObject();
			if (this.settingConfig.location && uni.getSystemInfoSync().osName == 'android') {
				plus.android.invoke(nwv, 'setGeolocationEnabled', true);
			} else if (!this.settingConfig.location && uni.getSystemInfoSync().osName == 'android') {
				plus.android.invoke(nwv, 'setGeolocationEnabled', false);
			}
		})
	}

	websiteSettingConfig(url) {
		const websiteSettingConfig = this.wv.state.data.websiteSetting;

		const defaultWebsiteSetting = this.wv.state.data.defaultWebsiteSetting;
		if (!url) {
			return defaultWebsiteSetting;
		}
		for (let key in websiteSettingConfig) {
			if (key.length > 1 && url.indexOf(key) > -1) {
				return websiteSettingConfig[key] || defaultWebsiteSetting;
			}
		}
		return websiteSetting;
	}

	/**
	 * 链接拦截,覆盖重写
	 * @param {Object} wv webview实例
	 * @param {Object} url 拦截的url
	 */
	overrideUrl(wv, url) {
		return true;
	}

	saveLastPageInfo(wv) {
		if (wv.lastpage) return;
		wv.lastpage = true;
		let setList = () => {
			const lastWebviews = []
			this.wv.webviews.forEach(item => {
				let obj = {
					id: item.id,
					url: item.getURL()
				}
				lastWebviews.push(obj)
			})
			uni.setStorage({
				key: 'lastWebviews',
				data: lastWebviews
			})
		}
		this.wv.on(EVENT_TYPE['CLOSE-WINDOW'], () => {
			uni.removeStorage({
				key: 'lastWebviews'
			})
		})
		this.wv.on(EVENT_TYPE['CLOSE-WINDOW-ALL'], () => {
			uni.removeStorage({
				key: 'lastWebviews'
			})
		})

		wv.addEventListener('loaded', setList)
		wv.addEventListener('close', setList)
	}

	/**
	 * 获取最后页面
	 */
	getLastWebviews() {
		return uni.getStorageSync('lastWebviews')
	}

	/**
	 * 删除最后页面
	 */
	removeLastWebviews() {
		uni.removeStorage({
			key: 'lastWebviews'
		})
	}

	/**
	 * 设置ua
	 * @param {String} val
	 */
	set userAgent(val) {
		uni.setStorageSync('UA', val);
		plus.navigator.setUserAgent(val, false);
	}

	/**
	 * 获取ua
	 */
	get userAgent() {
		return uni.getStorageSync('UA') || ua;
	}

	/**
	 * 设置主页信息
	 * @param {Object} val
	 */
	set homePage(val) {
		if (typeof val !== 'object') return;
		const defaultHome = this.settingConfig.defaultHome
		Object.keys(defaultHome).forEach(key => {
			if (val[key]) {
				defaultHome[key] = val[key]
			}
		})
		this.settingConfig = {
			defaultHome: defaultHome
		}

	}

	/**
	 * 获取主页信息
	 */
	get homePage() {
		return this.settingConfig.defaultHome
	}

	/**
	 * 设置全屏
	 * @param {Boolean} val 
	 */
	set full(val) {
		this.wv.state.setData({
			full: val
		})
		if (val) {
			plus.navigator.setFullscreen(true);
			this.wv.activeWebview.setStyle({
				height: '100%',
				top: 0,
			})
			const view = new plus.nativeObj.View('exit', {
				backgroundColor: '#cccccc',
				width: '30px',
				height: '30px',
				bottom: '50px',
				left: uni.getSystemInfoSync().screenWidth - 45 + 'px',
				opacity: 0.5
			}, [{
				tag: 'font',
				id: 'font',
				text: 'Exit',
				textStyles: {
					size: '12px'
				}
			}]);

			view.addEventListener('click', () => {
				this.full = false;
				this.wv.activeWebview.remove(view)
				view.close()
			})

			this.wv.activeWebview.append(view)
		} else {
			plus.navigator.setFullscreen(false);
			let exit = plus.nativeObj.View.getViewById('exit');
			if (exit) {
				exit.close()
			}

			if (this.wv.height && this.wv.activeWebview) {
				this.wv.activeWebview.setStyle({
					height: this.wv.height,
					top: uni.getSystemInfoSync().statusBarHeight,
				})
			}

		}
	}

	get full() {
		return this.wv.state.data.full
	}

	wvSettingEvent() {
		let webviews = this.wv.webviews;
		this.wv.on(EVENT_TYPE['CREATE-WEBVIEW'], (wv) => {
			if (this._settingConfig.pullLoad) {
				this.pullLoad(wv)
			}
		})

		this.wv.on(EVENT_TYPE['WEB-MESSAGE'], (data) => {
			this.webdataSett(data)
		})


		this.wv.on('READ-MODE', () => {
			this.read = !this.read
			this.readMode(this.wv.activeWebview)
		})

		this.wv.on(EVENT_TYPE['loading'], () => {
			console.log('loading')
			this.readMode(this.wv.activeWebview)
		})

	}

	/**
	 * 阅读模式
	 * @param {Object} wv 
	 */
	readMode(wv) {
		if (!wv) return;
		if (this.read) {
			wv.appendJsFile('_www/static/sdk/readmod/Readability.js')
			wv.evalJS(`
			(function() {
				let readNodes = document.createElement('div');
				var documentClone = document.cloneNode(true);
				var article = new Readability(documentClone).parse();
				
				var content = article.content
				readNodes.innerHTML = content;
				if (readNodes) {
					readNodes.classList.add('readmod')
					readNodes.style.cssText = 'background:#e6cea0;color:#000;display: block; position: fixed; inset: 0;z-index:999999;overflow-y:auto;padding:12px;';
					document.querySelectorAll('header,footer').forEach(function(n){
						n.style.display = 'none';
					});
					let style = document.createElement('style')
					style.innerHTML = '.readmod img{width:100%;height:auto;}'
					document.body.appendChild(readNodes)
					document.body.appendChild(style)
					window.readNodes = readNodes;
				}
			})()
			`)

		} else {
			wv.evalJS(`
			if(window.readNodes){
				window.readNodes.style.cssText = 'display: block;';
				document.querySelectorAll('header,footer').forEach(function(n){
					n.style.display = 'initial';
				});
				window.readNodes.remove();
			}
			`)
		}

	}


	allRes = [];

	action = {
		download: 'download',
		dlnaSearch: 'Dlan-search',
		dlnaPlay: 'Dlan-play',
		statistics: 'statistics',
		blank: '_blank'
	}
	webdataSett(json) {
		let action = json.action;
		switch (action) {
			case this.action.blank:
				if (json.url.indexOf('http') > -1) {
					this.wv.openNewWindow(decodeURIComponent(json.url))
				}

				break;
		}
	}
	// 下拉刷新
	pullLoad(wv) {
		wv.addEventListener('loading', () => {
			let onRefresh = () => {
				wv.reload();
			};
			wv.setPullToRefresh({
					support: true,
					height: '50px',
					range: '200px'
				},
				onRefresh
			);
			wv.endPullToRefresh();
		})
	}

	/**
	 * 重置
	 */
	reset() {
		uni.removeStorageSync('settingConfig');
		uni.removeStorageSync('UA');

		this.settingConfig = settingConfig;

	}
	/**
	 * 获取设置配置
	 */
	get settingConfig() {
		return this.wv.state.data.settingConfig || this._settingConfig;
	}
	set settingConfig(val) {

		const config = this.settingEvent('settingConfig', val)
		this.wv.state.data.settingConfig = config;

		uni.setStorage({
			key: 'settingConfig',
			data: config
		})
	}

	settingEvent(configKey, val) {
		if (typeof val !== 'object') return;
		Object.keys(val).forEach(key => {
			if (Reflect.has(this['_' + configKey], key)) {
				this['_' + configKey][key] = val[key]
			}
		})
		this['_' + configKey].defaultHome.parent = null;
		return this['_' + configKey];
	}
}

export default function install(wv) {
	wv.Bookmark = new Bookmark(wv)
	wv.History = new History(wv)
	wv.Setting = new Setting(wv)
}