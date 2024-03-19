let GM_ctrl = {}


let setItem = plus.storage.setItem;
let getItem = plus.storage.getItem;
let metadata = {}

function element(tag, attr) {
	let node = document.createElement(tag)
	if (typeof attr == 'object') {
		Object.keys(attr).forEach(function(key) {
			node.setAttribute(key, attr[key])
		})
	}
	return node;
}

function websiteChecked(url) {
	let match = metadata.match;
	for (let i = 0, len = match.length; i < len; i++) {
		let urlreg = new RegExp(match[i])
		if (urlreg.test(url)) {
			return true;
		}
	}
	return false;
}

const namespaceStorage = function() {
	let data = getItem(metadata.name)
	if (typeof data == 'string') {
		return JSON.parse(data)
	}
	return []
}


GM_ctrl.GM_setValue = function(key, defaultValue) {
	let namespaceArr = namespaceStorage() || [];
	let saveVal = {
		key: key,
		data: defaultValue
	}
	namespaceArr.push(saveVal)
	setItem(metadata.name, JSON.stringify(namespaceArr))
}

GM_ctrl.GM_getValue = function(key) {
	let namespaceArr = namespaceStorage() || [];
	let resArr = namespaceArr.find(item => item.key == key)
	return resArr.data;
}

GM_ctrl.GM_deleteValue = function(key) {
	let namespaceArr = namespaceStorage() || [];

	namespaceArr.forEach((item, index) => {
		namespaceArr.splice(index, 1)
	})
	setItem(metadata.name, JSON.stringify(namespaceArr))
}
GM_ctrl.GM_getResourceText = function(name) {
	return metadata[name]
}

GM_ctrl.GM_getResourceURL = function(name) {
	return metadata.resource.find(item => item[0] == name)
}

GM_ctrl.GM_addElement = function() {
	let a = arguments[0]
	let b = arguments[1]
	let c = arguments[2]
	let node = null
	if (typeof a == 'string') {
		node = element(a, b)
		document.body.appendChild(node)
	}
	if (typeof a == 'object') {
		node = element(b, c)
		a.appendChild(node)
	}
	return node
}

GM_ctrl.GM_addStyle = function(css) {
	let style = document.createElement('style')
	style.textContent = css;
	document.head[0].appendChild(style)
	return style;
}

GM_ctrl.GM_openInTab = function(url, options) {
	
}

GM_ctrl.GM_registerMenuCommand = function(caption, onClick) {

}
GM_ctrl.GM_unregisterMenuCommand = function(caption) {

}

GM_ctrl.GM_xmlhttpRequest = function(details) {
	let xhr = new plus.net.XMLHttpRequest();
	details.onreadystatechange = xhr.onreadystatechange;
	details.onabort = xhr.onabort;
	details.onerror = xhr.onerror;
	details.onload = xhr.onload;
	details.onloadend = xhr.onloadend;
	details.onloadstart = xhr.onloadstart;
	details.onprogress = xhr.onprogress;
	details.ontimeout = xhr.ontimeout;

	xhr.timeout = details.timeout || 30000
	if (details.responseType) {
		xhr.responseType = details.responseType
	}
	if (details.headers) {
		Object.keys(details.headers).forEach(function(key) {
			xhr.setRequestHeader(key, details.headers[key])
		})

	}
	if (details.overrideMimeType) {
		xhr.overrideMimeType(details.overrideMimeType);
	}

	if (details.method == 'GET' && details.data) {
		let param = ''
		Object.keys(details.data).forEach(function(key) {
			param += '&' + key + '=' + details[key]
		})
		param = param.substring(1)
		details.url = '?' + param
	}

	let username = details.user ? details.user : null,
		password = details.password ? details.password : null;

	xhr.open(details.method || 'GET', details.url, username, password);
	if (details.metadata == 'POST') {
		xhr.send(details.data);
	} else {
		xhr.send();
	}
}

GM_ctrl.GM_download = function() {

	return new Promise((res, rej) => {
		if (arguments.length == 1) {
			let options = arguments[0];
			plus.downloader.createDownload(options.url, options, function(e) {
				res(e)
			});
		}
		if (arguments.length > 1) {
			let url = arguments[0];
			let name = arguments[1];
			plus.downloader.createDownload(url, {
				filename: name
			}, function(e) {
				res(e)
			});
		}
	})
}