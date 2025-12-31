/**
 * convert katakana characters to hiragana ones.
 * if the character is not katakana, 
 * this function doesn't convert its character and use it as is. 
 * @param {string} Katakana string
 * @return Hiragana
 * @customfunction
 */
function KATAKATA_TO_HIRAGANA(from_str) {
  if (from_str == null) {
    return null;
  }
  var to_str = '';
  // ひらがな開始文字のコードポイント https://ja.wikipedia.org/wiki/%E5%B9%B3%E4%BB%AE%E5%90%8D_(Unicode%E3%81%AE%E3%83%96%E3%83%AD%E3%83%83%E3%82%AF)
  const from_code_base = 'ぁ'.codePointAt(0);
  // カタカナ開始文字のコードポイント https://ja.wikipedia.org/wiki/%E7%89%87%E4%BB%AE%E5%90%8D_(Unicode%E3%81%AE%E3%83%96%E3%83%AD%E3%83%83%E3%82%AF)
  const to_code_base = 'ァ'.codePointAt(0);
  //変換対象となるカタカナの正規表現 参考 https://qiita.com/thzking/items/f07633e0ee9145a85ace
  //const regex = /^[\p{scx=Katakana}]+$/u;
  const regex = /^[ァ-ヶヽヾヿ]+$/u;
  // 一文字ずつ読み込んで変換するか判定する
  for (idx = 0; idx < from_str.length;idx++) {
    const from_char = from_str[idx];
    if (regex.test(from_char)) {
      // カタカナをひらがなに変換する
      const from_code = from_str.codePointAt(idx);
      const to_code = from_code - to_code_base + from_code_base;
      var h = String.fromCodePoint(to_code);
      to_str = to_str + h;
    } else {
      // 変換せずそのまま追加する
      to_str = to_str + from_char;
    }
  }

  return to_str;
}

/**
 * convert hiragana characters to katakana ones.
 * if the character is not hiragana, 
 * this function doesn't convert its character and use it as is. 
 * @param {string} hiragana string
 * @return katakana
 * @customfunction
 */
function HIRAGANA_TO_KATAKATA(from_str) {
  if (from_str == null) {
    return null;
  }
  var to_str = '';
  // カタカナ開始文字のコードポイント https://ja.wikipedia.org/wiki/%E7%89%87%E4%BB%AE%E5%90%8D_(Unicode%E3%81%AE%E3%83%96%E3%83%AD%E3%83%83%E3%82%AF)
  const from_code_base = 'ァ'.codePointAt(0);
  // ひらがな開始文字のコードポイント https://ja.wikipedia.org/wiki/%E5%B9%B3%E4%BB%AE%E5%90%8D_(Unicode%E3%81%AE%E3%83%96%E3%83%AD%E3%83%83%E3%82%AF)
  const to_code_base = 'ぁ'.codePointAt(0);
  //変換対象となるカタカナの正規表現 参考 https://qiita.com/thzking/items/f07633e0ee9145a85ace
  //const regex = /^[\p{scx=Katakana}]+$/u;
  const regex = /^[ぁ-ゖゝゞゟ]+$/u;
  // 一文字ずつ読み込んで変換するか判定する
  for (idx = 0; idx < from_str.length;idx++) {
    const from_char = from_str[idx];
    if (regex.test(from_char)) {
      // ひらがなをカタカナに変換する
      const from_code = from_str.codePointAt(idx);
      const to_code = from_code - to_code_base + from_code_base;
      var h = String.fromCodePoint(to_code);
      to_str = to_str + h;
    } else {
      // 変換せずそのまま追加する
      to_str = to_str + from_char;
    }
  }

  return to_str;
}

function test() {
  const hiragana = KATAKATA_TO_HIRAGANA('ヴァイキング タロウ');
  console.log(hiragana);
  const hiragana2 = KATAKATA_TO_HIRAGANA('ヽヾヿ');
  console.log(hiragana2);
  // 変換対象ではないカタカナ文字が存在する(U+30F7 - U+30FC)
  const hiragana3 = KATAKATA_TO_HIRAGANA('ヷヸヹヺ・ー');
  console.log(hiragana3);

  const katakana = HIRAGANA_TO_KATAKATA('ゔぁいきんぐ たろう');
  console.log(katakana);
  const katakana2 = HIRAGANA_TO_KATAKATA('ゝゞゟ');
  console.log(katakana2);

  // 変換対象ではないひらがな文字が存在する(U+3097 - U+309C)
}