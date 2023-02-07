const EventEmitter = require("events").EventEmitter;

class OriginItemUtil {
    /**
     * 命悬一线武器箱
     */
    static isClutchCase(item) {
        return item.def_index != null && item.def_index == 4471;
    }

    /**
     * 裂空武器箱
     */
    static isFractureCase(item) {
        return item.def_index != null && item.def_index == 4698;
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
     * 是否在组件内
     */
    static isInCasket(item) {
        return item.casket_id != null;
    }

    /**
     * 是否可交易
     */
    static isTradable(item) {
        return item.tradable_after != null && item.tradable_after < new Date();
    }

    /**
     * 是否是组件
     */
    static isCasket(item) {
        return item.casket_contained_item_count != null;
    }

    /**
     * 是否是dust2纪念包
     */
    static isDust2SouvenirPackage(item) {
        return item.def_index != null && item.def_index == 4862;
    }

    /**
     * 是否是mirage纪念包
     */
    static isMirageSouvenirPackage(item) {
        return item.def_index != null && item.def_index == 4861;
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
     * 是否是蛇噬武器箱
     */
    static isSnakeBiteCase(item) {
        return item.def_index != null && item.def_index == 4747;
    }
}

// Date 2023.1.15
const CsgoCasketMaxSize = 1000;

class CsgoCasket {
    #items;
    #id;

    constructor(id) {
        this.#items = new Map();
        this.#id = id;
    }

    size() {
        return this.#items.size;
    }

    id() {
        return this.#id;
    }

    addable() {
        return this.#items.size < CsgoCasketMaxSize;
    }

    addItem(my_item) {
        if (this.addable() && !this.hasItem(my_item)) {
            my_item.casket_id = this.#id;
            this.#items.set(my_item.id, my_item);
        }
    }

    removeItem(my_item) {
        if (this.hasItem(my_item.id)) {
            this.#items.delete(my_item.id);
            my_item.casket_id = null;
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
    executeTasks() {
        let i = 1;
        for (var key of this.#moveinTasks.keys()) {
            let task = this.#moveinTasks.get(key);
            setTimeout(function (obj) {
                obj.addToCasket(task.casket_id, task.item_id)
            }, this.#taskExecInterval * i, this)
            i++;
        }
        for (var key of this.#moveoutTasks.keys()) {
            let task = this.#moveoutTasks.get(key);
            setTimeout(function (obj) {
                obj.removeFromCasket(task.casket_id, task.item_id);
            }, this.#taskExecInterval * i, this);
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

        if (this.#moveinTasks.has(item.id)) {
            let task = this.#moveinTasks.get(item.id);
            if (this.#logger) {
                this.#logger.info(
                    "物品移入库存组件, 物品id:" + task.item_id +
                    ", 组件id:" + task.casket_id +
                    ", 剩余移入任务数:" + Number(this.#moveinTasks.size - 1)
                );
            }
            this.#moveinTasks.delete(item.id);
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

        if (this.#moveoutTasks.has(my_item.id)) {
            let task = this.#moveoutTasks.get(my_item.id);
            if (this.#logger) {
                this.#logger.info(
                    "物品移出库存组件, 物品id:" + task.item_id +
                    ", 组件id:" + task.casket_id +
                    ", 剩余移出任务数:" + Number(this.#moveoutTasks.size - 1)
                );
            }
            this.#moveoutTasks.delete(my_item.id);
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
            this.#caskets.get(my_item.casket_id).addItem(my_item);
        } else {
            this.addOutterItem(my_item);
        }
    }

    casketFoundCB(casket_id) {
        this.createCasket(casket_id);
        var casket = this.#caskets.get(casket_id);
        var inner_items = this.#inner_items;
        this.#csgo.getCasketContents(casket_id, (err, items) => {
            if (err == null) {
                items.forEach(function (item) {
                    var my_item = CsgoItem.fromOriginItem(item);
                    casket.addItem(my_item);
                    if (!inner_items.has(my_item.id)) {
                        inner_items.set(my_item.id, my_item);
                    }
                })
            }
        });
    }

    listInnerItemCB(def_index, tradable = 1, res = null) {
        let items_num = 0;
        for (let key of this.#inner_items.keys()) {
            if (
                this.#inner_items.get(key).def_index == def_index
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
                this.#outter_items.get(key).def_index == def_index
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
        console.log("recv moveinTask, def_index= " + def_index + ", tradable= " + tradable)
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
                console.log("caskets size:" + this.#caskets.size)
                for (let casket_key of this.#caskets.keys()) {
                    var casket = this.#caskets.get(casket_key);
                    if (casket.addable()) {
                        casket.addItem(my_item);
                        this.addMoveinTask({
                            casket_id: casket_key,
                            item_id: my_item.id
                        });
                        break;
                    }
                }
            }
        }
        console.log("remain unmoved movein_num:", move_num);
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
                console.log("moveoutTaskExecuting,item.def_index=", my_item.def_index);
                move_num--;
                this.#outter_items.set(my_item.id, my_item);
                this.#inner_items.delete(my_item.id);
                var casket_id = my_item.casket_id;
                this.addMoveoutTask({
                    casket_id: casket_id,
                    item_id: my_item.id
                });
                my_item.casket_id = null;
            }
        }
        console.log("remain unmoved moveout_num:", move_num);
    }

    flushOutterItem(func) {
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

    createCasket(casket_id) {
        if (!this.hasCasket(casket_id)) {
            var casket = new CsgoCasket(casket_id);
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
}

module.exports = {
    OriginItemUtil,
    CsgoCasketMaxSize,
    CsgoCasket,
    CsgoItem,
    CasketHelper
};

