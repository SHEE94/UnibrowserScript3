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

function getMatedata(text) {

	const reg = new RegExp('// ==UserScript==');
	const reg2 = new RegExp('// ==/UserScript==');
	
	let a = text.split(reg)[1];
	if(!a)return null;
	let b = a.split(reg2)[0];

	if (!a || !b) {
		return {}
	}
	let matedata = {
		uuid:uuid(),
		name: '', //脚本名称
		icon: '', //脚本icon
		include: '', //匹配的网址
		description: '',
		require: [],
		run: '',
		author: '',
		version: '',
		namespace: '',
		grant: [],
		match: [], //正则匹配的网址
		downloadURL: '',
		homepageURL: '',
		resource: []
	}
	let arr = b.split('\n')

	const getD = (arr, name) => {
		const reg = new RegExp(`(@${name})\\s`)
		let nameArr = arr.split(reg)
		// console.log(reg)
		nameArr.forEach((i, index) => {
			if (!i) {
				nameArr.splice(index, 1)
			}

		})
		if (nameArr.length > 1) {
			return nameArr[2].replace(/(^\s*)|(\s*$)/g, '');
		}
		return null
	}

	// 分离matedata数据块
	for (let i = 0; i < arr.length; i++) {
		if (arr[i]) {
			try {
				Object.keys(matedata).forEach(key => {
					let name = getD(arr[i], key);

					if (name && key == 'resource') {
						matedata['resource'].push(name.split(/\s/))
					}
					if (name && key != 'resource') {
						if (Object.prototype.toString.call(matedata[key]) === '[object Array]') {
							matedata[key].push(name)
						}
						if (Object.prototype.toString.call(matedata[key]) === '[object String]') {
							matedata[key] = name
						}
					}

				})
			} catch (e) {
				//TODO handle the exception
				console.warn(e)
			}

		}
	}

	return matedata;
}

function GMApiCode(metadata) {
	return new Promise((resolve, reject) => {
		plus.io.resolveLocalFileSystemURL('_www/static/sdk/api.js', function(entry) {

			entry.file(function(file) {
				try {
					var fileReader = new plus.io.FileReader();
					fileReader.readAsText(file, 'utf-8');
					fileReader.onloadend = function(evt) {
						let result = evt.target.result;
						let text = result.replace('"%metadata%"', JSON.stringify(metadata))
						resolve(text)
					}
				} catch (e) {
					//TODO handle the exception
					console.error(e)
					reject(e)
				}

			});


		}, function(e) {
			console.log("Resolve file URL failed: " + e.message);
		});
	})

}

async function wrapper(file, url) {
	const matedata = file.matedata;
	const text = await GMApiCode(matedata)
	let enApiText = encodeURIComponent(text);
	let code = '';

	if (!matedata) {
		let matchs = file.match;
		code = `!(function(){
			let code = \`${file.codeText}\`;
			let matchs = ${JSON.stringify(matchs)};
			
			matchs.map(function(str) {
				let res = str.replace(/\\*\/g,'.*');
				let reg = new RegExp(res, 'g');
				return reg;
			}).forEach(match => {
				
				if (match.test('${url}')) {
					let inject = new Function(code);
					inject();
				}
			});
		})()`;
	} else {

		let codeText = file.codeText;
		
		let nCode = `
			if(!scriptLoaded){
				window['scriptLoad_${matedata.uuid}'] = function(){
					${codeText}
				}
			}else{
				${codeText}
			}
		`;
		let enCode = encodeURIComponent(nCode);

		code = `!(function() {
			let matedata = ${JSON.stringify(matedata)};
			if(!matedata.match){
				matedata.match = [];
			}

			let namespace = function() {
				matedata.include && matedata.match.push(matedata.include);
				
				matedata.match.forEach(function(str) {
					
					let res = str.replace(/\\*\/g,'.*');
					let reg = new RegExp(res, 'g');
	
					if (matedata.name && window[matedata.name]) {return;}
					if (reg.test('${url}')) {
						let enApiText = "${enApiText}";
						
						let encode = "${enCode}";
						let injectCode = new Function(decodeURIComponent(enApiText) + decodeURIComponent(encode));
						
						injectCode();
						matedata.name && (window[matedata.name] = true);
					}
				});
				
			};
			
			window[matedata.namespace] = new namespace();
		})()`;

	}
	return code;
}


