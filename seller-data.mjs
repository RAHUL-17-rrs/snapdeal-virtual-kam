// Mock seller data + deterministic analytics. The LLM narrates; all maths happens here.
// Rajesh's core metrics come straight from the assignment brief. Everything marked ASSUMPTION is mock data we added.
// Each seller has a DIFFERENT root cause, to show the agent isn't scripted around one story.

const UPCOMING_EVENT = "Snapdeal Winter Saver Sale, starts in 9 days";

// ======================================================================= SELLERS
const RAJESH = {
  seller_id: "SD-SLR-48213", name: "Rajesh Kumar", business: "Kumar Home & Kitchen", city: "Jaipur", category: "Home & Kitchen", tier: "Silver",
  metrics: {
    last_month: { sales: 200000, orders: 400, cancellation_rate: 0.08, asp: 500, out_of_stock_products: 5 },
    this_month: { sales: 135000, orders: 270, cancellation_rate: 0.14, asp: 500, out_of_stock_products: 18 },
  },
  total_live_skus: 60,
  top_skus: [
    { sku: "KH-101", keywords: "pressure cooker|cooker", name: "Stainless Steel Pressure Cooker 3L", last_month_orders: 62, stock: 0, oos_days: 11 },
    { sku: "KH-114", keywords: "tawa", name: "Non-stick Tawa 28cm", last_month_orders: 48, stock: 0, oos_days: 9 },
    { sku: "KH-122", keywords: "jar|storage", name: "Glass Storage Jar Set (6 pc)", last_month_orders: 41, stock: 3, oos_days: 0 },
    { sku: "KH-130", keywords: "towel", name: "Cotton Kitchen Towels (pack of 12)", last_month_orders: 37, stock: 0, oos_days: 14 },
    { sku: "KH-145", keywords: "bottle", name: "Steel Water Bottle 1L", last_month_orders: 33, stock: 120, oos_days: 0 },
    { sku: "KH-152", keywords: "spice rack|spice", name: "Spice Rack Organiser", last_month_orders: 29, stock: 0, oos_days: 7 },
  ],
  cancellation_reasons: [
    { reason: "Seller cancelled - out of stock after order", share: 0.55, type: "stock" },
    { reason: "Late dispatch / SLA breach", share: 0.25, type: "dispatch" },
    { reason: "Customer changed mind", share: 0.12, type: "customer" },
    { reason: "Price found lower elsewhere", share: 0.08, type: "price" },
  ],
  late_dispatch: { last_month: 0.03, this_month: 0.04 },
  visibility: { search_impressions_change: -0.22, seller_rating: { last_month: 4.3, this_month: 4.0 }, active_promotions: 0, ads_active: true, upcoming_event: UPCOMING_EVENT },
  pricing: {
    verdict: "Do not cut prices across the board. Average selling price is flat and the drop is entirely volume, so a blanket discount just gives away margin.",
    skus: [
      { sku: "KH-101", name: "Pressure Cooker 3L", your_price: 1249, category_median: 1199, buy_box: false, monthly_loss_rs: 0, est_monthly_gain_rs: 4000, margin_pct: 22, note: "4% above median; worth matching once restocked" },
      { sku: "KH-114", name: "Non-stick Tawa", your_price: 449, category_median: 459, buy_box: true, note: "competitive" },
      { sku: "KH-145", name: "Steel Water Bottle 1L", your_price: 299, category_median: 309, buy_box: true, note: "competitive" },
      { sku: "KH-122", name: "Glass Jar Set", your_price: 599, category_median: 589, buy_box: true, note: "at par" },
    ],
  },
  rating_insight: {
    last_month: 4.3, this_month: 4.0,
    drivers: [
      { driver: "Seller-cancelled orders (stock-outs)", impact: "high", detail: "21 cancellations this month; each one counts against seller rating" },
      { driver: "Late dispatch", impact: "medium", detail: "10 orders breached the 48-hour dispatch SLA" },
      { driver: "Product reviews", impact: "low", detail: "Reviews average 4.2; recurring theme: 'packaging could be better' on glass jars" },
    ],
    recovery: "Rating recalculates on a rolling 30-day window, so fixing cancellations shows up in about 3-4 weeks.",
  },
  assumptions: { sale_uplift_rs: 15000 }, // ASSUMPTION: sale participants see ~15% uplift on in-stock catalogue
  story: "Stock-outs -> post-order cancellations and fewer buyable listings -> worse rating and ranking -> fewer impressions -> fewer orders. Price is flat, so this is a volume problem.",
  remainder_label: "Lower visibility & other",
  day7: {
    days_since_last_call: 7,
    metrics_last_7_days: { orders: 82, cancellation_rate: 0.09, out_of_stock_products: 9, search_impressions_change_vs_prev_week: 0.11 },
    commitments: [
      { title: "Stock alerts + auto-pause", owner: "kam", status: "done", result: "zero oversold orders this week" },
      { title: "Enrol in Winter Saver Sale", owner: "kam", status: "done", result: "10 SKUs live, sale starts in 2 days" },
      { title: "Restock Non-stick Tawa and Kitchen Towels", owner: "seller", status: "done", result: "back in stock" },
      { title: "Restock Pressure Cooker 3L (KH-101)", owner: "seller", status: "slipped", result: "supplier has not dispatched, still 0 stock. Bestseller, ~62 orders/month" },
      { title: "Restock Spice Rack Organiser", owner: "seller", status: "slipped", result: "still 0 stock" },
    ],
  },
};

