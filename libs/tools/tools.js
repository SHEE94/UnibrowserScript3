export const uuid = (len, radix) => {
  let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(
    '',
  );
  let uuid = [],
    i;
  radix = radix || chars.length;

  if (len) {
    for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
  } else {
    let r;
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }

  return uuid.join('');
}

export const encrypt = {
		// 加密
		/**
		 * 
		 * @param {string} str 要加密的字符串
		 * @param {string} key 密钥
		 * @returns {string} 
		 */
		encrypt: function(str, key) {
			let cipher = '';
			for (let i = 0; i < str.length; i++) {
				let char = str.charCodeAt(i);
				let keyChar = key.charCodeAt(i % key.length);
				cipher += String.fromCharCode(char + keyChar);
			}
			return encodeURI(cipher);
		},
		// 解密
		/**
		 * 
		 * @param {string} str 要解密的字符串
		 * @param {string} key 密钥
		 * @returns {string}
		 */
		decrypt: function(str, key) {
			str = decodeURI(str)
			let decipher = '';
			for (let i = 0; i < str.length; i++) {
				let char = str.charCodeAt(i);
				let keyChar = key.charCodeAt(i % key.length);
				decipher += String.fromCharCode(char - keyChar);
			}
			return decipher;
		}


	}