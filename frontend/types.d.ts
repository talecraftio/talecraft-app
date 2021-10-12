import { ResourcetypeResponse } from "./src/utils/contracts/resource";

declare module "url:*";
declare module "jsx:*";

interface InventoryItem {
    info: ResourcetypeResponse;
    tokenId: string;
    balance: number;
}
