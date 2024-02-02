import loadScript from './src/load-script.js'
import {
	codeArray
} from './src/wrapper.js'

export default function install(wv) {
	loadScript.load().then(_=>{
		let list = loadScript.getScriptList()
		// console.log('脚本列表',list)
		// console.log('codeArray',codeArray)
		// codeArray.forEach(code => {
		// 	wv.activeWebview.addEventListener('loaded',function(){
		// 		wv.activeWebview.evalJS(decodeURIComponent(atob(code.inject)))
		// 	}) 
		// })
	})
	
}