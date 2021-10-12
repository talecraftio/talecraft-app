export function trimAddress(address?: string) {
    if (!address)
        return '';
    return address.slice(0, 8) + '...' + address.slice(address.length - 6, address.length);
}
