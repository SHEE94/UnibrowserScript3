const requestFileSystem = plus.io.requestFileSystem;

// 获取本地路径的目录或文件
/**
 * @param {string} url 本地路径
 * @returns {DirectoryEntry} 文件操作的实体对象
 */
export const LocalFileSystemURL = (url) => {
	return new Promise((resolve, reject) => {
		
		const _url = plus.io.LocalURL?plus.io.LocalURL + '/storage/emulated/0' + url:'file:///storage/emulated/0' + url
		
		plus.io.resolveLocalFileSystemURL('_www/static'+url, entry => {
				resolve(entry)
			},
			err => {
				
				reject(err)
			})
	})
}

export const readFile = (file)=>{
	return new Promise((resolve,reject)=>{
		plus.io.FileReader()
	})
}