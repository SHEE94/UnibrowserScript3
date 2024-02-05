<template>
	<view class="res-list-container">
		<scroll-view scroll-y="true" class="list">
			<view>
				<view class="item" v-for="(item,index) in videos" :key="item.url">
					<text class="url-text">{{item.url}}</text>
					<image src="../../static/icon/play.png" mode="aspectFit" class="plat-icon" @click="playVideo(item.url)"></image>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	const app = getApp()
	export default {
		name: "res-list",
		data() {
			return {
				videos: []
			};
		},
		created() {
			const webview = app.globalData.webview;
			webview.state.getData('videos', (videos) => {
				if (!videos) return;
				this.videos = videos;
			})
		},
		methods:{
			playVideo(url){
				plus.runtime.openURL( url)
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
		box-shadow: 0 0 15px 2px #000;

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

			overflow: hidden;
		}

		.item {
			padding: 10px 15px;
			flex-direction: row;
			justify-content: space-between;
			border-bottom: 1px solid #999;
		}
	}
</style>