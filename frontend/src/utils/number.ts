import BN from "bignumber.js";
import numeral from "numeral";

export function toBN(val: number | string) {
    if (!val)
        return new BN(0);
    return new BN(val.toString());
}

export function fd(val: number | string | BN) {
    if (!val)
        return '';
    return numeral(toBN(val?.toString()).toString()).format('0[.][00000]a')
}
