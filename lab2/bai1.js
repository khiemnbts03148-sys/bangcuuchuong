function tinhtien(kw) {
  let tong = 0;

  if (kw <= 0) {
    return 0;
  }

  if (kw <= 50) {
  
    tong = kw * 1800;
  } else if (kw <= 100) {

    tong = (50 * 1800) + ((kw - 50) * 2300);
  } else {
  
    tong = (50 * 1800) + (50 * 2300) + ((kw - 100) * 3000);
  }
  return tong;
}
console.log("45 kWh:", tinhtien(45));
console.log("86 kWh:", tinhtien(86));   
console.log("150 kWh:", tinhtien(150)); 


