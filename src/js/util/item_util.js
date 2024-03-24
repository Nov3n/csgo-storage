const { EventEmitter } = require("events").EventEmitter;
const { fs } = require("fs");

class OriginItemUtil {
    /**
     * 命悬一线武器箱
     */
    static isClutchCase(item) {
        return item.def_index != null && item.def_index == 4471;
    }

    /**
     * 地平线武器箱
     */
    static isHorizonCase(item) {
        return item.def_index != null && item.def_index == 4482;
    }

    /**
     * 头号特训武器箱
     */
    static isDangerZoneCase(item) {
        return item.def_index != null && item.def_index == 4548;
    }

    /**
     * 棱菜武器箱
     */
    static isPrismaCase(item) {
        return item.def_index != null && item.def_index == 4598;
    }

    /**
     * csgo20周年武器箱
     */
    static isCSGO20Case(item) {
        return item.def_index != null && item.def_index == 4669;
    }

    /**
     * 棱彩2号武器箱
     */
    static isPrisma2Case(item) {
        return item.def_index != null && item.def_index == 4695;
    }

    /**
     * 裂空武器箱
     */
    static isFractureCase(item) {
        return item.def_index != null && item.def_index == 4698;
    }

    /**
     * 是否是蛇噬武器箱
     */
    static isSnakeBiteCase(item) {
        return item.def_index != null && item.def_index == 4747;
    }

    /**
     * 斯德哥尔摩2022major签名胶囊
     * 4803: 传奇组队标胶囊
     * 4804: 挑战组队标胶囊
     * 4805: 竞争组队标胶囊
     */
    static isStockH2022TeamCapsules(item) {
        return item.def_index != null && item.def_index >= 4803 && item.def_index <= 4805;
    }

    /**
     * 里约2022major签名胶囊
     * 4857: 传奇组队标胶囊
     * 4858: 挑战组队标胶囊
     * 4859: 竞争组队标胶囊
     */
    static isRio2022TeamCapsules(item) {
        return item.def_index != null && item.def_index >= 4857 && item.def_index <= 4859;
    }

    /**
     * 是否是inferno纪念包
     */
    static isRIoInfernoSouvenirPackage(item) {
        return item.def_index != null && item.def_index == 4860;
    }

    /**
     * 是否是mirage纪念包
     */
    static isRIoMirageSouvenirPackage(item) {
        return item.def_index != null && item.def_index == 4861;
    }

    /**
     * 是否是dust2纪念包
     */
    static isRioDust2SouvenirPackage(item) {
        return item.def_index != null && item.def_index == 4862;
    }

    /**
     * 里约2022major签名胶囊
     * 4867: 传奇组签名胶囊
     * 4868: 挑战组签名胶囊
     * 4869: 竞争组签名胶囊
     * 4870: 冠军组签名胶囊
     */
    static isRio2022SignatureCapsules(item) {
        return item.def_index != null && item.def_index >= 4867 && item.def_index <= 4870;
    }

    /**
     * 是否是2023.2 间谍印花胶囊
     */
    static isEspionageStickerCapsule(item) {
        return item.def_index != null && item.def_index == 4879;
    }

    /**
     * 是否是2023.2 变革武器箱
     */
    static isRevolutionCase(item) {
        return item.def_index != null && item.def_index == 4880;
    }

    /**
     * 是否是2023.2 音乐盒
     */
    static isUltimateMusicKit(item) {
        return item.def_index != null && item.def_index == 1314;
    }

    /**
     * 是否在组件内
     */
    static isInCasket(item) {
        return item.casket_id != null;
    }

    /**
     * 是否可交易
     */
    static isTradable(item) {
        if (item.tradable_after != null && item.tradable_after < new Date()) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 是否是组件
     */
    static isCasket(item) {
        return item.casket_contained_item_count != null;
    }
}

// Date 2023.1.15
const CsgoCasketMaxSize = 1000;

class CsgoCasket {
    #items;
    #id;
    #origin_size;

    constructor(id, size = -1) {
        this.#items = new Map();
        this.#id = id;
        this.#origin_size = size;
    }

    size() {
        if (this.#origin_size != -1) {
            return this.#origin_size;
        }
        else {
            return this.#items.size;
        }
    }

    clear_origin_size() {
        this.#origin_size = -1;
    }

    id() {
        return this.#id;
    }