// ASSUMPTION (entire profile): price war -> lost Buy Box.
const TECHNEST = {
  seller_id: "SD-SLR-48317", name: "Amit Verma", business: "TechNest Accessories", city: "Delhi", category: "Mobile Accessories", tier: "Gold",
  metrics: {
    last_month: { sales: 300000, orders: 1000, cancellation_rate: 0.05, asp: 300, out_of_stock_products: 2 },
    this_month: { sales: 228000, orders: 760, cancellation_rate: 0.05, asp: 300, out_of_stock_products: 3 },
  },
  total_live_skus: 85,
  top_skus: [
    { sku: "TN-201", keywords: "charger", name: "20W USB-C Fast Charger", last_month_orders: 260, stock: 400, oos_days: 0 },
    { sku: "TN-214", keywords: "cable", name: "Braided Type-C Cable 1m", last_month_orders: 220, stock: 650, oos_days: 0 },
    { sku: "TN-250", keywords: "tempered|glass|screen guard", name: "Tempered Glass (pack of 2)", last_month_orders: 180, stock: 900, oos_days: 0 },
    { sku: "TN-260", keywords: "cover|case", name: "Silicone Back Cover", last_month_orders: 150, stock: 500, oos_days: 0 },
    { sku: "TN-245", keywords: "stand", name: "Foldable Phone Stand", last_month_orders: 120, stock: 210, oos_days: 0 },
    { sku: "TN-230", keywords: "earbuds|earphone", name: "TWS Earbuds Pro", last_month_orders: 40, stock: 60, oos_days: 0 },
  ],
  cancellation_reasons: [
    { reason: "Customer changed mind", share: 0.45, type: "customer" },
    { reason: "Price found lower elsewhere", share: 0.35, type: "price" },
    { reason: "Late dispatch / SLA breach", share: 0.1, type: "dispatch" },
    { reason: "Seller cancelled - out of stock after order", share: 0.1, type: "stock" },
  ],
  late_dispatch: { last_month: 0.02, this_month: 0.02 },
  visibility: { search_impressions_change: -0.12, seller_rating: { last_month: 4.4, this_month: 4.4 }, active_promotions: 0, ads_active: false, upcoming_event: UPCOMING_EVENT },
  pricing: {
    verdict: "Pricing IS the problem here. Two competitors cut prices by 6 to 8 percent on chargers and cables, so you lost the Buy Box on 4 bestsellers. Your average price looks flat because you didn't change prices; the market did. Match selectively where margin allows, not across the board.",
    skus: [
      { sku: "TN-201", name: "20W USB-C Fast Charger", your_price: 349, category_median: 325, buy_box: false, monthly_loss_rs: 31410, est_monthly_gain_rs: 25000, margin_pct: 24, note: "7% above Buy Box winner; margin stays 17% if matched" },
      { sku: "TN-214", name: "Braided Type-C Cable", your_price: 199, category_median: 185, buy_box: false, monthly_loss_rs: 11940, est_monthly_gain_rs: 9500, margin_pct: 30, note: "8% above; margin stays 22% if matched" },
      { sku: "TN-230", name: "TWS Earbuds Pro", your_price: 1049, category_median: 979, buy_box: false, monthly_loss_rs: 8392, est_monthly_gain_rs: 6500, margin_pct: 18, note: "7% above; margin drops to 11%, so match only during the sale" },
      { sku: "TN-250", name: "Tempered Glass (2 pack)", your_price: 149, category_median: 139, buy_box: false, monthly_loss_rs: 4470, est_monthly_gain_rs: 3500, margin_pct: 35, note: "7% above; easy match" },
      { sku: "TN-245", name: "Foldable Phone Stand", your_price: 249, category_median: 249, buy_box: true, note: "at par" },
      { sku: "TN-260", name: "Silicone Back Cover", your_price: 199, category_median: 205, buy_box: true, note: "competitive" },
    ],
  },
  rating_insight: { last_month: 4.4, this_month: 4.4, drivers: [{ driver: "Stable", impact: "low", detail: "Dispatch and cancellations are healthy; rating isn't a factor in this drop" }], recovery: "No action needed on rating." },
  assumptions: { sale_uplift_rs: 12000, ads_uplift_rs: 9000 },
  story: "Competitors undercut chargers and cables by 6-8% -> you lost the Buy Box on 4 bestsellers -> buyers default to the cheaper seller -> orders fell 24% even though your own price never changed.",
  remainder_label: "Lower impressions & other",
};

