const normalizePhone = (phone) => {
  if (!phone) return phone;
  // Convert to string and remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, "");

  // Normalize prefixes: 91, 0, or just 10 digits
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
};

const isValidPhone = (phone) => {
  // Exactly 10 digits and starts with 6, 7, 8, or 9
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

module.exports = {
  normalizePhone,
  isValidPhone,
};
