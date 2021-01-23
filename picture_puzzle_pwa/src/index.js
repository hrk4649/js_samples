import * as Vue from 'vue/dist/vue.esm-bundler';


const levels =  [
    {
        id: 1,
        title: "サクナ１",
        imgsrc: "leaf_small.png"
    },
    {
        id: 2,
        title: "花",
        imgsrc: "flower1.png"
    },
    {
        id: 3,
        title: "センダングサ",
        imgsrc: "flower2.png"
    },
    {
        id: 4,
        title: "サクナ２",
        imgsrc: "leaf2.png"
    },
    {
        id: 5,
        title: "気球",
        imgsrc: "balloon.png"
    },
    {
        id: 6,
        title: "パパイヤとかたつむり",
        imgsrc: "papaya_snail.png"
    },
    {
        id: 7,
        title: "コーヒーチェリー",
        imgsrc: "coffee_cherry.png"
    },
    {
        id: 8,
        title: "モモタマナ",
        imgsrc: "momotamana.png"
    },
    {
        id: 9,
        title: "アメリカハマグルマ",
        imgsrc: "wedelia.png"
    },
];

const board = {
    // ピースの数
    numOfPiece: 16,
    // ピースの幅
    pieceWidth: -1,
    // ピースの高さ
    pieceHeight: -1,
    // ボード は配列で表現される。16ピースのボードの場合、
    // インデックス番号 n の要素は、
    // ボードの(x, y) = (n % 4, n / 4)のピースに対応する
    pieces: [],
    // 掴んている画像の番号
    numGrabbed: -1,
    // 画像を掴んだ時の、画像座標系でのX座標
    grabbedX: -1,
    // 画像を掴んだ時の、画像座標系でのY座標
    grabbedY: -1,
    // ピースを表示する際のx座標
    originX: 0,
    // ピースを表示する際のy座標
    originY: 0,
    // ピース間のマージン
    marginPiece: 1,
    // 表示するビットマップのデバイス画面サイズに対する比率
    tgtPixelRate: 0.9,
    // ゲーム中のレベルID(ベストタイム情報を登録するときに使う
    levelId: -1,
    // ゲームにおける画像の分割数 ( = sqrt(numOfPiece))
    devide: -1,
    // ゲームの開始時刻
    startGameAt: 0,
    // ゲームクリアの時刻
    clearGameAt: 0,
    // ゲーム中のレベルのベストタイム
    bestTime: 0,
    // ゲーム画面の状態 1=開始処理中, 2=アニメーション中, 3=ゲーム中, 4=ゲームクリア
    state: 0,
    // touchend イベントが発生する直前の X 座標
    beforeX: -1,
    // touchend イベントが発生する直前の Y 座標
    beforeY: -1
};

const GAME_STATE_START = 1;
const GAME_STATE_IN_ANIMATION = 2;
const GAME_STATE_ON_GAME = 3;
const GAME_STATE_GAME_CLEAR = 4;

const HOUR_MILLISECOND = 60 * 60 * 1000;
const MINUTE_MILLISECOND = 60 * 1000;
const SECOND_MILLISECOND = 1000;

// indexeddb の初期化
// window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"};
// window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;


