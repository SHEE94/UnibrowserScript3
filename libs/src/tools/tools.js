/**
 *@description: 工具类插件
 *@author: Xianxu
 *@date: 2024-02-02
 *@version: 3.0
 *@Copyright: Xianxu
 *@LastEditors: Xianxu
 *@LastEditTime: 2024-02-02
 */

import {
	EVENT_TYPE,
	ACTION_TYPR
} from '../../tools/types.js'
import AD from './ad.js';
import websiteSetting from '../../config/websiteSetting.js'
let $statistics = {}
class Tools {
	constructor(wv) {
		this.wv = wv;
		this.websiteSetting = JSON.parse(JSON.stringify(websiteSetting))

		this._websiteSetting = uni.getStorageSync('websiteSetting') || {};
		this.wv.state.setData({
			websiteSetting: this._websiteSetting,
			defaultWebsiteSetting: this.websiteSetting
		})
		this.eventListener()
	}
	/**
	 * 网页单独配置
	 */
	get websiteSettingConfig() {
		return this.wv.state.data.websiteSetting;
	}

	/**
	 * @param {Object} val {url:{...},url2:{...},url3:{...}}
	 */
	set websiteSettingConfig(val) {
		if(typeof val !== 'object')return;
		this.wv.state.data.websiteSetting = val;
		uni.setStorage({
			key: 'websiteSetting',
			data: val
		})
	}
	encrypt = {
		// 加密
		/**
		 * 
		 * @param {string} str 要加密的字符串
		 * @param {string} key 密钥
		 * @returns {string} 
		 */
		encrypt: function(str, key) {
			let cipher = '';
			for (let i = 0; i < str.length; i++) {
				let char = str.charCodeAt(i);
				let keyChar = key.charCodeAt(i % key.length);
				cipher += String.fromCharCode(char + keyChar);
			}
			return encodeURI(cipher);
		},
		// 解密
		/**
		 * 
		 * @param {string} str 要解密的字符串
		 * @param {string} key 密钥
		 * @returns {string}
		 */
		decrypt: function(str, key) {
			str = decodeURI(str)
			let decipher = '';
			for (let i = 0; i < str.length; i++) {
				let char = str.charCodeAt(i);
				let keyChar = key.charCodeAt(i % key.length);
				decipher += String.fromCharCode(char - keyChar);
			}
			return decipher;
		}


	}


	videoUrls = []
	/**
	 * 监听浏览器事件
	 */
	eventListener() {
		this.wv.on(EVENT_TYPE['WEB-MESSAGE'], (json) => {
			if (json.action === ACTION_TYPR.statistics) {
				this.statistics = json.data;
			}
		})
		
	}


	/**
	 *给网页发送统计信息
	 */
	sendStatisticsInfo() {
		const actionWV = this.wv.checkedActiveWebview()
		actionWV.evalJS('window.sendStatics()')
	}

	get statistics() {
		return $statistics
	}

	set statistics(val) {
		if (typeof val !== 'object') return
		$statistics = val;
	}

}

export default function install(wv) {
	wv.Tools = new Tools(wv)
	wv.AD = new AD(wv)
}