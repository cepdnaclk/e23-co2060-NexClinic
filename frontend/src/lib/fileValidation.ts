export const validatePublicUpload = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.size > maxSize) {
    return "File is too large. Maximum size for this upload is 5MB.";
  }

  if (!allowedTypes.includes(file.type)) {
    return "Invalid file type. Allowed types are: JPG, PNG, WEBP, GIF.";
  }

  return null;
};

export const validatePrivateUpload = (file: File): string | null => {
  const maxSize = 15 * 1024 * 1024; // 15MB
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/plain',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];

  if (file.size > maxSize) {
    return "File is too large. Maximum size for this upload is 15MB.";
  }

  if (!allowedTypes.includes(file.type)) {
    return "Invalid file type. Allowed types are: PDF, JPG, PNG, TXT, DOC, DOCX.";
  }

  return null;
};
