# Task: Update payment amount display to Vietnamese Dong format

## Steps:

- [ ] Edit client/src/app/(dashboard)/tenants/residences/[id]/page.tsx to change {payment.amountPaid.toFixed(2)}đ to {payment.amountPaid.toLocaleString('vi-VN')} ₫ in the BillingHistory component.
- [ ] Verify the change by running the development server and checking the billing history table on the tenant residences page.
- [ ] Update TODO.md to mark steps as completed.
- [ ] Complete the task.
