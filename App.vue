<script>
	import {
		WebView,
		Setting,
		Tools
	} from '@/libs/browser.core.js'
	

	// #ifdef APP
	const main = plus.android.runtimeMainActivity()
	const Intent = plus.android.importClass('android.content.Intent');
	const intent = new Intent();
	// #endif

	const webview = new WebView()
	const getIntentData = (arg) => {
		// #ifdef APP

		const data = intent.getDataString()
		if (data) {
			arg = data
		}
		// #endif

		if (typeof arg == 'string') {
			try {
				arg = JSON.parse(arg);
			} catch (e) {
				//TODO handle the exception
			}
		}
		if (arg.targeturl) {
			webview.state.setData({
				loadUrl: arg.targeturl
			})
		}
		if (arg.url) {
			webview.state.setData({
				loadUrl: arg.url
			})
		}
		if (typeof arg === 'string' && arg.length > 0) {
			webview.state.setData({
				loadUrl: arg
			})
		}
	}
	plus.globalEvent.addEventListener('newintent', (e) => {
		main.setIntent(Intent)
		getIntentData(plus.runtime.arguments)
	})

	export default {
		globalData: {
			showEnum: -1,
			activeWebview: null, //当前活动的webview窗口
			/**
			 * @type WebView
			 */
			webview: webview,
			webParam: null, //来自网页的消息
			showPopup: false, //显示popup

			// 当前浏览的网页信息
			browserInfo: {
				title: '',
				url: ''
			},
			searchVal: '', //搜索的内容
			homeUrl: '',
			closePopup() {
				const subNVue = uni.getSubNVueById('popup');
				this.showPopup = false;
				subNVue.hide();
				uni.$emit('popup-hide')
			}
		},
		onLaunch: function() {
			plus.android.requestPermissions(["android.permission.READ_CALENDAR",
				"com.android.launcher.permission.INSTALL_SHORTCUT",
				"android.permission.READ_EXTERNAL_STORAGE",
				"android.permission.WRITE_EXTERNAL_STORAGE",
				"android.permission.MANAGE_EXTERNAL_STORAGE"
			])
			console.log('App Launch')

			// 安装设置插件
			this.globalData.webview.plusInstall(Setting)
			// 安装暴力猴插件，这是个独立项目，当前项目中使用的代码为测试代码，请勿使用在正式环境中
			// this.globalData.webview.plusInstall(violentmonkey)
			// 安装工具插件
			this.globalData.webview.plusInstall(Tools)
			const domModule = uni.requireNativePlugin('dom');
			domModule.addRule('fontFace', {
				fontFamily: 'ccfffasd',
				src: "url('http://at.alicdn.com/t/c/font_2480200_22pc9fljf07.ttf?t=1707113971896')"
			});

		},
		onShow: function() {
			console.log('App Show')
			let arg = plus.runtime.arguments;
			getIntentData(arg)

		},
		onHide: function() {
			console.log('App Hide')
		},

	}
</script>

<style>
	/*每个页面公共css */
	.cc-font {
		font-family: ccfffasd;
	}
</style>