// ASSUMPTION (entire profile): dispatch failure -> cancellations -> rating -> visibility.
const URBAN = {
  seller_id: "SD-SLR-48487", name: "Arjun Banerjee", business: "Urban Threads", city: "Kolkata", category: "Men's Fashion", tier: "Silver",
  metrics: {
    last_month: { sales: 250000, orders: 500, cancellation_rate: 0.07, asp: 500, out_of_stock_products: 4 },
    this_month: { sales: 197500, orders: 395, cancellation_rate: 0.13, asp: 500, out_of_stock_products: 9 },
  },
  total_live_skus: 120,
  top_skus: [
    { sku: "UT-301", keywords: "shirt", name: "Slim Fit Cotton Shirt", last_month_orders: 120, stock: 80, oos_days: 0 },
    { sku: "UT-312", keywords: "chino|trouser|pant", name: "Stretch Chinos", last_month_orders: 95, stock: 60, oos_days: 0 },
    { sku: "UT-325", keywords: "kurta", name: "Linen Kurta", last_month_orders: 90, stock: 0, oos_days: 6 },
    { sku: "UT-330", keywords: "polo|t-shirt|tshirt", name: "Polo T-shirt (pack of 2)", last_month_orders: 85, stock: 140, oos_days: 0 },
    { sku: "UT-344", keywords: "jacket|denim", name: "Denim Jacket", last_month_orders: 40, stock: 25, oos_days: 0 },
  ],
  cancellation_reasons: [
    { reason: "Late dispatch / SLA breach", share: 0.55, type: "dispatch" },
    { reason: "Customer cancelled - delivery date too far", share: 0.2, type: "dispatch" },
    { reason: "Seller cancelled - out of stock after order", share: 0.15, type: "stock" },
    { reason: "Customer changed mind", share: 0.1, type: "customer" },
  ],
  late_dispatch: { last_month: 0.04, this_month: 0.18 },
  visibility: { search_impressions_change: -0.25, seller_rating: { last_month: 4.3, this_month: 3.9 }, active_promotions: 0, ads_active: false, upcoming_event: UPCOMING_EVENT },
  pricing: {
    verdict: "Pricing is fine: you're at or below market on every top SKU. Don't discount; fix delivery.",
    skus: [
      { sku: "UT-301", name: "Slim Fit Cotton Shirt", your_price: 699, category_median: 719, buy_box: true, note: "competitive" },
      { sku: "UT-312", name: "Stretch Chinos", your_price: 899, category_median: 899, buy_box: true, note: "at par" },
      { sku: "UT-325", name: "Linen Kurta", your_price: 799, category_median: 849, buy_box: true, note: "competitive" },
    ],
  },
  rating_insight: {
    last_month: 4.3, this_month: 3.9,
    drivers: [
      { driver: "Late dispatch", impact: "high", detail: "18% of orders shipped after the 48-hour SLA (was 4%)" },
      { driver: "Cancellations from delays", impact: "high", detail: "75% of cancellations are delay-related" },
      { driver: "Product reviews", impact: "low", detail: "Fit and fabric reviews average 4.3; delivery-delay complaints appear in 31% of 1-2 star reviews" },
    ],
    recovery: "Rolling 30-day score: fix dispatch now and the rating can be back above 4.1 in about 4 weeks. Below 3.8 you'd lose sale eligibility, so this is urgent.",
  },
  assumptions: { dispatch_visibility_rs: 18000, sale_uplift_rs: 10000 }, // ASSUMPTION: rating back to 4.2 restores ~60% of lost impressions
  story: "Dispatch slipped (18% late vs 4%) -> customers cancel when delivery dates stretch -> cancellations hit 13% and rating fell to 3.9 -> Snapdeal ranks you lower -> impressions down 25%.",
  remainder_label: "Lower visibility (rating 3.9)",
};

