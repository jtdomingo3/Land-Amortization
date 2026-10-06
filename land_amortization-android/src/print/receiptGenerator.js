import { formatCurrency, formatDate, formatMonthCovered, formatNumber } from '../utils/formatters.js';
import { addMonthsEdate } from '../utils/dateUtils.js';

/**
 * Calculates which amortization month(s) a specific payment covers using the
 * waterfall algorithm.
 * 
 * If a customer pays for 3 months at once (e.g. ₱36,249.99 for a ₱12,083.33/mo contract),
 * this returns 3 receipt descriptor items, one for each month covered.
 * 
 * @param {Object} account - Land account
 * @param {Object} targetPayment - Payment to generate receipts for
 * @param {Array<Object>} allPayments - All payments in the database
 * @returns {Array<Object>} Array of receipt breakdown objects
 */
export function calculateReceiptCoveredMonths(account, targetPayment, allPayments = []) {
  if (!account || !targetPayment) return [];

  // Down Payment receipts cover the down payment obligation
  if (targetPayment.payment_type === 'Down Payment') {
    const totalContract = Number(account.total_contract_amount) || 0;
    const paidAmount = Number(targetPayment.amount_paid) || 0;
    return [{
      receiptIndex: 1,
      totalReceipts: 1,
      monthNo: 0,
      description: 'Down Payment',
      dueDate: account.agreed_dp_due || account.date_of_start,
      expectedAmount: Number(account.down_payment) || paidAmount,
      amountApplied: paidAmount,
      status: paidAmount >= (Number(account.down_payment) || 0) ? 'PAID' : 'PARTIAL',
      runningTotalPaid: paidAmount,
      remainingBalance: Math.max(0, totalContract - paidAmount)
    }];
  }

  // Penalty-only payments
  if (targetPayment.payment_type === 'Penalty') {
    const paidAmount = Number(targetPayment.amount_paid) || 0;
    return [{
      receiptIndex: 1,
      totalReceipts: 1,
      monthNo: targetPayment.for_month_no || 0,
      description: `Penalty Settlement${targetPayment.month_covered ? ` (${targetPayment.month_covered})` : ''}`,
      dueDate: targetPayment.payment_date,
      expectedAmount: paidAmount,
      amountApplied: paidAmount,
      status: 'PAID',
      runningTotalPaid: Number(account.total_paid) || paidAmount,
      remainingBalance: Number(account.outstanding_balance) || 0
    }];
  }

  // INSTALLMENT & MONTHLY AMORTIZATION WATERFALL BREAKDOWN
  const isAmortizationType = !targetPayment.payment_type ||
    targetPayment.payment_type === 'Monthly Amortization' ||
    targetPayment.payment_type === 'Installment' ||
    targetPayment.payment_type === 'Amortization + Penalty';

  if (!isAmortizationType) {
    const paidAmount = Number(targetPayment.amount_paid) || 0;
    return [{
      receiptIndex: 1,
      totalReceipts: 1,
      monthNo: 0,
      description: targetPayment.payment_type,
      dueDate: targetPayment.payment_date,
      expectedAmount: paidAmount,
      amountApplied: paidAmount,
      status: 'PAID',
      runningTotalPaid: paidAmount,
      remainingBalance: Number(account.base_balance) || 0
    }];
  }

  // Filter all installment payments for this account and sort chronologically
  const isInstallmentRecord = (p) => p.payment_type !== 'Down Payment' && p.payment_type !== 'Penalty';
  const accountInstallments = allPayments
    .filter(p => String(p.account_id) === String(account.account_id) && isInstallmentRecord(p))
    .sort((a, b) => {
      const dateCmp = new Date(a.payment_date || 0) - new Date(b.payment_date || 0);
      if (dateCmp !== 0) return dateCmp;
      return (Number(a.payment_id) || 0) - (Number(b.payment_id) || 0);
    });

  // Calculate prior installments paid before this payment
  let priorPaid = 0;
  for (const p of accountInstallments) {
    if (String(p.payment_id) === String(targetPayment.payment_id)) {
      break;
    }
    const amortPortion = p.amortization_amount !== undefined ? Number(p.amortization_amount) : Number(p.amount_paid);
    priorPaid += (amortPortion || 0);
  }

  const thisAmort = targetPayment.amortization_amount !== undefined
    ? Number(targetPayment.amortization_amount)
    : (Number(targetPayment.amount_paid) || 0);
  const thisPaid = thisAmort > 0 ? thisAmort : (Number(targetPayment.amount_paid) || 0);
  const currentTotalInstallments = priorPaid + thisPaid;
  const monthlyExpected = Number(account.monthly_amortization) || 0;
  const totalMonths = Number(account.num_of_months) || 120;
  const firstDueDate = account.first_due_date || account.date_of_start;
  const totalContract = Number(account.total_contract_amount) || 0;
  const dpAmount = Number(account.down_payment) || 0;

  if (monthlyExpected <= 0) {
    return [{
      receiptIndex: 1,
      totalReceipts: 1,
      monthNo: 1,
      description: 'Monthly Amortization',
      dueDate: targetPayment.payment_date,
      expectedAmount: thisPaid,
      amountApplied: thisPaid,
      status: 'PAID',
      runningTotalPaid: dpAmount + currentTotalInstallments,
      remainingBalance: Math.max(0, totalContract - (dpAmount + currentTotalInstallments))
    }];
  }

  // Iterate over months and find which months receive a portion of this payment
  const receipts = [];
  let runningAppliedSoFar = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const monthStart = (m - 1) * monthlyExpected;
    const monthEnd = m * monthlyExpected;

    // Portion of this payment applied to month m
    const overlapStart = Math.max(priorPaid, monthStart);
    const overlapEnd = Math.min(currentTotalInstallments, monthEnd);
    const applied = Math.max(0, overlapEnd - overlapStart);

    if (applied > 0.009) {
      runningAppliedSoFar += applied;
      const dueDate = firstDueDate ? addMonthsEdate(firstDueDate, m - 1) : '';
      const monthTitle = dueDate ? formatMonthCovered(dueDate) : `Month ${m}`;
      const isPaidFull = (overlapEnd >= monthEnd - 0.01);

      receipts.push({
        monthNo: m,
        description: `${monthTitle} (Month ${m})`,
        dueDate,
        expectedAmount: monthlyExpected,
        amountApplied: applied,
        status: isPaidFull ? 'PAID' : 'PARTIAL',
        runningTotalPaid: dpAmount + priorPaid + runningAppliedSoFar,
        remainingBalance: Math.max(0, totalContract - (dpAmount + priorPaid + runningAppliedSoFar))
      });
    }

    if (monthStart >= currentTotalInstallments) {
      break;
    }
  }

  // Fallback: If payment did not map to any month (e.g. overpayment past term)
  if (receipts.length === 0) {
    receipts.push({
      monthNo: 1,
      description: 'Advance / Monthly Amortization',
      dueDate: targetPayment.payment_date,
      expectedAmount: thisPaid,
      amountApplied: thisPaid,
      status: 'PAID',
      runningTotalPaid: dpAmount + currentTotalInstallments,
      remainingBalance: Math.max(0, totalContract - (dpAmount + currentTotalInstallments))
    });
  }

  // Assign 1-indexed receipt counter
  const total = receipts.length;
  return receipts.map((item, idx) => ({
    ...item,
    receiptIndex: idx + 1,
    totalReceipts: total
  }));
}