    addable() {
        return this.size() < CsgoCasketMaxSize;
    }

    addItem(my_item) {
        if (this.addable() && !this.hasItem(my_item)) {
            my_item.casket_id = this.#id;
            this.#items.set(my_item.id, my_item);
            if (this.#origin_size != -1) {
                this.#origin_size++;
            }
        }
    }

    addOriginItem(my_item) {
        this.#items.set(my_item.id, my_item);
    }

    removeItem(my_item) {
        if (this.hasItem(my_item.id)) {
            this.#items.delete(my_item.id);
            my_item.casket_id = null;
            if (this.#origin_size != -1) {
                this.#origin_size--;
            }
        }
    }

    hasItem(my_item) {
        return this.#items.has(my_item.id);
    }
}

class CsgoItem {
    id; // 物品id
    def_index; // 类型索引
    casket_id; // 所属的库存组件id
    tradable_after; // 交易时间
    constructor(id, def_index, casket_id = null, tradable_after = null) {
        this.id = id;
        this.def_index = def_index;
        this.casket_id = casket_id;
        this.tradable_after = tradable_after;
    }

    tradable() {
        return this.tradable_after != null && this.tradable_after < new Date();
    }

    static fromOriginItem(item) {
        let my_item = new CsgoItem(item.id, item.def_index, item.casket_id, item.tradable_after);
        return my_item;
    }
}

class CasketHelper extends EventEmitter {
    #caskets; // 库存组件表
    #outter_items; // 库存组件外物品表
    #inner_items; // 库存组件内物品表
    #moveinTasks; // 移入库存任务表
    #moveoutTasks; // 移出库存任务表
    #executingTasks; // 执行任务列表, 统一执行移入和移出任务
    #numKeepCondMap; // 数量保持条件
    #extraItemInfo
    // #executingTasksSizeLimit // 执行中的任务个数最大限制
    #csgo; // 获取库存内物品时需要csgo接口
    #loopInterval;
    #taskExecInterval;
    #logger;
    constructor(csgo, loopInterval, taskExecInterval, logger) {
        super();
        this.#caskets = new Map();
        this.#outter_items = new Map();
        this.#inner_items = new Map();
        this.#moveinTasks = new Map();
        this.#moveoutTasks = new Map();
        this.#executingTasks = new Map();
        this.#numKeepCondMap = new Map();
        this.#extraItemInfo = new Map();
        // this.#executingTasksSize = 0;
        // this.#executingTasksSizeLimit = 15;
        this.#csgo = csgo;
        this.#loopInterval = loopInterval;
        this.#taskExecInterval = taskExecInterval;
        this.#logger = logger;

        this.on("itemRemoved", this.itemRemovedCB);
        this.on("itemAcquired", this.itemAcquiredCB);
        this.on("itemFound", this.itemFoundCB);
        this.on("casketFound", this.casketFoundCB);

        this.on("listInnerItem", this.listInnerItemCB);
        this.on("listOutterItem", this.listOutterItemCB);
        this.on("moveinTask", this.moveinTaskCB);
        this.on("moveoutTask", this.moveoutTaskCB);

        setInterval(() => {
            this.executeTasks();
        }, this.#loopInterval);

        this.on("printTest", this.printTestCB);
    }
    printTestCB() {
        console.log("外物品个数", this.#outter_items.size);
        console.log("内物品个数", this.#inner_items.size);
        console.log("moveinTasks.size= ", this.#moveinTasks.size);
        console.log("moveoutTasks.size= ", this.#moveoutTasks.size);
    }
    
    setExtraItemInfo(itemInfo) {
        this.#extraItemInfo = itemInfo;
    }

    clear() {
        this.#moveinTasks.clear();
        this.#moveoutTasks.clear();
        this.#executingTasks.clear();
        this.#caskets.clear();
        this.#outter_items.clear();
        this.#inner_items.clear();
    }

    executeTasks() {
        // 修改后的架构
        if (this.#executingTasks.size < 20) {
            // 原则上来说先执行移入操作，后执行移出操作，因为外界库存空间一般来说较小
            for (var key of this.#moveinTasks.keys()) {
                if (this.#executingTasks.size >= 20) {
                    break;
                }
                let task = this.#moveinTasks.get(key);
                this.#executingTasks.set(task.item_id, task);
                this.#moveinTasks.delete(key);
            }
            for (var key of this.#moveoutTasks.keys()) {
                if (this.#executingTasks.size >= 20) {
                    break;
                }
                let task = this.#moveoutTasks.get(key);
                this.#executingTasks.set(task.item_id, task);
                this.#moveoutTasks.delete(key);
            }
        }
        let i = 1;
        for (var key of this.#executingTasks.keys()) {
            let task = this.#executingTasks.get(key);
            // 三次执行失败直接取消该任务
            if (task.exec_times >= 3) {
                this.#executingTasks.delete(key);
                if (task.move_type == 0) {  // 
                    this.#outter_items.set(task.item_id, this.#inner_items.get(task.item_id));
                    this.#inner_items.delete(task.item_id);
                } else if (task.move_type == 1) {
                    this.#inner_items.set(task.item_id, this.#outter_items.get(task.item_id));
                    this.#outter_items.delete(task.item_id);
                }
                continue;
            }
            task.exec_times++;
            // 移入任务
            if (task.move_type == 0) {
                setTimeout(function (obj) {
                    obj.addToCasket(task.casket_id, task.item_id)
                }, this.#taskExecInterval * i, this);
            } else if (task.move_type == 1) {
                setTimeout(function (obj) {
                    obj.removeFromCasket(task.casket_id, task.item_id)
                }, this.#taskExecInterval * i, this);
            }
            i++;
        }
    }

    removeFromCasket(casket_id, item_id) {
        this.#csgo.removeFromCasket(casket_id, item_id);
    }

    addToCasket(casket_id, item_id) {
        this.#csgo.addToCasket(casket_id, item_id);
    }

    // 物品移除
    // 1. 交易失去物品
    // 2. 物品被放入库存组件
    //    这里如果是放入库存组件的话, 放入步骤会操作inner_items
    // @param item csgo原始物品类型
    itemRemovedCB(item) {
        this.#outter_items.delete(item.id);

        if (this.#executingTasks.has(item.id)) {
            let task = this.#executingTasks.get(item.id);
            this.#executingTasks.delete(item.id);
            if (this.#logger) {
                this.#logger.info(
                    "Item Moved In, ItemId:" + task.item_id +
                    ", CasketId:" + task.casket_id +
                    ", Remain Movein Tasks:" + Number(this.#moveinTasks.size) +
                    ", Current Executing Tasks:" + Number(this.#executingTasks.size)
                );
            }
        }
    }

    // 物品获得
    // 1. 交易得到物品
    // 2. 物品从库存组件中移出
    // 3. 通过csgo接口获得库存组件内的物品
    //    这种情况不需要加入outter_items
    // @param item csgo原始物品类型
    itemAcquiredCB(my_item) {
        if (!CasketHelper.isInCasket(my_item)) {
            this.#outter_items.set(my_item.id, my_item);
        }

        if (this.#executingTasks.has(my_item.id)) {
            let task = this.#executingTasks.get(my_item.id);
            this.#executingTasks.delete(my_item.id);
            if (this.#logger) {
                this.#logger.info(
                    "Item Moved Out, ItemId:" + task.item_id +
                    ", CasketId:" + task.casket_id +
                    ", Remain Moveout Tasks:" + Number(this.#moveoutTasks.size) +
                    ", Current Executing Tasks:" + Number(this.#executingTasks.size)
                );
            }
        }
    }

    // 物品发现
    // 连接至csgo网络时遍历物品
    // @param item csgo原始物品类型
    // TODO(CCH) 从外面回调的时候就传入自己的Item/Casket类型
    itemFoundCB(my_item) {
        if (CasketHelper.isInCasket(my_item)) {
            this.addInnerItem(my_item);
            this.createCasket(my_item.casket_id);
            this.#caskets.get(my_item.casket_id).addOriginItem(my_item);
        } else {
            this.addOutterItem(my_item);
        }
    }

    casketFoundCB(casket_id, size = -1) {
        this.createCasket(casket_id, size);
        var casket = this.#caskets.get(casket_id);
        var inner_items = this.#inner_items;
        setTimeout(() => {
            this.#csgo.getCasketContents(casket_id, (err, items) => {
                if (err == null) {
                    items.forEach(function (item) {
                        var my_item = CsgoItem.fromOriginItem(item);
                        casket.addOriginItem(my_item);
                        if (!inner_items.has(my_item.id)) {
                            inner_items.set(my_item.id, my_item);
                        }
                    });
                    casket.clear_origin_size();
                }
            });
        }, Math.random() * 20000);
    }

    listInnerItemCB(def_index, tradable = 1, res = null) {
        let items_num = 0;
        for (let key of this.#inner_items.keys()) {
            if (
                CasketHelper.checkDefIndex(this.#inner_items.get(key), def_index)
                && CasketHelper.checkTradable(this.#inner_items.get(key), tradable)
            ) {
                items_num++;
            }
        }
        if (res) {
            res.end(items_num + "\n")
        }
        return items_num;
    }

    listOutterItemCB(def_index, tradable = 1, res = null) {
        let items_num = 0;
        for (let key of this.#outter_items.keys()) {
            if (
                CasketHelper.checkDefIndex(this.#outter_items.get(key), def_index)
                && CasketHelper.checkTradable(this.#outter_items.get(key), tradable)
            ) {
                items_num++;
            }
        }
        if (res) {
            res.end(items_num + "\n")
        }
        return items_num
    }

    moveinTaskCB(def_index, tradable = 1, move_num = 0) {
        console.log("Recveive MoveinTask, DefIndex= " + def_index + ", Tradable= " + tradable)
        for (let key of this.#outter_items.keys()) {
            if (move_num <= 0) {
                break;
            }
            var my_item = this.#outter_items.get(key);
            if (my_item.def_index == def_index
                && CasketHelper.checkTradable(my_item, tradable)) {
                move_num--;
                this.#inner_items.set(my_item.id, my_item);
                this.#outter_items.delete(my_item.id);
                console.log("Casket Size:" + this.#caskets.size)
                for (let casket_key of this.#caskets.keys()) {
                    var casket = this.#caskets.get(casket_key);
                    if (casket.addable()) {
                        casket.addItem(my_item);
                        this.addMoveinTask({
                            move_type: 0,
                            casket_id: casket_key,
                            item_id: my_item.id,
                            exec_times: 0
                        });
                        break;
                    }
                }
            }
        }
        console.log("Remain Unmoved Movein Task:", move_num);
    }

    moveoutTaskCB(def_index, tradable = 1, move_num = 0) {
        console.log("innerItems.size= ", this.#inner_items.size);
        for (let my_item_key of this.#inner_items.keys()) {
            if (move_num <= 0) {
                break;
            }
            var my_item = this.#inner_items.get(my_item_key);
            if (
                my_item.def_index == def_index
                && CasketHelper.checkTradable(my_item, tradable)
                && this.#outter_items.size + this.#caskets.size < CsgoCasketMaxSize
            ) {
                console.log("Add Moveout Task, DefIndex=", my_item.def_index);
                move_num--;
                this.#outter_items.set(my_item.id, my_item);
                this.#inner_items.delete(my_item.id);
                var casket_id = my_item.casket_id;
                this.addMoveoutTask({
                    move_type: 1,
                    casket_id: casket_id,
                    item_id: my_item.id,
                    exec_times: 0
                });
                my_item.casket_id = null;
            }
        }
        console.log("Remain Unmoved Moveout Task:", move_num);
    }

    getStatusMap(items) {
        let statusMap = new Map();
        for (let my_item_key of items.keys()) {
            let my_item = items.get(my_item_key);
            if (my_item.def_index <= 1000) {
                continue;
            }
            let tradable = OriginItemUtil.isTradable(my_item);
            if (statusMap.has(my_item.def_index)) {
                let tradableMap = statusMap.get(my_item.def_index);
                if (tradableMap.has(tradable)) {
                    tradableMap.set(tradable, tradableMap.get(tradable) + 1);
                } else {
                    tradableMap.set(tradable, 1);
                }
            } else {
                let tradableMap = new Map();
                tradableMap.set(tradable, 1);
                statusMap.set(my_item.def_index, tradableMap);
                if (this.#extraItemInfo[my_item.def_index]) {
                    tradableMap.set("name", this.#extraItemInfo[my_item.def_index]["name"]);
                }
            }
        }
        return statusMap;
    }

    statusCB() {
        let innerStatusMap = this.getStatusMap(this.#inner_items);
        let remainSizeMap = new Map();
        remainSizeMap.set(false, this.#caskets.size * 1000 - this.#inner_items.size);
        remainSizeMap.set("name", "剩余存入空间数");
        innerStatusMap.set(0, remainSizeMap);
        let outterStatusMap = this.getStatusMap(this.#outter_items);
        let statusMap = new Map();
        statusMap.set("inner", innerStatusMap);
        statusMap.set("outter", outterStatusMap);

        return statusMap;
    }

    flushOutterItem(func) {
        let outterStatusMap = this.getStatusMap(this.#outter_items);
        for (let key of this.#numKeepCondMap.keys()) {
            let cond = this.#numKeepCondMap.get(key);
            let tradableNum = 0;
            let untradableNum = 0;
            if (outterStatusMap.has(cond.defIndex)) {
                tradableNum = Number(outterStatusMap.get(cond.defIndex).get(true));
                untradableNum = Number(outterStatusMap.get(cond.defIndex).get(false));
            }
            let validNum = cond.tradable == 0 ? untradableNum : cond.tradable == 1 ? tradableNum : tradableNum + untradableNum;
            if (validNum > cond.keepNum) {
                this.moveinTaskCB(cond.defIndex, cond.tradable, validNum - cond.keepNum);
            }
            else if (validNum < cond.keepNum) {
                this.moveoutTaskCB(cond.defIndex, cond.tradable, cond.keepNum - validNum);
            }
        }
        for (let key of this.#outter_items.keys()) {
            let my_item = this.#outter_items.get(key);
            if (func(my_item)) {
                this.moveinTaskCB(my_item.def_index, OriginItemUtil.isTradable(my_item), 1);
            }
        }
    }

    flushInnerItem(func) {
        for (let key of this.#inner_items.key()) {
            let my_item = this.#inner_items.get(key);
            if (func(my_item)) {
                this.moveoutTaskCB(my_item.def_index, OriginItemUtil.isTradable(my_item), 1);
            }
        }
    }

    createCasket(casket_id, size) {
        if (!this.hasCasket(casket_id)) {
            var casket = new CsgoCasket(casket_id, size);
            this.#caskets.set(casket_id, casket);
        }
    }

    hasCasket(casket_id) {
        return this.#caskets.has(casket_id);
    }

    addOutterItem(my_item) {
        if (!this.hasOutterItem(my_item.id)) {
            this.#outter_items.set(my_item.id, my_item);
        }
    }

    hasOutterItem(my_item_id) {
        return this.#outter_items.has(my_item_id);
    }

    addInnerItem(my_item) {
        if (!this.hasInnerItem(my_item.id)) {
            this.#inner_items.set(my_item.id, my_item);
        }
    }

    hasInnerItem(my_item_id) {
        return this.#inner_items.has(my_item_id);
    }

    addMoveinTask(task) {
        this.#moveinTasks.set(task.item_id, task);
    }

    addMoveoutTask(task) {
        this.#moveoutTasks.set(task.item_id, task);
    }

    moveinTaskSize() {
        return Number(this.#moveinTasks.size);
    }

    moveoutTaskSize() {
        return Number(this.#moveoutTasks.size);
    }

    executingTaskSize() {
        return Number(this.#executingTasks.size);
    }

    startFlushOutterItem(func, interval = 3000, delay = 5000) {
        setTimeout(() => {
            setInterval(() => {
                this.flushOutterItem(func);
            }, interval)
        }, delay)
    }

    startFlushInnerItem(func, interval = 3000, delay = 5000) {
        setTimeout(() => {
            setInterval(() => {
                this.flushInnerItem(func);
            }, interval)
        }, delay)
    }

    setNumKeepCond(numKeepCondMap) {
        this.#numKeepCondMap = numKeepCondMap;
    }

    // @param item csgo原始物品类型
    static isInCasket(item) {
        return item.casket_id != null;
    }

    // @param item csgo原始物品类型
    static isCasket(item) {
        return item.casket_contained_item_count != null;
    }

    static checkTradable(item, need_tradable) {
        if (need_tradable == 2) {
            return true;
        }
        return item.tradable() == Boolean(need_tradable);
    }

    static checkDefIndex(item, def_index) {
        if (def_index == 0) {
            return true;
        }
        return item.def_index == def_index;
    }
}

module.exports = {
    OriginItemUtil,
    CsgoCasketMaxSize,
    CsgoCasket,
    CsgoItem,
    CasketHelper
};

