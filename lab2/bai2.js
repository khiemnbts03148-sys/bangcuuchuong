function tinhLuong(chucVu, ngayCong) {
  const heSo = { intern: 1.0, staff: 1.5, senior: 2.0, manager: 3.0 };
  
  
  let hs = heSo[chucVu] || 0; 
  
  return Math.round(hs * ngayCong * (5000000 / 24));
}

console.log(tinhLuong("intern", 24));  
console.log(tinhLuong("staff", 24));   
console.log(tinhLuong("manager", 24)); 