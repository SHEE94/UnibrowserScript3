/**
 *@description: 扩展类插件
 *@author: Xianxu
 *@date: 2024-02-02
 *@version: 3.0
 *@Copyright: Xianxu
 *@LastEditors: Xianxu
 *@LastEditTime: 2024-02-02
 */

class ScriptExtension {
	constructor(wv) {
		this.scripts = []
		this.wv = wv
	}
	
	/**
	 * @type {enum}
	 */
	execution = {
		early:0,
		loading:1,
		loaded:2
	}

	/**
	 * @typedef scriptObj
	 * @type {Object}
	 * @property {String} name 脚本名
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
		
	}
	
	scriptList = []
	
	async addScriptOnline(obj){
		let res = await this.loadNetFile(obj.url)
		
	}
	
	loadNetFile(url){
		return new Promise((resolve,reject)=>{
			uni.request({
				url:url,
				responseType:'text',
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