import {
	uuid
} from '../../tools/tools.js'
import {
	EVENT_TYPE
} from '../../tools/types.js'
let historyList = uni.getStorageSync('history') || []
const privacyMode = uni.getStorageSync('privacyMode') || false
export default class History {
	constructor(wv) {
		this.wv = wv;
		wv.on(EVENT_TYPE['CREATE-WEBVIEW'], (w) => {
			w.addEventListener('loaded', () => {
				this.add({
					url: this.wv.getURL(),
					title: w.getTitle()
				})
			})
		})
		this.wv.state.setData({
			privacyMode
		})
		this.wv.state.watch('privacyMode', (val) => {
			uni.setStorage({
				data: val,
				key: 'privacyMode'
			})
			this.privacyModeController(val)
		})
	}



	privacyModeController(val) {
		const webviews = this.wv.webviews

		let code = `
		function clearAllCookie() {
			var keys = document.cookie.match(/[^ =;]+(?=\=)/g);
			if(keys) {
				for(var i = keys.length; i--;)
				document.cookie = keys[i] + '=0;expires=' + new Date(0).toUTCString()
			}
		};
		clearAllCookie();
		localStorage.clear();
		sessionStorage.clear(); 
		window.addEventListener('storage',function(event){
			if(!event.newValue)return;
			clearAllCookie();
			sessionStorage.clear(); 
			localStorage.clear();
		})`;

		if (val) {
			webviews.forEach(wvItem => {
				wvItem.evalJS(code)
			})
			this.wv.on(EVENT_TYPE['WEB-MESSAGE'], () => {
				plus.navigator.removeAllCookie();
			})
		}
	}
	
	/**
	 * @param {Boolean} val 
	 */
	set privacyMode(val) {
		this.wv.state.data.privacyMode = val;
	}

	get privacyMode() {
		return this.wv.state.data.privacyMode;
	}

	/**
	 * @interface options{url:string,title:string}
	 * @param {Object<options>} options
	 */
	add(options) {
		if (!options.url || this.privacyMode) {
			console.warn('Not a valid url')
			return;
		}
		options.createTime = new Date()
		options.id = uuid()
		historyList.unshift(options)
		uni.setStorageSync('history', historyList)
	}
	del(id) {
		historyList.forEach((item, index) => {
			if (item.id === id) {
				historyList.splice(index, 1)
			}
		})
		uni.setStorageSync('history', historyList)
	}
	get() {
		return historyList;
	}
	clear() {
		historyList = []
		uni.setStorageSync('history', historyList)
	}
}