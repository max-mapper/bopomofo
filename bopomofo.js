/**
 * This is free and unencumbered software released into the public domain.
 *
 * Anyone is free to copy, modify, publish, use, compile, sell, or
 * distribute this software, either in source code form or as a compiled
 * binary, for any purpose, commercial or non-commercial, and by any
 * means.
 *
 * In jurisdictions that recognize copyright laws, the author or authors
 * of this software dedicate any and all copyright interest in the
 * software to the public domain. We make this dedication for the benefit
 * of the public at large and to the detriment of our heirs and
 * successors. We intend this dedication to be an overt act of
 * relinquishment in perpetuity of all present and future rights to this
 * software under copyright law.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * For more information, please refer to <http://unlicense.org/>
 */

/**
 * name     : idx-pinyin-bopomofo.js
 * version  : 1
 * updated  : 2015-08-21
 * license  : http://unlicense.org/ The Unlicense
 * git      : https://github.com/pffy/javascript-bopomofo
 *
 */
var IdxPinyinBopomofo = {
    "chuang" : "\u3114\u3128\u3124",
    "shuang" : "\u3115\u3128\u3124",
    "zhuang" : "\u3113\u3128\u3124",
    "chang" : "\u3114\u3124",
    "cheng" : "\u3114\u3125",
    "chong" : "\u3114\u3128\u3125",
    "chuai" : "\u3114\u3128\u311e",
    "chuan" : "\u3114\u3128\u3122",
    "diang" : "\u3109\u3127\u3124",
    "guang" : "\u310d\u3128\u3124",
    "huang" : "\u310f\u3128\u3124",
    "jiang" : "\u3110\u3127\u3124",
    "jiong" : "\u3110\u3129\u3125",
    "kuang" : "\u310e\u3128\u3124",
    "liang" : "\u310c\u3127\u3124",
    "niang" : "\u310b\u3127\u3124",
    "qiang" : "\u3111\u3127\u3124",
    "qiong" : "\u3111\u3129\u3125",
    "shang" : "\u3115\u3124",
    "sheng" : "\u3115\u3125",
    "shong" : "\u3115\u3128\u3125",
    "shuai" : "\u3115\u3128\u311e",
    "shuan" : "\u3115\u3128\u3122",
    "xiang" : "\u3112\u3127\u3124",
    "xiong" : "\u3112\u3129\u3125",
    "zhang" : "\u3113\u3124",
    "zheng" : "\u3113\u3125",
    "zhong" : "\u3113\u3128\u3125",
    "zhuai" : "\u3113\u3128\u311e",
    "zhuan" : "\u3113\u3128\u3122",
    "bang" : "\u3105\u3124",
    "beng" : "\u3105\u3125",
    "bian" : "\u3105\u3127\u3122",
    "biao" : "\u3105\u3127\u3120",
    "bing" : "\u3105\u3127\u3125",
    "cang" : "\u3118\u3124",
    "ceng" : "\u3118\u3125",
    "chai" : "\u3114\u311e",
    "chan" : "\u3114\u3122",
    "chao" : "\u3114\u3120",
    "chen" : "\u3114\u3123",
    "chou" : "\u3114\u3121",
    "chua" : "\u3114\u3128\u311a",
    "chui" : "\u3114\u3128\u311f",
    "chun" : "\u3114\u3128\u3123",
    "chuo" : "\u3114\u3128\u311b",
    "cong" : "\u3118\u3128\u3125",
    "cuan" : "\u3118\u3128\u3122",
    "dang" : "\u3109\u3124",
    "deng" : "\u3109\u3125",
    "dian" : "\u3109\u3127\u3122",
    "diao" : "\u3109\u3127\u3120",
    "ding" : "\u3109\u3127\u3125",
    "dong" : "\u3109\u3128\u3125",
    "duan" : "\u3109\u3128\u3122",
    "fang" : "\u3108\u3124",
    "feng" : "\u3108\u3125",
    "gang" : "\u310d\u3124",
    "geng" : "\u310d\u3125",
    "gong" : "\u310d\u3128\u3125",
    "guai" : "\u310d\u3128\u311e",
    "guan" : "\u310d\u3128\u3122",
    "hang" : "\u310f\u3124",
    "heng" : "\u310f\u3125",
    "hong" : "\u310f\u3128\u3125",
    "huai" : "\u310f\u3128\u311e",
    "huan" : "\u310f\u3128\u3122",
    "jian" : "\u3110\u3127\u3122",
    "jiao" : "\u3110\u3127\u3120",
    "jing" : "\u3110\u3127\u3125",
    "juan" : "\u3110\u3129\u3122",
    "kang" : "\u310e\u3124",
    "keng" : "\u310e\u3125",
    "kong" : "\u310e\u3128\u3125",
    "kuai" : "\u310e\u3128\u311e",
    "kuan" : "\u310e\u3128\u3122",
    "lang" : "\u310c\u3124",
    "leng" : "\u310c\u3125",
    "lian" : "\u310c\u3127\u3122",
    "liao" : "\u310c\u3127\u3120",
    "ling" : "\u310c\u3127\u3125",
    "long" : "\u310c\u3128\u3125",
    "luan" : "\u310c\u3128\u3122",
    "mang" : "\u3107\u3124",
    "meng" : "\u3107\u3125",
    "mian" : "\u3107\u3127\u3122",
    "miao" : "\u3107\u3127\u3120",
    "ming" : "\u3107\u3127\u3125",
    "nang" : "\u310b\u3124",
    "neng" : "\u310b\u3125",
    "nian" : "\u310b\u3127\u3122",
    "niao" : "\u310b\u3127\u3120",
    "ning" : "\u310b\u3127\u3125",
    "nong" : "\u310b\u3128\u3125",
    "nuan" : "\u310b\u3128\u3122",
    "pang" : "\u3106\u3124",
    "peng" : "\u3106\u3125",
    "pian" : "\u3106\u3127\u3122",
    "piao" : "\u3106\u3127\u3120",
    "ping" : "\u3106\u3127\u3125",
    "qian" : "\u3111\u3127\u3122",
    "qiao" : "\u3111\u3127\u3120",
    "qing" : "\u3111\u3127\u3125",
    "quan" : "\u3111\u3129\u3122",
    "rang" : "\u3116\u3124",
    "reng" : "\u3116\u3125",
    "rong" : "\u3116\u3128\u3125",
    "ruan" : "\u3116\u3128\u3122",
    "sang" : "\u3119\u3124",
    "seng" : "\u3119\u3125",
    "shai" : "\u3115\u311e",
    "shan" : "\u3115\u3122",
    "shao" : "\u3115\u3120",
    "shei" : "\u3115\u311f",
    "shen" : "\u3115\u3123",
    "shou" : "\u3115\u3121",
    "shua" : "\u3115\u3128\u311a",
    "shui" : "\u3115\u3128\u311f",
    "shun" : "\u3115\u3128\u3123",
    "shuo" : "\u3115\u3128\u311b",
    "song" : "\u3119\u3128\u3125",
    "suan" : "\u3119\u3128\u3122",
    "tang" : "\u310a\u3124",
    "teng" : "\u310a\u3125",
    "tian" : "\u310a\u3127\u3122",
    "tiao" : "\u310a\u3127\u3120",
    "ting" : "\u310a\u3127\u3125",
    "tong" : "\u310a\u3128\u3125",
    "tuan" : "\u310a\u3128\u3122",
    "wang" : "\u3128\u3124",
    "weng" : "\u3128\u3125",
    "xian" : "\u3112\u3127\u3122",
    "xiao" : "\u3112\u3127\u3120",
    "xing" : "\u3112\u3127\u3125",
    "xuan" : "\u3112\u3129\u3122",
    "yang" : "\u3127\u3124",
    "ying" : "\u3127\u3125",
    "yong" : "\u3129\u3125",
    "yuan" : "\u3129\u3122",
    "zang" : "\u3117\u3124",
    "zeng" : "\u3117\u3125",
    "zhai" : "\u3113\u311e",
    "zhan" : "\u3113\u3122",
    "zhao" : "\u3113\u3120",
    "zhei" : "\u3113\u311f",
    "zhen" : "\u3113\u3123",
    "zhou" : "\u3113\u3121",
    "zhua" : "\u3113\u3128\u311a",
    "zhui" : "\u3113\u3128\u311f",
    "zhun" : "\u3113\u3128\u3123",
    "zhuo" : "\u3113\u3128\u311b",
    "zong" : "\u3117\u3128\u3125",
    "zuan" : "\u3117\u3128\u3122",
    "ang" : "\u3124",
    "bai" : "\u3105\u311e",
    "ban" : "\u3105\u3122",
    "bao" : "\u3105\u3120",
    "bei" : "\u3105\u311f",
    "ben" : "\u3105\u3123",
    "bie" : "\u3105\u3127\u311d",
    "bin" : "\u3105\u3127\u3123",
    "cai" : "\u3118\u311e",
    "can" : "\u3118\u3122",
    "cao" : "\u3118\u3120",
    "cen" : "\u3118\u3123",
    "cha" : "\u3114\u311a",
    "che" : "\u3114\u311c",
    "chi" : "\u3114",
    "chu" : "\u3114\u3128",
    "cou" : "\u3118\u3121",
    "cui" : "\u3118\u3128\u311f",
    "cun" : "\u3118\u3128\u3123",
    "cuo" : "\u3118\u3128\u311b",
    "dai" : "\u3109\u311e",
    "dan" : "\u3109\u3122",
    "dao" : "\u3109\u3120",
    "dei" : "\u3109\u311f",
    "den" : "\u3109\u3123",
    "die" : "\u3109\u3127\u311d",
    "diu" : "\u3109\u3127\u3121",
    "dou" : "\u3109\u3121",
    "dui" : "\u3109\u3128\u311f",
    "dun" : "\u3109\u3128\u3123",
    "duo" : "\u3109\u3128\u311b",
    "fan" : "\u3108\u3122",
    "fei" : "\u3108\u311f",
    "fen" : "\u3108\u3123",
    "fou" : "\u3108\u3121",
    "gai" : "\u310d\u311e",
    "gan" : "\u310d\u3122",
    "gao" : "\u310d\u3120",
    "gei" : "\u310d\u311f",
    "gen" : "\u310d\u3123",
    "gou" : "\u310d\u3121",
    "gua" : "\u310d\u3128\u311a",
    "gui" : "\u310d\u3128\u311f",
    "gun" : "\u310d\u3128\u3123",
    "guo" : "\u310d\u3128\u311b",
    "hai" : "\u310f\u311e",
    "han" : "\u310f\u3122",
    "hao" : "\u310f\u3120",
    "hei" : "\u310f\u311f",
    "hen" : "\u310f\u3123",
    "hou" : "\u310f\u3121",
    "hua" : "\u310f\u3128\u311a",
    "hui" : "\u310f\u3128\u311f",
    "hun" : "\u310f\u3128\u3123",
    "huo" : "\u310f\u3128\u311b",
    "jia" : "\u3110\u3127\u311a",
    "jie" : "\u3110\u3127\u311d",
    "jin" : "\u3110\u3127\u3123",
    "jiu" : "\u3110\u3127\u3121",
    "jue" : "\u3110\u3129\u311d",
    "jun" : "\u3110\u3129\u3123",
    "kai" : "\u310e\u311e",
    "kan" : "\u310e\u3122",
    "kao" : "\u310e\u3120",
    "ken" : "\u310e\u3123",
    "kou" : "\u310e\u3121",
    "kua" : "\u310e\u3128\u311a",
    "kui" : "\u310e\u3128\u311f",
    "kun" : "\u310e\u3128\u3123",
    "kuo" : "\u310e\u3128\u311b",
    "lai" : "\u310c\u311e",
    "lan" : "\u310c\u3122",
    "lao" : "\u310c\u3120",
    "lei" : "\u310c\u311f",
    "lia" : "\u310c\u3127\u311a",
    "lie" : "\u310c\u3127\u311d",
    "lin" : "\u310c\u3127\u3123",
    "liu" : "\u310c\u3127\u3121",
    "lou" : "\u310c\u3121",
    "lun" : "\u310c\u3128\u3123",
    "luo" : "\u310c\u3128\u311b",
    "l\u00fce" : "\u310c\u3129\u311d",
    "l\u00fcn" : "\u310c\u3129\u3123",
    "mai" : "\u3107\u311e",
    "man" : "\u3107\u3122",
    "mao" : "\u3107\u3120",
    "mei" : "\u3107\u311f",
    "men" : "\u3107\u3123",
    "mie" : "\u3107\u3127\u311d",
    "min" : "\u3107\u3127\u3123",
    "miu" : "\u3107\u3127\u3121",
    "mou" : "\u3107\u3121",
    "nai" : "\u310b\u311e",
    "nan" : "\u310b\u3122",
    "nao" : "\u310b\u3120",
    "nei" : "\u310b\u311f",
    "nen" : "\u310b\u3123",
    "nia" : "\u310b\u3127\u311a",
    "nie" : "\u310b\u3127\u311d",
    "nin" : "\u310b\u3127\u3123",
    "niu" : "\u310b\u3127\u3121",
    "nou" : "\u310b\u3121",
    "nun" : "\u310b\u3128\u3123",
    "nuo" : "\u310b\u3128\u311b",
    "n\u00fce" : "\u310b\u3129\u311d",
    "pai" : "\u3106\u311e",
    "pan" : "\u3106\u3122",
    "pao" : "\u3106\u3120",
    "pei" : "\u3106\u311f",
    "pen" : "\u3106\u3123",
    "pie" : "\u3106\u3127\u311d",
    "pin" : "\u3106\u3127\u3123",
    "pou" : "\u3106\u3121",
    "qia" : "\u3111\u3127\u311a",
    "qie" : "\u3111\u3127\u311d",
    "qin" : "\u3111\u3127\u3123",
    "qiu" : "\u3111\u3127\u3121",
    "que" : "\u3111\u3129\u311d",
    "qun" : "\u3111\u3129\u3123",
    "ran" : "\u3116\u3122",
    "rao" : "\u3116\u3120",
    "ren" : "\u3116\u3123",
    "rou" : "\u3116\u3121",
    "rui" : "\u3116\u3128\u311f",
    "run" : "\u3116\u3128\u3123",
    "ruo" : "\u3116\u3128\u311b",
    "sai" : "\u3119\u311e",
    "san" : "\u3119\u3122",
    "sao" : "\u3119\u3120",
    "sei" : "\u3119\u311f",
    "sen" : "\u3119\u3123",
    "sha" : "\u3115\u311a",
    "she" : "\u3115\u311c",
    "shi" : "\u3115",
    "shu" : "\u3115\u3128",
    "sou" : "\u3119\u3121",
    "sui" : "\u3119\u3128\u311f",
    "sun" : "\u3119\u3128\u3123",
    "suo" : "\u3119\u3128\u311b",
    "tai" : "\u310a\u311e",
    "tan" : "\u310a\u3122",
    "tao" : "\u310a\u3120",
    "tie" : "\u310a\u3127\u311d",
    "tou" : "\u310a\u3121",
    "tui" : "\u310a\u3128\u311f",
    "tun" : "\u310a\u3128\u3123",
    "tuo" : "\u310a\u3128\u311b",
    "wai" : "\u3128\u311e",
    "wan" : "\u3128\u3122",
    "wei" : "\u3128\u311f",
    "wen" : "\u3128\u3123",
    "xia" : "\u3112\u3127\u311a",
    "xie" : "\u3112\u3127\u311d",
    "xin" : "\u3112\u3127\u3123",
    "xiu" : "\u3112\u3127\u3121",
    "xue" : "\u3112\u3129\u311d",
    "xun" : "\u3112\u3129\u3123",
    "yan" : "\u3127\u3122",
    "yao" : "\u3127\u3120",
    "yin" : "\u3127\u3123",
    "you" : "\u3127\u3121",
    "yue" : "\u3129\u311d",
    "yun" : "\u3129\u3123",
    "zai" : "\u3117\u311e",
    "zan" : "\u3117\u3122",
    "zao" : "\u3117\u3120",
    "zei" : "\u3117\u311f",
    "zen" : "\u3117\u3123",
    "zha" : "\u3113\u311a",
    "zhe" : "\u3113\u311c",
    "zhi" : "\u3113",
    "zhu" : "\u3113\u3128",
    "zou" : "\u3117\u3121",
    "zui" : "\u3117\u3128\u311f",
    "zun" : "\u3117\u3128\u3123",
    "zuo" : "\u3117\u3128\u311b",
    "ai" : "\u311e",
    "an" : "\u3122",
    "ao" : "\u3120",
    "ba" : "\u3105\u311a",
    "bi" : "\u3105\u3127",
    "bo" : "\u3105\u311b",
    "bu" : "\u3105\u3128",
    "ca" : "\u3118\u311a",
    "ce" : "\u3118\u311c",
    "ci" : "\u3118",
    "cu" : "\u3118\u3128",
    "da" : "\u3109\u311a",
    "de" : "\u3109\u311c",
    "di" : "\u3109\u3127",
    "du" : "\u3109\u3128",
    "ei" : "\u311f",
    "en" : "\u3123",
    "er" : "\u3126",
    "fa" : "\u3108\u311a",
    "fo" : "\u3108\u311b",
    "fu" : "\u3108\u3128",
    "ga" : "\u310d\u311a",
    "ge" : "\u310d\u311c",
    "gu" : "\u310d\u3128",
    "ha" : "\u310f\u311a",
    "he" : "\u310f\u311c",
    "hu" : "\u310f\u3128",
    "ji" : "\u3110\u3127",
    "ju" : "\u3110\u3129",
    "ka" : "\u310e\u311a",
    "ke" : "\u310e\u311c",
    "ku" : "\u310e\u3128",
    "la" : "\u310c\u311a",
    "le" : "\u310c\u311c",
    "li" : "\u310c\u3127",
    "lo" : "\u310c\u311b",
    "lu" : "\u310c\u3128",
    "l\u00fc" : "\u310c\u3129",
    "ma" : "\u3107\u311a",
    "me" : "\u3107\u311c",
    "mi" : "\u3107\u3127",
    "mo" : "\u3107\u311b",
    "mu" : "\u3107\u3128",
    "na" : "\u310b\u311a",
    "ne" : "\u310b\u311c",
    "ni" : "\u310b\u3127",
    "nu" : "\u310b\u3128",
    "n\u00fc" : "\u310b\u3129",
    "ou" : "\u3121",
    "pa" : "\u3106\u311a",
    "pi" : "\u3106\u3127",
    "po" : "\u3106\u311b",
    "pu" : "\u3106\u3128",
    "qi" : "\u3111\u3127",
    "qu" : "\u3111\u3129",
    "re" : "\u3116\u311c",
    "ri" : "\u3116",
    "ru" : "\u3116\u3128",
    "sa" : "\u3119\u311a",
    "se" : "\u3119\u311c",
    "si" : "\u3119",
    "su" : "\u3119\u3128",
    "ta" : "\u310a\u311a",
    "te" : "\u310a\u311c",
    "ti" : "\u310a\u3127",
    "tu" : "\u310a\u3128",
    "wa" : "\u3128\u311a",
    "wo" : "\u3128\u311b",
    "wu" : "\u3128",
    "xi" : "\u3112\u3127",
    "xu" : "\u3112\u3129",
    "ya" : "\u3127\u311a",
    "ye" : "\u3127\u311d",
    "yi" : "\u3127",
    "yu" : "\u3129",
    "za" : "\u3117\u311a",
    "ze" : "\u3117\u311c",
    "zi" : "\u3117",
    "zu" : "\u3117\u3128",
    "a" : "\u311a",
    "e" : "\u311c"
}

