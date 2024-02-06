/**
 *@description: 设置类插件
 *@author: Xianxu
 *@date: 2024-02-02
 *@version: 3.0
 *@Copyright: Xianxu
 *@LastEditors: Xianxu
 *@LastEditTime: 2024-02-02
 */

import Bookmark from './bookmark.js'
import History from './history.js'
import {
	EVENT_TYPE
} from '../../tools/types.js'
import SettingConfig from '../../config/settingConfig.js'

const settingConfig = JSON.parse(JSON.stringify(SettingConfig))

const ua =
	'Mozilla/5.0 (Linux; Android; V1923A Build/N2G47O; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.70 Mobile Safari/537.36 SCRIPT/3.0';

let _self = null;

class Setting {

	read = false;
	constructor(wv) {
		this.wv = wv;
		_self = this;
		this._settingConfig = uni.getStorageSync('settingConfig') || settingConfig;
		// 初始化设置状态
		this.wv.state.setData({
			settingConfig: this._settingConfig
		})
		this.full = false;
		this.wvSettingEvent();

		if (this._settingConfig.defaultHome) {
			this.wv.homePage = this._settingConfig.defaultHome
		}

		this.userAgent = ua;

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
	}
	alertCount = true;

	listenerEvent() {
		const loading = () => {
			_self.alertCount = true
		}
		let blacklist = []
		const listen = () => {
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
			if (this.settingConfig.otherWebsite) {
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

					let currentUrl = activeWebview.getURL()
					let $URL = getStrOrigin(url)
					
					if (currentUrl.indexOf($URL) > -1) {
						overrideUrlLoading()
						this.wv.loadURL(url)
					} else {
						for(let i of blacklist){
							if(url.indexOf(i)>-1){
								return;
							}
						}
						uni.showModal({
							title: '提示',
							content: '是否跳转第三方网址？地址：' + url,
							success: (res) => {
								if (res.confirm) {
									overrideUrlLoading(true)
									this.wv.loadURL(url)
								}else{
									uni.showActionSheet({
										itemList:['加入黑名单'],
										success: (res) => {
											if(res.tapIndex == 0){
												blacklist.push(getStrOrigin(url))
											}
										}
									})
								}
							}
						})
						
						
						
						
					}
				})
			} else {
				overrideUrlLoading(true)
			}
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


		this.wv.state.getData('settingConfig', (config) => {
			dormancy()
		})

		if (this.settingConfig.lastPage) {
			this.wv.state.getData('activeWebview', (activeWebview) => {
				this.saveLastPageInfo(activeWebview)
			})
		}
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
		this.wv.on(EVENT_TYPE['CLOSE-WINDOW'], setList)
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
		plus.navigator.setUserAgent(val, false);
	}

	/**
	 * 获取ua
	 */
	get userAgent() {
		return ua;
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
	}


	/**
	 * 阅读模式
	 * @param {Object} wv 
	 */
	readMode(wv) {
		if (!wv) return;
		if (this.read) {
			wv.evalJS(`
			(function() {
				let readNodes = {
					score: 0,
				};
				const nodes = document.body.getElementsByTagName('p');
				for (var i = 0, len = nodes.length; i < len; i++) {
					const node = nodes[i];
					let score = 1;
					const text = node.innerText;
					const reg = ${new RegExp(/(：|。|；|，|,|\.|\?|”)/,'g')};
					score += text.split(reg).length;
					score += Math.min(Math.floor(text.length / 100), 3);
					typeof node.score !== 'number' && (node.score = 0);
					node.score += score;
					node.setAttribute('score', node.score);
					(node.score > readNodes.score) && (readNodes = node);
					let index = 0;
					let tempNode = node.parentElement;
					while (tempNode && tempNode.tagName !== 'BODY') {
						if (/div|article|section/i.test(tempNode.tagName)) {
							(typeof tempNode.score !== 'number') && (tempNode.score = 0);
							tempNode.score += (score / (index < 2 ? index + 2 : index * 3));
							tempNode.setAttribute('score', tempNode.score);
							(tempNode.score > readNodes.score) && (readNodes = tempNode);
							if (++index >= 3) {
								break;
							}
						}
						tempNode = tempNode.parentElement;
					}
				};
				if (readNodes) {
					readNodes.style.cssText = 'background:#e6cea0;color:#000;display: block; position: fixed; inset: 0;z-index:999999;overflow-y:auto;padding:12px;';
					document.querySelectorAll('header,footer').forEach(function(n){
						n.style.display = 'none';
					});
					
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
		this._settingConfig = settingConfig;
	}
	get settingConfig() {
		return this.wv.state.data.settingConfig || this._settingConfig;
	}
	set settingConfig(val) {

		if (typeof val !== 'object') return;
		Object.keys(val).forEach(key => {
			if (Reflect.has(this._settingConfig, key)) {
				this._settingConfig[key] = val[key]
			}
		})
		this._settingConfig.defaultHome.parent = null;
		uni.setStorage({
			key: 'settingConfig',
			data: this._settingConfig
		})

		// 保存设置状态
		this.wv.state.data.settingConfig = this._settingConfig

	}
}



export default function install(wv) {

	wv.Bookmark = new Bookmark(wv)
	wv.History = new History(wv)
	wv.Setting = new Setting(wv)
}