function laSoNguyenTo(n) {
  if (n < 2) {
    return false;
  } else if (n === 2) {
    return true;
  } else {
    for (let i = 2; i < n; i++) {
      if (n % i === 0) {
        return false;
      }
    }
    return true;
  }
}
console.log(laSoNguyenTo(1));
console.log(laSoNguyenTo(2)); 
console.log(laSoNguyenTo(9));
