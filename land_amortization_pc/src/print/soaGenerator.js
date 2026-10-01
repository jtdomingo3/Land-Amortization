import { formatCurrency, formatDate, formatMonthCovered, formatNumber } from '../utils/formatters.js';
import { computeMonthlySchedule } from '../engine/waterfall.js';

/**
 * Generates the clean A4 HTML for the Statement of Account (SOA).
 * Full-width single column layout maximizing the A4 paper.
 * 
 * @param {Object} account - Land account object
 * @param {Array<Object>} payments - All payments for this account
 * @param {Object} options - { dateFrom, dateTo, company, title }
 * @returns {string} Full A4 HTML string
 */
export function generateSOAHTML(account, payments = [], options = {}) {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  const company = options.company || {};
  const companyName = company.company_name || env.VITE_COMPANY_NAME || 'Land Amortization Tracker';
  const companyAddress = company.company_address || env.VITE_COMPANY_ADDRESS || '';
  const companyContact = company.company_contact || env.VITE_COMPANY_CONTACT || '';
  const companyEmail = company.company_email || env.VITE_COMPANY_EMAIL || '';
  const companyTin = company.company_tin || env.VITE_COMPANY_TIN || '';
  const companyLogo = company.company_logo || env.VITE_COMPANY_LOGO || '';

  const signatoryName = company.signatory_name || env.VITE_SIGNATORY_NAME || '';
  const signatoryTitle = company.signatory_title || env.VITE_SIGNATORY_TITLE || 'Approved by';
  const signatoryEsig = company.signatory_esig || env.VITE_SIGNATORY_ESIG || '';

  const contactLine = [
    companyContact ? `Tel: ${companyContact}` : '',
    companyEmail ? `Email: ${companyEmail}` : '',
    companyTin ? `TIN: ${companyTin}` : ''
  ].filter(Boolean).join('  |  ');

  // Filter payments for this account
  const accountPayments = payments
    .filter(p => String(p.account_id) === String(account.account_id))
    .sort((a, b) => new Date(a.payment_date || 0) - new Date(b.payment_date || 0));

  // Compute full monthly schedule
  const fullSchedule = computeMonthlySchedule(account, accountPayments);

  // Period filtering
  const dateFrom = options.dateFrom || ''; // YYYY-MM
  const dateTo = options.dateTo || '';     // YYYY-MM

  const filteredPayments = accountPayments.filter(p => {
    if (!p.payment_date) return true;
    const pMonth = p.payment_date.substring(0, 7);
    if (dateFrom && pMonth < dateFrom) return false;
    if (dateTo && pMonth > dateTo) return false;
    return true;
  });

  const filteredSchedule = fullSchedule.filter(row => {
    if (!row.due_date) return true;
    const rowMonth = row.due_date.substring(0, 7);
    if (dateFrom && rowMonth < dateFrom) return false;
    if (dateTo && rowMonth > dateTo) return false;
    return true;
  });

  const totalPeriodPaid = filteredPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
  const totalPeriodExpected = filteredSchedule.reduce((sum, s) => sum + (Number(s.expected_amortization) || 0), 0);
  const totalPeriodApplied = filteredSchedule.reduce((sum, s) => sum + (Number(s.amount_applied) || 0), 0);

  const formatPeriodDisplay = () => {
    if (dateFrom && dateTo) {
      return `${formatMonthCovered(dateFrom + '-01')} – ${formatMonthCovered(dateTo + '-01')}`;
    }
    if (dateFrom) {
      return `From ${formatMonthCovered(dateFrom + '-01')}`;
    }
    if (dateTo) {
      return `Up to ${formatMonthCovered(dateTo + '-01')}`;
    }
    return 'Full Contract Period';
  };

  const hasSignatory = Boolean(signatoryName || signatoryEsig);

  return `
    <div class="print-page document-sheet">
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
          <div class="doc-type-title">STATEMENT OF ACCOUNT</div>
          <div style="font-size: 0.76rem; color: #475569; margin-top: 4px;">
            Issued: <strong>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</strong>
          </div>
        </div>
      </div>

      <!-- STATEMENT META BAR -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #ffffff; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 0.82rem;">
        <div>
          <span>Account: </span>
          <strong style="letter-spacing: 0.02em;">#${account.account_id} • ${account.name}</strong>
        </div>
        <div>
          <span>Coverage Period: </span>
          <strong>${formatPeriodDisplay()}</strong>
        </div>
        <div>
          <span>Status: </span>
          <strong style="color: ${account.status === 'DELINQUENT' || account.status === 'OVERDUE' ? '#fb7185' : '#34d399'};">
            ${account.status || 'ACTIVE'}
          </strong>
        </div>
      </div>

      <!-- ACCOUNT & PROPERTY INFORMATION (FULL WIDTH GRID) -->
      <div class="doc-info-box" style="margin-bottom: 14px;">
        <div class="doc-info-box-title">Account & Property Information</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 0.78rem;">
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Buyer Name</span>
            <span class="doc-value" style="display: block; text-align: left;">${account.name}</span>
          </div>
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Title Number</span>
            <span class="doc-value mono" style="display: block; text-align: left;">${account.land_title_number || 'N/A'}</span>
          </div>
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Lot Area</span>
            <span class="doc-value" style="display: block; text-align: left;">${account.land_area_sqm ? `${formatNumber(account.land_area_sqm)} sqm` : 'N/A'}</span>
          </div>
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Total Contract Amount</span>
            <span class="doc-value mono" style="display: block; text-align: left; font-weight: 700;">${formatCurrency(account.total_contract_amount)}</span>
          </div>

          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Down Payment Required</span>
            <span class="doc-value mono" style="display: block; text-align: left;">${formatCurrency(account.down_payment)}</span>
          </div>
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Monthly Amortization</span>
            <span class="doc-value mono" style="display: block; text-align: left;">${formatCurrency(account.monthly_amortization)}</span>
          </div>
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">Payment Term</span>
            <span class="doc-value" style="display: block; text-align: left;">${account.num_of_months || 120} Months</span>
          </div>
          <div>
            <span class="doc-label" style="display: block; font-size: 0.7rem;">First Due Date</span>
            <span class="doc-value mono" style="display: block; text-align: left;">${formatDate(account.first_due_date)}</span>
          </div>
        </div>
      </div>

      <!-- PAYMENT HISTORY SECTION (FULL WIDTH) -->
      <div style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h3 style="font-size: 0.82rem; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0; letter-spacing: 0.04em;">
            Payment History in Period (${filteredPayments.length} transactions)
          </h3>
          <span style="font-size: 0.74rem; color: #475569;">
            Period Payments Total: <strong class="mono" style="color: #047857;">${formatCurrency(totalPeriodPaid)}</strong>
          </span>
        </div>

        <table class="doc-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Receipt / Ref #</th>
              <th>Payment Type</th>
              <th>Method</th>
              <th class="right">Amount Paid</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPayments.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 12px;">No payment transactions recorded during this period.</td>
              </tr>
            ` : filteredPayments.map(p => `
              <tr>
                <td>${formatDate(p.payment_date)}</td>
                <td class="mono">${p.receipt_no || '-'}</td>
                <td>${p.payment_type || 'Installment'}</td>
                <td>${p.payment_method || 'Cash'}</td>
                <td class="right mono" style="font-weight: 700; color: #047857;">${formatCurrency(p.amount_paid)}</td>
                <td style="color: #64748b; font-size: 0.72rem;">${p.remarks || '-'}</td>
              </tr>
            `).join('')}
            ${filteredPayments.length > 0 ? `
              <tr class="total-row">
                <td colspan="4" style="text-transform: uppercase;">Total Period Payments</td>
                <td class="right mono" style="font-size: 0.88rem; color: #047857;">${formatCurrency(totalPeriodPaid)}</td>
                <td></td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <!-- MONTHLY AMORTIZATION SCHEDULE SECTION (FULL WIDTH) -->
      <div style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h3 style="font-size: 0.82rem; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0; letter-spacing: 0.04em;">
            Monthly Amortization Schedule (${filteredSchedule.length} Months)
          </h3>
          <span style="font-size: 0.74rem; color: #475569;">
            Applied in Period: <strong class="mono" style="color: #047857;">${formatCurrency(totalPeriodApplied)}</strong>
          </span>
        </div>

        <table class="doc-table">
          <thead>
            <tr>
              <th class="center" style="width: 50px;">Mo #</th>
              <th>Due Date</th>
              <th class="right">Expected</th>
              <th class="right">Applied</th>
              <th class="right">Advance Remaining</th>
              <th class="center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSchedule.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 12px;">No schedule months in this period.</td>
              </tr>
            ` : filteredSchedule.map(s => {
              const statusColor = s.payment_status === 'PAID' ? '#047857' : (s.payment_status === 'OVERDUE' ? '#b91c1c' : (s.payment_status === 'PARTIAL' ? '#b45309' : '#475569'));
              const statusBg = s.payment_status === 'PAID' ? 'rgba(16,185,129,0.12)' : (s.payment_status === 'OVERDUE' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)');
              return `
                <tr>
                  <td class="center mono" style="font-weight: 600;">${s.month_no}</td>
                  <td>${formatDate(s.due_date)}</td>
                  <td class="right mono">${formatCurrency(s.expected_amortization)}</td>
                  <td class="right mono" style="font-weight: 600; color: ${s.amount_applied > 0 ? '#047857' : 'inherit'};">
                    ${formatCurrency(s.amount_applied)}
                  </td>
                  <td class="right mono" style="color: #64748b;">${formatCurrency(s.advance_remaining)}</td>
                  <td class="center">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.68rem; background: ${statusBg}; color: ${statusColor};">
                      ${s.payment_status}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
            ${filteredSchedule.length > 0 ? `
              <tr class="total-row">
                <td colspan="2" style="text-transform: uppercase;">Period Totals</td>
                <td class="right mono">${formatCurrency(totalPeriodExpected)}</td>
                <td class="right mono" style="color: #047857;">${formatCurrency(totalPeriodApplied)}</td>
                <td colspan="2"></td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <!-- BALANCE SUMMARY & PENALTIES (FULL WIDTH) -->
      <div class="doc-summary-card no-break">
        <div class="doc-summary-title">Balance & Account Summary to Date</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 0.8rem;">
          <div>
            <div class="doc-row">
              <span class="doc-label">Total Contract Amount:</span>
              <span class="doc-value mono">${formatCurrency(account.total_contract_amount)}</span>
            </div>
            <div class="doc-row">
              <span class="doc-label">Total Paid to Date:</span>
              <span class="doc-value mono" style="color: #047857;">${formatCurrency(account.total_paid)}</span>
            </div>
            <div class="doc-row">
              <span class="doc-label">Base Principal Balance:</span>
              <span class="doc-value mono">${formatCurrency(account.base_balance)}</span>
            </div>
          </div>

          <div>
            <div class="doc-row">
              <span class="doc-label">Down Payment Penalty (1%):</span>
              <span class="doc-value mono" style="color: ${account.dp_penalty > 0 ? '#b91c1c' : 'inherit'};">
                ${formatCurrency(account.dp_penalty)}
              </span>
            </div>
            <div class="doc-row">
              <span class="doc-label">Late Payment Penalty (10%):</span>
              <span class="doc-value mono" style="color: ${account.ten_percent_penalty > 0 ? '#b91c1c' : 'inherit'};">
                ${formatCurrency(account.ten_percent_penalty)}
              </span>
            </div>
            <div class="doc-row">
              <span class="doc-label">Total Penalties Due:</span>
              <span class="doc-value mono" style="color: ${account.total_penalties > 0 ? '#b91c1c' : 'inherit'};">
                ${formatCurrency(account.total_penalties)}
              </span>
            </div>
          </div>
        </div>

        <div class="doc-grand-total">
          <span>TOTAL OUTSTANDING BALANCE (INCLUDING PENALTIES):</span>
          <span class="mono" style="color: ${account.outstanding_balance > 0 ? '#b91c1c' : '#047857'}; font-size: 1.05rem;">
            ${formatCurrency(account.outstanding_balance)}
          </span>
        </div>
      </div>

      <!-- SIGNATURE SECTION (IF CONFIGURED) -->
      ${hasSignatory ? `
        <div class="doc-signatures no-break">
          <div class="doc-sig-block">
            ${signatoryEsig ? `
              <div class="doc-sig-container">
                <img class="doc-sig-image" src="${signatoryEsig}" alt="Signature" />
                <div class="doc-sig-name">${signatoryName || 'Authorized Signatory'}</div>
              </div>
            ` : `
              <div class="doc-sig-buyer-container">
                <div class="doc-sig-line"></div>
                <div class="doc-sig-name">${signatoryName || 'Authorized Signatory'}</div>
              </div>
            `}
            <div class="doc-sig-title">${signatoryTitle || 'Approved by'}</div>
          </div>

          <div class="doc-sig-block">
            <div class="doc-sig-buyer-container">
              <div class="doc-sig-line"></div>
              <div class="doc-sig-name">${account.name}</div>
            </div>
            <div class="doc-sig-title">Buyer / Conforme</div>
          </div>
        </div>
      ` : ''}

      <!-- FOOTER -->
      <div class="doc-footer">
        <div>Statement of Account • ${companyName}</div>
        <div>Date Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
      </div>
    </div>
  `;
}
export default generateSOAHTML;
