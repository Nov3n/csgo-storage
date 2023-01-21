// ##########################################辅助函数开始##########################################
// 是否自动移入组件
function isAutoMovein(item) {
    return (OriginItemUtil.isClutchCase(item)
        || OriginItemUtil.isFractureCase(item)
        || OriginItemUtil.isCSGO20Case(item)
        || OriginItemUtil.isPrisma2Case(item)
        || OriginItemUtil.isSnakeBiteCase(item)
        || OriginItemUtil.isRio2022SignatureCapsules(item)
        || OriginItemUtil.isDust2SouvenirPackage(item)
        || OriginItemUtil.isMirageSouvenirPackage(item))
        && OriginItemUtil.isInCasket(item) == false
        && OriginItemUtil.isTradable(item) == false
}

// ##########################################辅助函数结束##########################################

const SteamUser = require("steam-user");
const http = require("http");
const url = require("url")
const server = http.createServer();
const GlobalOffensive = require("globaloffensive");
const fs = require("fs");
const log4js = require("log4js");
const logCfg = require("./conf/log_config.json");
const { CsgoItem } = require("./util/item_util");
const CasketHelper = require("./util/item_util").CasketHelper;
const OriginItemUtil = require("./util/item_util").OriginItemUtil;

// 日志配置
console.log("logCfg:", logCfg);
log4js.configure(logCfg);
const logger = log4js.getLogger("default");

let client = new SteamUser();
let csgo = new GlobalOffensive(client);
csgo.setMaxListeners(30);
let casket_helper = new CasketHelper(csgo, 2000, 100, logger);


// 连接上csgo游戏中心的回调
// 将未冷却的命悬一线移动至库存组件
csgo.on("connectedToGC", function (details) {
    logger.info("连接csgo成功...");
    // 遍历库存数组找到空的组件
    movein_items = new Array();
    caskets = new Array();
    csgo.inventory.forEach(function (item) {
        // 找到所有库存组件, 并且将空组件存入
        if (OriginItemUtil.isCasket(item)) {
            logger.info("找到库存组件, 名称: " + item.custom_name + ", id: " + item.id + ", 已经使用空间: " + item.casket_contained_item_count);
            caskets.push(item);
            casket_helper.emit("casketFound", item.id);
        } else {
            casket_helper.emit("itemFound", CsgoItem.fromOriginItem(item));
        }
        // 找到符合自动移入库存条件的物品
        if (isAutoMovein(item)) {
            logger.info("找到自动移入物品, id: " + item.id + ", def_index: " + item.def_index);
            movein_items.push(item);
        }
    });
    logger.info("库存组件个数: " + caskets.length);
    logger.info("自动移入库存物品数: " + movein_items.length);
});

client.on("loggedOn", function (details) {
    logger.info("Steam 登陆成功, SteamID: " + client.steamID.getSteamID64());
    client.setPersona(SteamUser.EPersonaState.Invisible);
    client.gamesPlayed([730], true);
});

// 自动读取验证码登陆steam
client.logOn({
    accountName: "a2500664779",
    password: "Aa1bcptdtptp",
    twoFactorCode: fs.readFileSync("../csgo/product/code.txt").toString(),
});

// 获取了新的物品
csgo.on("itemAcquired", (item) => {
    if (isAutoMovein(item)) {
        var tradable = OriginItemUtil.isTradable(item);
        casket_helper.moveinTaskCB(item.def_index, tradable, 1);
    }
    if (!OriginItemUtil.isInCasket(item)) {
        logger.info("获取物品, 物品def_index= " + item.def_index + ", 物品可交易= " + OriginItemUtil.isTradable(item) + ", 是否自动移入组件= " + isAutoMovein(item));
    }
    casket_helper.emit("itemAcquired", CsgoItem.fromOriginItem(item));
});

csgo.on("itemRemoved", (item) => {
    casket_helper.emit("itemRemoved", item);
});

csgo.on("disconnectedFromGC", () => {
    logger.info("csgo断开连接, 程序退出")
    process.exit();
});

setInterval(function () {
    casket_helper.emit("printTest");
}, 20000)

setInterval(() => {
    casket_helper.flushOutterItem(isAutoMovein)
}, 30000);

server.on("request", (req, res) => {
    const { query, pathname } = url.parse(req.url, true)
    if (!query.def_index) {
        res.end("Parameter Error\n");
    } else {
        let def_index = parseInt(query.def_index);
        let tradable = true;
        if (query.tradable && query.tradable == "0") {
            tradable = false;
        }
        let move_num = 0;
        if (query.move_num) {
            move_num = parseInt(query.move_num)
        }

        // 请求事件回调
        if (pathname === "/moveinTask") {
            server.emit("moveinTask", def_index, tradable, move_num);
            res.end("succeed\n");
        }
        else if (pathname === "/moveoutTask") {
            server.emit("moveoutTask", def_index, tradable, move_num);
            res.end("succeed\n");
        }
        else if (pathname === "/listInnerItem") {
            server.emit("listInnerItem", def_index, tradable, res);
        }
        else if (pathname === "/listOutterItem") {
            server.emit("listOutterItem", def_index, tradable, res);
        }
    }
});

server.on("moveinTask", (def_index, tradable, move_num) => {
    logger.info("收到movein请求, def_index=", def_index, ", tradable=", tradable, ", move_num=", move_num);
    casket_helper.emit("moveinTask", def_index, tradable, move_num);
});

server.on("moveoutTask", (def_index, tradable, move_num) => {
    logger.info("收到moveout请求, def_index=", def_index, ", tradable=", tradable, ", move_num=", move_num);
    casket_helper.emit("moveoutTask", def_index, tradable, move_num);
});

server.on("listInnerItem", (def_index, tradable, res) => {
    logger.info("收到listInnerItem请求, def_index=", def_index, ", tradable=", tradable);
    casket_helper.emit("listInnerItem", def_index, tradable, res);
});

server.on("listOutterItem", (def_index, tradable, res) => {
    logger.info("收到listOutterItem请求, def_index=", def_index, ", tradable=", tradable);
    casket_helper.emit("listOutterItem", def_index, tradable, res);
});

server.listen(3000);

