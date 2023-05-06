// ##########################################辅助函数开始##########################################
// 是否自动移入组件
const { OriginItemUtil } = require('./util/item_util')
function PreAutoMovein(item) {
    return (OriginItemUtil.isClutchCase(item)
        || OriginItemUtil.isFractureCase(item)
        || OriginItemUtil.isCSGO20Case(item)
        || OriginItemUtil.isPrisma2Case(item)
        || OriginItemUtil.isSnakeBiteCase(item)
        || OriginItemUtil.isStockH2022TeamCapsules(item)
        || OriginItemUtil.isRio2022SignatureCapsules(item)
        || OriginItemUtil.isRio2022TeamCapsules(item)
        || OriginItemUtil.isRioDust2SouvenirPackage(item)
        || OriginItemUtil.isRIoMirageSouvenirPackage(item)
        || OriginItemUtil.isEspionageStickerCapsule(item)
        || OriginItemUtil.isUltimateMusicKit(item)
        || OriginItemUtil.isRevolutionCase(item))
        && OriginItemUtil.isInCasket(item) == false
        && OriginItemUtil.isTradable(item) == false
}


module.exports = {
    PreAutoMovein
};
