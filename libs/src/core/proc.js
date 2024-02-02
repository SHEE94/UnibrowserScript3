// data数据监听
const _watchMap = new Map();
const _queuing = new Map();
const _data = {
	_queuing,
	version: '1.0.0',
	SDK: '1.0.0'
}


let _self = null;

function setData(target, property, value, receiver) {
	if (_watchMap.has(property)) {
		let cbs = _watchMap.get(property)
		if (cbs) {
			cbs.forEach(item => {
				item(value)
			})
		}
	}

	return Reflect.set(target, property, value, receiver)
}

function deleteData(target, property) {
	if (_watchMap.has(property)) {
		_watchMap.delete(property)
	}
	return Reflect.deleteProperty(target, property)
}


const $data = new Proxy(_data, {
	set: (target, property, value, receiver) => {
		return setData(target, property, value, receiver)
	},
	deleteProperty: (target, property) => {
		return deleteData(target, property)
	}
})

/**
 * @class proc
 * @classdesc provider通信进程
 */
export class Proc {

	constructor() {

		_self = this;

	}

	/**
	 * 对属性进行监听
	 * @param {String} key 
	 * @param {Function} cb 
	 */
	watch(key, cb) {
		const watchs = _watchMap.get(key) || [];
		_watchMap.set(key, [...watchs, cb]);
	}



	/**
	 * 获取数据模型
	 */
	get data() {
		return $data
	}
	/**
	 * 直接赋值数据模型
	 * @description 直接赋值将放置到anonymousData匿名数据数组中，更新data中的数据请使用setData({})方法，或使用“ . ”运算符对data中的属性赋值
	 */
	set data(val) {
		// 设置匿名数据，无建名
		if (!$data['anonymousData']) {
			$data['anonymousData'] = []
		}
		$data['anonymousData'].push(val)
	}

	/**
	 * 获取匿名数据
	 */
	get anonymousData() {
		return $data['anonymousData']
	}


	/**
	 * @description 消息列队处理
	 */
	messageQueuing = {
		/**
		 * 
		 * @param {string} key 
		 * @param {Array<any>} val 列队
		 * @returns 
		 */
		add(key, val = []) {
			if (!Array.isArray(val)) {
				return;
			}
			_self.data._queuing.set(key, val)
		},
		/**
		 * 
		 * @param {string} key 
		 * @param {function} cb 消息处理程序
		 * @returns 
		 */
		async handler(key, cb) {
			if (typeof cb !== 'function') return;
			let $queuing = _self.data._queuing;
			let list = $queuing.get(key);
			try {
				for (let i = 0; i < list.length; i++) {
					let bool = cb(list[i])
					if (Object.prototype.toString.call(bool) === '[object Promise]') {
						bool = await bool;
					}
					if (!bool) {
						break;
					}
				}
			} catch (error) {
				return false;
			}
			return true;
		},
		clear(key) {
			if (key) {
				_self.data._queuing.delete(key)
			} else {
				_self.data._queuing.clear()
			}
		}
	}


	/**
	 * 设置数据
	 * @param {Object} data
	 * @returns {Boolean}
	 */
	setData(data) {
		return new Promise((res, rej) => {
			try {
				Object.keys(data).forEach(key => {
					this.data[key] = data[key]
				})
				res(true)
			} catch (error) {
				rej(error)
			}

		})

	}
	/**
	 * 获取数据并监听数据变化
	 * @param {Object} key
	 * @param {Object} callback
	 */
	getData(key, callback, err) {
		let val = this.data[key];
		if (val) {
			callback(val);
		} else {
			err && err()
		}
		this.watch(key, (val) => {
			callback(val)
		})
	}


}