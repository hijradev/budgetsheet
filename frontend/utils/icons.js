/**
 * icons.js — Shared icon list for Tabler Icons dropdowns
 * Provides a curated list of 30 commonly used icons for wallet/category forms.
 */

var ICON_LIST = [
  { value: 'wallet',           label: 'Wallet' },
  { value: 'credit-card',      label: 'Credit Card' },
  { value: 'cash',             label: 'Cash' },
  { value: 'coin',             label: 'Coin' },
  { value: 'piggy-bank',       label: 'Piggy Bank' },
  { value: 'building-bank',    label: 'Bank' },
  { value: 'brand-cashapp',    label: 'Cash App' },
  { value: 'shopping-cart',    label: 'Shopping Cart' },
  { value: 'shopping-bag',     label: 'Shopping Bag' },
  { value: 'receipt',          label: 'Receipt' },
  { value: 'tag',              label: 'Tag' },
  { value: 'home',             label: 'Home' },
  { value: 'car',              label: 'Car' },
  { value: 'bus',              label: 'Bus' },
  { value: 'plane',            label: 'Plane' },
  { value: 'tools',            label: 'Tools' },
  { value: 'device-mobile',    label: 'Mobile' },
  { value: 'bolt',             label: 'Bolt / Electric' },
  { value: 'droplet',          label: 'Droplet / Water' },
  { value: 'flame',            label: 'Flame / Gas' },
  { value: 'heart',            label: 'Heart / Health' },
  { value: 'stethoscope',      label: 'Stethoscope' },
  { value: 'school',           label: 'School' },
  { value: 'book',             label: 'Book' },
  { value: 'gift',             label: 'Gift' },
  { value: 'movie',            label: 'Movie' },
  { value: 'music',            label: 'Music' },
  { value: 'pizza',            label: 'Pizza / Food' },
  { value: 'coffee',           label: 'Coffee' },
  { value: 'shirt',            label: 'Shirt / Clothing' },
];

/**
 * Build <option> elements for an icon <select> dropdown.
 * @param {string} selected - Currently selected icon value
 * @returns {string} HTML string of <option> elements
 */
function buildIconOptions(selected) {
  return ICON_LIST.map(function(icon) {
    var sel = icon.value === selected ? ' selected' : '';
    return '<option value="' + icon.value + '"' + sel + '>' + icon.label + '</option>';
  }).join('');
}
