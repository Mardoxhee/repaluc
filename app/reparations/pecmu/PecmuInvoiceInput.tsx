'use client';

import { fieldClass } from './WorkflowForm';

export default function PecmuInvoiceInput({ onChange }: { onChange: (files: File[]) => void }) {
  return <label className="block text-sm font-medium md:col-span-2">
    Factures de la prise en charge
    <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className={fieldClass}
      onChange={event => onChange(Array.from(event.target.files || []))} />
  </label>;
}