const Main = {
    data() {
        return {
            stylePage1: {
                display: 'block'
            },
            stylePage2: {
                display: 'none'
            },
            stylePage3: {
                display: 'none'
            },
            levels,
            // 分割数
            divides: [3, 4, 5],
            board,
            dbname: 'timedb',
            dbversion: 1,
            objectStore: 'time',
            keyPath: 'id',
            // イメージオブジェクト
            img: null
        }
    },
    methods: {
        // level オブジェクトから ベストタイムを取得する
        getBesttime(level, divide) {
            let time = null;
            if (level.besttime != null && level.besttime[divide] != null) {
                time = level.besttime[divide];
            }
            return time;
        },
        // 時刻のフォーマット
        timeFormat(time) {
            if (time == null) {
                return `--:--:--`;
            }

            let hour = Math.floor(time / (60 * 60 * 1000));
            let minute = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
            let second = Math.floor(time % (60 * 1000) / 1000);
            let p = (v) => {
                let pad = '';
                if (v < 10) {
                    pad = '0';
                }
                return `${pad}${v}`;
            };

            return `${p(hour)}:${p(minute)}:${p(second)}`;
        },
        // データベースから各レベルのベストタイムを読み込む
        readBesttime: async function() {
            console.log(`readBesttime`);
            let p1 = await new Promise((resolve, reject) => {
                let request = window.indexedDB.open(this.dbname,this.dbversion);
                request.onerror = (error) => {
                    // エラー対応処理
                    console.log(`readBesttime error ${error}`);
                    reject(error);
                };

                request.onsuccess = (event) => {
                    // 処理
                    console.log(`readBesttime onsuccess ${event}`);
                    let db = event.target.result;
                    let objectStore = db.transaction(this.objectStore)
                        .objectStore(this.objectStore);

                    // 返戻用オブジェクト
                    let ret = {};

                    objectStore.openCursor().onsuccess = (event) => {
                        // データをすべて読み込む
                        let cursor = event.target.result;
                        if (cursor) {
                            console.log(`readBesttime cursor onsuccess ${JSON.stringify(cursor)}`);
                            ret[cursor.key] = cursor.value.time;
                            cursor.continue();
                        } else {
                            console.log(`readBesttime cursor onsuccess no more entries`);
                            resolve(ret);
                        }
                    };
                };

                request.onupgradeneeded = (event) => {
                    console.log(`readBesttime onupgradeneeded ${event}`);

                    let db = event.target.result;
                    // オブジェクトストアの作成
                    let objectStore = db.createObjectStore(
                        this.objectStore,
                        {keyPath: this.keyPath});
                };
            }).then((timemap) => {
                console.log(`readBesttime timemap ${JSON.stringify(timemap)}`);
                // ベストタイムをセットする
                for (let key in timemap) {
                    let time = timemap[key];
                    let elems = key.split('-');
                    let id = parseInt(elems[0]);
                    let divide = parseInt(elems[1]);
                    let level = this.levels.find((v) => {return v.id === id});
                    if (!level) {
                        console.log(`readBesttime continue ${id}-${divide}`);
                        continue;
                    }
                    if (level.besttime == null) {
                        level.besttime = {};
                    }
                    console.log(`readBesttime set ${id}-${divide} ${time}`);
                    level.besttime[divide] = time;
                }
            }).catch((error) => {
                console.log(`readBesttime error ${JSON.stringify(error)}`);
            });
            console.log(`readBesttime finish`);
        },
        // ベストタイムの更新
        updateBestTime: async function(levelid, divide, time) {
            console.log(`updateBestTime`);
            let p1 = await new Promise((resolve, reject) => {
                let request = window.indexedDB.open(this.dbname,this.dbversion);
                request.onerror = (error) => {
                    // エラー対応処理
                    console.log(`updateBestTime error ${error}`);
                    reject(error);
                };

                request.onsuccess = (event) => {
                    // 処理
                    console.log(`updateBestTime onsuccess ${event}`);
                    let db = event.target.result;
                    let objectStore = db.transaction(this.objectStore, 'readwrite')
                        .objectStore(this.objectStore);

                    // 返戻用オブジェクト
                    let id = `${levelid}-${divide}`;
                    let data = {id, time};
                    console.log(`updateBestTime data ${JSON.stringify(data)}`);
                    let req2 = objectStore.put(data);
                    req2.onerror = (event) => {
                        reject("error");
                    };
                    req2.onsuccess = (event) => {
                        resolve(event.target.result);
                    };
                };

                request.onupgradeneeded = (event) => {
                    console.log(`updateBestTime onupgradeneeded ${event}`);

                    let db = event.target.result;
                    // オブジェクトストアの作成
                    let objectStore = db.createObjectStore(
                        this.objectStore,
                        {keyPath: this.keyPath});
                };
            }).then((id) => {
                console.log(`updateBestTime id ${JSON.stringify(id)}`);
            }).catch((error) => {
                console.log(`updateBestTime error ${JSON.stringify(error)}`);
            });
            console.log(`updateBestTime finish`);
        },
        // スクロールを無効にするハンドラー
        stopScroll(event) {
            event.preventDefault();
        },
        // スクロールを無効にする
        disableScroll() {
            // スクロールの停止
            // https://www.html5rocks.com/ja/mobile/touch/
            // event.preventDefaultが動かなかった
            // https://note.com/cfbif/n/n92195df174bf
            document.body.addEventListener('touchmove', this.stopScroll, { passive: false, capture: false});
        },
        // スクロールを有効にする
        enableScroll() {
            document.body.removeEventListener('touchmove', this.stopScroll, { passive: false, capture: false});
        },
        // page2に繊維する
        movePage2() {

            this.readBesttime();

            this.stylePage1.display = 'none'
            this.stylePage2.display = 'block'
            this.stylePage3.display = 'none'

            this.enableScroll();
        },
        // ゲーム画面を表示する
        startGame: async function(levelId, divide) {
            console.log(`startGame ${levelId} ${divide}`);
            this.stylePage1.display = 'none'
            this.stylePage2.display = 'none'
            this.stylePage3.display = 'block'

            this.board.numOfPiece = divide * divide;
            this.board.divide = divide;
            this.board.levelId = levelId;
            this.board.state = GAME_STATE_START;

            let level = this.levels.find((v) => {return v.id == levelId});
            console.log(`startGame level ${JSON.stringify(level)}`);
            if (level != null && level.besttime != null && level.besttime[divide] != null) {
                this.board.bestTime = level.besttime[divide];
            } else {
                this.board.bestTime = Number.MAX_VALUE;
            }
            console.log(`startGame bestTime ${this.board.bestTime}`);

            this.board.startGameAt = new Date().getTime();

            this.initPieces();
            console.log(`startGame pieces ${JSON.stringify(this.board.pieces)}`);

            // 画像の読み込み
            await this.loadImage(level.imgsrc);

            this.drawPieces();
            this.disableScroll();
        },
        initCanvas() {
            console.log(`initCanvas`);
            const canvas = document.getElementById('canvas');
            const page3 = document.getElementById('main');
            // キャンバスのサイズを設定する
            canvas.width = page3.clientWidth;
            canvas.height = page3.clientHeight;
        },
        loadImage: async function(filename) {
            console.log(`loadImage`);
            let self = this;
            if (filename == null) {
                return;
            }
            let p = await new Promise((resolve, reject) => {
                this.img = new Image();
                this.img.onload = function() {
                    resolve('ok');
                }
                this.img.src = 'img/' + filename;
            });
            console.log(`loadImage finish`);
        },
        drawPieces() {
            console.log(`drawPieces`);
            this.initCanvas();
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            //let self = this;
            let board = this.board;
            let img = this.img;
            let divide = Math.floor(Math.sqrt(board.numOfPiece));
            // 1ピースあたりのサイズ(幅、高さ)
            board.pieceWidth = img.width / divide;
            board.pieceHeight = img.height / divide;
            // 縮小率
            if (canvas.height < canvas.width) {
                board.tgtPixelRate = canvas.height / img.height;
            } else {
                board.tgtPixelRate = canvas.width / img.width;
            }
            // ボードのX座標
            board.originX = canvas.width / 2 - img.width * board.tgtPixelRate / 2;
            // ボードのY座標
            board.originY = canvas.height / 2 - img.height * board.tgtPixelRate / 2;
            // console.log(`drawPieces pieceWidth=${board.pieceWidth}`);
            // console.log(`drawPieces pieceHeight=${board.pieceHeight}`);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // console.log(`drawPieces board.pieces.length=${board.pieces.length}`);
            for (let idx = 0; idx < board.pieces.length; idx++) {
                if (board.numGrabbed === idx) {
                    // 掴んでいる画像はスキップする
                    continue;
                }
                // 画像番地 idx に表示するピースの番号
                let n = board.pieces[idx];
                let x = this.getBoardClm(n);
                let y = this.getBoardRow(n);
                //console.log(`drawPieces (x,y)=(${x},${y})`);
                // console.log(`drawPieces getDisplayX(${n})=${self.getDisplayX(n)}`);
                // console.log(`drawPieces getDisplayY(${n})=${self.getDisplayY(n)}`);
                ctx.drawImage(img,
                    x * board.pieceWidth,
                    y * board.pieceHeight,
                    board.pieceWidth,
                    board.pieceHeight,
                    this.getDisplayX(idx),
                    this.getDisplayY(idx),
                    board.pieceWidth * board.tgtPixelRate,
                    board.pieceHeight * board.tgtPixelRate
                    );
            }
            // 画像を掴んでいる時の処理
            if (board.numGrabbed >= 0) {
                // 画像番地 board.numGrabbed に存在するピースの番号
                let n = board.pieces[board.numGrabbed];
                let x = this.getBoardClm(n);
                let y = this.getBoardRow(n);

                // 画像の描画位置
                let picX = board.beforeX - board.grabbedX;
                let picY = board.beforeY - board.grabbedY;

                ctx.drawImage(img,
                    x * board.pieceWidth,
                    y * board.pieceHeight,
                    board.pieceWidth,
                    board.pieceHeight,
                    picX,
                    picY,
                    board.pieceWidth * board.tgtPixelRate,
                    board.pieceHeight * board.tgtPixelRate
                    );
            }
        },
        // 時間(ミリ秒) を表現する文字列 "hh:mm:ss" を返す
        getTimeStr(time) {
            let hour = Math.floor(time / HOUR_MILLISECOND);
            let minute = Math.floor(time % HOUR_MILLISECOND / MINUTE_MILLISECOND);
            let second = Math.floor(time % MINUTE_MILLISECOND / SECOND_MILLISECOND);
            let format = (v) => {
                if (v < 10) {
                    return '0' + v;
                } else {
                    return '' + v;
                }
            };
            return `${format(hour)}:${format(minute)}:${format(second)}`;
        },
        // ゲームクリアのメッセージを表示する
        showGameClearMessage(time, isNewRecord) {
            // 画像の表示
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            let self = this;
            let img = new Image();
            let imgScale = 0.9;
            img.onload = function() {
                ctx.drawImage(img,
                    0,
                    0,
                    img.width,
                    img.height,
                    canvas.width / 2 - img.width * imgScale / 2,
                    canvas.height / 2 - img.height * imgScale / 2,
                    img.width * imgScale,
                    img.height * imgScale
                    );
                // メッセージの表示
                let txts = [
                    'ゲームクリア',
                    `${(isNewRecord ? '新記録' : 'タイム')}:${self.getTimeStr(time)}`
                ];

                for (let idx = 0; idx < txts.length; idx ++) {
                    let txt = txts[idx];
                    ctx.font = 'xx-large serif';
                    ctx.fillStyle = 'rgb(255,255,255)';
                    let measure = ctx.measureText(txt);
                    ctx.fillText(txt,
                        canvas.width / 2 - measure.width / 2,
                        canvas.height / 2 + canvas.height * 0.1 * idx);
                }

            };
            img.src = 'img/rainbow.png';
            // メッセージの表示
        },
        // ゲーム開始時のアニメーション
        startAnimation: async function (shuffled) {
            console.log(`startAnimation`);

            this.initCanvas();
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            //let self = this;
            let board = this.board;
            let img = this.img;
            let divide = Math.floor(Math.sqrt(board.numOfPiece));
            // 1ピースあたりのサイズ(幅、高さ)
            board.pieceWidth = img.width / divide;
            board.pieceHeight = img.height / divide;
            // 縮小率
            board.tgtPixelRate = canvas.width / img.width;

            // アニメーション時間
            let meantime = 1000.0;

            // 開始時刻
            let startAt = new Date().getTime();

            // 描画処理を同期するためのPromise
            let p = await new Promise((resolve, reject) => {

                // 1フレームの描画処理
                let drawFrame = () => {
                    // 現在時刻
                    let current = new Date().getTime();
                    // let current = startAt + meantime / 2 ;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    for (let idx = 0; idx < board.pieces.length; idx++) {

                        // 各ピースについて
                        // 現在位置 と 目的位置 の 差分ベクトルを取得する
                        let currentPosNo = board.pieces[idx];
                        let targetPosNo = shuffled.indexOf(currentPosNo);

                        if (targetPosNo < 0) {
                            // 念のための値チェック
                            continue;
                        }

                        let currX = this.getDisplayX(currentPosNo);
                        let currY = this.getDisplayY(currentPosNo);

                        let targetX = this.getDisplayX(targetPosNo);
                        let targetY = this.getDisplayY(targetPosNo);
                        // console.log(`startAnimation: (currX,currY)=(${currX},${currY}) (targetX,targetY)=(${targetX},${targetY})`);

                        let vecX = targetX - currX;
                        let vecY = targetY - currY;
                        // console.log(`startAnimation: (vecX,vecY)=(${vecX},${vecY})`);

                        // 処理進捗率 = 経過時間 / アニメーション時間
                        let parcentage = Math.min(1.0, (current - startAt) / meantime)

                        // 移動量 = 差分ベクトル * 処理進捗率
                        let drawX = currX + vecX * parcentage;
                        let drawY = currY + vecY * parcentage;

                        // ピースを描画
                        // console.log(`startAnimation: currentPosNo ${currentPosNo} (drawX,drawY)=(${drawX},${drawY})`);

                        // 画像番地 idx に表示するピースの番号
                        let x = this.getBoardClm(currentPosNo);
                        let y = this.getBoardRow(currentPosNo);
                        ctx.drawImage(img,
                            x * board.pieceWidth,
                            y * board.pieceHeight,
                            board.pieceWidth,
                            board.pieceHeight,
                            drawX,
                            drawY,
                            board.pieceWidth * board.tgtPixelRate,
                            board.pieceHeight * board.tgtPixelRate
                            );
                    }

                    // console.log(`startAnimation: current ${current} startAt ${startAt}`);
                    if (current < startAt + meantime) {
                        // 自身を呼び出す
                        window.requestAnimationFrame(drawFrame);
                    } else {
                        // アニメーション終了
                        console.log(`startAnimation: finish 1`);
                        resolve();
                    }
                };

                // 描画を行う
                // https://developer.mozilla.org/ja/docs/Web/Guide/HTML/Canvas_tutorial/Basic_animations
                window.requestAnimationFrame(drawFrame);
            });
            console.log(`startAnimation: finish 2`);
        },
        // ゲーム画面を消去する
        clearCanvas() {
            console.log(`startAnimation`);
            this.initCanvas();
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        // ゲーム画面の処理
        game(event) {
            console.log(`game event`);
            console.log(`${event}`);
            console.log(`${event.type}`);

            // タッチした座標
            let x = -1;
            let y = -1;
            if (event.touches.length >= 1) {
                x = event.touches[0].pageX;
                y = event.touches[0].pageY;
            }
            console.log(`game (x,y) = (${x},${y})`);

            switch (this.board.state) {
                case GAME_STATE_START:
                    console.log(`game GAME_STATE_START`);
                    let shuffled = this.getShuffledPieces();
                    // TODO アニメーション化する
                    this.startAnimation(shuffled);
                    this.board.pieces = shuffled;
                    this.board.state = GAME_STATE_ON_GAME;
                    this.drawPieces();
                    break;
                case GAME_STATE_IN_ANIMATION:
                    console.log(`game GAME_STATE_IN_ANIMATION`);
                    break;
                case GAME_STATE_ON_GAME:
                    // console.log(`game GAME_STATE_ON_GAME`);
                    switch(event.type) {
                        case 'touchstart':
                            // 分割されたピース画像をつかむ
                            this.board.numGrabbed = this.getDisplayN(x, y);
                            this.board.beforeX = x;
                            this.board.beforeY = y;
                            console.log(`game GAME_STATE_ON_GAME touchstart ${this.board.numGrabbed}`);
                            if (this.board.numGrabbed >= 0) {
                                this.board.grabbedX = x - this.getDisplayX(this.board.numGrabbed);
                                this.board.grabbedY = y - this.getDisplayY(this.board.numGrabbed);
                            }
                            break;
                        case 'touchmove':
                            // つかんだ画像の移動
                            console.log(`game GAME_STATE_ON_GAME touchmove`);
                            this.board.beforeX = x;
                            this.board.beforeY = y;
                            if (this.board.numGrabbed >= 0) {
                                // ピースの再描画
                                this.drawPieces();
                            }
                            break;
                        case 'touchend':
                            // 分割されたピース画像をはなす

                            let numSwitched = this.getDisplayN(this.board.beforeX, this.board.beforeY);
                            this.board.beforeX = -1;
                            this.board.beforeY = -1;

                            if (numSwitched >= 0 && this.board.numGrabbed >= 0) {
                                // ピースの位置を入れ替えする
                                console.log(`game GAME_STATE_ON_GAME touchend switch ${numSwitched} and ${this.board.numGrabbed}`);
                                let vGrabbed = this.board.pieces[this.board.numGrabbed];
                                let vSwitched = this.board.pieces[numSwitched];
                                this.board.pieces[this.board.numGrabbed] = vSwitched;
                                this.board.pieces[numSwitched] = vGrabbed;
                                this.board.numGrabbed = -1;
                                // ピースの再描画
                                this.drawPieces();

                                if (this.isAllPiecesOnProperPlaces()) {
                                    // ゲームクリアの処理へ
                                    // ステータスはゲームクリアにする
                                    this.board.state = GAME_STATE_GAME_CLEAR;

                                    this.board.clearGameAt = new Date().getTime();
                                    let time = this.board.clearGameAt - this.board.startGameAt;
                                    this.showGameClearMessage(time, time < this.board.bestTime);
                                    if (time < this.board.bestTime) {
                                        // ベストタイム更新
                                        this.updateBestTime(this.board.levelId, this.board.divide, time);
                                    }
                                    // ファンファーレを鳴らす
                                    let audio = new Audio('snd/fanfare.wav');
                                    audio.play();
                                }

                            } else {
                                this.board.numGrabbed = -1;
                                // ピースの再描画
                                this.drawPieces();
                            }

                            break;
                        default:
                            break;
                    }

                    break;
                case GAME_STATE_GAME_CLEAR:
                    console.log(`game GAME_STATE_GAME_CLEAR`);
                    this.movePage2();
                    this.clearCanvas();
                    break;
                default:
                    console.log(`game default`);
            }
        },
        // ボード上のピースを初期化する
        initPieces() {
            let board = this.board;
            console.log(`initPieces numOfPiece ${board.numOfPiece}`);
            board.pieces = [];
            for (let n = 0; n < board.numOfPiece;n++) {
                board.pieces.push(n);
            }
            console.log(`initPieces pieces ${JSON.stringify(board.pieces)}`);
        },
        // ピースが正しい位置にセットされたか?
        isAllPiecesOnProperPlaces() {
            return this.board.pieces.filter(
                (piece, index) => {
                    return piece === index
                }
            ).length === this.board.pieces.length;
        },
        // シャッフルしたピースの配列を返す
        getShuffledPieces() {
            let shuffled = this.board.pieces.slice();
            for (let idx1 = shuffled.length - 1; idx1 >= 0; idx1 = idx1 - 1) {
                let idx2 = Math.floor(Math.random() * (idx1 + 1));
                let value1 = shuffled[idx1];
                let value2 = shuffled[idx2];
                shuffled[idx1] = value2;
                shuffled[idx2] = value1;
            }

            return shuffled;
        },
        // ボード上の列番号を返す
        getBoardClm(n) {
            return n % Math.floor(Math.sqrt(this.board.numOfPiece));
        },
        // ボード上の行番号を返す
        getBoardRow(n) {
            return Math.floor(n / Math.floor(Math.sqrt(this.board.numOfPiece)));
        },
        // 縮小・拡大されたビットマップ上のX座標を返す
        getOrigBitmapX(n) {
            return this.getBoardClm(n) * this.board.pieceWidth;
        },
        // 縮小・拡大されたビットマップ上のX座標を返す
        getOrigBitmapY(n) {
            return this.getBoardRow(n) * this.board.pieceHeight
        },
        // ディスプレイ上のX座標を返す
        getDisplayX(n) {
            let board = this.board;
            return board.originX +
                this.getBoardClm(n) * board.pieceWidth * board.tgtPixelRate +
                board.marginPiece * (this.getBoardClm(n) - 1);
        },
        // ディスプレイ上のY座標を返す
        getDisplayY(n) {
            let board = this.board;
            return board.originY +
                this.getBoardRow(n) * board.pieceHeight * board.tgtPixelRate +
                board.marginPiece * (this.getBoardRow(n) - 1);
        },
        // ディスプレイ上の ボートの ピース番号を返す
        getDisplayN(x, y) {
            let board = this.board;
            let ret = -1;
            for (let n = 0; n < board.numOfPiece; n++) {
                let dx = this.getDisplayX(n);
                let dy = this.getDisplayY(n);
                if (x >= dx && x < dx + board.pieceWidth * board.tgtPixelRate
                    && y >= dy && y < dy + board.pieceHeight * board.tgtPixelRate) {
                    ret = n;
                    break;
                }
            }
            return ret;
        }
    }
}

Vue.createApp(Main).mount('#main')
