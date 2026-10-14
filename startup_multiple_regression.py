# ==============================================================================
# 50 Startups 多元線性迴歸分析 (Multiple Linear Regression)
# 遵循 CRISP-DM 資料採掘標準流程
# 包含：One-Hot Encoding (Model B, 避免虛擬變數陷阱)、VIF 共線性檢驗、
#       6 種特徵選擇模型比較 (Baseline, LassoCV, RFECV, SFS, ElasticNetCV, EFS)、
#       模型評估 (R2, Adjusted R2, RMSE, MAE)、Top 10 離群值 (Outliers) 偵測與視覺化圖表
# ==============================================================================

import os
import itertools
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.linear_model import LinearRegression, LassoCV, ElasticNetCV
from sklearn.feature_selection import RFECV, SequentialFeatureSelector
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor

# 設定中文字型與圖表美化
plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False
sns.set_theme(style="whitegrid", font='Microsoft JhengHei')

def main():
    print("=" * 80)
    print(" 50 Startups 多元線性迴歸專案 (CRISP-DM 流程) ")
    print("=" * 80)

    # --------------------------------------------------------------------------
    # 第一階段：商業理解 (Business Understanding)
    # --------------------------------------------------------------------------
    print("\n[CRISP-DM 階段 1] 商業理解 (Business Understanding)")
    print("-" * 60)
    print("目標：預測 50 家初創企業的獲利 (Profit)。")
    print("探討特徵：研發支出 (R&D Spend)、行政支出 (Administration)、行銷支出 (Marketing Spend)、州別 (State)。")
    print("核心議題：特徵共線性問題 (Collinearity)、虛擬變數陷阱 (Dummy Variable Trap)、特徵篩選與離群值偵測。")

    # --------------------------------------------------------------------------
    # 第二階段：資料理解 (Data Understanding)
    # --------------------------------------------------------------------------
    print("\n[CRISP-DM 階段 2] 資料理解 (Data Understanding)")
    print("-" * 60)
    csv_file = "50_Startups.csv"
    if not os.path.exists(csv_file):
        raise FileNotFoundError(f"找不到 {csv_file}，請確認檔案路徑。")

    df = pd.read_csv(csv_file)
    print(f"資料筆數與欄位數：{df.shape[0]} 筆樣本, {df.shape[1]} 個欄位")
    print("\n資料前 5 筆預覽：")
    print(df.head())

    print("\n欄位型態與缺失值檢查：")
    print(df.info())
    print("\n各欄位缺失值統計：")
    print(df.isnull().sum())

    print("\n數值型特徵敘述性統計：")
    print(df.describe().T)

    print("\n州別分佈 (State Categorical Distribution)：")
    print(df['State'].value_counts())

    # --------------------------------------------------------------------------
    # 第三階段：資料準備 (Data Preparation)
    # --------------------------------------------------------------------------
    print("\n[CRISP-DM 階段 3] 資料準備 (Data Preparation)")
    print("-" * 60)
    print("1. 類別變數 (State) 處理：採用 One-Hot Encoding。")
    print("2. 虛擬變數陷阱與共線性考量：")
    print("   - Model A (全虛擬變數無截距項)：y = w1*CA + w2*FL + w3*NY + w4*R&D + ...")
    print("   - Model B (兩虛擬變數含截距項)：y = b + w1*X1 + w2*X2 + w3*X3 + w4*FL + w5*NY")
    print("   註：依據講義指示採用 Model B，drop_first=True 移除 California 作為基準組 (Baseline)。")
    print("       當 FL=0 且 NY=0 時，截距項 b 即代表加州 (California) 的基準效應。")

    # One-Hot Encoding，drop_first=True (移除 California)
    df_model_b = pd.get_dummies(df, columns=['State'], drop_first=True, dtype=float)
    print("\n編碼後的特徵欄位：", [c for c in df_model_b.columns if c != 'Profit'])

    # 分割 X 與 y
    feature_names = [col for col in df_model_b.columns if col != 'Profit']
    X = df_model_b[feature_names]
    y = df_model_b['Profit']

    # 共線性檢驗 (VIF - Variance Inflation Factor)
    print("\n--- 共線性檢驗：VIF (Variance Inflation Factor) ---")
    X_vif = sm.add_constant(X)
    vif_df = pd.DataFrame()
    vif_df['Feature'] = X_vif.columns
    vif_df['VIF'] = [variance_inflation_factor(X_vif.values, i) for i in range(X_vif.shape[1])]
    print(vif_df.to_string(index=False))
    print("說明：VIF > 5 或 10 代表存在潛在多元共線性 (Multicollinearity)。")

    # 切分訓練集與測試集 (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\n訓練集大小: {X_train.shape[0]} 筆, 測試集大小: {X_test.shape[0]} 筆")

    # 特徵標準化 (用於正規化模型 LassoCV / ElasticNetCV)
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=feature_names, index=X_train.index)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=feature_names, index=X_test.index)

    # 輔助評估函式 (計算 R2, Adjusted R2, RMSE, MAE)
    def calc_metrics(y_true, y_pred, p):
        n = len(y_true)
        r2 = r2_score(y_true, y_pred)
        adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1) if n > p + 1 else np.nan
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        mae = mean_absolute_error(y_true, y_pred)
        return r2, adj_r2, rmse, mae

    # --------------------------------------------------------------------------
    # 第四階段：模型建置與特徵選擇 (Modeling & Feature Selection)
    # 比較 6 個模型：
    # 1. Baseline Linear Regression (All Features)
    # 2. LassoCV (L1 正則化)
    # 3. RFECV (遞迴特徵消除 + 交叉驗證)
    # 4. Sequential Forward Selection (SFS 前向特徵選擇)
    # 5. ElasticNetCV (L1+L2 彈性網絡)
    # 6. Exhaustive Feature Selection (窮舉最佳子集選擇)
    # --------------------------------------------------------------------------
    print("\n[CRISP-DM 階段 4] 模型建置與特徵選擇 (Modeling & Feature Selection)")
    print("-" * 60)

    results = []
    selected_features_dict = {}
    fitted_models = {}

    # 1. Baseline Linear Regression (All-in Model B)
    lr_base = LinearRegression()
    lr_base.fit(X_train, y_train)
    y_test_pred_base = lr_base.predict(X_test)
    y_train_pred_base = lr_base.predict(X_train)
    r2_b, adj_r2_b, rmse_b, mae_b = calc_metrics(y_test, y_test_pred_base, X_train.shape[1])
    r2_tr_b, _, _, _ = calc_metrics(y_train, y_train_pred_base, X_train.shape[1])

    results.append({
        'Model': 'Baseline (All In)',
        'Selected_Features_Count': len(feature_names),
        'Selected_Features': list(feature_names),
        'Train_R2': r2_tr_b,
        'Test_R2': r2_b,
        'Test_Adj_R2': adj_r2_b,
        'Test_RMSE': rmse_b,
        'Test_MAE': mae_b
    })
    selected_features_dict['Baseline (All In)'] = list(feature_names)
    fitted_models['Baseline (All In)'] = (lr_base, list(feature_names), False)

    # 2. LassoCV (L1 正則化自動特徵稀疏化)
    lasso_cv = LassoCV(cv=5, random_state=42, max_iter=10000)
    lasso_cv.fit(X_train_scaled, y_train)
    lasso_features = [f for f, coef in zip(feature_names, lasso_cv.coef_) if abs(coef) > 1e-4]
    if len(lasso_features) == 0:
        lasso_features = [feature_names[np.argmax(np.abs(lasso_cv.coef_))]]

    # 以選出之特徵建立未受罰線性迴歸 (以評估實際效能)
    lr_lasso = LinearRegression()
    lr_lasso.fit(X_train[lasso_features], y_train)
    y_test_pred_lasso = lr_lasso.predict(X_test[lasso_features])
    y_train_pred_lasso = lr_lasso.predict(X_train[lasso_features])
    r2_l, adj_r2_l, rmse_l, mae_l = calc_metrics(y_test, y_test_pred_lasso, len(lasso_features))
    r2_tr_l, _, _, _ = calc_metrics(y_train, y_train_pred_lasso, len(lasso_features))

    results.append({
        'Model': 'LassoCV',
        'Selected_Features_Count': len(lasso_features),
        'Selected_Features': lasso_features,
        'Train_R2': r2_tr_l,
        'Test_R2': r2_l,
        'Test_Adj_R2': adj_r2_l,
        'Test_RMSE': rmse_l,
        'Test_MAE': mae_l
    })
    selected_features_dict['LassoCV'] = lasso_features
    fitted_models['LassoCV'] = (lr_lasso, lasso_features, False)

    # 3. RFECV (Recursive Feature Elimination with Cross-Validation)
    rfecv = RFECV(estimator=LinearRegression(), step=1, cv=KFold(n_splits=5, shuffle=True, random_state=42), scoring='neg_mean_squared_error')
    rfecv.fit(X_train, y_train)
    rfecv_features = [f for f, sup in zip(feature_names, rfecv.support_) if sup]

    lr_rfe = LinearRegression()
    lr_rfe.fit(X_train[rfecv_features], y_train)
    y_test_pred_rfe = lr_rfe.predict(X_test[rfecv_features])
    y_train_pred_rfe = lr_rfe.predict(X_train[rfecv_features])
    r2_r, adj_r2_r, rmse_r, mae_r = calc_metrics(y_test, y_test_pred_rfe, len(rfecv_features))
    r2_tr_r, _, _, _ = calc_metrics(y_train, y_train_pred_rfe, len(rfecv_features))

    results.append({
        'Model': 'RFECV',
        'Selected_Features_Count': len(rfecv_features),
        'Selected_Features': rfecv_features,
        'Train_R2': r2_tr_r,
        'Test_R2': r2_r,
        'Test_Adj_R2': adj_r2_r,
        'Test_RMSE': rmse_r,
        'Test_MAE': mae_r
    })
    selected_features_dict['RFECV'] = rfecv_features
    fitted_models['RFECV'] = (lr_rfe, rfecv_features, False)

    # 4. Sequential Forward Selection (SFS)
    # 測試特徵個數 1 到 5，挑選交叉驗證 MSE 最優之組合
    best_sfs_score = -np.inf
    best_sfs_features = None
    cv_sfs = KFold(n_splits=5, shuffle=True, random_state=42)

    for k in range(1, len(feature_names)):
        sfs = SequentialFeatureSelector(LinearRegression(), n_features_to_select=k, direction='forward', cv=cv_sfs, scoring='neg_mean_squared_error')
        sfs.fit(X_train, y_train)
        feats = [f for f, s in zip(feature_names, sfs.get_support()) if s]
        scores = cross_val_score(LinearRegression(), X_train[feats], y_train, cv=cv_sfs, scoring='neg_mean_squared_error')
        if scores.mean() > best_sfs_score:
            best_sfs_score = scores.mean()
            best_sfs_features = feats

    lr_sfs = LinearRegression()
    lr_sfs.fit(X_train[best_sfs_features], y_train)
    y_test_pred_sfs = lr_sfs.predict(X_test[best_sfs_features])
    y_train_pred_sfs = lr_sfs.predict(X_train[best_sfs_features])
    r2_s, adj_r2_s, rmse_s, mae_s = calc_metrics(y_test, y_test_pred_sfs, len(best_sfs_features))
    r2_tr_s, _, _, _ = calc_metrics(y_train, y_train_pred_sfs, len(best_sfs_features))

    results.append({
        'Model': 'Sequential Forward Selection',
        'Selected_Features_Count': len(best_sfs_features),
        'Selected_Features': best_sfs_features,
        'Train_R2': r2_tr_s,
        'Test_R2': r2_s,
        'Test_Adj_R2': adj_r2_s,
        'Test_RMSE': rmse_s,
        'Test_MAE': mae_s
    })
    selected_features_dict['Sequential Forward Selection'] = best_sfs_features
    fitted_models['Sequential Forward Selection'] = (lr_sfs, best_sfs_features, False)

    # 5. ElasticNetCV (L1 + L2 正則化)
    enet_cv = ElasticNetCV(l1_ratio=[0.1, 0.5, 0.7, 0.9, 0.95, 0.99, 1.0], cv=5, random_state=42, max_iter=10000)
    enet_cv.fit(X_train_scaled, y_train)
    enet_features = [f for f, coef in zip(feature_names, enet_cv.coef_) if abs(coef) > 1e-4]
    if len(enet_features) == 0:
        enet_features = [feature_names[np.argmax(np.abs(enet_cv.coef_))]]

    lr_enet = LinearRegression()
    lr_enet.fit(X_train[enet_features], y_train)
    y_test_pred_enet = lr_enet.predict(X_test[enet_features])
    y_train_pred_enet = lr_enet.predict(X_train[enet_features])
    r2_e, adj_r2_e, rmse_e, mae_e = calc_metrics(y_test, y_test_pred_enet, len(enet_features))
    r2_tr_e, _, _, _ = calc_metrics(y_train, y_train_pred_enet, len(enet_features))

    results.append({
        'Model': 'ElasticNetCV',
        'Selected_Features_Count': len(enet_features),
        'Selected_Features': enet_features,
        'Train_R2': r2_tr_e,
        'Test_R2': r2_e,
        'Test_Adj_R2': adj_r2_e,
        'Test_RMSE': rmse_e,
        'Test_MAE': mae_e
    })
    selected_features_dict['ElasticNetCV'] = enet_features
    fitted_models['ElasticNetCV'] = (lr_enet, enet_features, False)

    # 6. Exhaustive Feature Selection (EFS 窮舉子集搜尋 2^p - 1 = 31 種可能)
    best_efs_score = -np.inf
    best_efs_features = None
    cv_efs = KFold(n_splits=5, shuffle=True, random_state=42)

    for k in range(1, len(feature_names) + 1):
        for combo in itertools.combinations(feature_names, k):
            sub_feats = list(combo)
            scores = cross_val_score(LinearRegression(), X_train[sub_feats], y_train, cv=cv_efs, scoring='neg_mean_squared_error')
            if scores.mean() > best_efs_score:
                best_efs_score = scores.mean()
                best_efs_features = sub_feats

    lr_efs = LinearRegression()
    lr_efs.fit(X_train[best_efs_features], y_train)
    y_test_pred_efs = lr_efs.predict(X_test[best_efs_features])
    y_train_pred_efs = lr_efs.predict(X_train[best_efs_features])
    r2_efs, adj_r2_efs, rmse_efs, mae_efs = calc_metrics(y_test, y_test_pred_efs, len(best_efs_features))
    r2_tr_efs, _, _, _ = calc_metrics(y_train, y_train_pred_efs, len(best_efs_features))

    results.append({
        'Model': 'Exhaustive Feature Selection',
        'Selected_Features_Count': len(best_efs_features),
        'Selected_Features': best_efs_features,
        'Train_R2': r2_tr_efs,
        'Test_R2': r2_efs,
        'Test_Adj_R2': adj_r2_efs,
        'Test_RMSE': rmse_efs,
        'Test_MAE': mae_efs
    })
    selected_features_dict['Exhaustive Feature Selection'] = best_efs_features
    fitted_models['Exhaustive Feature Selection'] = (lr_efs, best_efs_features, False)

    # --------------------------------------------------------------------------
    # 第五階段：模型評估與離群值偵測 (Evaluation & Outlier Detection)
    # --------------------------------------------------------------------------
    print("\n[CRISP-DM 階段 5] 模型評估與比較 (Evaluation)")
    print("-" * 60)
    summary_df = pd.DataFrame(results)
    print(summary_df[['Model', 'Selected_Features_Count', 'Test_R2', 'Test_Adj_R2', 'Test_RMSE', 'Test_MAE']].to_string(index=False))

    print("\n各方法挑選之特徵細節：")
    for m, feats in selected_features_dict.items():
        print(f" - {m:<30}: {feats}")

    # Top 10 離群值偵測 (使用 Statsmodels OLS 搭配 Cook's Distance 與殘差)
    print("\n--- 離群值偵測 (Top 10 Outliers Detection) ---")
    ols_data = sm.add_constant(X)
    ols_model = sm.OLS(y, ols_data).fit()

    influence = ols_model.get_influence()
    cooks_d = influence.cooks_distance[0]
    studentized_resids = influence.resid_studentized_internal

    outlier_df = df.copy()
    outlier_df['Actual_Profit'] = y
    outlier_df['Predicted_Profit'] = ols_model.fittedvalues
    outlier_df['Residual'] = ols_model.resid
    outlier_df['Studentized_Residual'] = studentized_resids
    outlier_df['Cooks_Distance'] = cooks_d

    # 依 Cook's Distance 排序前 10 名最顯著離群值 (影響力最高樣本)
    top_10_outliers = outlier_df.sort_values(by='Cooks_Distance', ascending=False).head(10)
    print("\n【Top 10 Outliers (依 Cook's Distance 影響力排序)】：")
    print(top_10_outliers[['Actual_Profit', 'Predicted_Profit', 'Residual', 'Studentized_Residual', 'Cooks_Distance', 'State']])

    # --------------------------------------------------------------------------
    # 第六階段：視覺化與部署產出 (Deployment & Visualizations)
    # --------------------------------------------------------------------------
    print("\n[CRISP-DM 階段 6] 視覺化與圖表輸出 (Deployment & Visualizations)")
    print("-" * 60)

    fig = plt.figure(figsize=(18, 14))

    # 子圖 1: 散布圖、迴歸線與 Top 10 離群值 (Scatter Plot & Regression Line & Outliers)
    ax1 = fig.add_subplot(2, 2, 1)
    y_full_pred = ols_model.fittedvalues
    ax1.scatter(y, y_full_pred, color='#2b5c8f', alpha=0.6, edgecolors='k', s=60, label='一般樣本 (Normal Samples)')

    # 迴歸線與完美預測線 (y = x)
    min_val, max_val = min(y.min(), y_full_pred.min()), max(y.max(), y_full_pred.max())
    ax1.plot([min_val, max_val], [min_val, max_val], color='darkgreen', linestyle='--', linewidth=2, label='完美預測線 (y = x)')

    # 擬合趨勢線 (Regression Fit Line)
    m, b = np.polyfit(y, y_full_pred, 1)
    x_line = np.linspace(min_val, max_val, 100)
    ax1.plot(x_line, m * x_line + b, color='#e67e22', linewidth=2, label=f'迴歸擬合線 (Slope={m:.2f})')

    # 標記 Top 10 離群值 (紅點與編號)
    top_outlier_indices = top_10_outliers.index
    ax1.scatter(y.loc[top_outlier_indices], y_full_pred.loc[top_outlier_indices],
                color='#e74c3c', s=130, edgecolors='black', linewidth=1.5, label='Top 10 Outliers', zorder=5)

    for idx in top_outlier_indices:
        ax1.annotate(f"#{idx}", (y.loc[idx], y_full_pred.loc[idx]),
                     textcoords="offset points", xytext=(8, 5), fontsize=9, fontweight='bold', color='#c0392b')

    ax1.set_title('實際利潤 vs 預測利潤 (標記 Top 10 離群值與迴歸線)', fontsize=13, fontweight='bold', pad=10)
    ax1.set_xlabel('實際利潤 (Actual Profit)', fontsize=11)
    ax1.set_ylabel('模型預測利潤 (Predicted Profit)', fontsize=11)
    ax1.legend(loc='upper left', frameon=True)

    # 子圖 2: 殘差圖 (Residual Plot)
    ax2 = fig.add_subplot(2, 2, 2)
    residuals = ols_model.resid
    ax2.scatter(y_full_pred, residuals, color='#34495e', alpha=0.6, edgecolors='k', s=60)
    ax2.axhline(0, color='red', linestyle='--', linewidth=1.8)
    ax2.scatter(y_full_pred.loc[top_outlier_indices], residuals.loc[top_outlier_indices],
                color='#e74c3c', s=120, edgecolors='black', linewidth=1.5, zorder=5)

    for idx in top_outlier_indices:
        ax2.annotate(f"#{idx}", (y_full_pred.loc[idx], residuals.loc[idx]),
                     textcoords="offset points", xytext=(8, 4), fontsize=9, fontweight='bold', color='#c0392b')

    ax2.set_title('殘差圖 (Residuals vs Fitted Values)', fontsize=13, fontweight='bold', pad=10)
    ax2.set_xlabel('預測利潤 (Fitted Profit)', fontsize=11)
    ax2.set_ylabel('殘差 (Residuals)', fontsize=11)

    # 子圖 3: 庫克距離圖 (Cook\'s Distance Plot)
    ax3 = fig.add_subplot(2, 2, 3)
    n = len(df)
    threshold = 4 / n
    ax3.stem(range(n), cooks_d, markerfmt="o", linefmt="grey", basefmt="r-")
    ax3.axhline(threshold, color='crimson', linestyle='--', linewidth=1.5, label=f'常見門檻值 (4/n = {threshold:.3f})')

    # 高亮前 10 大點
    ax3.scatter(top_outlier_indices, cooks_d[top_outlier_indices], color='red', s=70, zorder=5)
    for idx in top_outlier_indices[:5]:  # 標記前 5 大最突出點編號
        ax3.annotate(f"#{idx}", (idx, cooks_d[idx]), textcoords="offset points", xytext=(0, 6), ha='center', fontsize=9, fontweight='bold', color='darkred')

    ax3.set_title('各樣本庫克距離 (Cook\'s Distance - 影響力分析)', fontsize=13, fontweight='bold', pad=10)
    ax3.set_xlabel('樣本索引 (Sample Index)', fontsize=11)
    ax3.set_ylabel('Cook\'s Distance', fontsize=11)
    ax3.legend(loc='upper right')

    # 子圖 4: 6 個模型的 Adjusted R2 與 RMSE 比較條形圖
    ax4 = fig.add_subplot(2, 2, 4)
    x_indices = np.arange(len(summary_df))
    width = 0.35

    color_adj = '#2980b9'
    ax4.bar(x_indices - width/2, summary_df['Test_Adj_R2'], width, label='Test Adjusted R²', color=color_adj, alpha=0.85)
    ax4.set_ylabel('Adjusted R²', color=color_adj, fontsize=11, fontweight='bold')
    ax4.tick_params(axis='y', labelcolor=color_adj)
    ax4.set_ylim([0.85, 1.0])

    # 雙 Y 軸繪製 RMSE
    ax4_twin = ax4.twinx()
    color_rmse = '#d35400'
    ax4_twin.bar(x_indices + width/2, summary_df['Test_RMSE'], width, label='Test RMSE', color=color_rmse, alpha=0.85)
    ax4_twin.set_ylabel('RMSE', color=color_rmse, fontsize=11, fontweight='bold')
    ax4_twin.tick_params(axis='y', labelcolor=color_rmse)

    ax4.set_xticks(x_indices)
    ax4.set_xticklabels([m.replace(" ", "\n") for m in summary_df['Model']], fontsize=9)
    ax4.set_title('6 種特徵選擇模型表現綜合比較 (Adjusted R² & RMSE)', fontsize=13, fontweight='bold', pad=10)

    plt.tight_layout()
    chart_output_path = "startups_regression_analysis.png"
    plt.savefig(chart_output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"\n[完成] 視覺化整合圖表已儲存至：{chart_output_path}")

    # 輸出特徵選擇矩陣 Heatmap
    plt.figure(figsize=(10, 5))
    feat_matrix = pd.DataFrame(index=summary_df['Model'], columns=feature_names, data=0)
    for model_name, feats in selected_features_dict.items():
        feat_matrix.loc[model_name, feats] = 1

    sns.heatmap(feat_matrix, annot=True, cmap="Blues", cbar=False, linewidths=1, linecolor='gray')
    plt.title('特徵選擇結果矩陣 (1: 納入模型, 0: 剔除特徵)', fontsize=13, fontweight='bold', pad=10)
    plt.ylabel('模型方法')
    plt.tight_layout()
    heatmap_output_path = "feature_selection_matrix.png"
    plt.savefig(heatmap_output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[完成] 特徵選擇矩陣已儲存至：{heatmap_output_path}")

    # 儲存評估結果為 CSV
    summary_df.to_csv("model_comparison_results.csv", index=False, encoding='utf-8-sig')
    top_10_outliers.to_csv("top_10_outliers.csv", encoding='utf-8-sig')
    print("[完成] 模型比較表與 Top 10 離群值表已分別儲存為 CSV。")
    print("=" * 80)

if __name__ == "__main__":
    main()
