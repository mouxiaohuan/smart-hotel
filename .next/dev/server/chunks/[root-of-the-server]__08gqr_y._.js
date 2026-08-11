module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/app/api/knowledge/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$data$2f$knowledge$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/data/knowledge.ts [app-route] (ecmascript)");
;
;
function GET() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(__TURBOPACK__imported__module__$5b$project$5d2f$data$2f$knowledge$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["knowledgeBase"]);
}
}),
"[project]/data/knowledge.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "knowledgeBase",
    ()=>knowledgeBase
]);
const knowledgeBase = [
    {
        id: 'check-in',
        category: '入住政策',
        title: '入住与退房时间',
        content: '标准入住时间为 14:00，退房时间为次日 12:00。提前到店可寄存行李；如需延迟退房，请联系前台，视房态可延至 14:00，超过 14:00 将按半日房费计费。',
        tags: [
            '入住',
            '退房',
            '延迟退房',
            '行李'
        ],
        updatedAt: '2026-08-01'
    },
    {
        id: 'breakfast',
        category: '餐饮服务',
        title: '早餐与餐厅',
        content: '云端全日餐厅位于 3 楼，早餐供应时间为 06:30–10:30。成人早餐 128 元/位，6 岁以下儿童免费，6–12 岁儿童半价。住店客人可凭房卡直接入场。',
        tags: [
            '早餐',
            '餐厅',
            '儿童',
            '云端餐厅'
        ],
        updatedAt: '2026-07-28'
    },
    {
        id: 'pool',
        category: '康体设施',
        title: '泳池与健身房',
        content: '恒温泳池和健身房位于 5 楼，开放时间 06:00–23:00。泳池需佩戴泳帽，酒店可免费借用。16 岁以下客人使用泳池需由成人陪同。',
        tags: [
            '泳池',
            '游泳',
            '健身房',
            '开放时间'
        ],
        updatedAt: '2026-07-22'
    },
    {
        id: 'room-deluxe',
        category: '房型信息',
        title: '行政大床房',
        content: '行政大床房面积 42㎡，配备 2 米大床、独立浴缸、城市景观和行政酒廊礼遇，适合 1–2 位客人入住。可免费加一张婴儿床。',
        tags: [
            '房型',
            '大床',
            '行政',
            '婴儿床'
        ],
        updatedAt: '2026-08-03'
    },
    {
        id: 'pet',
        category: '入住政策',
        title: '宠物入住',
        content: '酒店暂不接受宠物入住（导盲犬除外）。附近有专业宠物寄养机构，前台可以协助预约接送。',
        tags: [
            '宠物',
            '导盲犬',
            '寄养'
        ],
        updatedAt: '2026-06-15'
    },
    {
        id: 'parking',
        category: '交通服务',
        title: '停车与接送',
        content: '地下停车场入口在酒店东侧，住店客人每日可享免费停车。机场接送需至少提前 24 小时预约，商务车单程 380 元。',
        tags: [
            '停车',
            '机场',
            '接送',
            '交通'
        ],
        updatedAt: '2026-07-30'
    },
    {
        id: 'wifi',
        category: '客房服务',
        title: '网络与办公',
        content: '全酒店覆盖免费 Wi‑Fi，网络名称为 SmartHotel_Guest，密码可在入住短信或房内电视首页查看。商务中心位于 2 楼，提供打印、复印和会议室预订。',
        tags: [
            'WiFi',
            '网络',
            '打印',
            '商务中心'
        ],
        updatedAt: '2026-07-18'
    },
    {
        id: 'cancellation',
        category: '预订政策',
        title: '取消与修改预订',
        content: '灵活价预订可在入住前一天 18:00 前免费取消；特惠价和节假日套餐以订单页面标注为准。需要修改入住日期时，客服会根据实时房价协助处理。',
        tags: [
            '取消',
            '预订',
            '修改',
            '退款'
        ],
        updatedAt: '2026-08-02'
    }
];
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__08gqr_y._.js.map