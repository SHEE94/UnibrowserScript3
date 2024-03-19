let GM_ctrl = {};
let setItem = plus.storage.setItem;
let getItem = plus.storage.getItem;
let metadata = "%metadata%";

function uuid() {
	let s = [];
	let hexDigits = "0123456789abcdef";
	for (let i = 0; i < 36; i++) {
		let start = Math.floor(Math.random() * 0x10);
		s[i] = hexDigits.substring(start, start + 1);
	}
	s[14] = "4";
	let start2 = (s[19] & 0x3) | 0x8;
	s[19] = hexDigits.substring(start2, start2 + 1);
	s[8] = s[13] = s[18] = s[23] = "-";

	let uuid = s.join("");
	return uuid;
}


function require(src) {
	return new Promise(function(res, reje) {
		let s = document.createElement('script')
		s.onload = function() {
			res(true)
		}
		s.onerror = function() {
			reje('err')
		}
		s.src = src;
		document.body.appendChild(s)
	})

}

let downloadType = {
	link: 0,
	img: 1,
	script: 2
}

let scriptLoaded = false;

if (metadata.require && metadata.require.length) {
	let len = metadata.require.length;
	let current = 0;
	metadata.require.forEach(function(src) {
		require(src)
		.then(function() {
			current++;
			if (current >= len) {
				scriptLoaded = true;
				window['scriptLoad_' + metadata.uuid]()
			}
		})
		.catch(function() {
			current++;
		})
	})
}
if (!metadata.require.length) {
	scriptLoaded = true;
}


function element(tag, attr) {
	let node = document.createElement(tag);
	if (typeof attr == 'object') {
		Object.keys(attr).forEach(function(key) {
			node.setAttribute(key, attr[key]);
		});
	};
	return node;
};

function websiteChecked(url) {
	let match = metadata.match;
	for (let i = 0, len = match.length; i < len; i++) {
		let urlreg = new RegExp(match[i]);
		if (urlreg.test(url)) {
			return true;
		}
	};
	return false;
};

const namespaceStorage = function() {
	let data = getItem(metadata.name);
	if (typeof data == 'string') {
		return JSON.parse(data);
	};
	return [];
};

const GM_info = {
	uuid: metadata.uuid,
	script: {
		author: metadata.author,
		name: metadata.name,
		description: metadata.description,
		version: metadata.version,
		copyright: metadata.copyright,
		includes: metadata.includes,
		matches: metadata.matches,
		excludes: metadata.excludes,
		resources: metadata.resources
	},
	version: '1.0.0',
};


function requestText(url) {
	return new Promise(function(res, rej) {
		let xhr = new window.XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "text";
		xhr.onload = function() {
			if (xhr.readyState === xhr.DONE) {
				if (xhr.status === 200) {
					res(xhr.responseText)
				}
			}
		};
		xhr.onerror = function() {
			rej()
		}
		xhr.send(null);
	})

}

const GM_getResourceText = function(name) {
	return new Promise(function(res, rej) {
		let resource = metadata.resource;
		for (let i = 0; i < resource.length; i++) {
			if (resource[0] === name) {
				requestText(resource[1])
					.then(res)
			}
		}
		rej(null)
	})
}

const GM_setClipboard = window.GM_setClipboard = function(text) {
	return navigator.clipboard.writeText(text)
		.then(() => {
			console.log('Text successfully copied to clipboard!');
		})
		.catch(err => {
			console.error('Failed to copy text: ', err);
		});
}


const GM_getResourceURL = function(name) {
	let resource = metadata.resource;
	for (let i = 0; i < resource.length; i++) {
		if (resource[0] === name) {
			return resource[1]
		}
	}
	return null;
}

const GM_setValue = window.GM_setValue = function(key, defaultValue) {
	let namespaceArr = namespaceStorage() || [];
	let saveVal = {
		key: key,
		data: defaultValue
	};
	namespaceArr.push(saveVal);
	setItem(metadata.name, JSON.stringify(namespaceArr));
};

