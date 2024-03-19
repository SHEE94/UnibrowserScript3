let commands = document.getElementById("commands");
let editor = CodeMirror.fromTextArea(commands, {
	lineNumbers: true,
	matchBrackets: true,
	continueComments: "Enter",
	theme: 'material',
	lint: true,
	autofocus: true,
	mode: {
		name: "javascript",
		globalVars: true
	},
	hintOptions: { // 自定义提示选项
		completeSingle: false
	}
});

var editReady = function() {

	editor.focus()
	let notKey = [13, 32, 8, 186, 16, 222, 187];
	document.onkeyup = (evt) => {
		// 如果不存在数组中将触发
		if (notKey.indexOf(evt.keyCode) == -1 && editor.hasFocus()) {
			editor.showHint();
			CodeMirror.hint.javascript(editor);
		}
	}


	let ul = document.querySelector('.A-shortcut .ul').children;

	let selectEvent = (sel) => {
		switch (sel) {
			case 'Revoke':
				editor.undo();
				break;
			case 'Redo':
				editor.redo()
				break;
			case 'clearAll':
				editor.setValue('')
				break;
			default:
				break;
		}
		editor.focus()
	}


	let keyEvent = (sel) => {
		let pos = editor.getCursor()
		let pos2 = {};
		pos2.line = pos.line;
		pos2.ch = pos.ch;
		editor.replaceRange(sel, pos2);
		editor.focus()
	}

	let barEvent = (e) => {
		let target = e.target,
			_type = target.dataset.type,
			sel = target.dataset.sel;
		switch (_type) {
			case 'select':
				selectEvent(sel)
				break;
			case 'key':
				keyEvent(sel)
				break;
		}
	}
	for (let i = 0, len = ul.length; i < len; i++) {
		ul[i].addEventListener('click', barEvent)
	}


	// 初始化
	document.querySelector('#init').addEventListener('click', function() {
		keyEvent('')
	})

	document.querySelector('#savedb').addEventListener('click', function() {
		let codeData = editor.getValue();
		uni.postMessage({
			data: {
				action: 'message',
				script: codeData
			}
		})
	})
	
	document.querySelector('#Cancel').addEventListener('click', function() {
		uni.postMessage({
			data: {
				action: 'Cancel',
			}
		})
	})

	window.save = function() {
		let codeData = editor.getValue();
		uni.postMessage({
			data: {
				action: 'message',
				script: codeData
			}
		})
		window.localStorage.savestate = codeData;
	}

	let $code = [];
	window.setCode = function(code) {
		editor.setValue(decodeURIComponent(code))
	}
}
editReady()