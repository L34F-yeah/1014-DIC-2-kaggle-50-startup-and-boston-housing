// ==============================================================================
// 50 Startups Interactive Machine Learning Dashboard - Application Logic
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化資料與狀態
  let currentSortCol = 'id';
  let isSortAsc = true;
  let activeTab = 'tab-bu';
  let chartInstances = {};
  let currentSelectedOutlierId = null;

  // 2. 主題切換 (Light / Dark Theme)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  themeToggleBtn.addEventListener('click', () => {
    const htmlElem = document.documentElement;
    const currentTheme = htmlElem.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElem.setAttribute('data-theme', newTheme);
    themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    // 重新繪製所有圖表以適配背景與文字顏色
    updateChartsTheme(newTheme);
  });

  // 3. CRISP-DM Stepper Tabs 切換
  const stepBtns = document.querySelectorAll('.step-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      if (activeTab === targetTabId) return;

      stepBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        targetContent.classList.add('active');
        activeTab = targetTabId;
        // 延遲初始化或重整當前標籤頁內的圖表以避免 canvas 縮放問題
        triggerChartsForTab(targetTabId);
      }
    });
  });

  // 4. 初始化 TAB 2：資料探索 (Data Understanding)
  renderDataTable();
  renderStateDistributionChart();
  renderCorrelationChart();

  // 搜尋與篩選事件
  document.getElementById('searchInput').addEventListener('input', renderDataTable);
  document.getElementById('stateFilterSelect').addEventListener('change', renderDataTable);

  // 表格標頭點擊排序
  document.querySelectorAll('#startupsDataTable th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (currentSortCol === col) {
        isSortAsc = !isSortAsc;
      } else {
        currentSortCol = col;
        isSortAsc = true;
      }
      renderDataTable();
    });
  });

  // 5. 初始化 TAB 3：資料準備 (Model A vs B & VIF)
  setupModelAToggle();
  renderVIFTable();

  // 6. 初始化 TAB 4：特徵選擇與模型 (6 Models)
  renderModelCards();
  renderFeatureMatrixTable();

  // 7. 初始化 TAB 5：模型評估與離群值 (Top 10 Outliers)
  renderOutliersTable();
  // 延遲繪製評估圖表
  setTimeout(() => {
    renderEvaluationCharts();
  }, 100);

  // 8. 初始化 TAB 6：即時預測模擬器 (Live Simulator)
  setupLiveSimulator();

  // --------------------------------------------------------------------------
  // 函式定義區
  // --------------------------------------------------------------------------

  // 格式化美金
  function formatUSD(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  }

  // 渲染資料表
  function renderDataTable() {
    const tableBody = document.getElementById('tableBody');
    const searchVal = document.getElementById('searchInput').value.trim().toLowerCase();
    const stateVal = document.getElementById('stateFilterSelect').value;

    let filtered = STARTUPS_DATA.filter(item => {
      const matchState = (stateVal === 'ALL') || (item.state === stateVal);
      const matchSearch = item.id.toString().includes(searchVal) ||
        item.state.toLowerCase().includes(searchVal) ||
        item.profit.toString().includes(searchVal) ||
        item.rd.toString().includes(searchVal) ||
        item.marketing.toString().includes(searchVal);
      return matchState && matchSearch;
    });

    // 排序
    filtered.sort((a, b) => {
      let valA = a[currentSortCol];
      let valB = b[currentSortCol];
      if (typeof valA === 'string') {
        return isSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return isSortAsc ? valA - valB : valB - valA;
    });

    document.getElementById('tableRecordCount').textContent = `共 ${filtered.length} 筆`;

    tableBody.innerHTML = filtered.map(row => {
      const isTopOutlier = TOP_10_OUTLIERS.some(o => o.id === row.id);
      const rowClass = isTopOutlier ? 'outlier-highlight' : '';
      const outlierTag = isTopOutlier ? ' <span class="badge badge-danger">Outlier</span>' : '';
      return `
        <tr class="${rowClass}">
          <td><strong>#${row.id}</strong>${outlierTag}</td>
          <td>${formatUSD(row.rd)}</td>
          <td>${formatUSD(row.admin)}</td>
          <td>${formatUSD(row.marketing)}</td>
          <td><span class="badge ${getStateBadgeClass(row.state)}">${row.state}</span></td>
          <td style="font-weight: 700; color: #10b981;">${formatUSD(row.profit)}</td>
        </tr>
      `;
    }).join('');
  }

  function getStateBadgeClass(state) {
    if (state === 'California') return 'badge-primary';
    if (state === 'Florida') return 'badge-success';
    return 'badge-warning';
  }

  // 繪製州別圓餅圖
  function renderStateDistributionChart() {
    const ctx = document.getElementById('statePieChart');
    if (!ctx) return;
    
    const stateCounts = { 'New York': 0, 'California': 0, 'Florida': 0 };
    STARTUPS_DATA.forEach(d => stateCounts[d.state]++);

    chartInstances.statePie = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['New York (17 家)', 'California (17 家)', 'Florida (16 家)'],
        datasets: [{
          data: [stateCounts['New York'], stateCounts['California'], stateCounts['Florida']],
          backgroundColor: ['#6366f1', '#06b6d4', '#10b981'],
          borderWidth: 2,
          borderColor: '#111827'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: getTextColor() } }
        }
      }
    });
  }

  // 繪製特徵與獲利相關係數條形圖
  function renderCorrelationChart() {
    const ctx = document.getElementById('correlationBarChart');
    if (!ctx) return;

    chartInstances.correlationBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['R&D Spend (研發)', 'Marketing Spend (行銷)', 'Administration (行政)'],
        datasets: [{
          label: '與 Profit (獲利) 之皮爾森相關係數 (Pearson r)',
          data: [0.9729, 0.7478, 0.2007],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { min: 0, max: 1.0, ticks: { color: getTextColor() }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: getTextColor() }, grid: { display: false } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // 設定 Model A vs Model B 切換器
  function setupModelAToggle() {
    const btnA = document.getElementById('btnModelA');
    const btnB = document.getElementById('btnModelB');
    const display = document.getElementById('modelFormulaDisplay');
    const explanation = document.getElementById('modelExplanationBox');

    function setModelB() {
      btnB.classList.add('active');
      btnA.classList.remove('active');
      display.innerHTML = `
        <span class="formula-tag">Model B (With Intercept, Drop California)</span><br>
        <strong>ŷ = 50,125.34 + 0.8057*(R&D) - 0.0268*(Admin) + 0.0272*(Marketing) + 198.79*(FL) - 169.85*(NY)</strong>
      `;
      explanation.innerHTML = `
        <p><strong>✅ 為什麼這是最佳實踐？</strong></p>
        <p>
          1. <strong>避免虛擬變數陷阱：</strong>三個州別的指示變數相加為 1 (CA + FL + NY = 1)，若同時保留三者且加上常數截距項 $b$，將造成完全多元共線性 (Perfect Multicollinearity)，矩陣無法求逆。<br>
          2. <strong>加州就是截距項：</strong>以加州 (California) 為基準類別 (Baseline)。當 $FL = 0$ 且 $NY = 0$ 時，該企業必然位於加州，此時截距項 <strong>$50,125.34</strong> 即代表加州企業的基準獲利！<br>
          3. <strong>相對增量係數：</strong>$FL (+198.79)$ 代表佛州比加州平均微幅高出約 $199 美元；$NY (-169.85)$ 代表紐約比加州微幅減少約 $170 美元（兩者 p-value 皆大於 0.9，表示州別影響極微弱）。
        </p>
      `;
    }

    function setModelA() {
      btnA.classList.add('active');
      btnB.classList.remove('active');
      display.innerHTML = `
        <span class="formula-tag" style="background: #f59e0b;">Model A (Full One-Hot, No Intercept)</span><br>
        <strong>ŷ = 50,125.34*(CA) + 50,324.13*(FL) + 49,955.49*(NY) + 0.8057*(R&D) - 0.0268*(Admin) + 0.0272*(Marketing)</strong>
      `;
      explanation.innerHTML = `
        <p><strong>⚠️ Model A 的特性與風險：</strong></p>
        <p>
          1. <strong>無常數項 ($b = 0$)：</strong>強制取消截距項，直接為三個州各自估計獨立的基準常數權重。<br>
          2. <strong>傳統統計統計量失效：</strong>取消截距項後，傳統判定係數 $R^2$ 與 F 檢定的分母定義會產生偏移，部分統計軟體輸出的 $R^2$ 會呈現不合理的過高虛假數值。<br>
          3. 雖然預測值在數值上與 Model B 完全等價，但<strong>Model B 具備更健全的統計推論意義</strong>，因此講義強烈指定採用 Model B。
        </p>
      `;
    }

    btnB.addEventListener('click', setModelB);
    btnA.addEventListener('click', setModelA);
    setModelB(); // 預設 Model B
  }

  // 渲染 VIF 表格
  function renderVIFTable() {
    const tbody = document.getElementById('vifTableBody');
    tbody.innerHTML = VIF_DATA.map(item => `
      <tr>
        <td><strong>${item.feature}</strong></td>
        <td style="font-family: monospace; font-size: 0.95rem;">${item.vif.toFixed(4)}</td>
        <td><span class="badge badge-success">${item.status}</span></td>
        <td><span style="color: ${item.color}; font-weight: bold;">${item.risk}</span></td>
      </tr>
    `).join('');
  }

  // 渲染 6 大模型卡片
  function renderModelCards() {
    const container = document.getElementById('modelsCardsGrid');
    container.innerHTML = MODELS_SUMMARY.map(m => `
      <div class="card" style="border-top: 3px solid ${m.badgeColor};">
        <div class="card-header" style="margin-bottom: 0.75rem;">
          <h4 style="font-size: 1rem; color: var(--text-main);">${m.name}</h4>
          <span class="badge" style="background: rgba(255,255,255,0.08); color: ${m.badgeColor};">${m.type}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          <strong>選入特徵 (${m.featureCount} 個)：</strong><br>
          <span style="color: ${m.badgeColor};">${m.features.join(', ')}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem; background: rgba(0,0,0,0.2); padding: 0.6rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
          <div>Test R²: <strong>${m.testR2.toFixed(4)}</strong></div>
          <div style="color: #34d399;">Test Adj R²: <strong>${m.testAdjR2.toFixed(4)}</strong></div>
          <div>RMSE: <strong>$${m.testRMSE.toFixed(0)}</strong></div>
          <div>MAE: <strong>$${m.testMAE.toFixed(0)}</strong></div>
        </div>
        <div style="font-family: monospace; font-size: 0.72rem; color: var(--text-dim); overflow-x: auto; white-space: nowrap; padding-bottom: 0.25rem;">
          ${m.formula}
        </div>
      </div>
    `).join('');
  }

  // 渲染特徵選擇矩陣
  function renderFeatureMatrixTable() {
    const tbody = document.getElementById('matrixTableBody');
    tbody.innerHTML = MODELS_SUMMARY.map(m => {
      const hasRD = m.features.includes("R&D Spend") ? '✓' : '✗';
      const hasAdmin = m.features.includes("Administration") ? '✓' : '✗';
      const hasMkt = m.features.includes("Marketing Spend") ? '✓' : '✗';
      const hasFL = m.features.includes("State_Florida") ? '✓' : '✗';
      const hasNY = m.features.includes("State_New York") ? '✓' : '✗';

      return `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td class="matrix-cell ${hasRD === '✓' ? 'matrix-active' : 'matrix-inactive'}">${hasRD}</td>
          <td class="matrix-cell ${hasAdmin === '✓' ? 'matrix-active' : 'matrix-inactive'}">${hasAdmin}</td>
          <td class="matrix-cell ${hasMkt === '✓' ? 'matrix-active' : 'matrix-inactive'}">${hasMkt}</td>
          <td class="matrix-cell ${hasFL === '✓' ? 'matrix-active' : 'matrix-inactive'}">${hasFL}</td>
          <td class="matrix-cell ${hasNY === '✓' ? 'matrix-active' : 'matrix-inactive'}">${hasNY}</td>
          <td style="text-align: center; font-weight: bold; color: var(--primary);">${m.featureCount} 個</td>
        </tr>
      `;
    }).join('');
  }

  // 渲染 Top 10 離群值表格
  function renderOutliersTable() {
    const tbody = document.getElementById('outliersTableBody');
    tbody.innerHTML = TOP_10_OUTLIERS.map(item => `
      <tr style="cursor: pointer;" data-outlier-id="${item.id}" class="outlier-row">
        <td><span class="badge badge-danger">#${item.rank}</span></td>
        <td><strong>Sample #${item.id}</strong></td>
        <td><span class="badge ${getStateBadgeClass(item.state)}">${item.state}</span></td>
        <td>${formatUSD(item.actual)}</td>
        <td>${formatUSD(item.predicted)}</td>
        <td style="color: ${item.residual < 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">${formatUSD(item.residual)}</td>
        <td>${item.studentized.toFixed(2)}</td>
        <td style="font-weight: 800; color: #ec4899;">${item.cooksD.toFixed(4)}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${item.note}</td>
      </tr>
    `).join('');

    // 點擊離群值列時高亮圖表
    document.querySelectorAll('.outlier-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = parseInt(row.getAttribute('data-outlier-id'));
        highlightOutlierOnCharts(id);
      });
    });
  }

  // 高亮特定離群值
  function highlightOutlierOnCharts(sampleId) {
    currentSelectedOutlierId = sampleId;
    document.querySelectorAll('.outlier-row').forEach(r => {
      r.style.outline = (parseInt(r.getAttribute('data-outlier-id')) === sampleId) ? '2px solid #ef4444' : 'none';
    });

    if (chartInstances.scatter) {
      chartInstances.scatter.update();
    }
    if (chartInstances.residuals) {
      chartInstances.residuals.update();
    }
  }

  // 渲染評估圖表 (Scatter, Residuals, Cook's Distance, Model Comparison)
  function renderEvaluationCharts() {
    // 1. 散布圖與迴歸擬合線
    const scatterCtx = document.getElementById('scatterRegressionChart');
    if (scatterCtx && !chartInstances.scatter) {
      const normalData = [];
      const outlierData = [];

      STARTUPS_DATA.forEach(d => {
        const isOutlier = TOP_10_OUTLIERS.some(o => o.id === d.id);
        const pred = MODEL_B_PARAMS.intercept +
          MODEL_B_PARAMS.coef_rd * d.rd +
          MODEL_B_PARAMS.coef_admin * d.admin +
          MODEL_B_PARAMS.coef_marketing * d.marketing +
          (d.state === 'Florida' ? MODEL_B_PARAMS.coef_florida : 0) +
          (d.state === 'New York' ? MODEL_B_PARAMS.coef_newyork : 0);

        const point = { x: d.profit, y: pred, id: d.id, state: d.state, residual: d.profit - pred };
        if (isOutlier) {
          outlierData.push(point);
        } else {
          normalData.push(point);
        }
      });

      // 45 度理想線 (y = x)
      const lineData = [
        { x: 10000, y: 10000 },
        { x: 200000, y: 200000 }
      ];

      // 迴歸趨勢線
      const fitLineData = [
        { x: 10000, y: 10000 * 0.95 + 5600 },
        { x: 200000, y: 200000 * 0.95 + 5600 }
      ];

      chartInstances.scatter = new Chart(scatterCtx, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: '一般初創企業 (Normal Samples)',
              data: normalData,
              backgroundColor: 'rgba(99, 102, 241, 0.75)',
              pointRadius: 6,
              pointHoverRadius: 9
            },
            {
              label: 'Top 10 離群值 (Influential Outliers)',
              data: outlierData,
              backgroundColor: 'rgba(239, 68, 68, 0.95)',
              pointRadius: 9,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointHoverRadius: 13
            },
            {
              type: 'line',
              label: '完美預測線 (y = x)',
              data: lineData,
              borderColor: '#10b981',
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0
            },
            {
              type: 'line',
              label: '迴歸擬合線 (Regression Trend)',
              data: fitLineData,
              borderColor: '#f59e0b',
              borderWidth: 2.5,
              fill: false,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: { display: true, text: '實際利潤 Actual Profit ($)', color: getTextColor() },
              ticks: { color: getTextColor() },
              grid: { color: 'rgba(255,255,255,0.06)' }
            },
            y: {
              title: { display: true, text: '模型預測利潤 Predicted Profit ($)', color: getTextColor() },
              ticks: { color: getTextColor() },
              grid: { color: 'rgba(255,255,255,0.06)' }
            }
          },
          plugins: {
            legend: { labels: { color: getTextColor() } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const raw = ctx.raw;
                  if (!raw.id) return `${ctx.dataset.label}`;
                  return `Sample #${raw.id} (${raw.state}): 實際 $${Math.round(raw.x).toLocaleString()}, 預測 $${Math.round(raw.y).toLocaleString()}, 殘差 $${Math.round(raw.residual).toLocaleString()}`;
                }
              }
            }
          }
        }
      });
    }

    // 2. 殘差圖 (Residuals Plot)
    const residCtx = document.getElementById('residualsChart');
    if (residCtx && !chartInstances.residuals) {
      const residPoints = STARTUPS_DATA.map(d => {
        const pred = MODEL_B_PARAMS.intercept +
          MODEL_B_PARAMS.coef_rd * d.rd +
          MODEL_B_PARAMS.coef_admin * d.admin +
          MODEL_B_PARAMS.coef_marketing * d.marketing +
          (d.state === 'Florida' ? MODEL_B_PARAMS.coef_florida : 0) +
          (d.state === 'New York' ? MODEL_B_PARAMS.coef_newyork : 0);
        const resid = d.profit - pred;
        const isOutlier = TOP_10_OUTLIERS.some(o => o.id === d.id);
        return {
          x: pred,
          y: resid,
          id: d.id,
          isOutlier: isOutlier
        };
      });

      chartInstances.residuals = new Chart(residCtx, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: '殘差分佈 (Residuals)',
              data: residPoints,
              backgroundColor: residPoints.map(p => p.isOutlier ? '#ef4444' : '#60a5fa'),
              pointRadius: residPoints.map(p => p.isOutlier ? 8 : 5)
            },
            {
              type: 'line',
              label: '零殘差基準線 (Residual = 0)',
              data: [{ x: 40000, y: 0 }, { x: 200000, y: 0 }],
              borderColor: '#ef4444',
              borderDash: [6, 4],
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: '擬合預測值 Fitted Values ($)', color: getTextColor() }, ticks: { color: getTextColor() }, grid: { color: 'rgba(255,255,255,0.06)' } },
            y: { title: { display: true, text: '殘差 Residual ($)', color: getTextColor() }, ticks: { color: getTextColor() }, grid: { color: 'rgba(255,255,255,0.06)' } }
          },
          plugins: {
            legend: { labels: { color: getTextColor() } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const raw = ctx.raw;
                  if (!raw.id) return ctx.dataset.label;
                  return `Sample #${raw.id}: 擬合值 $${Math.round(raw.x).toLocaleString()}, 殘差 $${Math.round(raw.y).toLocaleString()}`;
                }
              }
            }
          }
        }
      });
    }

    // 3. 庫克距離圖 (Cook's Distance)
    const cooksCtx = document.getElementById('cooksDistanceChart');
    if (cooksCtx && !chartInstances.cooks) {
      // 依樣本 ID 0-49 映射庫克距離
      const sampleCooks = new Array(50).fill(0.015);
      TOP_10_OUTLIERS.forEach(o => {
        sampleCooks[o.id] = o.cooksD;
      });

      chartInstances.cooks = new Chart(cooksCtx, {
        type: 'bar',
        data: {
          labels: Array.from({ length: 50 }, (_, i) => `#${i}`),
          datasets: [
            {
              label: "Cook's Distance",
              data: sampleCooks,
              backgroundColor: sampleCooks.map(val => val > 0.08 ? '#ef4444' : '#6366f1'),
              borderRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: getTextColor(), maxRotation: 90, font: { size: 9 } }, grid: { display: false } },
            y: {
              title: { display: true, text: "Cook's Distance", color: getTextColor() },
              ticks: { color: getTextColor() },
              grid: { color: 'rgba(255,255,255,0.06)' }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // 4. 6 大模型比較圖 (Adjusted R² vs RMSE)
    const modelsCompCtx = document.getElementById('modelsComparisonChart');
    if (modelsCompCtx && !chartInstances.modelsComp) {
      chartInstances.modelsComp = new Chart(modelsCompCtx, {
        type: 'bar',
        data: {
          labels: MODELS_SUMMARY.map(m => m.name.replace('Sequential Forward Selection', 'SFS')),
          datasets: [
            {
              label: 'Test Adjusted R²',
              data: MODELS_SUMMARY.map(m => m.testAdjR2),
              backgroundColor: '#3b82f6',
              yAxisID: 'y'
            },
            {
              label: 'Test RMSE ($)',
              data: MODELS_SUMMARY.map(m => m.testRMSE),
              backgroundColor: '#f59e0b',
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: getTextColor() }, grid: { display: false } },
            y: {
              type: 'linear',
              position: 'left',
              min: 0.7,
              max: 1.0,
              title: { display: true, text: 'Adjusted R²', color: '#3b82f6' },
              ticks: { color: '#3b82f6' }
            },
            y1: {
              type: 'linear',
              position: 'right',
              min: 7000,
              max: 11000,
              title: { display: true, text: 'RMSE ($)', color: '#f59e0b' },
              ticks: { color: '#f59e0b' },
              grid: { display: false }
            }
          },
          plugins: {
            legend: { labels: { color: getTextColor() } }
          }
        }
      });
    }
  }

  // 9. 即時預測模擬器 (What-If Simulator) 邏輯
  function setupLiveSimulator() {
    const sliderRD = document.getElementById('sliderRD');
    const sliderAdmin = document.getElementById('sliderAdmin');
    const sliderMkt = document.getElementById('sliderMarketing');
    const selectState = document.getElementById('simStateSelect');
    const selectModel = document.getElementById('simModelSelect');

    const labelRD = document.getElementById('labelValRD');
    const labelAdmin = document.getElementById('labelValAdmin');
    const labelMkt = document.getElementById('labelValMarketing');
    const resultProfit = document.getElementById('simPredictedProfit');
    const resultCI = document.getElementById('simConfidenceInterval');

    // Waterfall 貢獻度長條圖
    const waterfallCtx = document.getElementById('waterfallBarChart');
    let waterfallChart = null;

    function recalculate() {
      const rd = parseFloat(sliderRD.value);
      const admin = parseFloat(sliderAdmin.value);
      const mkt = parseFloat(sliderMkt.value);
      const state = selectState.value;
      const model = selectModel.value;

      labelRD.textContent = formatUSD(rd);
      labelAdmin.textContent = formatUSD(admin);
      labelMkt.textContent = formatUSD(mkt);

      let baseIntercept = 50125.34;
      let wRD = 0.8057;
      let wAdmin = -0.0268;
      let wMkt = 0.0272;
      let wState = 0;

      if (model === 'lassocv' || model === 'sfs' || model === 'elasticnet' || model === 'efs') {
        // 州別特徵被篩除，係數為 0
        wState = 0;
      } else {
        if (state === 'Florida') wState = 198.79;
        if (state === 'New York') wState = -169.85;
      }

      const contribBase = baseIntercept;
      const contribRD = wRD * rd;
      const contribAdmin = wAdmin * admin;
      const contribMkt = wMkt * mkt;
      const contribState = wState;

      const totalProfit = contribBase + contribRD + contribAdmin + contribMkt + contribState;
      resultProfit.textContent = formatUSD(totalProfit);

      const ciLow = totalProfit - 1.96 * 8995 / Math.sqrt(10);
      const ciHigh = totalProfit + 1.96 * 8995 / Math.sqrt(10);
      resultCI.textContent = `95% 信賴區間：${formatUSD(ciLow)} ~ ${formatUSD(ciHigh)}`;

      // 更新貢獻度條形圖
      const contribData = [contribBase, contribRD, contribAdmin, contribMkt, contribState];
      if (!waterfallChart && waterfallCtx) {
        waterfallChart = new Chart(waterfallCtx, {
          type: 'bar',
          data: {
            labels: ['基準項 (Base)', '研發 (R&D)', '行政 (Admin)', '行銷 (Mkt)', '州別 (State)'],
            datasets: [{
              label: '貢獻金額 ($)',
              data: contribData,
              backgroundColor: contribData.map(v => v >= 0 ? '#10b981' : '#ef4444'),
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: getTextColor() }, grid: { display: false } },
              y: { ticks: { color: getTextColor() }, grid: { color: 'rgba(255,255,255,0.06)' } }
            },
            plugins: { legend: { display: false } }
          }
        });
      } else if (waterfallChart) {
        waterfallChart.data.datasets[0].data = contribData;
        waterfallChart.data.datasets[0].backgroundColor = contribData.map(v => v >= 0 ? '#10b981' : '#ef4444');
        waterfallChart.update();
      }
    }

    sliderRD.addEventListener('input', recalculate);
    sliderAdmin.addEventListener('input', recalculate);
    sliderMkt.addEventListener('input', recalculate);
    selectState.addEventListener('change', recalculate);
    selectModel.addEventListener('change', recalculate);

    recalculate();
  }

  // 取得當前主題文字顏色
  function getTextColor() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#9ca3af';
  }

  // 更新所有圖表的主題色彩
  function updateChartsTheme(theme) {
    const textColor = theme === 'light' ? '#334155' : '#9ca3af';
    Object.values(chartInstances).forEach(chart => {
      if (chart && chart.options) {
        if (chart.options.scales) {
          Object.values(chart.options.scales).forEach(scale => {
            if (scale.ticks) scale.ticks.color = textColor;
            if (scale.title) scale.title.color = textColor;
          });
        }
        if (chart.options.plugins && chart.options.plugins.legend) {
          chart.options.plugins.legend.labels.color = textColor;
        }
        chart.update();
      }
    });
  }

  // 當特定分頁顯示時重繪圖表
  function triggerChartsForTab(tabId) {
    if (tabId === 'tab-eval') {
      setTimeout(() => {
        renderEvaluationCharts();
        if (chartInstances.scatter) chartInstances.scatter.resize();
        if (chartInstances.residuals) chartInstances.residuals.resize();
        if (chartInstances.cooks) chartInstances.cooks.resize();
        if (chartInstances.modelsComp) chartInstances.modelsComp.resize();
      }, 50);
    }
  }
});
