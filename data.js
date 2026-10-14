// 50 Startups 完整資料集與預先計算之統計量
const STARTUPS_DATA = [
  { id: 0, rd: 165349.20, admin: 136897.80, marketing: 471784.10, state: "New York", profit: 192261.83 },
  { id: 1, rd: 162597.70, admin: 151377.59, marketing: 443898.53, state: "California", profit: 191792.06 },
  { id: 2, rd: 153441.51, admin: 101145.55, marketing: 407934.54, state: "Florida", profit: 191050.39 },
  { id: 3, rd: 144372.41, admin: 118671.85, marketing: 383199.62, state: "New York", profit: 182901.99 },
  { id: 4, rd: 142107.34, admin: 91391.77, marketing: 366168.42, state: "Florida", profit: 166187.94 },
  { id: 5, rd: 131876.90, admin: 99814.71, marketing: 362861.36, state: "New York", profit: 156991.12 },
  { id: 6, rd: 134615.46, admin: 147198.87, marketing: 127716.82, state: "California", profit: 156122.51 },
  { id: 7, rd: 130298.13, admin: 145530.06, marketing: 323876.68, state: "Florida", profit: 155752.60 },
  { id: 8, rd: 120542.52, admin: 148718.95, marketing: 311613.29, state: "New York", profit: 152211.77 },
  { id: 9, rd: 123334.88, admin: 108679.17, marketing: 304981.62, state: "California", profit: 149759.96 },
  { id: 10, rd: 101913.08, admin: 110594.11, marketing: 229160.95, state: "Florida", profit: 146121.95 },
  { id: 11, rd: 100671.96, admin: 91790.61, marketing: 249744.55, state: "California", profit: 144259.40 },
  { id: 12, rd: 93863.75, admin: 127320.38, marketing: 249839.44, state: "Florida", profit: 141585.52 },
  { id: 13, rd: 91992.39, admin: 135495.07, marketing: 252664.93, state: "California", profit: 134307.35 },
  { id: 14, rd: 119943.24, admin: 156547.42, marketing: 256512.92, state: "Florida", profit: 132602.65 },
  { id: 15, rd: 114523.61, admin: 122616.84, marketing: 261776.23, state: "New York", profit: 129917.04 },
  { id: 16, rd: 78013.11, admin: 121597.55, marketing: 264346.06, state: "California", profit: 126992.93 },
  { id: 17, rd: 94657.16, admin: 145077.58, marketing: 282574.31, state: "New York", profit: 125370.37 },
  { id: 18, rd: 91749.16, admin: 114175.79, marketing: 294919.57, state: "Florida", profit: 124266.90 },
  { id: 19, rd: 86419.70, admin: 153514.11, marketing: 0.00, state: "New York", profit: 122776.86 },
  { id: 20, rd: 76253.86, admin: 113867.30, marketing: 298664.47, state: "California", profit: 118474.03 },
  { id: 21, rd: 78389.47, admin: 153773.43, marketing: 299737.29, state: "New York", profit: 111313.02 },
  { id: 22, rd: 73994.56, admin: 122782.75, marketing: 303319.26, state: "Florida", profit: 110352.25 },
  { id: 23, rd: 67532.53, admin: 105751.03, marketing: 304768.73, state: "Florida", profit: 108733.99 },
  { id: 24, rd: 77044.01, admin: 99281.34, marketing: 140574.81, state: "New York", profit: 108552.04 },
  { id: 25, rd: 64664.71, admin: 139553.16, marketing: 137962.62, state: "California", profit: 107404.34 },
  { id: 26, rd: 75328.87, admin: 144135.98, marketing: 134050.07, state: "Florida", profit: 105733.54 },
  { id: 27, rd: 72107.60, admin: 127864.55, marketing: 353183.81, state: "New York", profit: 105008.31 },
  { id: 28, rd: 66051.52, admin: 182645.56, marketing: 118148.20, state: "Florida", profit: 103282.38 },
  { id: 29, rd: 65605.48, admin: 153032.06, marketing: 107138.38, state: "New York", profit: 101004.64 },
  { id: 30, rd: 61994.48, admin: 115641.28, marketing: 91131.24, state: "Florida", profit: 99937.59 },
  { id: 31, rd: 61136.38, admin: 152701.92, marketing: 88218.23, state: "New York", profit: 97483.56 },
  { id: 32, rd: 63408.86, admin: 129219.61, marketing: 46085.25, state: "California", profit: 97427.84 },
  { id: 33, rd: 55493.95, admin: 103057.49, marketing: 214634.81, state: "Florida", profit: 96778.92 },
  { id: 34, rd: 46426.07, admin: 157693.92, marketing: 210797.67, state: "California", profit: 96712.80 },
  { id: 35, rd: 46014.02, admin: 85047.44, marketing: 205517.64, state: "New York", profit: 96479.51 },
  { id: 36, rd: 28663.76, admin: 127056.21, marketing: 201126.82, state: "Florida", profit: 90708.19 },
  { id: 37, rd: 44069.95, admin: 51283.14, marketing: 197029.42, state: "California", profit: 89949.14 },
  { id: 38, rd: 20229.59, admin: 65947.93, marketing: 185265.10, state: "New York", profit: 81229.06 },
  { id: 39, rd: 38558.51, admin: 82982.09, marketing: 174999.30, state: "California", profit: 81005.76 },
  { id: 40, rd: 28754.33, admin: 118546.05, marketing: 172795.67, state: "California", profit: 78239.91 },
  { id: 41, rd: 27892.92, admin: 84710.77, marketing: 164470.71, state: "Florida", profit: 77798.83 },
  { id: 42, rd: 23640.93, admin: 96189.63, marketing: 148001.11, state: "California", profit: 71498.49 },
  { id: 43, rd: 15505.73, admin: 127382.30, marketing: 35534.17, state: "New York", profit: 69758.98 },
  { id: 44, rd: 22177.74, admin: 154806.14, marketing: 28334.72, state: "California", profit: 65200.33 },
  { id: 45, rd: 1000.23, admin: 124153.04, marketing: 1903.93, state: "New York", profit: 64926.08 },
  { id: 46, rd: 1315.46, admin: 115816.21, marketing: 297114.46, state: "Florida", profit: 49490.75 },
  { id: 47, rd: 0.00, admin: 135426.92, marketing: 0.00, state: "California", profit: 42559.73 },
  { id: 48, rd: 542.05, admin: 51743.15, marketing: 0.00, state: "New York", profit: 35673.41 },
  { id: 49, rd: 0.00, admin: 116983.80, marketing: 45173.06, state: "California", profit: 14681.40 }
];

