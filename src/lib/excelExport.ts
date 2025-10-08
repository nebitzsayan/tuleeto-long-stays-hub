import * as XLSX from "xlsx";
import { PaymentRecord, Tenant } from "@/types";

export function exportPaymentRecordsToExcel(
  records: PaymentRecord[],
  tenants: Tenant[],
  fileName: string = "payment_records.xlsx"
) {
  // Create a map for quick tenant lookup
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  // Transform data for Excel
  const excelData = records.map((record) => {
    const tenant = tenantMap.get(record.tenant_id);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return {
      "Tenant Name": tenant?.name || "Unknown",
      "Room Number": tenant?.room_number || "N/A",
      "Phone": tenant?.phone || "N/A",
      "Month": monthNames[record.month - 1],
      "Year": record.year,
      "Rent Paid": record.rent_paid ? "Yes" : "No",
      "Rent Amount": record.rent_amount,
      "Rent Paid Date": record.rent_paid_date || "N/A",
      "Electricity Paid": record.electricity_paid ? "Yes" : "No",
      "Electricity Amount": record.electricity_amount,
      "Electricity Paid Date": record.electricity_paid_date || "N/A",
      "Water Paid": record.water_paid ? "Yes" : "No",
      "Water Amount": record.water_amount,
      "Water Paid Date": record.water_paid_date || "N/A",
      "Other Charges": record.other_charges,
      "Other Charges Description": record.other_charges_description || "N/A",
      "Total Amount": 
        record.rent_amount + 
        record.electricity_amount + 
        record.water_amount + 
        record.other_charges,
      "Remarks": record.remarks || "N/A",
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 20 }, // Tenant Name
    { wch: 12 }, // Room Number
    { wch: 15 }, // Phone
    { wch: 12 }, // Month
    { wch: 8 },  // Year
    { wch: 10 }, // Rent Paid
    { wch: 12 }, // Rent Amount
    { wch: 15 }, // Rent Paid Date
    { wch: 15 }, // Electricity Paid
    { wch: 15 }, // Electricity Amount
    { wch: 18 }, // Electricity Paid Date
    { wch: 12 }, // Water Paid
    { wch: 12 }, // Water Amount
    { wch: 15 }, // Water Paid Date
    { wch: 15 }, // Other Charges
    { wch: 25 }, // Other Charges Description
    { wch: 15 }, // Total Amount
    { wch: 30 }, // Remarks
  ];
  worksheet["!cols"] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Records");

  // Save file
  XLSX.writeFile(workbook, fileName);
}

export function exportTenantsToExcel(
  tenants: Tenant[],
  fileName: string = "tenants.xlsx"
) {
  const excelData = tenants.map((tenant) => ({
    "Name": tenant.name,
    "Email": tenant.email || "N/A",
    "Phone": tenant.phone,
    "Room Number": tenant.room_number || "N/A",
    "Move In Date": tenant.move_in_date,
    "Move Out Date": tenant.move_out_date || "N/A",
    "Monthly Rent": tenant.monthly_rent,
    "Security Deposit": tenant.security_deposit,
    "Status": tenant.is_active ? "Active" : "Inactive",
    "Notes": tenant.notes || "N/A",
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tenants");

  XLSX.writeFile(workbook, fileName);
}