// ASSUMPTION (entire profile): seasonal dip + no promotions while competitors run deals.
const KIDS = {
  seller_id: "SD-SLR-48385", name: "Harpreet Singh", business: "Kids Kingdom Toys", city: "Ludhiana", category: "Toys", tier: "Silver",
  metrics: {
    last_month: { sales: 180000, orders: 450, cancellation_rate: 0.06, asp: 400, out_of_stock_products: 3 },
    this_month: { sales: 124000, orders: 310, cancellation_rate: 0.06, asp: 400, out_of_stock_products: 3 },
  },
  total_live_skus: 70,
  category_demand_change: -0.2,
  competitor_note: "7 of the top 10 toy sellers are running 15-25% deals; you have none",
  top_skus: [
    { sku: "KK-401", keywords: "car|remote", name: "Remote Control Racing Car", last_month_orders: 110, stock: 90, oos_days: 0 },
    { sku: "KK-412", keywords: "block|lego", name: "Building Blocks 500 pc", last_month_orders: 95, stock: 120, oos_days: 0 },
    { sku: "KK-420", keywords: "doctor", name: "Kids Doctor Set", last_month_orders: 70, stock: 45, oos_days: 0 },
    { sku: "KK-433", keywords: "teddy|bear|soft toy", name: "Soft Teddy Bear 2ft", last_month_orders: 60, stock: 200, oos_days: 0 },
    { sku: "KK-440", keywords: "board game|game", name: "Board Game Combo", last_month_orders: 45, stock: 30, oos_days: 0 },
  ],
  cancellation_reasons: [
    { reason: "Customer changed mind", share: 0.5, type: "customer" },
    { reason: "Late dispatch / SLA breach", share: 0.2, type: "dispatch" },
    { reason: "Price found lower elsewhere", share: 0.2, type: "price" },
    { reason: "Seller cancelled - out of stock after order", share: 0.1, type: "stock" },
  ],
  late_dispatch: { last_month: 0.03, this_month: 0.03 },
  visibility: { search_impressions_change: -0.3, seller_rating: { last_month: 4.3, this_month: 4.3 }, active_promotions: 0, ads_active: false, upcoming_event: UPCOMING_EVENT },
  pricing: {
    verdict: "Your list prices are at market, but competitors are running 15-25% deals and you have none, so you look expensive in search. Use a time-bound sale discount, not a permanent price cut.",
    skus: [
      { sku: "KK-401", name: "Remote Control Racing Car", your_price: 799, category_median: 799, buy_box: true, note: "at par, but rivals show deal badges" },
      { sku: "KK-412", name: "Building Blocks 500 pc", your_price: 649, category_median: 629, buy_box: true, note: "slightly above" },
    ],
  },
  rating_insight: { last_month: 4.3, this_month: 4.3, drivers: [{ driver: "Stable", impact: "low", detail: "Operations are healthy; rating isn't the issue" }], recovery: "No action needed on rating." },
  assumptions: { sale_uplift_rs: 15000, ads_uplift_rs: 9000 },
  custom_opps: [
    { id: "festive", issue: "inventory", title: "Stock up top 3 toys for Christmas and winter-holiday demand", recoverable_rs: 22000, ease: "medium", owner: "seller", basis: "ASSUMPTION: toy demand rises ~35% from mid-December; RC car and blocks sell out first" },
    { id: "bundle", issue: "visibility", title: "Create 'Gift Combo' bundles (blocks + board game)", recoverable_rs: 6000, ease: "easy", owner: "kam", basis: "ASSUMPTION: combos lift order value and appear in gifting widgets" },
  ],
  story: "Toy demand is seasonally down 20% across the category, but you fell further (-31%): competitors are running deals and ads while you have no promotions, so you slide down search results.",
  remainder_label: "Lost share: no deals or ads",
};

export const SELLERS = { [RAJESH.seller_id]: RAJESH, [URBAN.seller_id]: URBAN, [TECHNEST.seller_id]: TECHNEST, [KIDS.seller_id]: KIDS };
export const SELLER = RAJESH; // default
export const getSeller = (id) => SELLERS[id] || RAJESH;

// ======================================================================= HELPERS
const pct = (a, b) => Math.round(((b - a) / a) * 1000) / 10;
const oosSkus = (s) => s.top_skus.filter((k) => k.stock === 0);
const oosLostOrders = (s) => Math.round(oosSkus(s).reduce((n, k) => n + k.last_month_orders * (k.oos_days / 30), 0));
const cancelLoss = (s) => { const { last_month: L, this_month: T } = s.metrics; return Math.max(0, Math.round(T.orders * (T.cancellation_rate - L.cancellation_rate))) * T.asp; };
const buyBoxLost = (s) => (s.pricing?.skus || []).filter((p) => p.buy_box === false);
const buyBoxLoss = (s) => buyBoxLost(s).reduce((n, p) => n + (p.monthly_loss_rs || 0), 0);
const cancelDriver = (s) => { const by = {}; for (const r of s.cancellation_reasons) by[r.type] = (by[r.type] || 0) + r.share; return Object.entries(by).sort((a, b) => b[1] - a[1])[0][0]; };
const sev = (rs) => (rs >= 20000 ? "high" : rs >= 8000 ? "medium" : "low");
const rsF = (n) => "Rs " + Math.round(n).toLocaleString("en-IN");

