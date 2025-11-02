import { PaymentRecord, Tenant } from "@/types";
import { getMonthName } from "@/lib/billGenerator";
import { Check, X } from "lucide-react";

interface BillCanvasProps {
  record: PaymentRecord;
  tenant: Tenant;
  billNumber: string;
  billDate: string;
}

export const BillCanvas = ({ record, tenant, billNumber, billDate }: BillCanvasProps) => {
  const total = record.rent_amount + record.electricity_amount + record.water_amount + record.other_charges;
  const paidTotal = 
    (record.rent_paid ? record.rent_amount : 0) +
    (record.electricity_paid ? record.electricity_amount : 0) +
    (record.water_paid ? record.water_amount : 0) +
    record.other_charges;
  const pendingTotal = total - paidTotal;

  return (
    <div 
      className="w-[800px] bg-white text-gray-900 font-sans"
      style={{ 
        padding: '40px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header */}
      <div 
        className="text-center mb-8 py-6 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B2C 100%)',
        }}
      >
        <h1 className="text-4xl font-bold text-white mb-1">tuleeto.in</h1>
        <p className="text-white/90 text-sm">Property Management Platform</p>
      </div>

      {/* Bill Title */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">RENT BILL</h2>
        <div className="flex justify-between text-sm text-gray-600 max-w-md mx-auto">
          <div>
            <span className="font-semibold">Bill No:</span> {billNumber}
          </div>
          <div>
            <span className="font-semibold">Date:</span> {billDate}
          </div>
        </div>
      </div>

      {/* Tenant Details */}
      <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
          TENANT DETAILS
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="font-semibold w-24">Name:</span>
            <span className="text-gray-700">{tenant.name}</span>
          </div>
          {tenant.room_number && (
            <div className="flex">
              <span className="font-semibold w-24">Room:</span>
              <span className="text-gray-700">{tenant.room_number}</span>
            </div>
          )}
          <div className="flex">
            <span className="font-semibold w-24">Phone:</span>
            <span className="text-gray-700">{tenant.phone}</span>
          </div>
          {tenant.email && (
            <div className="flex">
              <span className="font-semibold w-24">Email:</span>
              <span className="text-gray-700">{tenant.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Billing Period */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">BILLING PERIOD</h3>
        <p className="text-gray-700 text-base">
          {getMonthName(record.month)} {record.year}
        </p>
      </div>

      {/* Payment Details */}
      <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          PAYMENT DETAILS
        </h3>

        {/* Rent */}
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">🏠 Room Rent</span>
            <span className="text-xl font-bold text-gray-800">₹ {record.rent_amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {record.rent_paid ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">Paid</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-red-700 font-medium">Unpaid</span>
                </>
              )}
            </div>
            {record.rent_paid && record.rent_paid_date && (
              <span className="text-gray-600">Date: {new Date(record.rent_paid_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Electricity */}
        <div className="mb-4 p-3 bg-yellow-50 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">⚡ Electricity Bill</span>
            <span className="text-xl font-bold text-gray-800">₹ {record.electricity_amount.toLocaleString()}</span>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            <span>Units Consumed: {record.electricity_units || 0}</span>
            <span className="mx-2">•</span>
            <span>Rate per Unit: ₹{record.cost_per_unit || 11}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {record.electricity_paid ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">Paid</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-red-700 font-medium">Unpaid</span>
                </>
              )}
            </div>
            {record.electricity_paid && record.electricity_paid_date && (
              <span className="text-gray-600">Date: {new Date(record.electricity_paid_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Water */}
        <div className="mb-4 p-3 bg-cyan-50 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">💧 Water Charges</span>
            <span className="text-xl font-bold text-gray-800">₹ {record.water_amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {record.water_paid ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">Paid</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-red-700 font-medium">Unpaid</span>
                </>
              )}
            </div>
            {record.water_paid && record.water_paid_date && (
              <span className="text-gray-600">Date: {new Date(record.water_paid_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Other Charges */}
        {record.other_charges > 0 && (
          <div className="mb-4 p-3 bg-purple-50 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">📝 Other Charges</span>
              <span className="text-xl font-bold text-gray-800">₹ {record.other_charges.toLocaleString()}</span>
            </div>
            {record.other_charges_description && (
              <p className="text-sm text-gray-600">{record.other_charges_description}</p>
            )}
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div 
        className="mb-6 p-4 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B2C 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-white">GRAND TOTAL</span>
          <span className="text-3xl font-bold text-white">₹ {total.toLocaleString()}</span>
        </div>
        {pendingTotal > 0 && (
          <div className="mt-3 pt-3 border-t border-white/30 text-white text-sm">
            <div className="flex justify-between">
              <span>Paid Amount:</span>
              <span className="font-semibold">₹ {paidTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Pending Amount:</span>
              <span className="font-semibold">₹ {pendingTotal.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Remarks */}
      {record.remarks && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Remarks:</h3>
          <p className="text-sm text-gray-700">{record.remarks}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-6 border-t-2 border-gray-200">
        <p className="text-gray-600 mb-1">Thank you!</p>
        <p className="text-sm text-gray-500">Visit us at <span className="font-semibold" style={{ color: '#FF8C42' }}>tuleeto.in</span></p>
      </div>
    </div>
  );
};
