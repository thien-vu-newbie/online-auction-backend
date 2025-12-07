/**
 * Convert Vietnamese text to non-accent text for full-text search
 * Example: "Điện thoại iPhone 15 Pro Max" => "dien thoai iphone 15 pro max"
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  
  // Normalize and remove accents
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  
  // Remove extra spaces
  str = str.replace(/\s+/g, ' ').trim();
  
  return str;
}

/**
 * Create regex pattern for full-text search
 * Support both Vietnamese and non-Vietnamese text
 */
export function createSearchPattern(searchText: string): RegExp {
  const normalized = removeVietnameseAccents(searchText);
  // Escape special regex characters
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}