/**
 * 注入代码
 * @param {Object} code 注入的代码字符串
 */
const injectCodeText = async function(codeText, matchs, url) {
	let matedata = getMatedata(codeText);
	let code = '';
	if(matedata){
		code = await wrapper({matedata,codeText,match:matchs},url)
	}else{
		code = await wrapper({codeText,match:matchs},url)
	}

	return code;
}

const injectFiles = async (filePath, matchs = [], url) => {

	let len = 0
	let arr = []
	const pathRecursion = (file) => {
		return new Promise((resolve, reject) => {
			plus.io.resolveLocalFileSystemURL(file.path, function(entry) {
				
				let obj = {
					codeText: '',
					filename: '',
					size: 0,
				}

				entry.file(function(file) {
					try {
						obj.filename = file.name;
						obj.size = file.size;
						var fileReader = new plus.io.FileReader();
						fileReader.readAsText(file, 'utf-8');
						fileReader.onloadend = function(evt) {
							let result = evt.target.result;
							obj.codeText = result;
							let matedata = getMatedata(result);
							if(matedata){
								matedata.match = [...matedata.match, ...matchs];
								obj.matedata = matedata;
							}
							arr.push(obj);
							len++;
							resolve(arr)
							if (filePath[len]) {
								pathRecursion(filePath[len])
							}
						}
					} catch (e) {
						//TODO handle the exception
						console.log(e)
					}

				});


			}, function(e) {
				console.log("Resolve file URL failed: " + e.message);
			});
		})


	}
	const list = await pathRecursion(filePath[len])

	return list;
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

		// 监听网页信息
		this.wv.on(EVENT_TYPE['WEB-MESSAGE'], (json) => {
			if (json.action == 'GM_openInTab') {
				let data = json.data;
				this.wv.openNewWindow(data.url);
			} else if (json.action == 'GM_registerMenuCommand') {
				// 注册菜单
				let GM_MENU = this.wv.state.data.GM_MENU;
				if (!GM_MENU) {
					GM_MENU = []
				}
				let obj = {
					title: json.data.caption,
					id: json.data.id
				}
				GM_MENU.push(obj)
				this.wv.state.setData({
					GM_MENU
				})
			} else if (json.action == 'GM_unregisterMenuCommand') {
				// 取消菜单
				let GM_MENU = this.wv.state.data.GM_MENU;
				GM_MENU.forEach((item, index) => {
					if (item.id == json.data.caption) {
						GM_MENU.splice(index, 1)
					}
				})
				this.wv.state.setData({
					GM_MENU
				})
			}
		})


		const appendJS = (item, wvitem) => {
			let matchs = item.match.split('@@');
			injectCodeText(item.codeText, matchs, wvitem.getURL())
			.then(code=>{
				wvitem.evalJS(code);
			})

			injectFiles(item.scriptPath, matchs, wvitem.getURL())
				.then(jsfile => {
					jsfile.forEach(matedata => {
						setTimeout((m) => {
							wrapper(m, wvitem.getURL()).then(code => {
								wvitem.evalJS(code);
							})
						}, 0, matedata)

					})
				})
			
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
	 * 单机扩展按钮
	 * @param {Object} item
	 */
	clickExtensionMenu(item) {
		if (!item.id) return;
		this.wv.activeWebview.evalJS(`window['gm_menu_${item.id}'](${JSON.stringify(item)})`)
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
	 * @property {String} match 脚本匹配地址
	 * @property {String} description 描述	
	 * @property {Boolean} enable 是否启用
	 * @property {Array} scriptPath 脚本地址
	 * @property {String} codeText 脚本信息
	 * @property {Number}  execution 执行时机
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
		if (!val || typeof val !== 'object') return;
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