
import {
	uuid
} from '../../tools/tools.js'
let historyList = uni.getStorageSync('history') || []

export default class History {
	constructor(wv){
		this.wv = wv;
		wv.on('CREATE-WEBVIEW',(w)=>{
			w.addEventListener('loaded',()=>{
				this.add({
					url:this.wv.getURL(),
					title: w.getTitle()
				})
			})
		})
	}
	/**
	 * @interface options{url:string,title:string}
	 * @param {Object<options>} options
	 */
	add(options) {
		if (!options.url) {
			console.warn('Not a valid url')
			return;
		}
		options.createTime = new Date()
		options.id = uuid()
		historyList.unshift(options)
		uni.setStorageSync('history',historyList)
	}
	del(id) {
		historyList.forEach((item, index) => {
			if (item.id === id) {
				historyList.splice(index, 1)
			}
		})
		uni.setStorageSync('history',historyList)
	}
	get() {
		return historyList;
	}
	clear(){
		historyList = []
		uni.setStorageSync('history',historyList)
	}
}