// ======================================================================= DETECT
export function detectAlerts(s = RAJESH) {
  const { last_month: L, this_month: T } = s.metrics;
  const a = [];
  if ((T.sales - L.sales) / L.sales <= -0.2) a.push({ rule: "sales_drop_gt_20pct", text: `Sales down ${Math.round((1 - T.sales / L.sales) * 100)}% month on month` });
  if (T.cancellation_rate >= 0.1) a.push({ rule: "cancellation_gt_10pct", text: `Cancellation rate ${Math.round(T.cancellation_rate * 100)}% (threshold 10%)` });
  if (T.out_of_stock_products >= 2 * L.out_of_stock_products && T.out_of_stock_products >= 6) a.push({ rule: "oos_doubled", text: `Out-of-stock products ${L.out_of_stock_products} -> ${T.out_of_stock_products}` });
  if (s.visibility.seller_rating.this_month < 4.2) a.push({ rule: "rating_below_4_2", text: `Seller rating fell to ${s.visibility.seller_rating.this_month}` });
  if (s.late_dispatch.this_month >= 0.1) a.push({ rule: "late_dispatch_gt_10pct", text: `Late dispatch ${Math.round(s.late_dispatch.this_month * 100)}% (was ${Math.round(s.late_dispatch.last_month * 100)}%)` });
  if (buyBoxLoss(s) > 0) a.push({ rule: "buy_box_lost", text: `Lost Buy Box on ${buyBoxLost(s).length} SKUs` });
  if (s.visibility.search_impressions_change <= -0.2) a.push({ rule: "impressions_drop_gt_20pct", text: `Search impressions ${Math.round(s.visibility.search_impressions_change * 100)}%` });
  return a;
}

// ======================================================================= ANALYTICS: revenue bridge
export function revenueBridge(s = RAJESH) {
  const { last_month: L, this_month: T } = s.metrics;
  const steps = [];
  if (s.category_demand_change) steps.push({ label: "Category demand (seasonal)", value: Math.round(L.sales * s.category_demand_change), issue: "demand" });
  const oos = oosLostOrders(s) * T.asp;
  if (oos) steps.push({ label: "Stock-outs on bestsellers", value: -oos, issue: "inventory" });
  const cl = cancelLoss(s); // ASSUMPTION: excess cancellations above last month's rate are lost sales
  if (cl) steps.push({ label: "Extra cancellations", value: -cl, issue: "cancellations" });
  const bb = buyBoxLoss(s);
  if (bb) steps.push({ label: "Lost Buy Box (price)", value: -bb, issue: "pricing" });
  const aspEffect = (T.asp - L.asp) * T.orders;
  const explained = steps.reduce((n, x) => n + x.value, 0) + aspEffect;
  steps.push({ label: s.remainder_label || "Lower visibility & other", value: (T.sales - L.sales) - explained, issue: "visibility" });
  steps.push({ label: "Avg price change", value: aspEffect, issue: "price_change" });
  return { start: { label: "Last month", value: L.sales }, steps, end: { label: "This month", value: T.sales }, drop: L.sales - T.sales };
}

// ======================================================================= DIAGNOSE
export function diagnose(s = RAJESH) {
  const { last_month: L, this_month: T } = s.metrics;
  const bridge = revenueBridge(s);
  const val = (issue) => -(bridge.steps.find((x) => x.issue === issue)?.value || 0);
  const issues = [];
  if (s.category_demand_change) issues.push({ id: "demand", rs: val("demand"), headline: `Category demand is down ${Math.round(-s.category_demand_change * 100)}% (seasonal)`, evidence: `About ${rsF(val("demand"))} of the drop is the market, not you. But you fell ${Math.round((1 - T.sales / L.sales) * 100)}%, more than the category.` });
  if (s.active_promotions === 0 || (s.visibility.active_promotions === 0 && s.competitor_note)) issues.push({ id: "promotions", rs: val("visibility"), headline: "No promotions or ads while competitors run deals", evidence: `${s.competitor_note}. No sponsored ads running. ${s.visibility.upcoming_event}.` });
  const oos = oosSkus(s);
  if (oos.length && T.out_of_stock_products > L.out_of_stock_products) issues.push({ id: "inventory", rs: val("inventory"), headline: `Out-of-stock products jumped from ${L.out_of_stock_products} to ${T.out_of_stock_products}`, evidence: `${oos.length} of your top ${s.top_skus.length} sellers are at zero stock (${oos.map((k) => k.name).join(", ")}). About ${oosLostOrders(s)} orders (${rsF(val("inventory"))}) lost from these alone.` });
  if (s.late_dispatch.this_month >= 0.08) issues.push({ id: "dispatch", rs: val("cancellations") + (s.assumptions.dispatch_visibility_rs || 0), headline: `Late dispatch jumped from ${Math.round(s.late_dispatch.last_month * 100)}% to ${Math.round(s.late_dispatch.this_month * 100)}%`, evidence: `Orders are missing the 48-hour SLA. ${Math.round(s.cancellation_reasons.filter((r) => r.type === "dispatch").reduce((n, r) => n + r.share, 0) * 100)}% of cancellations are delay-related, and it's dragging the rating down.` });
  if (T.cancellation_rate - L.cancellation_rate >= 0.02) {
    const fixable = Math.round(s.cancellation_reasons.filter((r) => r.type === "stock" || r.type === "dispatch").reduce((n, r) => n + r.share, 0) * 100);
    issues.push({ id: "cancellations", rs: val("cancellations"), headline: `Cancellation rate rose from ${Math.round(L.cancellation_rate * 100)}% to ${Math.round(T.cancellation_rate * 100)}%`, evidence: `${Math.round(T.orders * T.cancellation_rate)} cancellations this month vs ${Math.round(L.orders * L.cancellation_rate)} last month. ${fixable}% are seller-side (stock or dispatch), so fixable.` });
  }
  if (buyBoxLost(s).length && buyBoxLoss(s) > 0) {
    const bb = buyBoxLost(s).filter((p) => p.monthly_loss_rs);
    const gaps = bb.map((p) => Math.round((p.your_price / p.category_median - 1) * 100));
    issues.push({ id: "pricing", rs: buyBoxLoss(s), headline: `Lost the Buy Box on ${bb.length} bestsellers (priced ${Math.min(...gaps)}-${Math.max(...gaps)}% above competitors)`, evidence: `${bb.map((p) => p.name).join(", ")}. About ${rsF(buyBoxLoss(s))} a month lost. Your price didn't change, the competition's did.` });
  } else {
    issues.push({ id: "pricing", rs: 0, severity: "low", headline: "Pricing is NOT the main problem", evidence: `Average selling price is ${T.asp === L.asp ? "flat at " + rsF(T.asp) : "changed"}, and you're at market on top SKUs. ${s.pricing.verdict.split(".")[0]}.` });
  }
  if (s.visibility.search_impressions_change <= -0.1 && !issues.some((i) => i.id === "promotions")) issues.push({ id: "visibility", rs: val("visibility"), severity: "medium", headline: `Search impressions down ${Math.round(-s.visibility.search_impressions_change * 100)}% (knock-on effect)`, evidence: `Rating ${s.visibility.seller_rating.last_month} -> ${s.visibility.seller_rating.this_month}. Ranking reacts to cancellations, dispatch and rating. Active promotions: ${s.visibility.active_promotions}.` });
  for (const i of issues) i.severity ??= sev(i.rs);
  const order = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity] || b.rs - a.rs);
  return {
    summary: { sales_change_pct: pct(L.sales, T.sales), orders_change_pct: pct(L.orders, T.orders), sales_drop_rs: L.sales - T.sales, asp_change_pct: pct(L.asp, T.asp), root_cause_chain: s.story },
    issues: issues.map(({ rs, ...i }) => ({ ...i, monthly_impact_rs: rs })),
    opportunity: s.visibility.upcoming_event,
  };
}