/**
 * This is free and unencumbered software released into the public domain.
 *
 * Anyone is free to copy, modify, publish, use, compile, sell, or
 * distribute this software, either in source code form or as a compiled
 * binary, for any purpose, commercial or non-commercial, and by any
 * means.
 *
 * In jurisdictions that recognize copyright laws, the author or authors
 * of this software dedicate any and all copyright interest in the
 * software to the public domain. We make this dedication for the benefit
 * of the public at large and to the detriment of our heirs and
 * successors. We intend this dedication to be an overt act of
 * relinquishment in perpetuity of all present and future rights to this
 * software under copyright law.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * For more information, please refer to <http://unlicense.org/>
 */

/**
 * name     : bopomofo.js
 * version  : 1
 * updated  : 2015-08-21
 * license  : http://unlicense.org/ The Unlicense
 * git      : https://github.com/pffy/javascript-bopomofo
 *
 */
var Bopomofo = function (str) {

  // constants
  const BPMF_TONES = {
    '2': 'ˊ',
    '3': 'ˇ',
    '4': 'ˋ',
    '5': '˙'
  }

  // tools, inputs and outputs
  var _pbdx = IdxPinyinBopomofo,
      _input = '',
      _output = '';

  function _setInput(str) {

    str = '' + str;
    str = str.trim();

    if(!str) {
      return;
    }

    _input = str;

    return _convert()
  }

  function _convert() {

    _output = _input;

    for(var p in _pbdx) {
      _output = _output.replace((new RegExp(p, 'g')), ' ' + _pbdx[p]);

      _output = _output.replace(_pbdx[p] + '1', _pbdx[p]);
      _output = _output.replace(_pbdx[p] + '2', _pbdx[p] + BPMF_TONES['2']);
      _output = _output.replace(_pbdx[p] + '3', _pbdx[p] + BPMF_TONES['3']);
      _output = _output.replace(_pbdx[p] + '4', _pbdx[p] + BPMF_TONES['4']);
      _output = _output.replace(_pbdx[p] + '5', _pbdx[p] + BPMF_TONES['5']);
    }

    _output = _vacuum(_output);
    _output = _output.trim();
    return _output
  }

  function _vacuum(str) {
    return str.replace((new RegExp('[^\\S\\n]{2,}', 'g')), ' ');
  }

  function _isReady() {
    return (_input && _pbdx && (typeof _pbdx === 'object'));
  }
  
  return _setInput(str)
};

module.exports = Bopomofo