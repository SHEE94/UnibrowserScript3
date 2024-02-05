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
let $statistics = {}
class Tools {
	constructor(wv) {
		this.wv = wv;
		this.websiteSetting = {
			videoPLay: false, //外部播放器打开
			redirect: true, //是允许重定向
			clipboard: true, //访问剪切板
			location: false,
			cookies: false,
			clipboard: true, //访问剪切板
			timer: true, //使用定时器
			addScript: true, //动态添加脚本
			nonstandardTag: true, //添加非标准节点
			otherWebsite: false, //跳转第三方网站
			fingerprint: false, //指纹追踪
			autoDownload: false, //自动下载
			dev: false, //开发者模式
			additionalHttpHeaders: '{}'
		}

		this.eventListener()
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
		// let link = actionWV.getURL().split('//')
		// let hostname = link[1].split('/')[0]

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
}