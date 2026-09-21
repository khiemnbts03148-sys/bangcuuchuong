console.log("hello - js Im BaoKhiem");

let wel="Hello - js im Baokhiem"
console.log(wel);





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
console.log("Tiền điện cho 45 kWh:", tinhtien(45));
console.log("Tiền điện cho 86 kWh:", tinhtien(86));   
console.log("Tiền điện cho 150 kWh:", tinhtien(150)); 