// OLS 全樣本參數 (Model B: drop California, with intercept)
// y = 50125.34 + 0.8057 * RD - 0.0268 * Admin + 0.0272 * Marketing + 198.79 * FL - 169.85 * NY
const MODEL_B_PARAMS = {
  intercept: 50125.34,
  coef_rd: 0.805715,
  coef_admin: -0.026816,
  coef_marketing: 0.027228,
  coef_florida: 198.788793,
  coef_newyork: -169.851017,
  r2: 0.95075,
  adj_r2: 0.94515
};

// 6 個模型的預算與測試表現匯總
const MODELS_SUMMARY = [
  {
    name: "Baseline (All In)",
    type: "全特徵基準 (Model B)",
    featureCount: 5,
    features: ["R&D Spend", "Administration", "Marketing Spend", "State_Florida", "State_New York"],
    formula: "y = 50125.34 + 0.8057*RD - 0.0268*Admin + 0.0272*Mkt + 198.79*FL - 169.85*NY",
    trainR2: 0.9585,
    testR2: 0.8987,
    testAdjR2: 0.7721,
    testRMSE: 9055.96,
    testMAE: 6961.48,
    fullAdjR2: 0.9452,
    badgeColor: "#6366f1"
  },
  {
    name: "LassoCV",
    type: "L1 正則化 (自動稀疏化)",
    featureCount: 3,
    features: ["R&D Spend", "Administration", "Marketing Spend"],
    formula: "y = 50122.19 + 0.8057*RD - 0.0268*Admin + 0.0272*Mkt",
    trainR2: 0.9584,
    testR2: 0.9001,
    testAdjR2: 0.8501,
    testRMSE: 8995.91,
    testMAE: 6979.15,
    fullAdjR2: 0.9475,
    badgeColor: "#10b981"
  },
  {
    name: "RFECV",
    type: "遞迴特徵消除 (Cross-Validation)",
    featureCount: 5,
    features: ["R&D Spend", "Administration", "Marketing Spend", "State_Florida", "State_New York"],
    formula: "y = 50125.34 + 0.8057*RD - 0.0268*Admin + 0.0272*Mkt + 198.79*FL - 169.85*NY",
    trainR2: 0.9585,
    testR2: 0.8987,
    testAdjR2: 0.7721,
    testRMSE: 9055.96,
    testMAE: 6961.48,
    fullAdjR2: 0.9452,
    badgeColor: "#3b82f6"
  },
  {
    name: "Sequential Forward Selection",
    type: "SFS 前向逐步選擇 (貪婪搜尋)",
    featureCount: 3,
    features: ["R&D Spend", "Administration", "Marketing Spend"],
    formula: "y = 50122.19 + 0.8057*RD - 0.0268*Admin + 0.0272*Mkt",
    trainR2: 0.9584,
    testR2: 0.9001,
    testAdjR2: 0.8501,
    testRMSE: 8995.91,
    testMAE: 6979.15,
    fullAdjR2: 0.9475,
    badgeColor: "#f59e0b"
  },
  {
    name: "ElasticNetCV",
    type: "L1 + L2 雙重正則化",
    featureCount: 3,
    features: ["R&D Spend", "Administration", "Marketing Spend"],
    formula: "y = 50122.19 + 0.8057*RD - 0.0268*Admin + 0.0272*Mkt",
    trainR2: 0.9584,
    testR2: 0.9001,
    testAdjR2: 0.8501,
    testRMSE: 8995.91,
    testMAE: 6979.15,
    fullAdjR2: 0.9475,
    badgeColor: "#ec4899"
  },
  {
    name: "Exhaustive Feature Selection",
    type: "窮舉最佳子集 (31 種組合)",
    featureCount: 3,
    features: ["R&D Spend", "Administration", "Marketing Spend"],
    formula: "y = 50122.19 + 0.8057*RD - 0.0268*Admin + 0.0272*Mkt",
    trainR2: 0.9584,
    testR2: 0.9001,
    testAdjR2: 0.8501,
    testRMSE: 8995.91,
    testMAE: 6979.15,
    fullAdjR2: 0.9475,
    badgeColor: "#8b5cf6"
  }
];

