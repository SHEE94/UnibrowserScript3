const blackUrls = uni.getStorageSync('blackUrls') || [];
const blackClassList = uni.getStorageSync('blackClassList') || [];
export default class AD {
	constructor(wv) {
		this.wv = wv;
		this.wv.state.setData({
			blackUrls,
			blackClassList
		})
		this.wv.state.watch('blackClassList', (val) => {
			uni.setStorage({
				key: 'blackClassList',
				data: blackClassList
			})
		})
		this.wv.state.watch('blackUrls', (val) => {
			uni.setStorage({
				key: 'blackUrls',
				data: blackUrls
			})
		})
		this.wv.state.getData('activeWebview', activeWebview => {
			if (!activeWebview) return;

			let code = this.injectClearADCode();
			activeWebview.evalJS(code)

		})
	}

	injectClearADCode() {
		let blackClassList = this.wv.state.data.blackClassList || [];
		let code = `(function(){
			window.WebKitMutationObserver ||
				window.MozMutationObserver;
			const observeMutationSupport = !!MutationObserver;
			
			const clearAD = function(){
				let blackClassList = ${ JSON.stringify(blackClassList)};
				
				let nodes = []
				blackClassList.forEach(item=>{
					if(!item)return;
					let ADNode = document.querySelectorAll('.'+item)
					
					ADNode.forEach(dom=>{
						dom.style.display = 'none';
					})
					
				})
			}
			if (observeMutationSupport) {
				let observer = new MutationObserver(function(records) {
					clearAD()
				});
				let body = document.querySelector('body')
				observer.observe(body, {
					'childList': true,
					'subtree': true
				})
			}
			window.addEventListener('DOMContentLoaded',clearAD)
		})()`;
		return code;
	}

	/**
	 * 添加链接到黑名单
	 * @param {Object} url
	 */
	addBlackAD(url) {
		if (!url) return;
		blackUrls.push(url);
		this.wv.state.data.blackUrls = blackUrls;
	}
	/**
	 * 添加class到黑名单
	 * @param {Object} className
	 */
	addClassAD(className) {
		if (!className) return;
		blackClassList.push(className);
		this.wv.state.data.blackClassList = blackClassList;
	}


}