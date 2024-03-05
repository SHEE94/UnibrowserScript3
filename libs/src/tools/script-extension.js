/**
 *@description: 扩展类插件
 *@author: Xianxu
 *@date: 2024-02-02
 *@version: 3.0
 *@Copyright: Xianxu
 *@LastEditors: Xianxu
 *@LastEditTime: 2024-02-02
 */
import {
	EVENT_TYPE
} from '../../tools/types.js'

import {
	uuid
} from '../../tools/tools.js'
let scripts = uni.getStorageSync('scripts') || []

/**
 * 注入代码
 * @param {Object} code 注入的代码字符串
 */
const injectCodeText = function(code, matchs, url) {
	return `!(function(){
		let code = \`${code}\`
		let matchs = ${JSON.stringify(matchs)}
		
		matchs.map(m => {
			let reg = new RegExp(m, 'i')
			return reg;
		}).forEach(match => {
			
			if (match.test(window.Location.href||'${url}')) {
				let inject = new Function(code)
				inject()
			}
		})
	})()`
}


class ScriptExtension {
	constructor(wv) {
		this.wv = wv
		wv.state.setData({
			scripts,
		})
		this.wv.state.getData('activeWebview', (activeWebview) => {
			if (!activeWebview) return;
			activeWebview.addEventListener()
		})


		const appendJS = (item, wvitem) => {
			let matchs = item.match.split('@@');
			let code = injectCodeText(item.codeText, matchs, wvitem.getURL())
			wvitem.evalJS(code);
		}

		this.wv.on(EVENT_TYPE['rendering'], wvitem => {
			let $script = wv.state.data.scripts;
			$script.forEach(item => {
				if ((item.execution === this.execution.loading) && item.enable) {
					appendJS(item, wvitem)
				}
			})
		})
		this.wv.on(EVENT_TYPE['loading'], wvitem => {
			let $script = wv.state.data.scripts;
			$script.forEach(item => {
				if ((item.execution === this.execution.early) && item.enable) {
					console.log('尽早')
					appendJS(item, wvitem)
				}
			})
		})
		let url = ''
		this.wv.on(EVENT_TYPE['loaded'], wvitem => {
			let $url = wvitem.getURL()
			if (url === $url) return;
			url = $url;
			let $script = wv.state.data.scripts;
			$script.forEach(item => {
				if ((item.execution === this.execution.loaded) && item.enable) {

					appendJS(item, wvitem)
				}
			})
		})

		this.wv.state.watch('scripts', (val) => {
			uni.setStorage({
				data: val,
				key: 'scripts'
			})
		})
	}

	/**
	 * 脚本加载时机
	 * @type {enum}
	 */
	execution = {
		early: 0, //尽量早
		loading: 1, //加载的时候
		loaded: 2, //加载完成
	}

	/**
	 * @typedef scriptObj
	 * @type {Object}
	 * @property {String} name 脚本名
	 * @property {String} match 脚本名
	 * @property {String} description 描述
	 * @property {Boolean} enable 是否启用
	 * @property {String} scriptPath 脚本地址
	 * @property {String} codeText 脚本信息
	 * @property {execution}  execution 执行时机
	 */
	/**
	 * @param {scriptObj} scriptObj
	 */
	add(scriptObj) {
		let $scripts = this.wv.state.data.scripts;
		$scripts.push(scriptObj);
		this.wv.state.data.scripts = $scripts;
	}

	get scripts() {
		return this.wv.state.data.scripts;
	}

	set scripts(val) {
		if (!val || typeof val !== 'object' && !val.codeText) return;
		if (!val.execution) {
			val.execution = this.execution.loaded
		}
		val.id = uuid()
		if (typeof val.match === 'undefined') {
			val.match = ''
		}
		if (typeof val.scriptPath === 'undefined') {
			val.scriptPath = []
		}

		this.add(val)
	}

	update(obj) {
		if (!obj.id || !obj || typeof obj !== 'object' && !obj.codeText) return;
		let $scripts = this.wv.state.data.scripts;
		$scripts.forEach(item => {
			if (item.id == obj.id) {
				item.codeText = obj.codeText;
				item.name = obj.name;
				item.description = obj.description;
				item.match = obj.match;
				item.execution = obj.execution;
				item.scriptPath = obj.scriptPath;
			}
		})

		this.wv.state.data.scripts = $scripts;
		return $scripts;
	}

	clear() {
		this.wv.state.data.scripts = []
		return []
	}

	del(id) {
		/**
		 * @type {Array}
		 */
		let $script = this.wv.state.data.scripts
		$script.forEach((item, index) => {
			if (item.id == id) {
				$script.splice(index, 1)
			}
		})
		this.wv.state.data.scripts = $script;
		return $script
	}

	async addScriptOnline(obj) {
		let res = await this.loadNetFile(obj.url)
	}

	loadNetFile(url) {
		return new Promise((resolve, reject) => {
			uni.request({
				url: url,
				responseType: 'text',
				success(res) {
					let data = res.data;
					resolve(data)
				},
				fail(err) {
					reject(err)
				}
			})
		})
	}
}

export default function install(wv) {

	wv.ScriptExtension = new ScriptExtension(wv)

}