/**
 * Generates the clean A4 HTML for one single receipt page.
 */
export function generateSingleReceiptHTML({
  account,
  payment,
  receiptItem,
  company,
  receiptIndex = 1,
  totalReceipts = 1
}) {
  const companyName = company.company_name || 'CORTEZ LAND AMORTIZATION COLLECTION TRACKER';
  const companyAddress = company.company_address || 'Purok 2, Brgy. Sta. Elena (Poblacion) Sta. Elena, Camarines Norte';
  const companyContact = company.company_contact || '';
  const companyEmail = company.company_email || '';
  const companyTin = company.company_tin || '';
  const companyLogo = company.company_logo || '';

  const signatoryName = company.signatory_name || '';
  const signatoryTitle = company.signatory_title || '';
  const signatoryEsig = company.signatory_esig || '';

  const receiptNo = payment.receipt_no || `OR-${payment.payment_id || '1001'}`;
  const displayReceiptNo = totalReceipts > 1 ? `${receiptNo} (${receiptIndex}/${totalReceipts})` : receiptNo;

  const contactLine = [
    companyContact ? `Tel: ${companyContact}` : '',
    companyEmail ? `Email: ${companyEmail}` : '',
    companyTin ? `TIN: ${companyTin}` : ''
  ].filter(Boolean).join('  |  ');

  const buyerName = account.name || 'Valued Buyer';
  const accountId = account.account_id || '-';
  const titleNo = account.land_title_number || 'N/A';
  const areaSqm = account.land_area_sqm ? `${formatNumber(account.land_area_sqm)} sqm` : 'N/A';
  const totalContract = Number(account.total_contract_amount) || 0;
  const runningPaid = receiptItem.runningTotalPaid || Number(payment.amount_paid) || 0;
  const remaining = receiptItem.remainingBalance !== undefined ? receiptItem.remainingBalance : Math.max(0, totalContract - runningPaid);
  const penaltiesDue = Number(account.total_penalties) || 0;
  const totalOutstanding = remaining + penaltiesDue;

  const hasSignatory = Boolean(signatoryName || signatoryEsig);

  return `
    <div class="print-page page-break document-sheet">
      <!-- HEADER -->
      <div class="doc-header">
        <div class="doc-brand">
          ${companyLogo ? `<img class="doc-logo" src="${companyLogo}" alt="Logo" />` : ''}
          <div>
            <h1 class="doc-company-name">${companyName}</h1>
            <div class="doc-company-detail">${companyAddress}</div>
            ${contactLine ? `<div class="doc-company-detail" style="margin-top: 2px;">${contactLine}</div>` : ''}
          </div>
        </div>

        <div class="doc-title-badge">
          <div class="doc-type-title">OFFICIAL RECEIPT</div>
          ${totalReceipts > 1 ? `<div class="doc-counter">Receipt ${receiptIndex} of ${totalReceipts}</div>` : ''}
        </div>
      </div>

      <!-- RECEIPT & TRANSACTION META -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #ffffff; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 0.82rem;">
        <div>
          <span>Receipt No: </span>
          <strong style="font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em;">${displayReceiptNo}</strong>
        </div>
        <div>
          <span>Date: </span>
          <strong>${formatDate(payment.payment_date)}</strong>
        </div>
        <div>
          <span>Payment Method: </span>
          <strong>${payment.payment_method || 'Cash'}</strong>
        </div>
      </div>

      <!-- BUYER & LAND DETAILS (2 COLUMNS) -->
      <div class="doc-info-grid">
        <div class="doc-info-box">
          <div class="doc-info-box-title">Buyer Information</div>
          <div class="doc-row">
            <span class="doc-label">Buyer Name:</span>
            <span class="doc-value">${buyerName}</span>
          </div>
          <div class="doc-row">
            <span class="doc-label">Account ID:</span>
            <span class="doc-value mono">#${accountId}</span>
          </div>
          <div class="doc-row">
            <span class="doc-label">Payment Type:</span>
            <span class="doc-value">${payment.payment_type || 'Monthly Amortization'}</span>
          </div>
          ${payment.month_covered ? `
          <div class="doc-row">
            <span class="doc-label">For Month of:</span>
            <span class="doc-value" style="font-weight: 700; color: #4338ca;">${payment.month_covered}</span>
          </div>
          ` : ''}
        </div>

        <div class="doc-info-box">
          <div class="doc-info-box-title">Land Property Details</div>
          <div class="doc-row">
            <span class="doc-label">Title Number:</span>
            <span class="doc-value mono">${titleNo}</span>
          </div>
          <div class="doc-row">
            <span class="doc-label">Lot Area:</span>
            <span class="doc-value">${areaSqm}</span>
          </div>
          <div class="doc-row">
            <span class="doc-label">Contract Amount:</span>
            <span class="doc-value">${formatCurrency(totalContract)}</span>
          </div>
        </div>
      </div>

      <!-- PAYMENT DETAILS TABLE (FULL WIDTH) -->
      <table class="doc-table">
        <thead>
          <tr>
            <th>Description / Month Covered</th>
            <th>Due Date</th>
            <th class="right">Amount Due</th>
            <th class="right">Amount Paid</th>
            <th class="center">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${receiptItem.description || payment.month_covered || 'Amortization Payment'}</strong>
              ${payment.month_covered && !receiptItem.description.includes(payment.month_covered) ? `<div style="font-size: 0.72rem; color: #4338ca; font-weight: 600; margin-top: 2px;">For the month of: ${payment.month_covered}</div>` : ''}
              ${payment.remarks ? `<div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">Note: ${payment.remarks}</div>` : ''}
            </td>
            <td>${formatDate(receiptItem.dueDate || payment.payment_date)}</td>
            <td class="right mono">${formatCurrency(receiptItem.expectedAmount)}</td>
            <td class="right mono" style="font-weight: 700; color: #047857;">${formatCurrency(receiptItem.amountApplied)}</td>
            <td class="center">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.7rem; background: ${receiptItem.status === 'PAID' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}; color: ${receiptItem.status === 'PAID' ? '#047857' : '#b45309'};">
                ${receiptItem.status || 'PAID'}
              </span>
            </td>
          </tr>
          ${Number(payment.penalty_amount) > 0 && payment.payment_type === 'Amortization + Penalty' ? `
          <tr>
            <td>
              <strong>Late Payment Penalty Surcharge</strong>
              <div style="font-size: 0.7rem; color: #b45309; margin-top: 2px;">Settlement of overdue penalty</div>
            </td>
            <td>${formatDate(payment.payment_date)}</td>
            <td class="right mono">${formatCurrency(payment.penalty_amount)}</td>
            <td class="right mono" style="font-weight: 700; color: #b45309;">${formatCurrency(payment.penalty_amount)}</td>
            <td class="center">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.7rem; background: rgba(245,158,11,0.15); color: #b45309;">
                SETTLED
              </span>
            </td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="3" style="text-transform: uppercase;">Total Received for this Receipt</td>
            <td class="right mono" style="font-size: 0.88rem; font-weight: 800; color: #047857;">
              ${formatCurrency(Number(payment.penalty_amount) > 0 && payment.payment_type === 'Amortization + Penalty' ? (Number(receiptItem.amountApplied) + Number(payment.penalty_amount)) : receiptItem.amountApplied)}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <!-- RUNNING BALANCE CARD -->
      <div class="doc-summary-card">
        <div class="doc-summary-title">Account Running Balance</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 0.78rem;">
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Total Paid to Date</span>
            <strong class="mono" style="color: #047857; font-size: 0.88rem;">${formatCurrency(runningPaid)}</strong>
          </div>
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Remaining Contract Balance</span>
            <strong class="mono" style="font-size: 0.88rem;">${formatCurrency(remaining)}</strong>
          </div>
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Total Outstanding (Incl. Penalties)</span>
            <strong class="mono" style="color: ${totalOutstanding > 0 ? '#b91c1c' : '#047857'}; font-size: 0.88rem;">${formatCurrency(totalOutstanding)}</strong>
          </div>
        </div>
      </div>

      <!-- SIGNATURE SECTION (IF CONFIGURED) -->
      ${hasSignatory ? `
        <div class="doc-signatures no-break">
          <div class="doc-sig-block">
            ${signatoryEsig ? `
              <div class="doc-sig-container">
                <img class="doc-sig-image" src="${signatoryEsig}" alt="Signature" />
                <div class="doc-sig-name">${signatoryName || 'ARTEMIO TEDOCO-BARBASA'}</div>
              </div>
            ` : `
              <div class="doc-sig-buyer-container">
                <div class="doc-sig-line"></div>
                <div class="doc-sig-name">${signatoryName || 'ARTEMIO TEDOCO-BARBASA'}</div>
              </div>
            `}
            <div class="doc-sig-title">${signatoryTitle || 'Approved by'}</div>
          </div>

          <div class="doc-sig-block">
            <div class="doc-sig-buyer-container">
              <div class="doc-sig-line"></div>
              <div class="doc-sig-name">${buyerName}</div>
            </div>
            <div class="doc-sig-title">Buyer / Payor</div>
          </div>
        </div>
      ` : ''}

      <!-- FOOTER -->
      <div class="doc-footer">
        <div>Official Receipt • ${companyName}</div>
        <div>Date Generated: ${formatDate(new Date())}</div>
      </div>
    </div>
  `;
}

/**
 * Generates all receipts for a given payment (e.g. 3 receipts if 3 months covered).
 * 
 * @param {Object} account - Account object
 * @param {Object} payment - Target payment object
 * @param {Array<Object>} allPayments - Full payment list
 * @param {Object} company - Company settings object
 * @returns {string} Combined HTML string of all receipts
 */
export function generateAllReceiptsHTML(account, payment, allPayments = [], company = {}) {
  const receiptItems = calculateReceiptCoveredMonths(account, payment, allPayments);
  const totalReceipts = receiptItems.length;

  return receiptItems.map((item, idx) => {
    return generateSingleReceiptHTML({
      account,
      payment,
      receiptItem: item,
      company,
      receiptIndex: idx + 1,
      totalReceipts
    });
  }).join('\n');
}
