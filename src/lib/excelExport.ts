import * as XLSX from "xlsx";
import { PaymentRecord, Tenant } from "@/types";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function exportPaymentRecordsToExcel(
  records: PaymentRecord[],
  tenants: Tenant[],
  fileName: string = "payment_records.xlsx"
) {
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  // Transform data to match the Excel format provided by user
  const excelData = records.map((record, index) => {
    const tenant = tenantMap.get(record.tenant_id);
    const total = record.rent_amount + record.electricity_amount + record.water_amount + record.other_charges;
    const allPaid = record.rent_paid && record.electricity_paid && record.water_paid;
    const electricityUnits = (record as any).electricity_units || 0;
    const costPerUnit = (record as any).cost_per_unit || 0;
    const remarks = (record as any).remarks || "";

    return {
      "S.No": index + 1,
      "Name": tenant?.name || "Unknown",
      "Phone No.": tenant?.phone || "",
      "Month": `${monthNames[record.month - 1]} ${record.year}`,
      "Rent (₹)": record.rent_amount,
      "Electricity Units": electricityUnits,
      "Cost per Unit (₹)": costPerUnit,
      "Electricity Bill (₹)": record.electricity_amount,
      "Water Bill (₹)": record.water_amount,
      "Total (Rent + Elec + Water)": total,
      "Paid/Unpaid": allPaid ? "Paid" : "Unpaid",
      "Payment Date": record.rent_paid_date || "",
      "Remarks": remarks
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 6 },  // S.No
    { wch: 20 }, // Name
    { wch: 15 }, // Phone
    { wch: 15 }, // Month
    { wch: 12 }, // Rent
    { wch: 15 }, // Electricity Units
    { wch: 15 }, // Cost per Unit
    { wch: 18 }, // Electricity Bill
    { wch: 15 }, // Water Bill
    { wch: 22 }, // Total
    { wch: 12 }, // Paid/Unpaid
    { wch: 15 }, // Payment Date
    { wch: 30 }  // Remarks
  ];

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