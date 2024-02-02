/**
 * 加载脚本
 */
import {
	LocalFileSystemURL
} from './fs/fs.js'

import {
	uuid
} from './utils/tools.js'
// 已读取的脚本列表
// uni.removeStorageSync('scriptList')
const scriptList = uni.getStorageSync('scriptList') || []


// 获取脚本的元数据
/**
 * @param {Object} text 脚本
 * @returns {matedata}
 */
function getMatedata(text) {
	// console.log(text)
	const reg = new RegExp('// ==UserScript==')
	const reg2 = new RegExp('// ==/UserScript==')
	let a = text.split(reg)[1]
	let b = a.split(reg2)[0]
	let matedata = {
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
			try{
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
			}catch(e){
				//TODO handle the exception
			}
			
		}
	}
	console.log(matedata)
	return matedata;
}
// 检测指定的脚本
function checkedScript(name) {
	return scriptList.find(item => item.namespace === name || item.name === name || item.fileName === name)
}
console.log('scriptList',scriptList)
let reader = null;
// 读取文件内容
const readFileData = (entries) => {
	
	if (checkedScript(entries.name)) return;

	let obj = {
		uuid: uuid(),
		fileName: entries.name,
		url: entries.fullPath, //脚本的本地地址
		scriptText: '', //脚本text信息
	}

	reader = new plus.io.FileReader();

	entries.file(file => {
		reader.onloadend = function(e) {
			const result = e.target.result;
			const metadata = getMatedata(result);
			obj.scriptText = result;
			obj.metadata = metadata;
			scriptList.push(obj);
			// 保存数据
			uni.setStorageSync('scriptList', scriptList)
		};
		reader.onerror = function(err) {
			console.log(err)
		}
		reader.readAsText(file);

	}, err => {
		console.log(err)
	})
}

// 读取脚本列表
const loadFilesList = async () => {
	const fileEntry = await LocalFileSystemURL('/script');
	console.log(fileEntry)
	// checkedScript(fileEntry)
	// 如果存在目录
	if (fileEntry.isDirectory) {

		let dirReader = fileEntry.createReader();
		dirReader.readEntries(entries => {
			console.log('entries',entries)
			for (let i = 0, len = entries.length; i < len; i++) {
				if (entries[i].isFile) {
					setTimeout((e) => {
						readFileData(e)
					}, 0, entries[i])
				}
			}
		}, err => {
			console.log('读取文件错误',err)
		})
	}
}
export default {
	async load() {
		await loadFilesList()
	},
	getScriptList() {
		return scriptList;
	}
}
