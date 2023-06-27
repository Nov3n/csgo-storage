const { app, BrowserWindow, ipcMain } = require('electron');
const SteamUser = require("steam-user");
const SteamCommunity = require('steamcommunity');
const fs = require("fs");
const log4js = require("log4js");
const GlobalOffensive = require("globaloffensive");
const { OriginItemUtil, CasketHelper, CsgoItem } = require('./src/js/util/item_util');
const { PreAutoMovein } = require('./src/js/csgo_storage')
let logConf = JSON.parse(fs.readFileSync("./conf/log_config.json", 'utf8'));
// let logConf = JSON.parse(fs.readFileSync(process.cwd() + "./conf/log_config.json", 'utf8'));
log4js.configure(logConf);
const logger = log4js.getLogger("default");


let steamClient = null;
let community = new SteamCommunity();
let csgoClient = null;
let csgoCasketHelper = null;
let indexWin;  // 初始窗口
let statusWin; // 登录后窗口


let indexWindowConfig = {
    width: 320,
    height: 256,
    webPreferences: {
        contextIsolation: false,
        nodeIntegration: true, // 设置开启nodejs环境
        enableRemoteModule: true // enableRemoteModule保证renderer.js可以可以正常require('electron').remote，此选项默认关闭且网上很多资料没有提到
    },
    resizable: false
};
let statusWindowConfig = {
    width: 800,
    height: 900,
    webPreferences: {
        contextIsolation: false,
        nodeIntegration: true, // 设置开启nodejs环境
        enableRemoteModule: true // enableRemoteModule保证renderer.js可以可以正常require('electron').remote，此选项默认关闭且网上很多资料没有提到
    },
    resizable: false
};
let autoMoveinCondMap = null;
let rmbPasswd = false;
let autoRelogin = false;
let steamAccount = null;


function isAutoMovein(item) {
    let res = false;
    if (PreAutoMovein(item)) {
        res = true;
    }
    if (autoMoveinCondMap != null && autoMoveinCondMap.size != 0) {
        for (var key of autoMoveinCondMap.keys()) {
            if (res) {
                break;
            }
            let cond = autoMoveinCondMap.get(key);
            console.log("cond.defIndex: " + cond.defIndex + "; cond.tradable: " + cond.tradable);
            if (cond.defIndex == item.def_index && CasketHelper.checkTradable(item, cond.tradable)) {
                res = true;
            }
        }
    }
    return res;
}


// 创建初始窗口
function createIndexWindow() {
    if (indexWin == null) {
        indexWin = new BrowserWindow(indexWindowConfig);
        indexWin.loadURL(`file://${__dirname}/src/html/index.html`);

        // indexWin.webContents.openDevTools(); // 创建开发者控制台, 后续要关闭

        indexWin.on('close', () => {
            //回收BrowserWindow对象
            indexWin = null;
        });
    }
}

function createStatusWindow() {
    if (statusWin == null) {
        statusWin = new BrowserWindow(statusWindowConfig);
        statusWin.loadURL(`file://${__dirname}/src/html/status.html`);

        // statusWin.webContents.openDevTools(); // 创建开发者控制台, 后续要关闭
        statusWin.on('close', () => {
            //回收BrowserWindow对象
            statusWin = null;
        });
    }
}

function closeStatusWindow() {
    if (statusWin != null) {
        statusWin.close();
        statusWin = null;
    }
}

function closeIndexWindow() {
    if (indexWin != null) {
        indexWin.close();
        indexWin = null;
    }
}

// 创建steam客户端
function createSteamClient() {
    steamClient = new SteamUser();
    // 设置steam登录成功回调
    steamClient.on('loggedOn', async (details) => {
        logger.info("Steam LoggedOn, SteamID: " + steamClient.steamID.getSteamID64());
        steamClient.setPersona(SteamUser.EPersonaState.Invisible);
        steamClient.gamesPlayed([730], true);
        if (rmbPasswd) {
            fs.writeFile('account.json', JSON.stringify(steamAccount), (err) => {
                if (err) {
                    console.log("Remember Passwd Failed");
                }
            });
        }
        else {
            fs.writeFile('account.json', JSON.stringify(steamAccount), (err) => { });
        }
    });
}

