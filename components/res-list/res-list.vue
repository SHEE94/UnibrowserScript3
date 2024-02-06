<template>
	<view class="res-list-container" ref="resList">
		<scroll-view scroll-y="true" class="list">
			<view>
				<view class="item" v-for="(item,index) in videos" :key="item.url">
					<text class="url-text">{{item.url}}</text>
					<image src="../../static/icon/play.png" mode="aspectFit" class="plat-icon"
						@click="playVideo(item.url)"></image>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	const app = getApp()
	const animation = uni.requireNativePlugin('animation');
	export default {
		name: "res-list",
		data() {
			return {
				videos: []
			};
		},
		created() {
			const webview = app.globalData.webview;
			let res = webview.getRES()
			this.videos = res.video
		},
		mounted() {
			const resList = this.$refs.resList;
			animation.transition(resList, {
				styles: {
					transform: 'translateY(0%)',
					transformOrigin: 'center center',
					opacity: 1
				},
				duration: 200, //ms
				timingFunction: 'ease',
				delay: 0 //ms
			});
		},
		methods: {
			playVideo(url) {

				if (uni.getSystemInfoSync().osName == 'android') {
					var Intent = plus.android.importClass("android.content.Intent");
					var Uri = plus.android.importClass("android.net.Uri");
					var main = plus.android.runtimeMainActivity();
					var intent = new Intent(Intent.ACTION_VIEW);
					var uri = Uri.parse(url);
					intent.setDataAndType(uri, "video/*");
					main.startActivity(intent);
				}

				if (uni.getSystemInfoSync().osName == 'ios') {
					plus.runtime.openURL(url)
				}
			}
		}
	}
</script>

<style lang="scss">
	.res-list-container {
		background-color: #fff;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 400px;
		padding-top: 10px;
		border-radius: 10px 10px 0px 0px;
		box-shadow: 0 0 1500px 10px #000;
		transform: translateY(100%);

		.list {
			height: 380px;
		}

		.plat-icon {
			width: 30px;
			height: 30px;
		}

		.url-text {
			width: 300px;
			height: 25px;
			color:#313131;
			text-overflow:ellipsis;
		}

		.item {
			padding: 10px 15px;
			flex-direction: row;
			justify-content: space-between;
			border-bottom: 1px solid #dddddd;
		}
	}
</style>