// export function imoka(kaina) {
//   return -Math.round(PPMT(0.025, 1, 60, kaina, 0));
// }

const imoka = () => {
  const fullPrice = document.querySelectorAll('.js-full-price');
  const montlyPrice = document.querySelectorAll('.js-calc');
  
  for (let index = 0; index < fullPrice.length; index++) {
    montlyPrice[index].innerHTML = -Math.round(PPMT(0.025, 1, 60, fullPrice[index].dataset.price, 0))
    
  }


}

function IPMT(rate, period, periods, present, future, type) {
    var type = (typeof type === 'undefined') ? 0 : type;
    rate = eval(rate);
    periods = eval(periods);
  
    var payment = PMT(rate, periods, present, future, type);
    
    var interest;
    if (period === 1) {
      if (type === 1) {
        interest = 0;
      } else {
        interest = -present;
      }
    } else {
      if (type === 1) {
        interest = FV(rate, period - 2, payment, present, 1) - payment;
      } else {
        interest = FV(rate, period - 1, payment, present, 0);
      }
    }
    
    return interest * rate;
  }

  function PMT(rate, periods, present, future, type) {
    if (!future) future = 0;
    if (!type) type = 0;

    if (rate == 0) return -(present + future)/periods;
    
    var pvif = Math.pow(1 + rate, periods);
    var pmt = rate / (pvif - 1) * -(present * pvif + future);

    if (type == 1) {
        pmt /= (1 + rate);
    };

    return pmt;
}

function FV (rate, periods, payment, present, type) {
    if (!type) type = 0;

    var pow = Math.pow(1 + rate, periods);
    var fv = 0;

    if (rate) {
        fv = (payment * (1 + rate * type) * (1 - pow) / rate) - present * pow;
    } else {
        fv = -1 * (present + payment * periods);
    }

    return fv;
}

function PPMT (rate, per, nper, pv, fv, type) {
    if (per < 1 || (per >= nper + 1)) return null;
    var pmt = PMT(rate, nper, pv, fv, type);
    var ipmt = IPMT(pv, pmt, rate, per - 1);
    return pmt - ipmt;
}

imoka();