function createCsgoClient() {
    csgoClient = new GlobalOffensive(steamClient);


    // let csgoConf = JSON.parse(fs.readFileSync(process.cwd() + "./conf/csgo_conf.json", 'utf8'));
    // casketHelperLoopInterval = csgoConf["loopInterval"];
    // casketHelperExecInterval = csgoConf["execInterval"];
    // flushOutterItem = csgoConf["flushOutterItem"];
    // flushOutterItemDelay = csgoConf["flushOutterItemDelay"];
    // flushOutterItemInterval = csgoConf["flushOutterItemInterval"];
    casketHelperLoopInterval = 2000;
    casketHelperExecInterval = 100;
    csgoClientMaxListeners = 200;
    flushOutterItemInterval = 3000;
    flushOutterItemDelay = 5000;
    flushOutterItem = true;

    csgoCasketHelper = new CasketHelper(csgoClient, casketHelperLoopInterval, casketHelperExecInterval, logger);
    csgoClient.setMaxListeners(csgoClientMaxListeners);

    // 设置csgo登陆成功回调
    csgoClient.on('connectedToGC', function (details) {
        // 发送游戏登陆成功信号
        ipcMain.emit('connectedToGC');
        csgoCasketHelper.startFlushOutterItem(isAutoMovein, flushOutterItemInterval, flushOutterItemDelay);
        logger.info("Connected to csgo...");
        csgoClient.inventory.forEach(function (item) {
            if (OriginItemUtil.isCasket(item)) {
                logger.info("Casket Found, Name: " + item.custom_name + ", id: " + item.id + ", ContainedSize: " + item.casket_contained_item_count);
                csgoCasketHelper.emit('casketFound', item.id, item.casket_contained_item_count);
            } else {
                csgoCasketHelper.emit('itemFound', CsgoItem.fromOriginItem(item));
            }
        });
    });
    // csgo新物品获取回调
    csgoClient.on('itemAcquired', (item) => {
        if (!OriginItemUtil.isInCasket(item)) {
            logger.info("ItemAcquired, DefIndex= " + item.def_index + ", Tradable= " + OriginItemUtil.isTradable(item) + ", AutoMovein= " + isAutoMovein(item));
            console.log("Itemid:" + item.def_index)
        }
        csgoCasketHelper.emit('itemAcquired', CsgoItem.fromOriginItem(item));
    });
    // csgo新物品删除回调
    csgoClient.on('itemRemoved', (item) => {
        csgoCasketHelper.emit("itemRemoved", item);
    });
    csgoClient.on('disconnectedFromGC', () => {
        ipcMain.emit('disconnectedFromGC')
    });
}

// 按下登录按钮, steam登录, steam登录成功后关闭主界面开启库存状态界面
ipcMain.on('steamLogin', async (event, account, passwd, twoFactorCode, rememberPasswd_ = false, autoRelogin_ = false) => {
    createSteamClient();
    createCsgoClient();
    rmbPasswd = rememberPasswd_;
    autoRelogin = autoRelogin_;
    steamAccount = { account: account, passwd: passwd, remember: rememberPasswd_ };

    // 登陆steam
    steamClient.logOn({
        accountName: account,
        password: passwd,
        twoFactorCode: twoFactorCode,
    });
});

// 渲染进程发送的移出任务
ipcMain.on('moveoutTask', async (event, defIndex, tradable, moveNum) => {
    logger.info("Recveive MoveoutTask, DefIndex=" + defIndex + ", Tradable=" + tradable + ", MoveNum=" + moveNum);
    if (csgoCasketHelper != null) {
        csgoCasketHelper.emit("moveoutTask", defIndex, tradable, moveNum);
    }
});