const GM_getValue = window.GM_getValue = function(key) {
	let namespaceArr = namespaceStorage() || [];
	let resArr = namespaceArr.find(item => item.key == key);
	if (!resArr) {
		return null;
	}
	return resArr.data;
};

const GM_deleteValue = window.GM_deleteValue = function(key) {
	let namespaceArr = namespaceStorage() || [];

	namespaceArr.forEach((item, index) => {
		namespaceArr.splice(index, 1);
	});
	setItem(metadata.name, JSON.stringify(namespaceArr));
};


const GM_addStyle = window.GM_addStyle = function(css) {
	let style = document.createElement('style');
	style.textContent = css;
	document.head.appendChild(style);
	return style;
};

const GM_openInTab = window.GM_openInTab = function(url, options) {
	if (window.webSDK) {
		window.webSDK.sendMessage({
			action: 'GM_openInTab',
			data: {
				url,
				options
			}
		});
	};
};



const GM_registerMenuCommand = window.GM_registerMenuCommand = function(caption, onClick, options) {
	let id = uuid()
	if (window.webSDK) {
		window.webSDK.sendMessage({
			action: 'GM_registerMenuCommand',
			data: {
				caption,
				options,
				id: id
			}
		});
		window['gm_menu_' + id] = function(menu) {
			onClick && onClick(menu)
		}
	}
	return id;
};

const GM_addElement = window.GM_addElement = function() {
	let arg = arguments;
	let tagName = '',
		attributes = {},
		parentNode = document.body;
	if (arg.length == 2) {
		tagName = arg[0];
		attributes = arg[1]
	} else if (arg.length === 3) {
		parentNode = arg[0];
		tagName = arg[1];
		attributes = arg[2]
	}

	let node = document.createElement(tagName);
	Object.keys(attributes).forEach(function(key) {
		node.setAttribute(key, attributes[key])
	})
	parentNode.appendChild(node)
	return node;
}

const GM_unregisterMenuCommand = window.GM_unregisterMenuCommand = function(caption) {
	if (window.webSDK) {
		window.webSDK.sendMessage({
			action: 'GM_unregisterMenuCommand',
			data: {
				caption
			}
		})
	}
};

const GM_xmlhttpRequest = window.GM_xmlhttpRequest = function(details) {

	let xhr = new plus.net.XMLHttpRequest();
	details.onreadystatechange = xhr.onreadystatechange;
	details.onabort = xhr.onabort;
	details.onerror = xhr.onerror;
	details.onload = xhr.onload;
	details.onloadend = xhr.onloadend;
	details.onloadstart = xhr.onloadstart;
	details.onprogress = xhr.onprogress;
	details.ontimeout = xhr.ontimeout;

	xhr.timeout = details.timeout || 30000;
	if (details.responseType) {
		xhr.responseType = details.responseType;
	}
	if (details.headers) {
		Object.keys(details.headers).forEach(function(key) {
			xhr.setRequestHeader(key, details.headers[key]);
		});

	};
	if (details.overrideMimeType) {
		xhr.overrideMimeType(details.overrideMimeType);
	};

	if (details.method == 'GET' && details.data) {
		let param = '';
		Object.keys(details.data).forEach(function(key) {
			param += '&' + key + '=' + details[key];
		});
		param = param.substring(1);
		details.url = '?' + param;
	};

	let username = details.user ? details.user : null,
		password = details.password ? details.password : null;

	xhr.open(details.method || 'GET', details.url, username, password);
	if (details.metadata == 'POST') {
		console.log(details)
		xhr.send(details.data);
	} else {
		xhr.send();
	}
};

const GM_download = window.GM_download = function() {

	return new Promise((res, rej) => {
		if (arguments.length == 1) {
			let options = arguments[0];
			plus.downloader.createDownload(options.url, options, function(e) {
				res(e);
			});
		};
		if (arguments.length > 1) {
			let url = arguments[0];
			let name = arguments[1];
			plus.downloader.createDownload(url, {
				filename: name
			}, function(e) {
				res(e)
			});
		}
	});
};