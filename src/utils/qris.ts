import QrScanner from 'qr-scanner';
import QRCode from 'qrcode';

// Decode QR content from a base64 image (PNG/JPG data URL)
export const decodeQRFromBase64 = async (base64Image: string): Promise<string> => {
  try {
    const result = await QrScanner.scanImage(base64Image, { returnDetailedScanResult: false });
    if (typeof result === 'string') {
      return result;
    }
    // Some versions may return object
    // @ts-ignore
    return result?.data || '';
  } catch (err) {
    return '';
  }
};

// EMV TLV parsing and building helpers for QRIS
export type EmvMap = Record<string, string | EmvMap>;

const padLen = (n: number) => n.toString().padStart(2, '0');

export const parseEmv = (payload: string): EmvMap => {
  let i = 0;
  const map: EmvMap = {};

  while (i < payload.length) {
    const tag = payload.slice(i, i + 2); i += 2;
    if (!/^[0-9A-Za-z]{2}$/.test(tag)) break;
    const len = parseInt(payload.slice(i, i + 2), 10); i += 2;
    const value = payload.slice(i, i + len); i += len;

    // Additional Data Field (62) and Merchant Account Information range (26-51) can contain sub-TLV
    if (tag === '62' || (parseInt(tag, 10) >= 26 && parseInt(tag, 10) <= 51)) {
      map[tag] = parseEmv(value);
    } else {
      map[tag] = value;
    }

    // Stop before CRC (63) as last field in EMV payload
    if (tag === '63') break;
  }

  return map;
};

const buildValue = (val: string | EmvMap): string => {
  if (typeof val === 'string') return val;
  // Build sub-TLV
  let out = '';
  for (const [t, v] of Object.entries(val)) {
    const vStr = buildValue(v);
    out += `${t}${padLen(vStr.length)}${vStr}`;
  }
  return out;
};

export const buildEmv = (map: EmvMap): string => {
  let payloadNoCRC = '';
  const entries: [string, string | EmvMap][] = Object.entries(map).filter(([t]) => t !== '63').sort((a, b) => a[0].localeCompare(b[0]));
  for (const [tag, val] of entries) {
    const vStr = buildValue(val);
    payloadNoCRC += `${tag}${padLen(vStr.length)}${vStr}`;
  }
  // Append CRC place holder (63, length 04) for computing
  const forCRC = `${payloadNoCRC}63${padLen(4)}`;
  const crc = crc16Ccitt(forCRC).toUpperCase();
  return `${payloadNoCRC}63${padLen(4)}${crc}`;
};

// CRC16-CCITT (XModem) used by EMVCo. Polynomial 0x1021, initial 0xFFFF
export const crc16Ccitt = (str: string): string => {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).padStart(4, '0');
};

// Generate dynamic QRIS payload from a base payload by setting dynamic flags and amount
export const generateDynamicQRISPayload = (basePayload: string, amount: number, reference?: string): string => {
  const emv = parseEmv(basePayload);

  // Set Point of Initiation Method (01) to '12' for dynamic
  emv['01'] = '12';

  // Transaction amount (54)
  const amountStr = amount.toFixed(2).replace(/\.00$/, '');
  emv['54'] = amountStr;

  // Additional data field (62) -> subtag '01' as reference/order id
  const addl = (typeof emv['62'] === 'object') ? (emv['62'] as EmvMap) : {};
  if (reference) {
    addl['01'] = reference;
  }
  emv['62'] = addl;

  return buildEmv(emv);
};

// Create a QR image data URL from payload
export const makeQRDataURL = async (payload: string, size = 512): Promise<string> => {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', width: size, margin: 2 });
};