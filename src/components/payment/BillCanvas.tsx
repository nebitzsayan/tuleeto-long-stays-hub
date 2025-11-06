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
      className="w-[800px] bg-white text-gray-900"
      style={{ 
        padding: '40px',
        fontFamily: 'Georgia, "Times New Roman", serif'
      }}
    >
      {/* Header */}
      <div 
        className="text-center mb-8 pb-6"
        style={{
          borderBottom: '2px solid #000'
        }}
      >
        <h1 style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#000',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '4px'
        }}>
          Tuleeto Rental
        </h1>
        <p style={{
          fontSize: '12px',
          color: '#666',
          fontFamily: 'Georgia, "Times New Roman", serif'
        }}>
          Property Management Platform | www.tuleeto.in
        </p>
      </div>

      {/* Bill Title & Invoice Details */}
      <div className="text-center mb-6 pb-4" style={{ borderBottom: '1px solid #ddd' }}>
        <h2 style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#000',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '12px'
        }}>
          Rent Invoice
        </h2>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '13px',
          color: '#333',
          fontFamily: 'Georgia, "Times New Roman", serif',
          maxWidth: '500px',
          margin: '0 auto',
          paddingTop: '8px',
          borderTop: '1px dashed #999'
        }}>
          <div><strong>Invoice No:</strong> {billNumber}</div>
          <div><strong>Date:</strong> {billDate}</div>
          <div><strong>Period:</strong> {getMonthName(record.month)} {record.year}</div>
        </div>
      </div>

      {/* Tenant Details */}
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid #ddd' }}>
        <h3 style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#000',
          textTransform: 'uppercase',
          marginBottom: '12px',
          letterSpacing: '1px'
        }}>
          Bill To:
        </h3>
        <div style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '14px',
          lineHeight: '1.8',
          color: '#333'
        }}>
          <div><strong>Name:</strong> {tenant.name}</div>
          {tenant.room_number && <div><strong>Room:</strong> {tenant.room_number}</div>}
          <div><strong>Phone:</strong> {tenant.phone}</div>
          {tenant.email && <div><strong>Email:</strong> {tenant.email}</div>}
        </div>
      </div>

      {/* Payment Details - Invoice Style */}
      <div className="mb-6">
        <h3 style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#000',
          textTransform: 'uppercase',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '2px solid #000',
          letterSpacing: '1px'
        }}>
          Itemized Charges
        </h3>

        {/* Table Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: '1px dashed #999',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          <span style={{ flex: '3' }}>Description</span>
          <span style={{ flex: '1', textAlign: 'right' }}>Qty</span>
          <span style={{ flex: '1', textAlign: 'right' }}>Amount</span>
        </div>

        {/* Rent Item */}
        <div style={{ marginTop: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '14px',
            color: '#000',
            padding: '4px 0'
          }}>
            <span style={{ flex: '3', fontWeight: '600' }}>Room Rent</span>
            <span style={{ flex: '1', textAlign: 'right' }}>1</span>
            <span style={{ flex: '1', textAlign: 'right', fontWeight: '600' }}>₹ {record.rent_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Electricity Item */}
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ddd' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '14px',
            color: '#000',
            padding: '4px 0'
          }}>
            <span style={{ flex: '3', fontWeight: '600' }}>Electricity Bill</span>
            <span style={{ flex: '1', textAlign: 'right' }}>{record.electricity_units || 0}</span>
            <span style={{ flex: '1', textAlign: 'right', fontWeight: '600' }}>₹ {record.electricity_amount.toLocaleString()}</span>
          </div>
          <div style={{
            fontSize: '11px',
            color: '#666',
            fontFamily: 'Georgia, "Times New Roman", serif',
            paddingLeft: '8px',
            marginTop: '2px'
          }}>
            ({record.electricity_units || 0} units @ ₹{record.cost_per_unit || 11}/unit)
          </div>
        </div>

        {/* Water Item */}
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ddd' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '14px',
            color: '#000',
            padding: '4px 0'
          }}>
            <span style={{ flex: '3', fontWeight: '600' }}>Water Charges</span>
            <span style={{ flex: '1', textAlign: 'right' }}>1</span>
            <span style={{ flex: '1', textAlign: 'right', fontWeight: '600' }}>₹ {record.water_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Other Charges */}
        {record.other_charges > 0 && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ddd' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '14px',
              color: '#000',
              padding: '4px 0'
            }}>
              <span style={{ flex: '3', fontWeight: '600' }}>Other Charges</span>
              <span style={{ flex: '1', textAlign: 'right' }}>1</span>
              <span style={{ flex: '1', textAlign: 'right', fontWeight: '600' }}>₹ {record.other_charges.toLocaleString()}</span>
            </div>
            {record.other_charges_description && (
              <div style={{
                fontSize: '11px',
                color: '#666',
                fontFamily: 'Georgia, "Times New Roman", serif',
                paddingLeft: '8px',
                paddingBottom: '8px'
              }}>
                {record.other_charges_description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grand Total Section */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px solid #000' }}>
        {/* Subtotal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '15px',
          padding: '8px 0',
          color: '#333'
        }}>
          <span>Subtotal:</span>
          <span>₹ {total.toLocaleString()}</span>
        </div>

        {/* Grand Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '12px 0',
          borderTop: '2px double #000',
          borderBottom: '2px double #000',
          color: '#000'
        }}>
          <span>GRAND TOTAL:</span>
          <span>₹ {total.toLocaleString()}</span>
        </div>

      </div>

      {/* Remarks */}
      {record.remarks && (
        <div style={{
          marginTop: '24px',
          padding: '12px',
          border: '1px solid #ddd',
          backgroundColor: '#fafafa',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '12px',
          color: '#333'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>Remarks:</div>
          <div>{record.remarks}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '32px',
        paddingTop: '16px',
        borderTop: '1px solid #ddd',
        textAlign: 'center',
        fontFamily: 'Georgia, "Times New Roman", serif'
      }}>
        <p style={{ fontSize: '14px', color: '#000', fontWeight: '600', marginBottom: '8px' }}>
          Thank you for your payment!
        </p>
        <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
          This is a computer-generated invoice
        </p>
        <p style={{ fontSize: '11px', color: '#666' }}>
          For queries, contact us at <strong>tuleeto.in</strong> or email <strong>contact@tuleeto.in</strong>
        </p>
      </div>
    </div>
  );
};