// 渲染进程发送的移入任务
ipcMain.on('moveinTask', async (event, defIndex, tradable, moveNum) => {
    logger.info("Recveive MoveinTask, DefIndex=" + defIndex + ", Tradable=" + tradable + ", MoveNum=" + moveNum);
    if (csgoCasketHelper != null) {
        csgoCasketHelper.emit("moveinTask", defIndex, tradable, moveNum);
    }
})

// 返回的自动移入组件条件
ipcMain.on('autoMoveinCond', async (event, mp) => {
    autoMoveinCondMap = mp;
});

// 库存页面返回的物品数量保持条件
ipcMain.on('numKeepCond', async (event, mp) => {
    if (csgoCasketHelper) {
        csgoCasketHelper.setNumKeepCond(mp);
    }
});

ipcMain.on('exitCsgo', async (event) => {
    ipcMain.emit('disconnectedFromGC');
    autoRelogin = false;
});

ipcMain.on('refreshStatus', async (event) => {
    csgoClient.inventory.forEach(function (item) {
        if (OriginItemUtil.isCasket(item)) {
            csgoCasketHelper.emit('casketFound', item.id, item.casket_contained_item_count);
        } else {
            csgoCasketHelper.emit('itemFound', CsgoItem.fromOriginItem(item));
        }
    });
});

// 游戏登陆成功时关闭登录界面, 打开库存界面
ipcMain.on('connectedToGC', async (details) => {
    closeIndexWindow();
    createStatusWindow();
});

// 游戏登录失败时, 关闭库存界面, 重新打开登录界面
ipcMain.on('disconnectedFromGC', () => {
    closeStatusWindow();
    createIndexWindow();
    if (autoRelogin && steamClient) {
        steamClient.gamesPlayed([730], true);
    }
});

app.on('ready', createIndexWindow);
app.on('window-all-closed', () => {
    app.quit();
});



// ----------测试----------
// setTimeout(() => {
//     ipcMain.emit('connectedToGC');
// }, 2000)

// let timeCount = 0;
// setInterval(() => {
//     if (statusWin != null) {
//         timeCount++;
//         let mp = new Map();

//         let innerMp = new Map();
//         innerMp.set(4472, new Map());
//         innerMp.get(4472).set(true, 10);
//         innerMp.get(4472).set(false, 20);
//         innerMp.get(4472).set("name", "命悬二线");

//         let outterMp = new Map();
//         outterMp.set(4471, new Map());
//         outterMp.get(4471).set(true, 10);
//         // outterMp.get(4471).set(false, 20);
//         outterMp.get(4471).set("name", "命悬一线");

//         mp.set("outter", outterMp);
//         mp.set("inner", innerMp);
//         statusWin.webContents.send('statusOnTimer', mp);
//         statusWin.webContents.send('moveTaskOnTimer', 200, 500);
//     }
// }, 500)

// setInterval(() => {
//     if (statusWin != null) {
//         statusWin.webContents.send('avatarUrl', "http://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/bc/bc31f8bc25b4768aa1e5283e3ae4b1ba425d72a5_full.jpg");
//      }
// }, 2000)

// ----------返回库存内容----------
setInterval(() => {
    if (statusWin != null) {
        statusWin.webContents.send('moveTaskOnTimer', csgoCasketHelper.moveinTaskSize(), csgoCasketHelper.moveoutTaskSize(), csgoCasketHelper.executingTaskSize());
    }
}, 500)

setInterval(() => {
    if (statusWin != null) {
        statusWin.webContents.send('statusOnTimer', csgoCasketHelper.statusCB());
        if (steamClient) {
            community.getSteamUser(steamClient.steamID, (err, user) => {
                if (err) {
                    console.log("getSteamUser Avatar ERROR");
                }
                else {
                    statusWin.webContents.send('avatarUrl', user.getAvatarURL());
                }
            });
        }
        statusWin.webContents.send('accountInfoOnTimer', steamAccount);
    }
}, 2000)