// ======================================================================= PRIORITISE
export function sizeOpportunities(s = RAJESH) {
  const opps = [];
  const asp = s.metrics.this_month.asp;
  const oos = oosSkus(s);
  if (oos.length && oosLostOrders(s)) opps.push({ id: "restock", issue: "inventory", title: `Restock ${oos.length} zero-stock bestseller${oos.length > 1 ? "s" : ""}`, recoverable_rs: oosLostOrders(s) * asp, ease: "medium", owner: "seller", basis: `~${oosLostOrders(s)} orders lost during stock-out days x Rs ${asp}` });
  const cl = cancelLoss(s);
  if (cl && cancelDriver(s) === "stock") opps.push({ id: "cancel", issue: "cancellations", title: "Stop overselling: stock alerts + auto-pause at zero", recoverable_rs: cl, ease: "easy", owner: "kam", basis: `bring cancellations back to ${Math.round(s.metrics.last_month.cancellation_rate * 100)}% = ${cl / asp} orders` });
  if (s.late_dispatch.this_month >= 0.08) opps.push({ id: "dispatch", issue: "dispatch", title: "Fix dispatch: second daily pickup + SLA alerts", recoverable_rs: (cancelDriver(s) === "dispatch" ? cl : 0) + (s.assumptions.dispatch_visibility_rs || 0), ease: "easy", owner: "kam", basis: `delay-driven cancellations (${rsF(cl)}) + ASSUMPTION: rating back to 4.2 restores ~60% of lost impressions` });
  const bb = (s.pricing?.skus || []).filter((p) => p.est_monthly_gain_rs);
  if (bb.length) opps.push({ id: "price", issue: "pricing", title: bb.length === 1 ? `Match category median on ${bb[0].name} (-${Math.round((1 - bb[0].category_median / bb[0].your_price) * 100)}%)` : `Win back the Buy Box: match price on ${bb.length} SKUs`, recoverable_rs: bb.reduce((n, p) => n + p.est_monthly_gain_rs, 0), ease: "easy", owner: "kam", basis: bb.length === 1 ? "ASSUMPTION: small conversion lift on one SKU after restock" : `ASSUMPTION: ~80% of Buy Box loss recovered; margins stay above 15% except earbuds` });
  if (s.visibility.active_promotions === 0 && s.assumptions.sale_uplift_rs) opps.push({ id: "sale", issue: "visibility", title: "Enrol in-stock SKUs in Winter Saver Sale", recoverable_rs: s.assumptions.sale_uplift_rs, ease: "easy", owner: "kam", basis: "ASSUMPTION: sale participants see ~10-15% uplift on in-stock catalogue" });
  if (!s.visibility.ads_active && s.assumptions.ads_uplift_rs) opps.push({ id: "ads", issue: "visibility", title: "Start sponsored ads (Rs 300/day) on top in-stock SKUs", recoverable_rs: s.assumptions.ads_uplift_rs, ease: "easy", owner: "kam", basis: "ASSUMPTION: ~4x return on Rs 9,000/month ad spend" });
  for (const c of s.custom_opps || []) opps.push({ ...c });
  const easeW = { easy: 1.2, medium: 1, hard: 0.7 };
  return opps.sort((x, y) => y.recoverable_rs * easeW[y.ease] - x.recoverable_rs * easeW[x.ease]).map((o, i) => ({ rank: i + 1, ...o }));
}

