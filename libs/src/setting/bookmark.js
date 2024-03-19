import {
	uuid,
	encrypt
} from '../../tools/tools.js'
let bookmarkList = uni.getStorageSync('bookmark') || []
export default class Bookmark {
	constructor(wv) {
		this.wv = wv;
	}
	/**
	 * @interface options{url:string,title:string,home:boolean,isDir:boolean,children:Array[options]}
	 * @param {Object<{url:string,title:string,home:false,isDir:false,children:[]}>} options 书签信息
	 */
	add(options) {
		if (!options.title) {
			console.warn('Not a valid title')
			return;
		}
		options.id = uuid()
		bookmarkList.unshift(options)
		uni.setStorageSync('bookmark', bookmarkList)
	}

	update(options) {
		let id = options.id;
		if (!id) return;
		const dg = function(list) {
			list.forEach((item, index) => {
				if (item.id == id) {
					Object.keys(options).forEach(key => {
						item[key] = options[key]
					})
				}
				if (item.children && item.isDir) {
					dg(item.children)
				}
			})
		}
		dg(bookmarkList)
		
		uni.setStorageSync('bookmark', bookmarkList)
	}

	del(id) {
		const dg = function(list) {
			list.forEach((item, index) => {
				if (item.id === id) {
					list.splice(index, 1)
				}
				if (item.children && item.isDir) {
					dg(item.children)
				}
			})
		}
		dg(bookmarkList)
		uni.setStorageSync('bookmark', bookmarkList)
	}

	get(id) {
		if (!id) return bookmarkList;
		return bookmarkList.find(item => id == item.id)

	}
	
	createEncryptionSharing(url){
		let str = encrypt.encrypt(url,'ScriptBrowser')
		return `ScriptBrowser://web@@${str}`
	}
}