// VIF (Variance Inflation Factor) 共線性診斷結果
const VIF_DATA = [
  { feature: "R&D Spend", vif: 2.4955, status: "正常 (< 5)", risk: "低", color: "#10b981" },
  { feature: "Administration", vif: 1.1778, status: "正常 (< 5)", risk: "極低", color: "#10b981" },
  { feature: "Marketing Spend", vif: 2.4168, status: "正常 (< 5)", risk: "低", color: "#10b981" },
  { feature: "State_Florida", vif: 1.3876, status: "正常 (< 5)", risk: "極低", color: "#10b981" },
  { feature: "State_New York", vif: 1.3351, status: "正常 (< 5)", risk: "極低", color: "#10b981" }
];

// Top 10 離群值資料 (依據庫克距離 Cook's Distance 排序)
const TOP_10_OUTLIERS = [
  { rank: 1, id: 49, actual: 14681.40, predicted: 48185.04, residual: -33503.64, studentized: -3.85, cooksD: 0.2640, state: "California", note: "研發=0, 利潤遠低於模型預期 (最高影響力點)" },
  { rank: 2, id: 48, actual: 35673.41, predicted: 49123.07, residual: -13449.66, studentized: -1.54, cooksD: 0.1564, state: "New York", note: "低研發支出, 利潤偏低" },
  { rank: 3, id: 45, actual: 64926.08, predicted: 47588.36, residual: 17337.72, studentized: 1.99, cooksD: 0.0944, state: "New York", note: "研發僅 $1,000 但利潤近 $65,000" },
  { rank: 4, id: 14, actual: 132602.65, predicted: 149694.38, residual: -17091.73, studentized: -1.96, cooksD: 0.0720, state: "Florida", note: "研發與行政皆高, 利潤低於預期" },
  { rank: 5, id: 36, actual: 90708.19, predicted: 75423.09, residual: 15285.10, studentized: 1.75, cooksD: 0.0592, state: "Florida", note: "行銷高研發低, 實際利潤偏高" },
  { rank: 6, id: 38, actual: 81229.06, predicted: 69606.52, residual: 11622.54, studentized: 1.33, cooksD: 0.0558, state: "New York", note: "研發極低 ($20k) 但利潤達 $81k" },
  { rank: 7, id: 15, actual: 129917.04, predicted: 146143.64, residual: -16226.60, studentized: -1.86, cooksD: 0.0434, state: "New York", note: "高研發但獲利略顯疲軟" },
  { rank: 8, id: 46, actual: 49490.75, predicted: 56272.99, residual: -6782.24, studentized: -0.78, cooksD: 0.0423, state: "Florida", note: "高行銷預算但低研發支出" },
  { rank: 9, id: 19, actual: 122776.86, predicted: 115594.19, residual: 7182.67, studentized: 0.82, cooksD: 0.0329, state: "New York", note: "行銷支出為 0, 獲利仍高" },
  { rank: 10, id: 27, actual: 105008.31, predicted: 114279.80, residual: -9271.49, studentized: -1.06, cooksD: 0.0325, state: "New York", note: "行銷花費 $353k 但利潤一般" }
];
