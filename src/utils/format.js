export const formatPrice = (price) => {
    if (price == null) {
        return '';  
    }

    // Convert the price to a string
    const priceString = price.toString();

    // Calculate the maximum number of digits allowed for the integer and decimal parts
    const totalMaxDigits = 10;

    // Calculate the maximum number of digits for the integer part, prioritizing it
    const maxIntegerDigits = Math.min(totalMaxDigits, priceString.indexOf('.') > -1 ? priceString.indexOf('.') : totalMaxDigits);

    // Calculate the maximum number of digits for the decimal part
    const maxDecimalDigits = totalMaxDigits - maxIntegerDigits;

    // Split the string into parts before and after the decimal point
    const [integerPart, decimalPart] = priceString.split('.');

    // Include all digits from the integer part
    const truncatedInteger = integerPart.slice(0, maxIntegerDigits);

    // If there is a decimal part, include remaining digits from it
    const truncatedDecimal = decimalPart ? decimalPart.slice(0, maxDecimalDigits) : '';

    // Concatenate the truncated integer and decimal parts
    const formattedPrice = truncatedDecimal ? `${truncatedInteger}.${truncatedDecimal}` : truncatedInteger;

    return formattedPrice;
};

export const formatDigitBasePrice = (price, digits) => {
    if (price == null) {
        return '';  
    }

    // Convert the price to a string
    const priceString = price.toString();

    // Calculate the maximum number of digits allowed for the integer and decimal parts
    const totalMaxDigits = digits;

    // Calculate the maximum number of digits for the integer part, prioritizing it
    const maxIntegerDigits = Math.min(totalMaxDigits, priceString.indexOf('.') > -1 ? priceString.indexOf('.') : totalMaxDigits);

    // Calculate the maximum number of digits for the decimal part
    const maxDecimalDigits = totalMaxDigits - maxIntegerDigits;

    // Split the string into parts before and after the decimal point
    const [integerPart, decimalPart] = priceString.split('.');

    // Include all digits from the integer part
    const truncatedInteger = integerPart.slice(0, maxIntegerDigits);

    // If there is a decimal part, include remaining digits from it
    const truncatedDecimal = decimalPart ? decimalPart.slice(0, maxDecimalDigits) : '';

    // Concatenate the truncated integer and decimal parts
    const formattedPrice = truncatedDecimal ? `${truncatedInteger}.${truncatedDecimal}` : truncatedInteger;

    return formattedPrice;
};

export const formatPriceUptoDecimals = (price, decimalDigits = 2) => {
    if (price == null) {
        return '';
    }

    const priceString = price.toString();

    const [integerPart, decimalPart] = priceString.split('.');
    let truncatedDecimal = '';
    if (decimalPart) {
        truncatedDecimal = decimalPart.slice(0, decimalDigits);
    }

    const formattedPrice = truncatedDecimal ? `${integerPart}.${truncatedDecimal}` : integerPart;

    return formattedPrice;
};

export const formatPositionToPipSize = (pipPosition) => {
    if(pipPosition == null){
        return 1;
    }

    return 1 / Math.pow(10, pipPosition);
  }  

export const adjustDateTime = (
  timestamp = '2024-07-03T03:35:11.000Z',
  timeAdjustment = '00:00',
) => {
  const date = new Date(timestamp);

  let [hours, minutes] = timeAdjustment.split(':').map(Number);
  if (hours < 0) {
    minutes = -Math.abs(minutes);
  }

  date.setHours(date.getHours() + hours);
  date.setMinutes(date.getMinutes() + minutes);

  return date.toISOString();
};

export const formatDate = (timestamp, module = 'Helloworld') => {
  const date = new Date(timestamp);

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = +date.getUTCFullYear().toString().slice(2);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  const formattedDateTime = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`; 

  return formattedDateTime;
};
export const convertToMilliseconds = (timeString) => {
  let [hours, minutes] = timeString.split(':').map(Number);

  let totalMinutes = hours * 60 + minutes;
  let totalMilliseconds = totalMinutes * 60 * 1000;
  console.log(totalMilliseconds)
  return totalMilliseconds;
};
