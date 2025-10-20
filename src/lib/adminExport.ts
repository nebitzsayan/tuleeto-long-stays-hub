import * as XLSX from 'xlsx';

export const exportUsersToExcel = (users: any[], fileName = 'users_export.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(
    users.map(user => ({
      'User ID': user.id,
      'Email': user.email,
      'Full Name': user.full_name || 'N/A',
      'Created At': new Date(user.created_at).toLocaleDateString(),
      'Is Banned': user.is_banned ? 'Yes' : 'No',
      'Ban Reason': user.ban_reason || 'N/A',
      'Last Login': user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A',
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  
  worksheet['!cols'] = [
    { wch: 35 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, 
    { wch: 10 }, { wch: 30 }, { wch: 15 }
  ];

  XLSX.writeFile(workbook, fileName);
};

export const exportPropertiesExcel = (properties: any[], fileName = 'properties_export.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(
    properties.map(prop => ({
      'Property ID': prop.id,
      'Title': prop.title,
      'Location': prop.location,
      'Type': prop.type,
      'Price': prop.price,
      'Bedrooms': prop.bedrooms,
      'Bathrooms': prop.bathrooms,
      'Area': prop.area,
      'Public': prop.is_public ? 'Yes' : 'No',
      'Featured': prop.is_featured ? 'Yes' : 'No',
      'Flagged': prop.is_flagged ? 'Yes' : 'No',
      'Views': prop.view_count || 0,
      'Created At': new Date(prop.created_at).toLocaleDateString(),
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');
  
  worksheet['!cols'] = [
    { wch: 35 }, { wch: 25 }, { wch: 20 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 15 }
  ];

  XLSX.writeFile(workbook, fileName);
};

export const exportReviewsExcel = (reviews: any[], fileName = 'reviews_export.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(
    reviews.map(review => ({
      'Review ID': review.id,
      'Property ID': review.property_id,
      'User ID': review.user_id,
      'Rating': review.rating,
      'Comment': review.comment || 'N/A',
      'Approved': review.is_approved ? 'Yes' : 'No',
      'Flagged': review.is_flagged ? 'Yes' : 'No',
      'Created At': new Date(review.created_at).toLocaleDateString(),
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reviews');
  
  worksheet['!cols'] = [
    { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 8 },
    { wch: 50 }, { wch: 10 }, { wch: 10 }, { wch: 15 }
  ];

  XLSX.writeFile(workbook, fileName);
};