// ======================================================================= ACT (simulated seller-panel APIs)
export const ACTION_TYPES = {
  pause_oos_listings: { label: "Paused zero-stock listings so they can't be ordered", opp: "cancel" },
  set_stock_alerts: { label: "Low-stock alerts at 10 units + auto-pause at 0", opp: "cancel" },
  send_supplier_reorder: { label: "Reorder request sent to supplier", opp: "restock" },
  enrol_in_sale: { label: "Enrolled in-stock SKUs in Winter Saver Sale", opp: "sale" },
  adjust_price: { label: "Price matched to Buy Box / category median", opp: "price" },
  add_pickup_slot: { label: "Second daily courier pickup added (2 PM + 6 PM)", opp: "dispatch" },
  set_dispatch_alerts: { label: "SLA alerts: warn at 24h for unshipped orders", opp: "dispatch" },
  start_ads: { label: "Sponsored ads started at Rs 300/day", opp: "ads" },
  create_bundle: { label: "Gift Combo bundle listing created", opp: "bundle" },
};
export function executeAction(s, type, params = {}) {
  const def = ACTION_TYPES[type];
  if (!def) return { ok: false, error: "unknown action" };
  const oos = oosSkus(s).map((k) => k.sku);
  const inStock = s.top_skus.filter((k) => k.stock > 0);
  const bb = buyBoxLost(s);
  const detail = {
    pause_oos_listings: oos.length ? `Paused ${oos.join(", ")}` : "No zero-stock bestsellers to pause",
    set_stock_alerts: `Alerts on all ${s.total_live_skus} SKUs`,
    send_supplier_reorder: `Reorder for ${oos.join(", ") || "requested SKUs"}${params.note ? " (" + params.note + ")" : ""}`,
    enrol_in_sale: `Enrolled ${params.sku_count || Math.min(10, s.total_live_skus)} in-stock SKUs`,
    adjust_price: bb.length ? bb.filter((p) => !params.note || !/earbud/i.test(p.name) || /earbud/i.test(params.note)).map((p) => `${p.sku} Rs ${p.your_price} -> ${p.category_median}`).join(", ") : "No price change needed",
    add_pickup_slot: "Courier partner confirmed 2 PM pickup from tomorrow",
    set_dispatch_alerts: "Seller gets app + SMS alert when an order is 24h old and unshipped",
    start_ads: `Rs 300/day on ${inStock.slice(0, 5).map((k) => k.sku).join(", ")}`,
    create_bundle: params.note || "Combo: Building Blocks + Board Game at 10% off",
  }[type];
  return { ok: true, reference: "SD-ACT-" + Math.floor(1000 + Math.random() * 9000), label: def.label, detail, opportunity: def.opp };
}

// ======================================================================= FORECAST
export function projectRecovery(s, oppIds) {
  const chosen = sizeOpportunities(s).filter((o) => oppIds.includes(o.id));
  const uplift = Math.round(chosen.reduce((n, o) => n + o.recoverable_rs, 0) * 0.7); // ASSUMPTION: ~70% realised in month 1
  const current = s.metrics.this_month.sales;
  return { current_sales: current, projected_next_month: current + uplift, uplift_rs: uplift, last_month_sales: s.metrics.last_month.sales, levers: chosen.map((o) => o.title), assumption: "70% of sized opportunity realised in month 1" };
}

// ======================================================================= TABLES & SCORES
export function skuTable(s = RAJESH) {
  const asp = s.metrics.this_month.asp;
  const price = Object.fromEntries((s.pricing?.skus || []).map((p) => [p.sku, p]));
  return s.top_skus.map((k) => ({
    ...k,
    lost_rs: Math.round(k.last_month_orders * (k.oos_days / 30)) * asp + (price[k.sku]?.monthly_loss_rs || 0),
    status: k.stock === 0 ? "out" : k.stock < 10 ? "low" : price[k.sku]?.buy_box === false ? "nobb" : "ok",
  }));
}

export function healthScore(s = RAJESH) {
  const T = s.metrics.this_month, L = s.metrics.last_month, v = s.visibility;
  const score = (cancel, oosShare, rating, impressions, late) => Math.round(
    25 * Math.max(0, 1 - cancel / 0.2) + 25 * (1 - Math.min(1, oosShare * 3)) + 25 * ((rating - 3) / 2) + 15 * Math.max(0, Math.min(1, 1 + impressions)) + 10 * Math.max(0, 1 - late / 0.2));
  const bbPenalty = buyBoxLoss(s) > 0 ? 12 : 0; // losing the Buy Box on bestsellers is a health hit even when ops are fine
  return {
    today: -bbPenalty + score(T.cancellation_rate, T.out_of_stock_products / s.total_live_skus, v.seller_rating.this_month, v.search_impressions_change, s.late_dispatch.this_month),
    projected: Math.round(score(Math.min(L.cancellation_rate, 0.08), L.out_of_stock_products / s.total_live_skus, Math.min(4.5, Math.max(v.seller_rating.this_month, v.seller_rating.last_month) - (v.seller_rating.this_month < v.seller_rating.last_month ? 0.1 : 0)), -0.05, Math.min(0.04, s.late_dispatch.last_month))),
  };
}

// ======================================================================= PORTFOLIO
// ASSUMPTION: mock book of 12 sellers. The 4 "demo" sellers have full data and can be called.
const OTHERS = [
  ["Shree Fashion House", "Surat", "Ethnic Wear", -0.18, 0.11, 7, 4.1, "Cancellations rising", 31000],
  ["Om Sai Footwear", "Agra", "Footwear", -0.09, 0.09, 4, 4.2, "Late dispatch SLA breaches", 12500],
  ["Green Leaf Organics", "Pune", "Grocery", -0.15, 0.05, 11, 4.5, "Stock-outs on 2 bestsellers", 18000],
  ["Royal Bedsheets", "Panipat", "Home Furnishing", 0.04, 0.05, 1, 4.6, "Healthy, growing", 0],
  ["Glow Beauty Store", "Mumbai", "Beauty", -0.06, 0.08, 5, 4.2, "Rating slipping (returns)", 7000],
  ["Fitzone Sports", "Jalandhar", "Sports", 0.11, 0.04, 0, 4.7, "Healthy, growing", 0],
  ["Desi Kitchen Masala", "Indore", "Grocery", -0.12, 0.1, 6, 4.0, "Rating below 4.1", 9500],
  ["Bright Stationers", "Lucknow", "Stationery", -0.02, 0.03, 2, 4.5, "Healthy", 0],
];
export function portfolio() {
  const rows = [
    ...Object.values(SELLERS).map((s) => {
      const { last_month: L, this_month: T } = s.metrics;
      return { id: s.seller_id, name: s.business, owner: s.name, city: s.city, category: s.category, sales_change: (T.sales - L.sales) / L.sales, cancellation_rate: T.cancellation_rate, oos: T.out_of_stock_products, rating: s.visibility.seller_rating.this_month, top_issue: diagnose(s).issues[0].headline, revenue_at_risk: L.sales - T.sales, demo: true };
    }),
    ...OTHERS.map(([name, city, category, sc, cr, oos, rating, top_issue, risk], i) => ({ id: "SD-SLR-" + (48600 + i * 17), name, city, category, sales_change: sc, cancellation_rate: cr, oos, rating, top_issue, revenue_at_risk: risk, demo: false })),
  ];
  // Priority = revenue at risk, boosted for fixable operational signals.
  for (const r of rows) {
    r.priority = Math.round(r.revenue_at_risk * (1 + (r.cancellation_rate > 0.1 ? 0.3 : 0) + (r.oos >= 10 ? 0.3 : 0) + (r.rating < 4.1 ? 0.2 : 0)));
    r.action = r.revenue_at_risk === 0 ? "Monitor" : r.priority > 50000 ? "Call today" : r.priority > 15000 ? "Call this week" : "Nudge via app";
  }
  return rows.sort((a, b) => b.priority - a.priority);
}

// ======================================================================= SHARED KNOWLEDGE (ASSUMPTION / mock)
export const PROGRAMS = {
  sale: "Winter Saver Sale starts in 9 days. Eligibility: rating 3.8+, in-stock SKUs, discount of at least 10% on enrolled SKUs. Enrolment closes 3 days before the sale. The KAM can enrol SKUs on the seller's behalf.",
  ads: "Sponsored Product Ads: pay per click, suggested starting budget Rs 300/day on the top 5 in-stock SKUs. Don't run ads on out-of-stock items; it wastes budget.",
  fulfilment: "Snapdeal Fulfilment (warehouse-stored inventory) gives faster delivery and a 'Fast Delivery' badge, which typically lifts conversion. Needs a minimum of 20 units per SKU sent in.",
  payments: "Payouts are settled weekly, 7 days after delivery. Disputes or delayed settlements need a human KAM or the payments team.",
  returns: "Return rate this month is 4.5%, below the category average of 6%. Not a concern.",
  shipping: "Pickups are daily by 6 PM; a second 2 PM slot can be added. Dispatch SLA is 48 hours from order.",
  buy_box: "The Buy Box is the default 'Add to cart' seller on a product page. It goes to the best mix of price, rating and delivery speed. Losing it typically cuts that SKU's orders by 40-60%.",
};
